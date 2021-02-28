package database

import (
	migratePackage "github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source"
	"github.com/pkg/errors"
	"os"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func isCurrent(migrator *migratePackage.Migrate, driver source.Driver) (bool, uint, error) {
	version, isDirty, err := migrator.Version()
	if errors.Is(err, migratePackage.ErrNilVersion) {
		return false, 0, nil
	}
	if err != nil {
		return false, 0, errors.WithStack(err)
	}
	if isDirty {
		return false, 0, errors.Errorf("Database is dirty")
	}

	// The database is current if Next returns ErrNotExist
	_, err = driver.Next(version)
	var pathErr *os.PathError
	if errors.As(err, &pathErr) {
		if pathErr.Err == os.ErrNotExist {
			return true, version, nil
		}
	}
	return false, version, err
}

func openMigrator(connectionString string) (*migratePackage.Migrate, source.Driver, error) {
	driver, err := source.Open("file://database/migrations")
	if err != nil {
		return nil, nil, err
	}
	migrator, err := migratePackage.NewWithSourceInstance("migrations", driver, connectionString)
	if err != nil {
		return nil, nil, err
	}
	return migrator, driver, nil
}

func migrate(connectionString string) error {
	migrator, driver, err := openMigrator(connectionString)
	if err != nil {
		return err
	}
	isCurrent, version, err := isCurrent(migrator, driver)
	if err != nil {
		return errors.Wrapf(err, "error checking whether the database is current")
	}
	if isCurrent {
		return errors.Errorf("could not migrate an already up-to-date database (version %d)", version)
	}
	err = migrator.Up()
	if err != nil {
		return err
	}
	version, isDirty, err := migrator.Version()
	if err != nil {
		return err
	}
	if isDirty {
		return errors.Errorf("error migrating database: database is dirty")
	}
	log.Infof("Migrated database to the latest version (version %d)", version)
	return nil
}
