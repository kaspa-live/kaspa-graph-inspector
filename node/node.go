package main

import (
	configPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/node/infrastructure/config"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/node/infrastructure/logging"
	"os"
)

var log = logging.Logger()

func main() {
	config, err := configPackage.Parse()
	if err != nil {
		logErrorAndExit("Could not parse command line arguments.\n%s", err)
	}

	log.Infof("Hello World! %s", config.P2PServerAddress)
}

func logErrorAndExit(errorLog string, logParameters ...interface{}) {
	log.Errorf(errorLog, logParameters...)
	os.Exit(1)
}
