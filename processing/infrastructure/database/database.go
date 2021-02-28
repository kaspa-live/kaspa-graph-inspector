package database

import (
	"github.com/kaspanet/kaspad/infrastructure/db/database"
	"github.com/kaspanet/kaspad/infrastructure/db/database/ldb"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/infrastructure/config"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/infrastructure/logging"
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
