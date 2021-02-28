package main

import (
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/consensus/utils/consensushashing"
	databasePackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/database"
	configPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/infrastructure/config"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/infrastructure/logging"
	kaspadPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/processing/kaspad"
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
	kaspad.SetOnBlockAddedListener(func(block *externalapi.DomainBlock) {
		log.Infof("aaa!! %s", consensushashing.BlockHash(block))
	})
	err = kaspad.Start()
	if err != nil {
		logErrorAndExit("Could not start kaspad: %s", err)
	}

	<-make(chan struct{})
}

func logErrorAndExit(errorLog string, logParameters ...interface{}) {
	log.Errorf(errorLog, logParameters...)
	os.Exit(1)
}
