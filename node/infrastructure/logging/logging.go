package logging

import (
	"fmt"
	"github.com/kaspanet/kaspad/infrastructure/logger"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/node/infrastructure/config"
	"os"
	"path/filepath"
)

const (
	logFileName      = "kaspa-dag-visualizer-node.log"
	errorLogFileName = "kaspa-dag-visualizer-node_errors.log"
)

var (
	backendLog = logger.NewBackend()
	log        = backendLog.Logger("KADV")
)

func init() {
	logFile := filepath.Join(config.HomeDir, logFileName)
	errorLogFile := filepath.Join(config.HomeDir, errorLogFileName)

	err := backendLog.AddLogFile(logFile, logger.LevelTrace)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "Error adding log file %s as log rotator for level %s: %s",
			logFileName, logger.LevelTrace, err)
		os.Exit(1)
	}
	err = backendLog.AddLogFile(errorLogFile, logger.LevelWarn)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "Error adding log file %s as log rotator for level %s: %s",
			errorLogFileName, logger.LevelWarn, err)
		os.Exit(1)
	}
}

func Logger() *logger.Logger {
	return log
}
