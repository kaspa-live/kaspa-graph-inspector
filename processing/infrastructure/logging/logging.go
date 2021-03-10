package logging

import (
	"github.com/kaspanet/kaspad/infrastructure/logger"
	"github.com/stasatdaglabs/kaspa-graph-inspector/processing/infrastructure/config"
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
	logger.SetLogLevels(logger.LevelInfo)
}

func Logger() *logger.Logger {
	return log
}
