package processing

import (
	"github.com/go-pg/pg/v10"
	databasePackage "github.com/kaspa-live/kaspa-graph-inspector/processing/database"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/database/model"
	configPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/logging"
	kaspadPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/kaspad"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/consensus/utils/consensushashing"
	"github.com/pkg/errors"
	"sync"
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

	err := processing.SyncDatabase()
	if err != nil {
		return nil, err
	}

	return processing, nil
}

func (p *Processing) SyncDatabase() error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		log.Infof("Syncing database")
		defer log.Infof("Finished syncing database")

		err := p.database.Clear(databaseTransaction)
		if err != nil {
			return err
		}

		pruningPointHash, err := p.kaspad.Domain().Consensus().PruningPoint()
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

		headersSelectedTip, err := p.kaspad.Domain().Consensus().GetHeadersSelectedTip()
		if err != nil {
			return err
		}
		hashesBetweenPruningPointAndHeadersSelectedTip, _, err := p.kaspad.Domain().Consensus().GetHashesBetween(pruningPointHash, headersSelectedTip, 0)
		if err != nil {
			return err
		}
		log.Infof("Adding %d blocks to the database", len(hashesBetweenPruningPointAndHeadersSelectedTip))

		for i, blockHash := range hashesBetweenPruningPointAndHeadersSelectedTip {
			block, err := p.kaspad.Domain().Consensus().GetBlockEvenIfHeaderOnly(blockHash)
			if err != nil {
				return err
			}
			err = p.processAddedBlock(databaseTransaction, block, nil)
			if err != nil {
				return err
			}

			addedCount := i + 1
			if addedCount%1000 == 0 || addedCount == len(hashesBetweenPruningPointAndHeadersSelectedTip) {
				log.Infof("Added %d/%d blocks to the database", addedCount, len(hashesBetweenPruningPointAndHeadersSelectedTip))
			}
		}

		virtualSelectedParentChain, err := p.kaspad.Domain().Consensus().GetVirtualSelectedParentChainFromBlock(pruningPointHash)
		if err != nil {
			return err
		}
		if len(virtualSelectedParentChain.Added) > 0 {
			virtualSelectedParentHash := virtualSelectedParentChain.Added[len(virtualSelectedParentChain.Added)-1]
			virtualSelectedParentBlock, err := p.kaspad.Domain().Consensus().GetBlock(virtualSelectedParentHash)
			if err != nil {
				return err
			}
			blockInsertionResult := &externalapi.BlockInsertionResult{
				VirtualSelectedParentChainChanges: virtualSelectedParentChain,
			}
			err = p.processAddedBlock(databaseTransaction, virtualSelectedParentBlock, blockInsertionResult)
			if err != nil {
				return err
			}
			log.Infof("Updated the virtual selected parent chain")
		}

		return nil
	})
}

func (p *Processing) ProcessAddedBlock(block *externalapi.DomainBlock,
	blockInsertionResult *externalapi.BlockInsertionResult) error {

	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.processAddedBlock(databaseTransaction, block, blockInsertionResult)
	})
}

