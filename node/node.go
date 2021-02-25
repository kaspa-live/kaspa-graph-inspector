package main

import (
	"github.com/kaspanet/kaspad/app"
	kaspadConfigPackage "github.com/kaspanet/kaspad/infrastructure/config"
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

	kaspadConfig := &kaspadConfigPackage.Config{
		Flags: &kaspadConfigPackage.Flags{
			ConnectPeers: []string{config.P2PServerAddress},
			NetworkFlags: config.NetworkFlags,
		},
	}
	databaseContext, err := database.Open()
	if err != nil {
		logErrorAndExit("Could not open database: %s", err)
	}
	interrupt := make(chan struct{})

	componentManager, err := app.NewComponentManager(kaspadConfig, databaseContext, interrupt)
	if err != nil {
		logErrorAndExit("Could not start kaspad: %s", err)
	}
	componentManager.Start()

	log.Infof("Node started!")

	<-interrupt
}

func logErrorAndExit(errorLog string, logParameters ...interface{}) {
	log.Errorf(errorLog, logParameters...)
	os.Exit(1)
}
