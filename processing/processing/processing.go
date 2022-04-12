package processing

import (
	"sync"

	"github.com/go-pg/pg/v10"
	databasePackage "github.com/kaspa-live/kaspa-graph-inspector/processing/database"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/database/model"
	configPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/logging"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/tools"
	kaspadPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/kaspad"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/consensus/utils/consensushashing"
	"github.com/pkg/errors"
)

var log = logging.Logger()

type Processing struct {
	config   *configPackage.Config
	database *databasePackage.Database
	kaspad   *kaspadPackage.Kaspad

	sync.Mutex
}

func NewProcessing(config *configPackage.Config,
	database *databasePackage.Database, kaspad *kaspadPackage.Kaspad) (*Processing, error) {

	processing := &Processing{
		config:   config,
		database: database,
		kaspad:   kaspad,
	}

	err := processing.ResyncDatabase()
	if err != nil {
		return nil, err
	}

	return processing, nil
}

func (p *Processing) ResyncDatabase() error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		log.Infof("Resyncing database")
		defer log.Infof("Finished resyncing database")

		p.database.LoadCache(databaseTransaction)
		log.Infof("Cache loaded from the database")

		pruningPointHash, err := p.kaspad.Domain().Consensus().PruningPoint()
		if err != nil {
			return err
		}

		hasPruningBlock, err := p.database.DoesBlockExist(databaseTransaction, pruningPointHash)
		if err != nil {
			return err
		}
		if hasPruningBlock {
			// The prunning block is already in the database
			// so we keep the database as it is and sync the new blocks
			log.Infof("Prunning point %s already in the database", pruningPointHash)
			log.Infof("Database kept")
		} else {
			// The prunning block was not found in the database
			// so we start from scratch.
			err = p.database.Clear(databaseTransaction)
			if err != nil {
				return err
			}
			log.Infof("Database cleared")

			pruningPointBlock, err := p.kaspad.Domain().Consensus().GetBlock(pruningPointHash)
			if err != nil {
				return err
			}
			pruningPointDatabaseBlock := &model.Block{
				BlockHash:                      pruningPointHash.String(),
				Timestamp:                      pruningPointBlock.Header.TimeInMilliseconds(),
				ParentIDs:                      []uint64{},
				Height:                         0,
				HeightGroupIndex:               0,
				SelectedParentID:               nil,
				Color:                          model.ColorGray,
				IsInVirtualSelectedParentChain: true,
				MergeSetRedIDs:                 []uint64{},
				MergeSetBlueIDs:                []uint64{},
			}
			err = p.database.InsertBlock(databaseTransaction, pruningPointHash, pruningPointDatabaseBlock)
			if err != nil {
				return err
			}
			heightGroup := &model.HeightGroup{
				Height: 0,
				Size:   1,
			}
			err = p.database.InsertOrUpdateHeightGroup(databaseTransaction, heightGroup)
			if err != nil {
				return err
			}
			log.Infof("Pruning point %s has been added to the database", pruningPointHash)
		}

		headersSelectedTip, err := p.kaspad.Domain().Consensus().GetHeadersSelectedTip()
		if err != nil {
			return err
		}
		hashesBetweenPruningPointAndHeadersSelectedTip, _, err := p.kaspad.Domain().Consensus().GetHashesBetween(pruningPointHash, headersSelectedTip, 0)
		if err != nil {
			return err
		}

		startIndex := int(0)
		if hasPruningBlock {
			log.Infof("Syncing %d blocks with the database", len(hashesBetweenPruningPointAndHeadersSelectedTip))
			startIndex = p.database.FindLatestStoredBlockIndex(databaseTransaction, hashesBetweenPruningPointAndHeadersSelectedTip)
			log.Infof("First %d blocks already exist in the database", startIndex)
			// We start from an earlier point (~ 5 minutes) to make sure we didn't miss any mutation
			startIndex = tools.Max(startIndex-600, 0)
		} else {
			log.Infof("Adding %d blocks to the database", len(hashesBetweenPruningPointAndHeadersSelectedTip))
		}

		totalToAdd := len(hashesBetweenPruningPointAndHeadersSelectedTip) - startIndex
		for i := startIndex; i < len(hashesBetweenPruningPointAndHeadersSelectedTip); i++ {
			blockHash := hashesBetweenPruningPointAndHeadersSelectedTip[i]
			block, err := p.kaspad.Domain().Consensus().GetBlockEvenIfHeaderOnly(blockHash)
			if err != nil {
				return err
			}
			err = p.processBlock(databaseTransaction, block, nil)
			if err != nil {
				return err
			}

			addedCount := i + 1 - startIndex
			if addedCount%1000 == 0 || addedCount == totalToAdd {
				log.Infof("Added %d/%d blocks to the database", addedCount, totalToAdd)
			}
		}

		return p.resyncVirtualSelectedParentChain(databaseTransaction)
	})
}

