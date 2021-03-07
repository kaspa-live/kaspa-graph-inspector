package consensus

import (
	kaspadConsensus "github.com/kaspanet/kaspad/domain/consensus"
	consensusDatabase "github.com/kaspanet/kaspad/domain/consensus/database"
	"github.com/kaspanet/kaspad/domain/consensus/datastructures/ghostdagdatastore"
	"github.com/kaspanet/kaspad/domain/consensus/model"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/dagconfig"
	"github.com/kaspanet/kaspad/infrastructure/db/database"
)

func New(dagParams *dagconfig.Params, databaseContext database.Database) (*Consensus, error) {
	kaspadConsensusFactory := kaspadConsensus.NewFactory()
	kaspadConsensusInstance, err := kaspadConsensusFactory.NewConsensus(dagParams, databaseContext, false)
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
type OnBlockAddedListener func(*externalapi.DomainBlock)

func (c *Consensus) SetOnAddingBlockListener(listener OnAddingBlockListener) {
	c.onAddingBlockListener = listener
}

func (c *Consensus) SetOnBlockAddedListener(listener OnBlockAddedListener) {
	c.onBlockAddedListener = listener
}

func (c *Consensus) ValidateAndInsertBlock(block *externalapi.DomainBlock) (*externalapi.BlockInsertionResult, error) {
	var addingBlockError error
	if c.onAddingBlockListener != nil {
		addingBlockError = c.onAddingBlockListener(block)
	}

	blockInsertionResult, err := c.kaspadConsensus.ValidateAndInsertBlock(block)
	if err != nil {
		return nil, err
	}
	if addingBlockError != nil {
		// onAddingBlockListener may correctly return errors when there's
		// something wrong with the block itself (most commonly missing
		// parents).
		// If we received an error from onAddingBlockListener but not from
		// ValidateAndInsertBlock it means that something actually is
		// wrong and we should abort.
		return nil, addingBlockError
	}

	if c.onBlockAddedListener != nil {
		c.onBlockAddedListener(block)
	}

	return blockInsertionResult, nil
}

func (c *Consensus) BlockGHOSTDAGData(blockHash *externalapi.DomainHash) (*model.BlockGHOSTDAGData, error) {
	return c.ghostdagDataStore.Get(c.dbManager, blockHash)
}
