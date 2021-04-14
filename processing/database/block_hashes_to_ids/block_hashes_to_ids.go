package block_hashes_to_ids

import (
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"sync"
)

type BlockHashesToIDs struct {
	blockHashesToIDs map[externalapi.DomainHash]uint64
	sync.RWMutex
}

func New() *BlockHashesToIDs {
	return &BlockHashesToIDs{
		blockHashesToIDs: make(map[externalapi.DomainHash]uint64),
	}
}

func (bhti *BlockHashesToIDs) Has(blockHash *externalapi.DomainHash) bool {
	bhti.RLock()
	defer bhti.RUnlock()

	_, ok := bhti.blockHashesToIDs[*blockHash]
	return ok
}

func (bhti *BlockHashesToIDs) Get(blockHash *externalapi.DomainHash) (uint64, bool) {
	bhti.RLock()
	defer bhti.RUnlock()

	id, ok := bhti.blockHashesToIDs[*blockHash]
	return id, ok
}

func (bhti *BlockHashesToIDs) Set(blockHash *externalapi.DomainHash, blockID uint64) {
	bhti.Lock()
	defer bhti.Unlock()

	bhti.blockHashesToIDs[*blockHash] = blockID
}
