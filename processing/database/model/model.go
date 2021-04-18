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
