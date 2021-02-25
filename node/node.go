package main

import (
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/consensus/utils/consensushashing"
	configPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/node/infrastructure/config"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/node/infrastructure/logging"
	kaspadPackage "github.com/stasatdaglabs/kaspa-dag-visualizer/node/kaspad"
	"os"
)

var log = logging.Logger()

func main() {
	config, err := configPackage.Parse()
	if err != nil {
		logErrorAndExit("Could not parse command line arguments.\n%s", err)
	}

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

	log.Infof("Node started!")
	<-make(chan struct{})
}

func logErrorAndExit(errorLog string, logParameters ...interface{}) {
	log.Errorf(errorLog, logParameters...)
	os.Exit(1)
}
