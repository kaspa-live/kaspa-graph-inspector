package domain

import (
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/dagconfig"
	"github.com/kaspanet/kaspad/domain/miningmanager"
	"github.com/kaspanet/kaspad/infrastructure/db/database"
	consensusPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/kaspad/domain/consensus"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/kaspad/domain/mining_manager"
)

func New(dagParams *dagconfig.Params, databaseContext database.Database) (*Domain, error) {
	consensus, err := consensusPackage.New(dagParams, databaseContext)
	if err != nil {
		return nil, err
	}
	miningManager := mining_manager.New()
	return &Domain{
		consensus:     consensus,
		miningManager: miningManager,
	}, nil
}

type Domain struct {
	consensus     *consensusPackage.Consensus
	miningManager miningmanager.MiningManager
}

func (d *Domain) SetOnBlockAddedListener(listener consensusPackage.OnBlockAddedListener) {
	d.consensus.SetOnBlockAddedListener(listener)
}

func (d *Domain) MiningManager() miningmanager.MiningManager {
	return d.miningManager
}

func (d *Domain) Consensus() externalapi.Consensus {
	return d.consensus
}
