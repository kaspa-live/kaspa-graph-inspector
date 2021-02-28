package processing

import (
	"fmt"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/consensus/utils/consensushashing"
	"github.com/pkg/errors"
	databasePackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/database"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/database/model"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/infrastructure/logging"
	kaspadPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/kaspad"
)

var log = logging.Logger()

type Processing struct {
	database *databasePackage.Database
	kaspad   *kaspadPackage.Kaspad
}

func NewProcessing(database *databasePackage.Database, kaspad *kaspadPackage.Kaspad) *Processing {
	return &Processing{
		database: database,
		kaspad:   kaspad,
	}
}

func (p *Processing) ProcessBlock(block *externalapi.DomainBlock) {
	blockHash := consensushashing.BlockHash(block)
	log.Infof("Processing block %s", blockHash)
	defer log.Infof("Finished processing block %s", blockHash)

	parentHashes := block.Header.ParentHashes()
	parentIDs, err := p.blockHashesToIDs(parentHashes)
	if err != nil {
		panic(fmt.Sprintf("Could not resolve parent IDs for block %s: %s", blockHash, err))
	}

	highestParentHeight, err := p.highestBlockHeight(parentIDs)
	if err != nil {
		panic(fmt.Sprintf("Could not resolve highest parent height for block %s: %s", blockHash, err))
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
		panic(fmt.Sprintf("Could not insert block %s: %s", blockHash, err))
	}
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
