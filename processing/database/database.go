package database

import (
	"context"
	"sync"

	"github.com/go-pg/pg/v10"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/database/model"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/database/utils/lrucache"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
)

type Database struct {
	database       *pg.DB
	blockBaseCache *lrucache.LRUCache[blockBase]
	sync.Mutex
}

// The cache capacity is set to embed ~1.5x the blocks provided
// by the node between the prunning point and the selected tip
const blockbaseCacheCapacity = 400000

type blockBase struct {
	ID     uint64
	Height uint64
}

func New(pgDatabase *pg.DB) *Database {
	database := &Database{
		database:       pgDatabase,
		blockBaseCache: lrucache.New[blockBase](blockbaseCacheCapacity, true),
	}
	return database
}

func (db *Database) RunInTransaction(transactionFunction func(*pg.Tx) error) error {
	db.Lock()
	defer db.Unlock()

	return db.database.RunInTransaction(context.Background(), transactionFunction)
}

// Load block infos into the memory cache for all blocks having a height geater or equal to minHeight
func (db *Database) LoadCache(databaseTransaction *pg.Tx, minHeight uint64) error {
	var infos []struct {
		ID        uint64
		BlockHash string
		Height    uint64
	}
	_, err := databaseTransaction.Query(&infos, "SELECT id, block_hash, height FROM blocks WHERE height >= ?", minHeight)
	if err != nil {
		return err
	}
	db.clearCache()
	for _, info := range infos {
		blockHash, err := externalapi.NewDomainHashFromString(info.BlockHash)
		if err != nil {
			return err
		}

		bb := &blockBase{
			ID:     info.ID,
			Height: info.Height,
		}
		db.blockBaseCache.Add(blockHash, bb)
	}
	return nil
}

func (db *Database) clearCache() {
	db.blockBaseCache = lrucache.New[blockBase](blockbaseCacheCapacity, true)
}

func (db *Database) DoesBlockExist(databaseTransaction *pg.Tx, blockHash *externalapi.DomainHash) (bool, error) {
	// Search cache
	if db.blockBaseCache.Has(blockHash) {
		return true, nil
	}

	// Search database
	var infos []struct {
		ID     uint64
		Height uint64
	}
	_, err := databaseTransaction.Query(&infos, "SELECT id, height FROM blocks WHERE block_hash = ?", blockHash.String())
	if err != nil {
		return false, err
	}
	if len(infos) != 1 {
		return false, nil
	}

	bb := &blockBase{
		ID:     infos[0].ID,
		Height: infos[0].Height,
	}
	db.blockBaseCache.Add(blockHash, bb)

	return true, nil
}

func (db *Database) InsertBlock(databaseTransaction *pg.Tx, blockHash *externalapi.DomainHash, block *model.Block) error {
	_, err := databaseTransaction.Model(block).Insert()
	if err != nil {
		return err
	}

	bb := &blockBase{
		ID:     block.ID,
		Height: block.Height,
	}
	db.blockBaseCache.Add(blockHash, bb)

	return nil
}

