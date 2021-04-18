package processing

import (
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/consensus/utils/consensushashing"
	"github.com/pkg/errors"
	databasePackage "github.com/stasatdaglabs/kaspa-graph-inspector/processing/database"
	"github.com/stasatdaglabs/kaspa-graph-inspector/processing/database/model"
	configPackage "github.com/stasatdaglabs/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/stasatdaglabs/kaspa-graph-inspector/processing/infrastructure/logging"
	kaspadPackage "github.com/stasatdaglabs/kaspa-graph-inspector/processing/kaspad"
	"github.com/stasatdaglabs/kaspa-graph-inspector/processing/processing_errors"
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

	err := processing.insertGenesisIfRequired()
	if err != nil {
		return nil, err
	}

	return processing, nil
}

func (p *Processing) insertGenesisIfRequired() error {
	genesisHash := p.config.ActiveNetParams.GenesisHash
	exists, err := p.database.DoesBlockExist(genesisHash)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}

	genesisBlock, err := p.kaspad.Domain().Consensus().GetBlock(genesisHash)
	if err != nil {
		return err
	}
	databaseGenesisBlock := &model.Block{
		BlockHash:                      genesisHash.String(),
		Timestamp:                      genesisBlock.Header.TimeInMilliseconds(),
		ParentIDs:                      nil,
		Height:                         0,
		HeightGroupIndex:               0,
		SelectedParentID:               nil,
		Color:                          model.ColorGray,
		IsInVirtualSelectedParentChain: true,
	}
	err = p.database.InsertOrIgnoreBlock(genesisHash, databaseGenesisBlock)
	if err != nil {
		return errors.Wrapf(err, "Could not insert genesis block %s", genesisHash)
	}
	return nil
}

func (p *Processing) PreprocessBlock(block *externalapi.DomainBlock) error {
	blockHash := consensushashing.BlockHash(block)
	log.Debugf("Preprocessing block %s", blockHash)
	defer log.Debugf("Finished preprocessing block %s", blockHash)

	parentHashes := block.Header.ParentHashes()
	parentIDs, err := p.database.BlockIDsByHashes(parentHashes)
	if err != nil {
		return errors.Wrapf(processing_errors.ErrMissingParents, "Could not resolve "+
			"parent IDs for block %s: %s", blockHash, err)
	}

	highestParentHeight, err := p.database.HighestBlockHeight(parentIDs)
	if err != nil {
		return errors.Wrapf(err, "Could not resolve highest parent height for block %s", blockHash)
	}
	blockHeight := highestParentHeight + 1

	blocksWithHeightCount, err := p.database.CountBlocksWithHeight(blockHeight)
	if err != nil {
		return err
	}

	databaseBlock := &model.Block{
		BlockHash:                      blockHash.String(),
		Timestamp:                      block.Header.TimeInMilliseconds(),
		ParentIDs:                      parentIDs,
		Height:                         blockHeight,
		HeightGroupIndex:               blocksWithHeightCount,
		SelectedParentID:               nil,
		Color:                          model.ColorGray,
		IsInVirtualSelectedParentChain: false,
	}
	err = p.database.InsertOrIgnoreBlock(blockHash, databaseBlock)
	if err != nil {
		return errors.Wrapf(err, "Could not insert block %s", blockHash)
	}
	return nil
}

func (p *Processing) ProcessAddedBlock(block *externalapi.DomainBlock,
	blockInsertionResult *externalapi.BlockInsertionResult) error {

	blockHash := consensushashing.BlockHash(block)
	log.Debugf("Processing added block %s", blockHash)
	defer log.Debugf("Finished processing added block %s", blockHash)

	blockID, err := p.database.BlockIDByHash(blockHash)
	if err != nil {
		return errors.Wrapf(err, "Could not get block ID for block %s", blockHash)
	}
	blockGHOSTDAGData, err := p.kaspad.BlockGHOSTDAGData(blockHash)
	if err != nil {
		return errors.Wrapf(err, "Could not get GHOSTDAG data for block %s", blockHash)
	}
	selectedParentID, err := p.database.BlockIDByHash(blockGHOSTDAGData.SelectedParent())
	if err != nil {
		return errors.Wrapf(err, "Could not get selected parent block ID for block %s",
			blockGHOSTDAGData.SelectedParent())
	}
	err = p.database.UpdateBlockSelectedParent(blockID, selectedParentID)
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
		removedBlockIDs, err := p.database.BlockIDsByHashes(removedBlockHashes)
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
		addedBlockIDs, err := p.database.BlockIDsByHashes(addedBlockHashes)
		if err != nil {
			return err
		}
		for _, addedBlockID := range addedBlockIDs {
			blockIsInVirtualSelectedParentChain[addedBlockID] = true
		}
	}
	err = p.database.UpdateBlockIsInVirtualSelectedParentChain(blockIsInVirtualSelectedParentChain)
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
			blueBlockIDs, err := p.database.BlockIDsByHashes(blueHashes)
			if err != nil {
				return errors.Wrapf(err, "Could not get blue block IDs for added block %s", addedBlockHash)
			}
			for _, blueBlockID := range blueBlockIDs {
				blockColors[blueBlockID] = model.ColorBlue
			}
		}

		redHashes := addedBlockGHOSTDAGData.MergeSetReds()
		if len(redHashes) > 0 {
			redBlockIDs, err := p.database.BlockIDsByHashes(redHashes)
			if err != nil {
				return errors.Wrapf(err, "Could not get red block IDs for added block %s", addedBlockHash)
			}
			for _, redBlockID := range redBlockIDs {
				blockColors[redBlockID] = model.ColorRed
			}
		}
	}
	return p.database.UpdateBlockColors(blockColors)
}
