package logging

import (
	"fmt"
	"github.com/kaspanet/kaspad/infrastructure/logger"
	"os"
)

var (
	log = logger.RegisterSubSystem("KAGI")
)

// InitLog attaches log file and error log file to the backend log.
func InitLog(logFile, errLogFile string) {

	// 280 MB (MB=1000^2 bytes)
	err := logger.BackendLog.AddLogFileWithCustomRotator(logFile, logger.LevelTrace, 1000*280, 64)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "Error adding log file %s as log rotator for level %s: %s", logFile, logger.LevelTrace, err)
		os.Exit(1)
	}
	err = logger.BackendLog.AddLogFile(errLogFile, logger.LevelWarn)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "Error adding log file %s as log rotator for level %s: %s", errLogFile, logger.LevelWarn, err)
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
