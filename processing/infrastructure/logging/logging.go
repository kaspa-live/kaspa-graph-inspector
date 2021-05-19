package logging

import (
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/kaspanet/kaspad/infrastructure/logger"
	"path/filepath"
)

const (
	logFileName      = "kaspa-graph-inspector-processing.log"
	errorLogFileName = "kaspa-graph-inspector-processing_errors.log"
)

var (
	log = logger.RegisterSubSystem("KAGI")
)

func init() {
	logFile := filepath.Join(config.HomeDir, logFileName)
	errorLogFile := filepath.Join(config.HomeDir, errorLogFileName)

	logger.InitLog(logFile, errorLogFile)
	UpdateLogLevels()
}

func UpdateLogLevels() {
	logger.SetLogLevels(logger.LevelInfo)
}

func Logger() *logger.Logger {
	return log
}
