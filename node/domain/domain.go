package domain

import (
	kaspadDomainPackage "github.com/kaspanet/kaspad/domain"
	"github.com/kaspanet/kaspad/domain/consensus"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/dagconfig"
	"github.com/kaspanet/kaspad/domain/miningmanager"
	"github.com/kaspanet/kaspad/infrastructure/db/database"
)

func New(dagParams *dagconfig.Params, databaseContext database.Database) (kaspadDomainPackage.Domain, error) {
	consensusFactory := consensus.NewFactory()
	consensusInstance, err := consensusFactory.NewConsensus(dagParams, databaseContext, false)
	if err != nil {
		return nil, err
	}
	return &domain{consensus: consensusInstance}, nil
}

type domain struct {
	consensus externalapi.Consensus
}

func (d *domain) MiningManager() miningmanager.MiningManager {
	return d
}

func (d *domain) Consensus() externalapi.Consensus {
	return d.consensus
}
