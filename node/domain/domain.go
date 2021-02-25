package domain

import (
	kaspadDomainPackage "github.com/kaspanet/kaspad/domain"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/dagconfig"
	"github.com/kaspanet/kaspad/domain/miningmanager"
	"github.com/kaspanet/kaspad/infrastructure/db/database"
	consensusPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/node/domain/consensus"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/node/domain/mining_manager"
)

func New(dagParams *dagconfig.Params, databaseContext database.Database) (kaspadDomainPackage.Domain, error) {
	consensus, err := consensusPackage.New(dagParams, databaseContext)
	if err != nil {
		return nil, err
	}
	miningManager := mining_manager.New()
	return &domain{
		consensus:     consensus,
		miningManager: miningManager,
	}, nil
}

type domain struct {
	consensus     externalapi.Consensus
	miningManager miningmanager.MiningManager
}

func (d *domain) MiningManager() miningmanager.MiningManager {
	return d.miningManager
}

func (d *domain) Consensus() externalapi.Consensus {
	return d.consensus
}
