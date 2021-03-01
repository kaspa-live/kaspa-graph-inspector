package database

import (
	"github.com/go-pg/pg/v10"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/database/model"
)

type Database struct {
	database *pg.DB
}

func (db *Database) DoesBlockExist(blockHash *externalapi.DomainHash) (bool, error) {
	blockIds, err := db.BlockIDsByHashes([]*externalapi.DomainHash{blockHash})
	if err != nil {
		return false, err
	}
	return len(blockIds) == 1, nil
}

func (db *Database) InsertBlock(block *model.Block) error {
	_, err := db.database.Model(block).Returning("*").Insert()
	return err
}

func (db *Database) BlockIDsByHashes(blockHashes []*externalapi.DomainHash) ([]uint64, error) {
	var result struct {
		IDs []uint64
	}
	_, err := db.database.Query(&result, "SELECT id FROM blocks WHERE block_hash IN (?)", pg.In(blockHashes))
	if err != nil {
		return nil, err
	}
	return result.IDs, nil
}

func (db *Database) HighestBlockHeight(blockIDs []uint64) (uint64, error) {
	var result struct {
		Highest uint64
	}
	_, err := db.database.Query(&result, "SELECT MAX(height) AS highest FROM blocks WHERE id IN (?)", pg.In(blockIDs))
	if err != nil {
		return 0, err
	}
	return result.Highest, nil
}

func (db *Database) Close() {
	err := db.database.Close()
	if err != nil {
		log.Warnf("Could not close database: %s", err)
	}
}