// Get a block from the database by its ID
func (db *Database) GetBlock(databaseTransaction *pg.Tx, id uint64) (*model.Block, error) {
	result := new(model.Block)
	_, err := databaseTransaction.Query(result, "SELECT * FROM blocks WHERE id = ?", id)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (db *Database) UpdateBlockSelectedParent(databaseTransaction *pg.Tx, blockID uint64, selectedParentID uint64) error {
	_, err := databaseTransaction.Exec("UPDATE blocks SET selected_parent_id = ? WHERE id = ?", selectedParentID, blockID)
	return err
}

func (db *Database) UpdateBlockMergeSet(
	databaseTransaction *pg.Tx, blockID uint64, mergeSetRedIDs []uint64, mergeSetBlueIDs []uint64) error {

	_, err := databaseTransaction.Exec("UPDATE blocks SET merge_set_red_ids = ?, merge_set_blue_ids = ? WHERE id = ?",
		mergeSetRedIDs, mergeSetBlueIDs, blockID)
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

// Update DAA Scores of blocks in the database
func (db *Database) UpdateBlockDAAScores(databaseTransaction *pg.Tx, blockIDsToDAAScores map[uint64]uint64) error {
	for blockID, daaScore := range blockIDsToDAAScores {
		_, err := databaseTransaction.Exec("UPDATE blocks SET daa_score = ? WHERE id = ?", daaScore, blockID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *Database) BlockIDByHash(databaseTransaction *pg.Tx, blockHash *externalapi.DomainHash) (uint64, error) {
	bb, err := db.blockBaseByHash(databaseTransaction, blockHash)
	if err != nil {
		return 0, err
	}
	return bb.ID, err
}

func (db *Database) BlockHeightByHash(databaseTransaction *pg.Tx, blockHash *externalapi.DomainHash) (uint64, error) {
	bb, err := db.blockBaseByHash(databaseTransaction, blockHash)
	if err != nil {
		return 0, err
	}
	return bb.Height, err
}

func (db *Database) blockBaseByHash(databaseTransaction *pg.Tx, blockHash *externalapi.DomainHash) (*blockBase, error) {
	// Search cache
	if cachedBlockBase, ok := db.blockBaseCache.Get(blockHash); ok {
		return cachedBlockBase, nil
	}

	// Search database
	var info struct {
		ID     uint64
		Height uint64
	}
	_, err := databaseTransaction.Query(&info, "SELECT id, height FROM blocks WHERE block_hash = ?", blockHash.String())
	if err != nil {
		return nil, err
	}

	bb := &blockBase{
		ID:     info.ID,
		Height: info.Height,
	}
	db.blockBaseCache.Add(blockHash, bb)

	return bb, nil
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

func (db *Database) BlockIDsAndHeightsByHashes(databaseTransaction *pg.Tx, blockHashes []*externalapi.DomainHash) ([]uint64, []uint64, error) {
	blockIDs := make([]uint64, len(blockHashes))
	blockHeights := make([]uint64, len(blockHashes))
	for i, blockHash := range blockHashes {
		bb, err := db.blockBaseByHash(databaseTransaction, blockHash)
		if err != nil {
			return nil, nil, err
		}
		blockIDs[i] = bb.ID
		blockHeights[i] = bb.Height
	}
	return blockIDs, blockHeights, nil
}

// Find the index in a DAG ordered block hash array of the latest block hash
// that is stored in the database
func (db *Database) FindLatestStoredBlockIndex(databaseTransaction *pg.Tx, blockHashes []*externalapi.DomainHash) (int, error) {
	// We use binary search since hash array is ordered from oldest to latest and
	// this ordering is also applied when storing blocks in the database
	low := int(0)
	high := int(len(blockHashes))
	for (high - low) > 1 {
		cur := (high + low) / 2
		hasBlock, err := db.DoesBlockExist(databaseTransaction, blockHashes[cur])
		if err != nil {
			return 0, err
		}
		if hasBlock {
			low = cur
		} else {
			high = cur
		}
	}
	return low, nil
}

// Find the block ID of the block having the closest DAA score to a given score.
func (db *Database) BlockIDByDAAScore(databaseTransaction *pg.Tx, blockDAAScore uint64) (uint64, error) {
	var result struct {
		ID uint64
	}
	_, err := databaseTransaction.Query(&result, "SELECT id FROM blocks ORDER BY ABS(daa_score-(?)) LIMIT 1", pg.In(blockDAAScore))
	if err != nil {
		return 0, err
	}
	return result.ID, nil
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

func (db *Database) HighestBlockInVirtualSelectedParentChain(databaseTransaction *pg.Tx) (*model.Block, error) {
	result := new(model.Block)
	_, err := databaseTransaction.Query(result, "select * from blocks where is_in_virtual_selected_parent_chain = ? order by height desc limit 1", true)
	if err != nil {
		return nil, err
	}
	return result, nil
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

func (db *Database) InsertEdge(databaseTransaction *pg.Tx, edge *model.Edge) error {
	_, err := databaseTransaction.Model(edge).Insert()
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

func (db *Database) Clear(databaseTransaction *pg.Tx) error {
	db.clearCache()
	_, err := databaseTransaction.Exec("TRUNCATE TABLE blocks")
	if err != nil {
		return err
	}
	_, err = databaseTransaction.Exec("TRUNCATE TABLE edges")
	if err != nil {
		return err
	}
	_, err = databaseTransaction.Exec("TRUNCATE TABLE height_groups")
	return err
}

func (db *Database) Close() {
	db.Lock()
	defer db.Unlock()

	err := db.database.Close()
	if err != nil {
		log.Warnf("Could not close database: %s", err)
	}
}