func (p *Processing) ResyncVirtualSelectedParentChain() error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.resyncVirtualSelectedParentChain(databaseTransaction)
	})
}

func (p *Processing) resyncVirtualSelectedParentChain(databaseTransaction *pg.Tx) error {
	log.Infof("Resyncing virtual selected parent chain")
	defer log.Infof("Finished resyncing virtual selected parent chain")

	highestBlockVirtualSelectedParentChain, err := p.database.HighestBlockInVirtualSelectedParentChain(databaseTransaction)
	if err != nil {
		return err
	}
	highestBlockHash, err := externalapi.NewDomainHashFromString(highestBlockVirtualSelectedParentChain.BlockHash)
	if err != nil {
		return err
	}
	log.Infof("Resyncing virtual selected parent chain from block %s", highestBlockHash)

	virtualSelectedParentChain, err := p.kaspad.Domain().Consensus().GetVirtualSelectedParentChainFromBlock(highestBlockHash)
	if err != nil {
		return err
	}
	if len(virtualSelectedParentChain.Added) > 0 {
		virtualSelectedParentHash := virtualSelectedParentChain.Added[len(virtualSelectedParentChain.Added)-1]
		virtualSelectedParentBlock, err := p.kaspad.Domain().Consensus().GetBlock(virtualSelectedParentHash)
		if err != nil {
			return err
		}
		blockInsertionResult := &externalapi.VirtualChangeSet{
			VirtualSelectedParentChainChanges: virtualSelectedParentChain,
		}
		err = p.processBlock(databaseTransaction, virtualSelectedParentBlock, blockInsertionResult)
		if err != nil {
			return err
		}
		log.Infof("Updated the virtual selected parent chain")
	}
	return nil
}

func (p *Processing) ProcessBlock(block *externalapi.DomainBlock,
	blockInsertionResult *externalapi.VirtualChangeSet) error {

	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.processBlock(databaseTransaction, block, blockInsertionResult)
	})
}

