package kaspad

import (
	"github.com/kaspanet/kaspad/app/protocol"
	kaspadConfigPackage "github.com/kaspanet/kaspad/infrastructure/config"
	"github.com/kaspanet/kaspad/infrastructure/network/addressmanager"
	"github.com/kaspanet/kaspad/infrastructure/network/connmanager"
	"github.com/kaspanet/kaspad/infrastructure/network/netadapter"
	"github.com/kaspanet/kaspad/infrastructure/network/netadapter/router"
	configPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/infrastructure/config"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/infrastructure/database"
	domainPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/kaspad/domain"
	consensusPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/kaspad/domain/consensus"
)

type Kaspad struct {
	domain            *domainPackage.Domain
	netAdapter        *netadapter.NetAdapter
	connectionManager *connmanager.ConnectionManager
	protocolManager   *protocol.Manager
}

func New(config *configPackage.Config) (*Kaspad, error) {
	kaspadConfig := &kaspadConfigPackage.Config{
		Flags: &kaspadConfigPackage.Flags{
			ConnectPeers: []string{config.P2PServerAddress},
			NetworkFlags: config.NetworkFlags,
		},
	}
	databaseContext, err := database.Open()
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
		domain:            domain,
		netAdapter:        netAdapter,
		connectionManager: connectionManager,
		protocolManager:   protocolManager,
	}, nil
}

func (n *Kaspad) SetOnBlockAddedListener(listener consensusPackage.OnBlockAddedListener) {
	n.domain.SetOnBlockAddedListener(listener)
}

func (n *Kaspad) Start() error {
	err := n.netAdapter.Start()
	if err != nil {
		return err
	}
	n.connectionManager.Start()
	return nil
}
