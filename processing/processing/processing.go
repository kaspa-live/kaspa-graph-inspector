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
)

var log = logging.Logger()

type Processing struct {
	config   *configPackage.Config
	database *databasePackage.Database
	kaspad   *kaspadPackage.Kaspad
}

func NewProcessing(config *configPackage.Config,
	database *databasePackage.Database, kaspad *kaspadPackage.Kaspad) (*Processing, error) {

	processing := &Processing{
		config:   config,
		database: database,
		kaspad:   kaspad,
	}

	err := processing.syncDatabase()
	if err != nil {
		return nil, err
	}

	return processing, nil
}

func (p *Processing) syncDatabase() error {
	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		log.Infof("Syncing database")
		defer log.Infof("Finished syncing database")

		pruningPointHash, err := p.kaspad.Domain().Consensus().PruningPoint()
		if err != nil {
			return err
		}
		pruningPointExistsInDatabase, err := p.database.DoesBlockExist(databaseTransaction, pruningPointHash)
		if err != nil {
			return err
		}
		if pruningPointExistsInDatabase {
			return nil
		}
		pruningPointBlock, err := p.kaspad.Domain().Consensus().GetBlock(pruningPointHash)
		if err != nil {
			return err
		}

		log.Infof("Pruning point %s is missing from the database", pruningPointHash)
		err = p.database.Clear(databaseTransaction)
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

		virtualSelectedChainPath, err := p.kaspad.Domain().Consensus().GetVirtualSelectedParentChainFromBlock(pruningPointHash)
		if err != nil {
			return err
		}
		virtualSelectedParentChain := virtualSelectedChainPath.Added

		if len(virtualSelectedParentChain) == 0 {
			return nil
		}
		log.Infof("Syncing a selected parent chain of length %d", len(virtualSelectedParentChain))

		return nil
	})
}

func (p *Processing) ProcessAddedBlock(block *externalapi.DomainBlock,
	blockInsertionResult *externalapi.BlockInsertionResult) error {

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		blockHash := consensushashing.BlockHash(block)
		log.Infof("Processing block %s", blockHash)
		defer log.Infof("Finished processing block %s", blockHash)

		blockExists, err := p.database.DoesBlockExist(databaseTransaction, blockHash)
		if err != nil {
			return err
		}
		if !blockExists {
			parentHashes := block.Header.ParentHashes()
			parentIDs, err := p.database.BlockIDsByHashes(databaseTransaction, parentHashes)
			if err != nil {
				return errors.Errorf("Could not resolve "+
					"parent IDs for block %s: %s", blockHash, err)
			}

			highestParentHeight, err := p.database.HighestBlockHeight(databaseTransaction, parentIDs)
			if err != nil {
				return errors.Wrapf(err, "Could not resolve highest parent height for block %s", blockHash)
			}
			blockHeight := highestParentHeight + 1

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
		if blockInfo.BlockStatus == externalapi.StatusHeaderOnly {
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

		if blockInsertionResult.VirtualSelectedParentChainChanges == nil {
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
	})
}
