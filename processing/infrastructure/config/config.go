package config

import (
	"github.com/jessevdk/go-flags"
	kaspaConfigPackage "github.com/kaspanet/kaspad/infrastructure/config"
	"github.com/kaspanet/kaspad/util"
	"github.com/pkg/errors"
)

const (
	appDataDirectory = "kaspa-graph-inspector-processing"
)

var (
	HomeDir = util.AppDir(appDataDirectory, false)
)

type Config struct {
	DatabaseConnectionString string   `long:"connection-string" description:"Connection string for PostgrSQL database to connect to. Should be of the form: postgres://<username>:<password>@<host>:<port>/<database name>"`
	ConnectPeers             []string `long:"connect" description:"Connect only to the specified peers at startup"`
	DNSSeed                  string   `long:"dnsseed" description:"Override DNS seeds with specified hostname (Only 1 hostname allowed)"`
	GRPCSeed                 string   `long:"grpcseed" description:"Hostname of gRPC server for seeding peers"`
	kaspaConfigPackage.NetworkFlags
}

func Parse() (*Config, error) {
	config := &Config{}
	parser := flags.NewParser(config, flags.HelpFlag)
	_, err := parser.Parse()
	if err != nil {
		return nil, err
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
