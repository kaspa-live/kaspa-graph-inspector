package main

import (
	databasePackage "github.com/kaspa-live/kaspa-graph-inspector/processing/database"
	configPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/logging"
	kaspadPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/kaspad"
	processingPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/processing"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/version"
)

func main() {
	config, err := configPackage.LoadConfig()
	if err != nil {
		logging.LogErrorAndExit("Could not parse command line arguments.\n%s", err)
	}

	logging.Logger().Infof("Version %s", version.Version())

	database, err := databasePackage.Connect(config.DatabaseConnectionString)
	if err != nil {
		logging.LogErrorAndExit("Could not connect to database %s: %s", config.DatabaseConnectionString, err)
	}
	defer database.Close()

	kaspad, err := kaspadPackage.New(config)
	if err != nil {
		logging.LogErrorAndExit("Could not create kaspad: %s", err)
	}
	processing, err := processingPackage.NewProcessing(config, database, kaspad)
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

	kaspad.SetOnVirtualResolvedListener(func() {
		err := processing.ResyncVirtualSelectedParentChain()
		if err != nil {
			logging.LogErrorAndExit("Could not resync the virtual selected parent chain: %s", err)
		}
	})
	kaspad.SetOnConsensusResetListener(func() {
		err := processing.ResyncDatabase()
		if err != nil {
			logging.LogErrorAndExit("Could not resync database: %s", err)
		}
	})
	err = kaspad.Start()
	if err != nil {
		logging.LogErrorAndExit("Could not start kaspad: %s", err)
	}

	<-make(chan struct{})
}
