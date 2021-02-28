package processing

import (
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/consensus/utils/consensushashing"
	"github.com/pkg/errors"
	databasePackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/database"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/database/model"
	configPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/infrastructure/config"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/infrastructure/logging"
	kaspadPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/kaspad"
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
		BlockHash: genesisHash.String(),
		Timestamp: genesisBlock.Header.TimeInMilliseconds(),
		ParentIDs: nil,
		Height:    0,
	}
	err = p.database.InsertBlock(databaseGenesisBlock)
	if err != nil {
		return errors.Wrapf(err, "Could not insert genesis block %s", genesisHash)
	}
	return nil
}

func (p *Processing) ProcessBlock(block *externalapi.DomainBlock) error {
	blockHash := consensushashing.BlockHash(block)
	log.Infof("Processing block %s", blockHash)
	defer log.Infof("Finished processing block %s", blockHash)

	parentHashes := block.Header.ParentHashes()
	parentIDs, err := p.blockHashesToIDs(parentHashes)
	if err != nil {
		return errors.Wrapf(err, "Could not resolve parent IDs for block %s", blockHash)
	}

	highestParentHeight, err := p.highestBlockHeight(parentIDs)
	if err != nil {
		return errors.Wrapf(err, "Could not resolve highest parent height for block %s", blockHash)
	}
	blockHeight := highestParentHeight + 1

	databaseBlock := &model.Block{
		BlockHash: blockHash.String(),
		Timestamp: block.Header.TimeInMilliseconds(),
		ParentIDs: parentIDs,
		Height:    blockHeight,
	}
	err = p.database.InsertBlock(databaseBlock)
	if err != nil {
		return errors.Wrapf(err, "Could not insert block %s", blockHash)
	}
	return nil
}

func (p *Processing) blockHashesToIDs(blockHashes []*externalapi.DomainHash) ([]uint64, error) {
	blockIDs, err := p.database.BlockIDsByHashes(blockHashes)
	if err != nil {
		return nil, err
	}
	if len(blockHashes) != len(blockIDs) {
		return nil, errors.Errorf("Some block hashes out of (%s) are missing in the database", blockHashes)
	}
	return blockIDs, nil
}

func (p *Processing) highestBlockHeight(blockIDs []uint64) (uint64, error) {
	return p.database.HighestBlockHeight(blockIDs)
}