func (p *Processing) processAddedBlock(databaseTransaction *pg.Tx, block *externalapi.DomainBlock,
	blockInsertionResult *externalapi.BlockInsertionResult) error {

	blockHash := consensushashing.BlockHash(block)
	log.Debugf("Processing block %s", blockHash)
	defer log.Debugf("Finished processing block %s", blockHash)

	isIncompleteBlock := false
	blockExists, err := p.database.DoesBlockExist(databaseTransaction, blockHash)
	if err != nil {
		return err
	}
	if !blockExists {
		parentHashes := block.Header.ParentHashes()
		existingParentHashes := make([]*externalapi.DomainHash, 0, len(parentHashes))
		for _, parentHash := range parentHashes {
			parentExists, err := p.database.DoesBlockExist(databaseTransaction, parentHash)
			if err != nil {
				return err
			}
			if !parentExists {
				log.Warnf("Parent %s for block %s does not exist in the database", parentHash, blockHash)
				isIncompleteBlock = true
				continue
			}
			existingParentHashes = append(existingParentHashes, parentHash)
		}

		parentIDs, err := p.database.BlockIDsByHashes(databaseTransaction, existingParentHashes)
		if err != nil {
			return errors.Errorf("Could not resolve "+
				"parent IDs for block %s: %s", blockHash, err)
		}

		blockHeight := uint64(0)
		if len(parentIDs) > 0 {
			highestParentHeight, err := p.database.HighestBlockHeight(databaseTransaction, parentIDs)
			if err != nil {
				return errors.Wrapf(err, "Could not resolve highest parent height for block %s", blockHash)
			}
			blockHeight = highestParentHeight + 1
		}

		heightGroupSize, err := p.database.HeightGroupSize(databaseTransaction, blockHeight)
		if err != nil {
			return err
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
		}
		err = p.database.InsertBlock(databaseTransaction, blockHash, databaseBlock)
		if err != nil {
			return errors.Wrapf(err, "Could not insert block %s", blockHash)
		}

		blockID, err := p.database.BlockIDByHash(databaseTransaction, blockHash)
		if err != nil {
			return err
		}
		heightGroup := &model.HeightGroup{
			Height: blockHeight,
			Size:   blockHeightGroupIndex + 1,
		}
		err = p.database.InsertOrUpdateHeightGroup(databaseTransaction, heightGroup)
		if err != nil {
			return err
		}

		for _, parentID := range parentIDs {
			parentHeight, err := p.database.BlockHeight(databaseTransaction, parentID)
			if err != nil {
				return err
			}
			parentHeightGroupIndex, err := p.database.BlockHeightGroupIndex(databaseTransaction, parentID)
			if err != nil {
				return err
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
				return err
			}
		}
	}

	blockInfo, err := p.kaspad.Domain().Consensus().GetBlockInfo(blockHash)
	if err != nil {
		return err
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
		return err
	}
	err = p.database.UpdateBlockSelectedParent(databaseTransaction, blockID, selectedParentID)
	if err != nil {
		return err
	}

	mergeSetRedIDs, err := p.database.BlockIDsByHashes(databaseTransaction, blockGHOSTDAGData.MergeSetReds())
	if err != nil {
		return err
	}
	mergeSetBlueIDs, err := p.database.BlockIDsByHashes(databaseTransaction, blockGHOSTDAGData.MergeSetBlues())
	if err != nil {
		return err
	}
	err = p.database.UpdateBlockMergeSet(databaseTransaction, blockID, mergeSetRedIDs, mergeSetBlueIDs)
	if err != nil {
		return err
	}

	if blockInsertionResult == nil || blockInsertionResult.VirtualSelectedParentChainChanges == nil {
		return nil
	}

	blockColors := make(map[uint64]string)
	blockIsInVirtualSelectedParentChain := make(map[uint64]bool)
	removedBlockHashes := blockInsertionResult.VirtualSelectedParentChainChanges.Removed
	if len(removedBlockHashes) > 0 {
		removedBlockIDs, err := p.database.BlockIDsByHashes(databaseTransaction, removedBlockHashes)
		if err != nil {
			return err
		}
		for _, removedBlockID := range removedBlockIDs {
			blockColors[removedBlockID] = model.ColorGray
			blockIsInVirtualSelectedParentChain[removedBlockID] = false
		}
	}

	addedBlockHashes := blockInsertionResult.VirtualSelectedParentChainChanges.Added
	if len(addedBlockHashes) > 0 {
		addedBlockIDs, err := p.database.BlockIDsByHashes(databaseTransaction, addedBlockHashes)
		if err != nil {
			return err
		}
		for _, addedBlockID := range addedBlockIDs {
			blockIsInVirtualSelectedParentChain[addedBlockID] = true
		}
	}
	err = p.database.UpdateBlockIsInVirtualSelectedParentChain(databaseTransaction, blockIsInVirtualSelectedParentChain)
	if err != nil {
		return err
	}

	for _, addedBlockHash := range addedBlockHashes {
		addedBlockGHOSTDAGData, err := p.kaspad.BlockGHOSTDAGData(addedBlockHash)
		if err != nil {
			return errors.Wrapf(err, "Could not get GHOSTDAG data for added block %s", blockHash)
		}

		blueHashes := addedBlockGHOSTDAGData.MergeSetBlues()
		if len(blueHashes) > 0 {
			blueBlockIDs, err := p.database.BlockIDsByHashes(databaseTransaction, blueHashes)
			if err != nil {
				return errors.Wrapf(err, "Could not get blue block IDs for added block %s", addedBlockHash)
			}
			for _, blueBlockID := range blueBlockIDs {
				blockColors[blueBlockID] = model.ColorBlue
			}
		}

		redHashes := addedBlockGHOSTDAGData.MergeSetReds()
		if len(redHashes) > 0 {
			redBlockIDs, err := p.database.BlockIDsByHashes(databaseTransaction, redHashes)
			if err != nil {
				return errors.Wrapf(err, "Could not get red block IDs for added block %s", addedBlockHash)
			}
			for _, redBlockID := range redBlockIDs {
				blockColors[redBlockID] = model.ColorRed
			}
		}
	}
	return p.database.UpdateBlockColors(databaseTransaction, blockColors)
}