func (p *Processing) processBlock(databaseTransaction *pg.Tx, block *externalapi.DomainBlock,
	blockInsertionResult *externalapi.VirtualChangeSet) error {

	blockHash := consensushashing.BlockHash(block)
	log.Debugf("Processing block %s", blockHash)
	defer log.Debugf("Finished processing block %s", blockHash)

	isIncompleteBlock := false
	blockExists, err := p.database.DoesBlockExist(databaseTransaction, blockHash)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not check if block %s does exist in database", blockHash)
	}
	if !blockExists {
		parentHashes := block.Header.DirectParents()
		existingParentHashes := make([]*externalapi.DomainHash, 0, len(parentHashes))
		for _, parentHash := range parentHashes {
			parentExists, err := p.database.DoesBlockExist(databaseTransaction, parentHash)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not check if parent %s for block %s does exist in database", parentHash, blockHash)
			}
			if !parentExists {
				log.Warnf("Parent %s for block %s does not exist in the database", parentHash, blockHash)
				isIncompleteBlock = true
				continue
			}
			existingParentHashes = append(existingParentHashes, parentHash)
		}

		parentIDs, parentHeights, err := p.database.BlockInfosByHashes(databaseTransaction, existingParentHashes)
		if err != nil {
			return errors.Errorf("Could not resolve "+
				"parent IDs for block %s: %s", blockHash, err)
		}

		blockHeight := uint64(0)
		for _, height := range parentHeights {
			blockHeight = tools.Max(blockHeight, height+1)
		}

		heightGroupSize, err := p.database.HeightGroupSize(databaseTransaction, blockHeight)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not resolve group size for highest parent height %s for block %s", blockHeight, blockHash)
		}
		blockHeightGroupIndex := heightGroupSize

		databaseBlock := &model.Block{
			BlockHash:                      blockHash.String(),
			Timestamp:                      block.Header.TimeInMilliseconds(),
			ParentIDs:                      parentIDs,
			Height:                         blockHeight,
			HeightGroupIndex:               blockHeightGroupIndex,
			SelectedParentID:               nil,
			Color:                          model.ColorGray,
			IsInVirtualSelectedParentChain: false,
			MergeSetRedIDs:                 []uint64{},
			MergeSetBlueIDs:                []uint64{},
			DAAScore:                       block.Header.DAAScore(),
		}
		err = p.database.InsertBlock(databaseTransaction, blockHash, databaseBlock)
		if err != nil {
			return errors.Wrapf(err, "Could not insert block %s", blockHash)
		}

		blockID, err := p.database.BlockIDByHash(databaseTransaction, blockHash)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not get id for block %s", blockHash)
		}
		heightGroup := &model.HeightGroup{
			Height: blockHeight,
			Size:   blockHeightGroupIndex + 1,
		}
		err = p.database.InsertOrUpdateHeightGroup(databaseTransaction, heightGroup)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not insert or update height group %s for block %s", blockHeight, blockHash)
		}

		for _, parentID := range parentIDs {
			parentHeight, err := p.database.BlockHeight(databaseTransaction, parentID)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not get block height of parent id %s for block %s", parentID, blockHash)
			}
			parentHeightGroupIndex, err := p.database.BlockHeightGroupIndex(databaseTransaction, parentID)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not get height group index of parent id %s for block %s", parentID, blockHash)
			}
			edge := &model.Edge{
				FromBlockID:          blockID,
				ToBlockID:            parentID,
				FromHeight:           blockHeight,
				ToHeight:             parentHeight,
				FromHeightGroupIndex: blockHeightGroupIndex,
				ToHeightGroupIndex:   parentHeightGroupIndex,
			}
			err = p.database.InsertEdge(databaseTransaction, edge)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not insert edge from block %s to parent id %s", blockHash, parentID)
			}
		}
	}

	blockInfo, err := p.kaspad.Domain().Consensus().GetBlockInfo(blockHash)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not get block info for block %s", blockHash)
	}
	if blockInfo.BlockStatus == externalapi.StatusHeaderOnly || isIncompleteBlock {
		return nil
	}

	blockGHOSTDAGData, err := p.kaspad.BlockGHOSTDAGData(blockHash)
	if err != nil {
		return errors.Wrapf(err, "Could not get GHOSTDAG data for block %s", blockHash)
	}
	selectedParentID, err := p.database.BlockIDByHash(databaseTransaction, blockGHOSTDAGData.SelectedParent())
	if err != nil {
		return errors.Wrapf(err, "Could not get selected parent block ID for block %s",
			blockGHOSTDAGData.SelectedParent())
	}
	blockID, err := p.database.BlockIDByHash(databaseTransaction, blockHash)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not get id for edged block %s", blockHash)
	}
	err = p.database.UpdateBlockSelectedParent(databaseTransaction, blockID, selectedParentID)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not update selected parent for block %s", blockHash)
	}

	mergeSetRedIDs, err := p.database.BlockIDsByHashes(databaseTransaction, blockGHOSTDAGData.MergeSetReds())
	if err != nil {
		// enhanced error description
		// return errors.Wrapf(err, "Could not get ids of merge set reds for block %s", blockHash)

		// Let's ignore this error temporarily and just report it in the log
		// This occures sometimes when the app was fresly started, at the end or just after ResyncDatabase
		// The actual conditions and the way to solve this has to be determined yet.
		log.Errorf("Could not get ids of merge set reds for block %s: %s", blockHash, blockGHOSTDAGData.MergeSetReds())
	}
	mergeSetBlueIDs, err := p.database.BlockIDsByHashes(databaseTransaction, blockGHOSTDAGData.MergeSetBlues())
	if err != nil {
		// enhanced error description
		// return errors.Wrapf(err, "Could not get ids of merge set blues for block %s", blockHash)

		// Let's ignore this error temporarily and just report it in the log
		// This occures sometimes when the app was fresly started, at the end or just after ResyncDatabase
		// The actual conditions and the way to solve this has to be determined yet.
		log.Errorf("Could not get ids of merge set blues for block %s: %s", blockHash, blockGHOSTDAGData.MergeSetBlues())
	}
	err = p.database.UpdateBlockMergeSet(databaseTransaction, blockID, mergeSetRedIDs, mergeSetBlueIDs)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not update merge sets colors for block %s", blockHash)
	}

	if blockInsertionResult == nil || blockInsertionResult.VirtualSelectedParentChainChanges == nil {
		return nil
	}

	blockColors := make(map[uint64]string)
	blockIsInVirtualSelectedParentChain := make(map[uint64]bool)
	removedBlockHashes := blockInsertionResult.VirtualSelectedParentChainChanges.Removed
	if len(removedBlockHashes) > 0 {
		for _, removedBlockHash := range removedBlockHashes {
			removedBlockID, err := p.database.BlockIDByHash(databaseTransaction, removedBlockHash)
			if err == nil {
				blockColors[removedBlockID] = model.ColorGray
				blockIsInVirtualSelectedParentChain[removedBlockID] = false
			} else {
				log.Errorf("Could not get id of removed block %s", removedBlockHash)
			}
		}
	}

	addedBlockHashes := blockInsertionResult.VirtualSelectedParentChainChanges.Added
	if len(addedBlockHashes) > 0 {
		for _, addedBlockHash := range addedBlockHashes {
			addedBlockID, err := p.database.BlockIDByHash(databaseTransaction, addedBlockHash)
			if err == nil {
				blockIsInVirtualSelectedParentChain[addedBlockID] = true
			} else {
				log.Errorf("Could not get id of added block %s", addedBlockHash)
			}
		}
	}
	err = p.database.UpdateBlockIsInVirtualSelectedParentChain(databaseTransaction, blockIsInVirtualSelectedParentChain)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not update blocks in virtual selected parent chain for block %s", blockHash)
	}

	for _, addedBlockHash := range addedBlockHashes {
		addedBlockGHOSTDAGData, err := p.kaspad.BlockGHOSTDAGData(addedBlockHash)
		if err != nil {
			return errors.Wrapf(err, "Could not get GHOSTDAG data for added block %s", blockHash)
		}

		blueHashes := addedBlockGHOSTDAGData.MergeSetBlues()
		if len(blueHashes) > 0 {
			for _, blueHash := range blueHashes {
				blueBlockID, err := p.database.BlockIDByHash(databaseTransaction, blueHash)
				if err == nil {
					blockColors[blueBlockID] = model.ColorBlue
				} else {
					log.Errorf("Could not get id of merge set blue block %s", blueHash)
				}
			}
		}

		redHashes := addedBlockGHOSTDAGData.MergeSetReds()
		if len(redHashes) > 0 {
			for _, redHash := range redHashes {
				redBlockID, err := p.database.BlockIDByHash(databaseTransaction, redHash)
				if err == nil {
					blockColors[redBlockID] = model.ColorRed
				} else {
					log.Errorf("Could not get id of merge set red block %s", redHash)
				}
			}
		}
	}
	return p.database.UpdateBlockColors(databaseTransaction, blockColors)
}
