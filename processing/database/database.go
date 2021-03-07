package database

import (
	"github.com/go-pg/pg/v10"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/pkg/errors"
	"github.com/stasatdaglabs/kaspa-dag-visualizer/processing/database/model"
)

type Database struct {
	database *pg.DB
}

func (db *Database) DoesBlockExist(blockHash *externalapi.DomainHash) (bool, error) {
	var ids []uint64
	_, err := db.database.Query(&ids, "SELECT id FROM blocks WHERE block_hash = ?", blockHash)
	if err != nil {
		return false, err
	}
	return len(ids) == 1, nil
}

func (db *Database) InsertBlock(block *model.Block) error {
	_, err := db.database.Model(block).OnConflict("(block_hash) DO NOTHING").Insert()
	return err
}

func (db *Database) UpdateBlockSelectedParent(blockID uint64, selectedParentID uint64) error {
	_, err := db.database.Exec("UPDATE blocks SET selected_parent_id = ? WHERE id = ?", selectedParentID, blockID)
	return err
}

func (db *Database) UpdateBlockColors(blockIDsToColors map[uint64]string) error {
	for blockID, color := range blockIDsToColors {
		_, err := db.database.Exec("UPDATE blocks SET color = ? WHERE id = ?", color, blockID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *Database) BlockIDByHash(blockHash *externalapi.DomainHash) (uint64, error) {
	var result struct {
		Id uint64
	}
	_, err := db.database.QueryOne(&result, "SELECT id FROM blocks WHERE block_hash = ?", blockHash.String())
	if err != nil {
		return 0, err
	}
	return result.Id, nil
}

func (db *Database) BlockIDsByHashes(blockHashes []*externalapi.DomainHash) ([]uint64, error) {
	blockHashStrings := make([]string, len(blockHashes))
	for i, blockHash := range blockHashes {
		blockHashStrings[i] = blockHash.String()
	}

	var ids []uint64
	_, err := db.database.Query(&ids, "SELECT id FROM blocks WHERE block_hash IN (?)", pg.In(blockHashStrings))
	if err != nil {
		return nil, err
	}
	if len(blockHashes) != len(ids) {
		return nil, errors.Errorf("Some block hashes out of (%s) are missing in the database", blockHashes)
	}
	return ids, nil
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
