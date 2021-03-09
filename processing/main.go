package main

import (
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	databasePackage "github.com/stasatdaglabs/kaspa-graph-inspector/processing/database"
	configPackage "github.com/stasatdaglabs/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/stasatdaglabs/kaspa-graph-inspector/processing/infrastructure/logging"
	kaspadPackage "github.com/stasatdaglabs/kaspa-graph-inspector/processing/kaspad"
	processingPackage "github.com/stasatdaglabs/kaspa-graph-inspector/processing/processing"
	"os"
)

var log = logging.Logger()

func main() {
	config, err := configPackage.Parse()
	if err != nil {
		logErrorAndExit("Could not parse command line arguments.\n%s", err)
	}

	database, err := databasePackage.Connect(config.DatabaseConnectionString)
	if err != nil {
		logErrorAndExit("Could not connect to database %s: %s", config.DatabaseConnectionString, err)
	}
	defer database.Close()

	kaspad, err := kaspadPackage.New(config)
	if err != nil {
		logErrorAndExit("Could not create kaspad: %s", err)
	}
	err = kaspad.Start()
	if err != nil {
		logErrorAndExit("Could not start kaspad: %s", err)
	}

	processing, err := processingPackage.NewProcessing(config, database, kaspad)
	if err != nil {
		logErrorAndExit("Could not initialize processing: %s", err)
	}
	kaspad.SetOnAddingBlockListener(processing.PreprocessBlock)
	kaspad.SetOnBlockAddedListener(func(block *externalapi.DomainBlock,
		blockInsertionResult *externalapi.BlockInsertionResult) {
		err := processing.ProcessAddedBlock(block, blockInsertionResult)
		if err != nil {
			logErrorAndExit("Could not process added block: %s", err)
		}
	})

	<-make(chan struct{})
}

func logErrorAndExit(errorLog string, logParameters ...interface{}) {
	log.Errorf(errorLog, logParameters...)
	os.Exit(1)
}
