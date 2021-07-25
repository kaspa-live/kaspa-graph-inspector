package consensus

import (
	kaspadConsensus "github.com/kaspanet/kaspad/domain/consensus"
	consensusDatabase "github.com/kaspanet/kaspad/domain/consensus/database"
	"github.com/kaspanet/kaspad/domain/consensus/datastructures/ghostdagdatastore"
	"github.com/kaspanet/kaspad/domain/consensus/model"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/dagconfig"
	"github.com/kaspanet/kaspad/domain/prefixmanager/prefix"
	"github.com/kaspanet/kaspad/infrastructure/db/database"
)

func New(dagParams *dagconfig.Params, databaseContext database.Database, dbPrefix *prefix.Prefix) (*Consensus, error) {
	consensusConfig := &kaspadConsensus.Config{
		Params:                          *dagParams,
		IsArchival:                      false,
		EnableSanityCheckPruningUTXOSet: false,
	}
	kaspadConsensusFactory := kaspadConsensus.NewFactory()
	kaspadConsensusInstance, err := kaspadConsensusFactory.NewConsensus(consensusConfig, databaseContext, dbPrefix)
	if err != nil {
		return nil, err
	}

	dbManager := consensusDatabase.New(databaseContext)
	pruningWindowSizeForCaches := int(dagParams.PruningDepth())
	ghostdagDataStore := ghostdagdatastore.New(dbPrefix, pruningWindowSizeForCaches, true)

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

	onBlockAddedListener OnBlockAddedListener
}

func (c *Consensus) ValidateAndInsertBlock(block *externalapi.DomainBlock, shouldValidateAgainstUTXO bool) (*externalapi.BlockInsertionResult, error) {
	blockInsertionResult, err := c.kaspadConsensus.ValidateAndInsertBlock(block, shouldValidateAgainstUTXO)
	if err != nil {
		return nil, err
	}
	c.onBlockAddedListener(block, blockInsertionResult)
	return blockInsertionResult, nil
}

type OnBlockAddedListener func(*externalapi.DomainBlock, *externalapi.BlockInsertionResult)

func (c *Consensus) SetOnBlockAddedListener(listener OnBlockAddedListener) {
	c.onBlockAddedListener = listener
}

func (c *Consensus) BlockGHOSTDAGData(blockHash *externalapi.DomainHash) (*externalapi.BlockGHOSTDAGData, error) {
	return c.ghostdagDataStore.Get(c.dbManager, model.NewStagingArea(), blockHash, false)
}
