package model

type Block struct {
	ID        uint64   `pg:",pk"`
	BlockHash string   `pg:",use_zero"`
	Timestamp int64    `pg:",use_zero"`
	ParentIDs []uint64 `pg:",use_zero"`
	Height    uint64   `pg:",use_zero"`
}
