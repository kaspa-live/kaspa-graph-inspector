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
