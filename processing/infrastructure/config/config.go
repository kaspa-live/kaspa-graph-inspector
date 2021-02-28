package config

import (
	"github.com/jessevdk/go-flags"
	"github.com/kaspanet/kaspad/infrastructure/config"
	"github.com/kaspanet/kaspad/util"
	"github.com/pkg/errors"
)

const (
	appDataDirectory = "kaspa-dag-visualizer-processing"
)

var (
	HomeDir = util.AppDataDir(appDataDirectory, false)
)

type Config struct {
	P2PServerAddress         string `long:"p2p-server" description:"Kaspad P2P server to connect to. Should be of the form: <host>:<port>"`
	DatabaseConnectionString string `long:"connection-string" description:"Connection string for PostgrSQL database to connect to. Should be of the form: postgres://<username>:<password>@<host>:<port>/<database name>"`
	config.NetworkFlags
}

func Parse() (*Config, error) {
	config := &Config{}
	parser := flags.NewParser(config, flags.HelpFlag)
	_, err := parser.Parse()
	if err != nil {
		return nil, err
	}

	if config.P2PServerAddress == "" {
		return nil, errors.Errorf("--p2p-server is required.")
	}
	if config.DatabaseConnectionString == "" {
		return nil, errors.Errorf("--connection-string is required.")
	}

	err = config.ResolveNetwork(parser)
	if err != nil {
		return nil, err
	}

	return config, nil
}
