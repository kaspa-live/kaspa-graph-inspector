package main

import (
	"github.com/kaspanet/kaspad/app/protocol"
	domainPackage "github.com/kaspanet/kaspad/domain"
	kaspadConfigPackage "github.com/kaspanet/kaspad/infrastructure/config"
	"github.com/kaspanet/kaspad/infrastructure/network/addressmanager"
	"github.com/kaspanet/kaspad/infrastructure/network/connmanager"
	"github.com/kaspanet/kaspad/infrastructure/network/netadapter"
	"github.com/kaspanet/kaspad/infrastructure/network/netadapter/router"
	configPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/node/infrastructure/config"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/node/infrastructure/database"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/node/infrastructure/logging"
	"os"
)

var log = logging.Logger()

func main() {
	config, err := configPackage.Parse()
	if err != nil {
		logErrorAndExit("Could not parse command line arguments.\n%s", err)
	}

	node, err := newNode(config)
	if err != nil {
		logErrorAndExit("Could not create node: %s", err)
	}
	err = node.start()
	if err != nil {
		logErrorAndExit("Could not start node: %s", err)
	}

	log.Infof("Node started!")
	<-make(chan struct{})
}

type node struct {
	netAdapter        *netadapter.NetAdapter
	connectionManager *connmanager.ConnectionManager
	protocolManager   *protocol.Manager
}

func newNode(config *configPackage.Config) (*node, error) {
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
	domain, err := domainPackage.New(config.NetworkFlags.ActiveNetParams, databaseContext, false)
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
	return &node{
		netAdapter:        netAdapter,
		connectionManager: connectionManager,
		protocolManager:   protocolManager,
	}, nil
}

func (n *node) start() error {
	err := n.netAdapter.Start()
	if err != nil {
		return err
	}
	n.connectionManager.Start()
	return nil
}

func logErrorAndExit(errorLog string, logParameters ...interface{}) {
	log.Errorf(errorLog, logParameters...)
	os.Exit(1)
}
