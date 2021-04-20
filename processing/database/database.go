package database

import (
	"context"
	"github.com/go-pg/pg/v10"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/stasatdaglabs/kaspa-graph-inspector/processing/database/block_hashes_to_ids"
	"github.com/stasatdaglabs/kaspa-graph-inspector/processing/database/model"
	"sync"
)

type Database struct {
	database         *pg.DB
	blockHashesToIDs *block_hashes_to_ids.BlockHashesToIDs
	sync.Mutex
}

func (db *Database) RunInTransaction(transactionFunction func(*pg.Tx) error) error {
	db.Lock()
	defer db.Unlock()

	return db.database.RunInTransaction(context.Background(), transactionFunction)
}

func (db *Database) DoesBlockExist(databaseTransaction *pg.Tx, blockHash *externalapi.DomainHash) (bool, error) {
	if db.blockHashesToIDs.Has(blockHash) {
		return true, nil
	}

	var ids []uint64
	_, err := databaseTransaction.Query(&ids, "SELECT id FROM blocks WHERE block_hash = ?", blockHash.String())
	if err != nil {
		return false, err
	}
	if len(ids) != 1 {
		return false, nil
	}

	db.blockHashesToIDs.Set(blockHash, ids[0])
	return true, nil
}

func (db *Database) InsertBlock(databaseTransaction *pg.Tx, blockHash *externalapi.DomainHash, block *model.Block) error {
	_, err := databaseTransaction.Model(block).Insert()
	if err != nil {
		return err
	}
	db.blockHashesToIDs.Set(blockHash, block.ID)
	return nil
}

func (db *Database) UpdateBlockSelectedParent(databaseTransaction *pg.Tx, blockID uint64, selectedParentID uint64) error {
	_, err := databaseTransaction.Exec("UPDATE blocks SET selected_parent_id = ? WHERE id = ?", selectedParentID, blockID)
	return err
}

func (db *Database) UpdateBlockIsInVirtualSelectedParentChain(
	databaseTransaction *pg.Tx, blockIDsToIsInVirtualSelectedParentChain map[uint64]bool) error {

	for blockID, isInVirtualSelectedParentChain := range blockIDsToIsInVirtualSelectedParentChain {
		_, err := databaseTransaction.Exec("UPDATE blocks SET is_in_virtual_selected_parent_chain = ? WHERE id = ?",
			isInVirtualSelectedParentChain, blockID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *Database) UpdateBlockColors(databaseTransaction *pg.Tx, blockIDsToColors map[uint64]string) error {
	for blockID, color := range blockIDsToColors {
		_, err := databaseTransaction.Exec("UPDATE blocks SET color = ? WHERE id = ?", color, blockID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *Database) BlockIDByHash(databaseTransaction *pg.Tx, blockHash *externalapi.DomainHash) (uint64, error) {
	if cachedBlockID, ok := db.blockHashesToIDs.Get(blockHash); ok {
		return cachedBlockID, nil
	}

	var result struct {
		Id uint64
	}
	_, err := databaseTransaction.QueryOne(&result, "SELECT id FROM blocks WHERE block_hash = ?", blockHash.String())
	if err != nil {
		return 0, err
	}

	db.blockHashesToIDs.Set(blockHash, result.Id)
	return result.Id, nil
}

func (db *Database) BlockIDsByHashes(databaseTransaction *pg.Tx, blockHashes []*externalapi.DomainHash) ([]uint64, error) {
	blockIDs := make([]uint64, len(blockHashes))
	for i, blockHash := range blockHashes {
		blockID, err := db.BlockIDByHash(databaseTransaction, blockHash)
		if err != nil {
			return nil, err
		}
		blockIDs[i] = blockID
	}
	return blockIDs, nil
}

func (db *Database) HighestBlockHeight(databaseTransaction *pg.Tx, blockIDs []uint64) (uint64, error) {
	var result struct {
		Highest uint64
	}
	_, err := databaseTransaction.Query(&result, "SELECT MAX(height) AS highest FROM blocks WHERE id IN (?)", pg.In(blockIDs))
	if err != nil {
		return 0, err
	}
	return result.Highest, nil
}

func (db *Database) HeightGroupSize(databaseTransaction *pg.Tx, height uint64) (uint32, error) {
	var result struct {
		Size uint32
	}
	_, err := databaseTransaction.Query(&result, "SELECT size FROM height_groups WHERE height = ?", height)
	if err != nil {
		return 0, err
	}
	return result.Size, nil
}

func (db *Database) BlockHeight(databaseTransaction *pg.Tx, blockID uint64) (uint64, error) {
	var result struct {
		Height uint64
	}
	_, err := databaseTransaction.QueryOne(&result, "SELECT height FROM blocks WHERE id = ?", blockID)
	if err != nil {
		return 0, err
	}
	return result.Height, nil
}

func (db *Database) BlockHeightGroupIndex(databaseTransaction *pg.Tx, blockID uint64) (uint32, error) {
	var result struct {
		HeightGroupIndex uint32
	}
	_, err := databaseTransaction.QueryOne(&result, "SELECT height_group_index FROM blocks WHERE id = ?", blockID)
	if err != nil {
		return 0, err
	}
	return result.HeightGroupIndex, nil
}

func (db *Database) InsertOrIgnoreEdge(databaseTransaction *pg.Tx, edge *model.Edge) error {
	_, err := databaseTransaction.Model(edge).OnConflict("DO NOTHING").Insert()
	if err != nil {
		return err
	}
	return nil
}

func (db *Database) InsertOrUpdateHeightGroup(databaseTransaction *pg.Tx, heightGroup *model.HeightGroup) error {
	_, err := databaseTransaction.Model(heightGroup).OnConflict("(height) DO UPDATE SET size = EXCLUDED.size").Insert()
	if err != nil {
		return err
	}
	return nil
}

func (db *Database) Close() {
	db.Lock()
	defer db.Unlock()

	err := db.database.Close()
	if err != nil {
		log.Warnf("Could not close database: %s", err)
	}
}
