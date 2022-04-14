package block_hashes_to_ids

import (
	"sync"

	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
)

type BlockHashesToIDs struct {
	blockHashesToIDs map[externalapi.DomainHash]*blockInfo
	sync.RWMutex
}

type blockInfo struct {
	ID     uint64
	Height uint64
}

func New() *BlockHashesToIDs {
	return &BlockHashesToIDs{
		blockHashesToIDs: make(map[externalapi.DomainHash]*blockInfo),
	}
}

func (bhti *BlockHashesToIDs) Has(blockHash *externalapi.DomainHash) bool {
	bhti.RLock()
	defer bhti.RUnlock()

	_, ok := bhti.blockHashesToIDs[*blockHash]
	return ok
}

func (bhti *BlockHashesToIDs) Get(blockHash *externalapi.DomainHash) (uint64, uint64, bool) {
	bhti.RLock()
	defer bhti.RUnlock()

	if bi, ok := bhti.blockHashesToIDs[*blockHash]; ok {
		return bi.ID, bi.Height, true
	}

	return 0, 0, false
}

func (bhti *BlockHashesToIDs) Set(blockHash *externalapi.DomainHash, blockID uint64, Height uint64) {
	bhti.Lock()
	defer bhti.Unlock()

	bi, ok := bhti.blockHashesToIDs[*blockHash]
	if !ok {
		bi = &blockInfo{}
		bhti.blockHashesToIDs[*blockHash] = bi
	}
	bi.ID = blockID
	bi.Height = Height
}
