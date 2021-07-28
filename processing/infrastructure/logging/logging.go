package logging

import (
	"fmt"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/kaspanet/kaspad/infrastructure/logger"
	"os"
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

	// 280 MB (MB=1000^2 bytes)
	err := logger.BackendLog.AddLogFileWithCustomRotator(logFile, logger.LevelTrace, 1000*280, 64)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "Error adding log file %s as log rotator for level %s: %s", logFile, logger.LevelTrace, err)
		os.Exit(1)
	}
	err = logger.BackendLog.AddLogFile(errorLogFile, logger.LevelWarn)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "Error adding log file %s as log rotator for level %s: %s", errorLogFile, logger.LevelWarn, err)
		os.Exit(1)
	}
	logger.InitLogStdout(logger.LevelInfo)

	UpdateLogLevels()
}

func UpdateLogLevels() {
	logger.SetLogLevels(logger.LevelDebug)
}

func Logger() *logger.Logger {
	return log
}
