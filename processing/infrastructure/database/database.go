package database

import (
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/logging"
	"github.com/kaspanet/kaspad/infrastructure/db/database"
	"github.com/kaspanet/kaspad/infrastructure/db/database/ldb"
	"path/filepath"
)

const (
	databaseDirectoryName = "database"
	levelDBCacheSizeMiB   = 256
)

var (
	log = logging.Logger()

	databaseDirectory = filepath.Join(config.HomeDir, databaseDirectoryName)
)

func Open() (database.Database, error) {
	log.Infof("Loading database from '%s'", databaseDirectory)
	return ldb.NewLevelDB(databaseDirectory, levelDBCacheSizeMiB)
}
