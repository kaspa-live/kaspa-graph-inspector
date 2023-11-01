package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/jessevdk/go-flags"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/logging"
	versionPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/version"
	kaspaConfigPackage "github.com/kaspanet/kaspad/infrastructure/config"
	kaspaLogger "github.com/kaspanet/kaspad/infrastructure/logger"
	"github.com/kaspanet/kaspad/util"
	"github.com/kaspanet/kaspad/version"
	"github.com/pkg/errors"
)

const (
	appDataDirectory      = "kgi-processing"
	defaultLogDirname     = "logs"
	defaultLogLevel       = "info"
	defaultLogFilename    = "kgi-processing.log"
	defaultErrLogFilename = "kgi-processing_err.log"
)

var (
	// DefaultAppDir is the default home directory for kaspad.
	DefaultAppDir  = util.AppDir(appDataDirectory, false)
	defaultDataDir = filepath.Join(DefaultAppDir)
)

type Flags struct {
	ShowVersion              bool     `short:"V" long:"version" description:"Display version information and exit"`
	AppDir                   string   `short:"b" long:"appdir" description:"Directory to store data"`
	LogDir                   string   `long:"logdir" description:"Directory to log output."`
	DatabaseConnectionString string   `long:"connection-string" description:"Connection string for PostgrSQL database to connect to. Should be of the form: postgres://<username>:<password>@<host>:<port>/<database name>"`
	ConnectPeers             []string `long:"connect" description:"Connect only to the specified peers at startup"`
	DNSSeed                  string   `long:"dnsseed" description:"Override DNS seeds with specified hostname (Only 1 hostname allowed)"`
	GRPCSeed                 string   `long:"grpcseed" description:"Hostname of gRPC server for seeding peers"`
	Resync                   bool     `long:"resync" description:"Force to resync all available node blocks with the PostgrSQL database -- Use if some recently added blocks have missing parents"`
	ClearDB                  bool     `long:"clear-db" description:"Clear the PostgrSQL database and sync from scratch"`
	LogLevel                 string   `short:"d" long:"loglevel" description:"Logging level for all subsystems {trace, debug, info, warn, error, critical} -- You may also specify <subsystem>=<level>,<subsystem2>=<level>,... to set the log level for individual subsystems -- Use show to list available subsystems"`
	RPCServer                string   `short:"s" long:"rpcserver" description:"RPC server to connect to"`
	kaspaConfigPackage.NetworkFlags
}

type Config struct {
	*Flags
}

// cleanAndExpandPath expands environment variables and leading ~ in the
// passed path, cleans the result, and returns it.
func cleanAndExpandPath(path string) string {
	// Expand initial ~ to OS specific home directory.
	if strings.HasPrefix(path, "~") {
		homeDir := filepath.Dir(DefaultAppDir)
		path = strings.Replace(path, "~", homeDir, 1)
	}

	// NOTE: The os.ExpandEnv doesn't work with Windows-style %VARIABLE%,
	// but they variables can still be expanded via POSIX-style $VARIABLE.
	return filepath.Clean(os.ExpandEnv(path))
}

func defaultFlags() *Flags {
	return &Flags{
		AppDir:    defaultDataDir,
		LogLevel:  defaultLogLevel,
		RPCServer: "localhost",
	}
}

func LoadConfig() (*Config, error) {
	funcName := "loadConfig"
	appName := filepath.Base(os.Args[0])
	appName = strings.TrimSuffix(appName, filepath.Ext(appName))
	usageMessage := fmt.Sprintf("Use %s -h to show usage", appName)

	cfgFlags := defaultFlags()
	parser := flags.NewParser(cfgFlags, flags.HelpFlag)
	_, err := parser.Parse()
	if err != nil {
		var flagsErr *flags.Error
		if ok := errors.As(err, &flagsErr); !ok || flagsErr.Type != flags.ErrHelp {
			return nil, errors.Wrapf(err, "Error parsing command line arguments: %s\n\n%s", err, usageMessage)
		}
		return nil, err
	}
	cfg := &Config{
		Flags: cfgFlags,
	}

	// Show the version and exit if the version flag was specified.
	if cfg.ShowVersion {
		fmt.Println(appName, "version", versionPackage.Version())
		fmt.Println("kaspad version", version.Version())
		os.Exit(0)
	}

	if cfg.DatabaseConnectionString == "" {
		return nil, errors.Errorf("--connection-string is required.")
	}

	err = cfg.ResolveNetwork(parser)
	if err != nil {
		return nil, err
	}

	cfg.AppDir = cleanAndExpandPath(cfg.AppDir)
	// Append the network type to the app directory so it is "namespaced"
	// per network.
	// All data is specific to a network, so namespacing the data directory
	// means each individual piece of serialized data does not have to
	// worry about changing names per network and such.
	cfg.AppDir = filepath.Join(cfg.AppDir, cfg.NetParams().Name)

	// Logs directory is usually under the home directory, unless otherwise specified
	if cfg.LogDir == "" {
		cfg.LogDir = filepath.Join(cfg.AppDir, defaultLogDirname)
	}
	cfg.LogDir = cleanAndExpandPath(cfg.LogDir)

	// Special show command to list supported subsystems and exit.
	if cfg.LogLevel == "show" {
		fmt.Println("Supported subsystems", kaspaLogger.SupportedSubsystems())
		os.Exit(0)
	}

	// Initialize log rotation. After log rotation has been initialized, the
	// logger variables may be used.
	logging.InitLog(filepath.Join(cfg.LogDir, defaultLogFilename), filepath.Join(cfg.LogDir, defaultErrLogFilename))

	// Parse, validate, and set debug log level(s).
	if err := kaspaLogger.ParseAndSetLogLevels(cfg.LogLevel); err != nil {
		err := errors.Errorf("%s: %s", funcName, err.Error())
		fmt.Fprintln(os.Stderr, err)
		fmt.Fprintln(os.Stderr, usageMessage)
		return nil, err
	}

	return cfg, nil
}
