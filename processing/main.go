package main

import (
	"fmt"
	"github.com/kaspanet/kaspad/infrastructure/network/rpcclient"

	databasePackage "github.com/kaspa-live/kaspa-graph-inspector/processing/database"
	configPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/logging"
	processingPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/processing"
	versionPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/version"
	"github.com/kaspanet/kaspad/version"
)

func main() {
	fmt.Println("=================================================")
	fmt.Println("Kaspa Graph Inspector (KGI)   -   Processing Tier")
	fmt.Println("=================================================")

	config, err := configPackage.LoadConfig()
	if err != nil {
		logging.LogErrorAndExit("Could not parse command line arguments.\n%s", err)
	}

	logging.Logger().Infof("Application version %s", versionPackage.Version())
	logging.Logger().Infof("Embedded kaspad version %s", version.Version())
	logging.Logger().Infof("Network %s", config.ActiveNetParams.Name)

	database, err := databasePackage.Connect(config.DatabaseConnectionString)
	if err != nil {
		logging.LogErrorAndExit("Could not connect to database %s: %s", config.DatabaseConnectionString, err)
	}
	defer database.Close()

	rpcAddress, err := config.NetParams().NormalizeRPCServerAddress(config.RPCServer)
	if err != nil {
		panic(err)
	}
	rpcClient, err := rpcclient.NewRPCClient(rpcAddress)
	if err != nil {
		panic(err)
	}

	_, err = processingPackage.NewProcessing(config, database, rpcClient)
	if err != nil {
		logging.LogErrorAndExit("Could not initialize processing: %s", err)
	}

	// This is no longer useful since kaspad v0.12.2
	// that introduce a consensus event channel.
	// See processing.initConsensusEventsHandler.

	// kaspad.SetOnBlockAddedListener(func(block *externalapi.DomainBlock) {
	// 	blockHash := consensushashing.BlockHash(block)
	// 	blockInfo, err := kaspad.Domain().Consensus().GetBlockInfo(blockHash)
	// 	if err != nil {
	// 		logging.LogErrorAndExit("Consensus ValidateAndInsertBlock listener could not get block info for block %s: %s", blockHash, err)
	// 	}
	// 	logging.Logger().Debugf("Consensus ValidateAndInsertBlock listener gets block %s with status %s", blockHash, blockInfo.BlockStatus.String())
	// })

	//kaspad.SetOnVirtualResolvedListener(func() {
	//	err := processing.ResyncVirtualSelectedParentChain()
	//	if err != nil {
	//		logging.LogErrorAndExit("Could not resync the virtual selected parent chain: %s", err)
	//	}
	//})
	//kaspad.SetOnConsensusResetListener(func() {
	//	err := processing.ResyncDatabase()
	//	if err != nil {
	//		logging.LogErrorAndExit("Could not resync database: %s", err)
	//	}
	//})
	//err = kaspad.Start()
	//if err != nil {
	//	logging.LogErrorAndExit("Could not start kaspad: %s", err)
	//}

	<-make(chan struct{})
}
