package consensus

import (
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/logging"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/processing_errors"
	kaspadConsensus "github.com/kaspanet/kaspad/domain/consensus"
	consensusDatabase "github.com/kaspanet/kaspad/domain/consensus/database"
	"github.com/kaspanet/kaspad/domain/consensus/datastructures/ghostdagdatastore"
	"github.com/kaspanet/kaspad/domain/consensus/model"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/consensus/utils/consensushashing"
	"github.com/kaspanet/kaspad/domain/dagconfig"
	"github.com/kaspanet/kaspad/infrastructure/db/database"
	"github.com/pkg/errors"
)

var log = logging.Logger()

func New(dagParams *dagconfig.Params, databaseContext database.Database) (*Consensus, error) {
	consensusConfig := &kaspadConsensus.Config{
		Params:                          *dagParams,
		IsArchival:                      false,
		EnableSanityCheckPruningUTXOSet: false,
	}
	kaspadConsensusFactory := kaspadConsensus.NewFactory()
	kaspadConsensusInstance, err := kaspadConsensusFactory.NewConsensus(consensusConfig, databaseContext)
	if err != nil {
		return nil, err
	}

	dbManager := consensusDatabase.New(databaseContext)
	pruningWindowSizeForCaches := int(dagParams.PruningDepth())
	ghostdagDataStore := ghostdagdatastore.New(pruningWindowSizeForCaches, true)

	return &Consensus{
		dbManager:         dbManager,
		kaspadConsensus:   kaspadConsensusInstance,
		ghostdagDataStore: ghostdagDataStore,
	}, nil
}

type Consensus struct {
	dbManager         model.DBManager
	kaspadConsensus   externalapi.Consensus
	ghostdagDataStore model.GHOSTDAGDataStore

	onAddingBlockListener OnAddingBlockListener
	onBlockAddedListener  OnBlockAddedListener
}

type OnAddingBlockListener func(*externalapi.DomainBlock) error
type OnBlockAddedListener func(*externalapi.DomainBlock, *externalapi.BlockInsertionResult)

func (c *Consensus) SetOnAddingBlockListener(listener OnAddingBlockListener) {
	c.onAddingBlockListener = listener
}

func (c *Consensus) SetOnBlockAddedListener(listener OnBlockAddedListener) {
	c.onBlockAddedListener = listener
}

func (c *Consensus) ValidateAndInsertBlock(block *externalapi.DomainBlock) (*externalapi.BlockInsertionResult, error) {
	receivedOrphanBlock := false
	if c.onAddingBlockListener != nil {
		err := c.onAddingBlockListener(block)
		if err != nil {
			if !errors.Is(err, processing_errors.ErrMissingParents) {
				return nil, err
			}
			receivedOrphanBlock = true
			log.Warnf("Received orphan block: %s", err)
		}
	}

	blockInsertionResult, err := c.kaspadConsensus.ValidateAndInsertBlock(block)
	if err != nil {
		return nil, err
	}
	if receivedOrphanBlock {
		return nil, errors.Errorf("Expected orphan block %s was "+
			"successfully added to the consensus", consensushashing.BlockHash(block))
	}

	if c.onBlockAddedListener != nil {
		c.onBlockAddedListener(block, blockInsertionResult)
	}

	return blockInsertionResult, nil
}

func (c *Consensus) BlockGHOSTDAGData(blockHash *externalapi.DomainHash) (*model.BlockGHOSTDAGData, error) {
	return c.ghostdagDataStore.Get(c.dbManager, model.NewStagingArea(), blockHash)
}
