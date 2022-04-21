package kaspad

import (
	configPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/database"
	//"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/logging"
	domainPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/kaspad/domain"
	consensusPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/kaspad/domain/consensus"
	"github.com/kaspanet/kaspad/app/protocol"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	kaspadConfigPackage "github.com/kaspanet/kaspad/infrastructure/config"
	"github.com/kaspanet/kaspad/infrastructure/network/addressmanager"
	"github.com/kaspanet/kaspad/infrastructure/network/connmanager"
	"github.com/kaspanet/kaspad/infrastructure/network/netadapter"
	"github.com/kaspanet/kaspad/infrastructure/network/netadapter/router"
	"net"
)

type Kaspad struct {
	config            *configPackage.Config
	domain            *domainPackage.Domain
	netAdapter        *netadapter.NetAdapter
	addressManager    *addressmanager.AddressManager
	connectionManager *connmanager.ConnectionManager
	protocolManager   *protocol.Manager
}

func New(config *configPackage.Config) (*Kaspad, error) {
	kaspadConfig := kaspadConfigPackage.DefaultConfig()
	kaspadConfig.ConnectPeers = config.ConnectPeers
	kaspadConfig.DNSSeed = config.DNSSeed
	kaspadConfig.GRPCSeed = config.GRPCSeed
	kaspadConfig.NetworkFlags = config.NetworkFlags
	kaspadConfig.Lookup = net.LookupIP

	//logging.UpdateLogLevels()

	databaseContext, err := database.Open(config)
	if err != nil {
		return nil, err
	}
	domain, err := domainPackage.New(config.NetworkFlags.ActiveNetParams, databaseContext)
	if err != nil {
		return nil, err
	}
	netAdapter, err := netadapter.NewNetAdapter(kaspadConfig)
	if err != nil {
		return nil, err
	}
	netAdapter.SetRPCRouterInitializer(func(router *router.Router, connection *netadapter.NetConnection) {})
	addressManager, err := addressmanager.New(addressmanager.NewConfig(kaspadConfig), databaseContext)
	if err != nil {
		return nil, err
	}
	connectionManager, err := connmanager.New(kaspadConfig, netAdapter, addressManager)
	if err != nil {
		return nil, err
	}
	protocolManager, err := protocol.NewManager(kaspadConfig, domain, netAdapter, addressManager, connectionManager)
	if err != nil {
		return nil, err
	}
	return &Kaspad{
		config:            config,
		domain:            domain,
		netAdapter:        netAdapter,
		addressManager:    addressManager,
		connectionManager: connectionManager,
		protocolManager:   protocolManager,
	}, nil
}

func (k *Kaspad) SetOnBlockAddedListener(listener consensusPackage.OnBlockAddedListener) {
	k.domain.SetOnBlockAddedListener(listener)
}

func (k *Kaspad) SetOnVirtualResolvedListener(listener consensusPackage.OnVirtualResolvedListener) {
	k.domain.SetOnVirtualResolvedListener(listener)
}

func (k *Kaspad) SetOnConsensusResetListener(listener domainPackage.OnConsensusResetListener) {
	k.domain.SetOnConsensusResetListener(listener)
}

func (k *Kaspad) BlockGHOSTDAGData(blockHash *externalapi.DomainHash) (*externalapi.BlockGHOSTDAGData, error) {
	return k.domain.BlockGHOSTDAGData(blockHash)
}

func (k *Kaspad) Start() error {
	err := k.netAdapter.Start()
	if err != nil {
		return err
	}
	k.connectionManager.Start()
	return nil
}

func (k *Kaspad) Domain() *domainPackage.Domain {
	return k.domain
}
