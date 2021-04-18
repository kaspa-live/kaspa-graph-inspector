package model

const (
	ColorGray = "gray"
	ColorRed  = "red"
	ColorBlue = "blue"
)

type Block struct {
	ID                             uint64   `pg:"id,pk"`
	BlockHash                      string   `pg:"block_hash"`
	Timestamp                      int64    `pg:"timestamp,use_zero"`
	ParentIDs                      []uint64 `pg:"parent_ids,use_zero"`
	Height                         uint64   `pg:"height,use_zero"`
	HeightGroupIndex               uint32   `pg:"height_group_index,use_zero"`
	SelectedParentID               *uint64  `pg:"selected_parent_id"`
	Color                          string   `pg:"color"`
	IsInVirtualSelectedParentChain bool     `pg:"is_in_virtual_selected_parent_chain,use_zero"`
}

type Edge struct {
	FromBlockID          uint64 `pg:"from_block_id,pk"`
	ToBlockID            uint64 `pg:"to_block_id,pk"`
	FromHeight           uint64 `pg:"from_height,use_zero"`
	ToHeight             uint64 `pg:"to_height,use_zero"`
	FromHeightGroupIndex uint32 `pg:"from_height_group_index,use_zero"`
	ToHeightGroupIndex   uint32 `pg:"to_height_group_index,use_zero"`
}

type HeightGroup struct {
	Height uint64 `pg:"height,use_zero"`
	Size   uint32 `pg:"size,use_zero"`
}
