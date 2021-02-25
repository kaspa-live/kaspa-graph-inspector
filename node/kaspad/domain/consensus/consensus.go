package consensus

import (
	kaspadConsensus "github.com/kaspanet/kaspad/domain/consensus"
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

	return &Consensus{kaspadConsensus: kaspadConsensusInstance}, nil
}

type Consensus struct {
	kaspadConsensus externalapi.Consensus

	onBlockAddedListener OnBlockAddedListener
}

type OnBlockAddedListener func(*externalapi.DomainBlock)

func (c *Consensus) SetOnBlockAddedListener(listener OnBlockAddedListener) {
	c.onBlockAddedListener = listener
}

func (c *Consensus) ValidateAndInsertBlock(block *externalapi.DomainBlock) (*externalapi.BlockInsertionResult, error) {
	blockInsertionResult, err := c.kaspadConsensus.ValidateAndInsertBlock(block)
	if err != nil {
		return nil, err
	}

	c.onBlockAddedListener(block)

	return blockInsertionResult, nil
}
