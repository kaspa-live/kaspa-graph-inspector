package database

import (
	"github.com/go-pg/pg/v10"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/stasatdaglabs/kaspa-graph-inspector/processing/database/block_hashes_to_ids"
	"github.com/stasatdaglabs/kaspa-graph-inspector/processing/database/model"
	"sync"
)

type Database struct {
	database         *pg.DB
	blockHashesToIDs *block_hashes_to_ids.BlockHashesToIDs
	sync.RWMutex
}

func (db *Database) DoesBlockExist(blockHash *externalapi.DomainHash) (bool, error) {
	db.RLock()
	defer db.RUnlock()

	return db.doesBlockExist(blockHash)
}

func (db *Database) doesBlockExist(blockHash *externalapi.DomainHash) (bool, error) {
	if db.blockHashesToIDs.Has(blockHash) {
		return true, nil
	}

	var ids []uint64
	_, err := db.database.Query(&ids, "SELECT id FROM blocks WHERE block_hash = ?", blockHash.String())
	if err != nil {
		return false, err
	}
	if len(ids) != 1 {
		return false, nil
	}

	db.blockHashesToIDs.Set(blockHash, ids[0])
	return true, nil
}

func (db *Database) InsertOrIgnoreBlock(blockHash *externalapi.DomainHash, block *model.Block) error {
	db.Lock()
	defer db.Unlock()

	return db.insertOrIgnoreBlock(blockHash, block)
}

func (db *Database) insertOrIgnoreBlock(blockHash *externalapi.DomainHash, block *model.Block) error {
	blockExists, err := db.doesBlockExist(blockHash)
	if err != nil {
		return err
	}
	if blockExists {
		return nil
	}

	_, err = db.database.Model(block).Insert()
	if err != nil {
		return err
	}

	db.blockHashesToIDs.Set(blockHash, block.ID)
	return nil
}

func (db *Database) UpdateBlockSelectedParent(blockID uint64, selectedParentID uint64) error {
	db.Lock()
	defer db.Unlock()

	return db.updateBlockSelectedParent(blockID, selectedParentID)
}

func (db *Database) updateBlockSelectedParent(blockID uint64, selectedParentID uint64) error {
	_, err := db.database.Exec("UPDATE blocks SET selected_parent_id = ? WHERE id = ?", selectedParentID, blockID)
	return err
}
func (db *Database) UpdateBlockIsInVirtualSelectedParentChain(
	blockIDsToIsInVirtualSelectedParentChain map[uint64]bool) error {

	db.Lock()
	defer db.Unlock()

	return db.updateBlockIsInVirtualSelectedParentChain(blockIDsToIsInVirtualSelectedParentChain)
}

func (db *Database) updateBlockIsInVirtualSelectedParentChain(
	blockIDsToIsInVirtualSelectedParentChain map[uint64]bool) error {

	for blockID, isInVirtualSelectedParentChain := range blockIDsToIsInVirtualSelectedParentChain {
		_, err := db.database.Exec("UPDATE blocks SET is_in_virtual_selected_parent_chain = ? WHERE id = ?",
			isInVirtualSelectedParentChain, blockID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *Database) UpdateBlockColors(blockIDsToColors map[uint64]string) error {
	db.Lock()
	defer db.Unlock()

	return db.updateBlockColors(blockIDsToColors)
}

func (db *Database) updateBlockColors(blockIDsToColors map[uint64]string) error {
	for blockID, color := range blockIDsToColors {
		_, err := db.database.Exec("UPDATE blocks SET color = ? WHERE id = ?", color, blockID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *Database) BlockIDByHash(blockHash *externalapi.DomainHash) (uint64, error) {
	db.RLock()
	defer db.RUnlock()

	return db.blockIDByHash(blockHash)
}

func (db *Database) blockIDByHash(blockHash *externalapi.DomainHash) (uint64, error) {
	if cachedBlockID, ok := db.blockHashesToIDs.Get(blockHash); ok {
		return cachedBlockID, nil
	}

	var result struct {
		Id uint64
	}
	_, err := db.database.QueryOne(&result, "SELECT id FROM blocks WHERE block_hash = ?", blockHash.String())
	if err != nil {
		return 0, err
	}

	db.blockHashesToIDs.Set(blockHash, result.Id)
	return result.Id, nil
}

func (db *Database) BlockIDsByHashes(blockHashes []*externalapi.DomainHash) ([]uint64, error) {
	db.RLock()
	defer db.RUnlock()

	return db.blockIDsByHashes(blockHashes)
}

func (db *Database) blockIDsByHashes(blockHashes []*externalapi.DomainHash) ([]uint64, error) {
	blockIDs := make([]uint64, len(blockHashes))
	for i, blockHash := range blockHashes {
		blockID, err := db.blockIDByHash(blockHash)
		if err != nil {
			return nil, err
		}
		blockIDs[i] = blockID
	}
	return blockIDs, nil
}

func (db *Database) HighestBlockHeight(blockIDs []uint64) (uint64, error) {
	db.RLock()
	defer db.RUnlock()

	return db.highestBlockHeight(blockIDs)
}

func (db *Database) highestBlockHeight(blockIDs []uint64) (uint64, error) {
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
	db.Lock()
	defer db.Unlock()

	db.close()
}

func (db *Database) close() {
	err := db.database.Close()
	if err != nil {
		log.Warnf("Could not close database: %s", err)
	}
}
