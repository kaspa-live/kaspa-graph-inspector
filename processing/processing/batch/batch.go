package batch

import (
	"github.com/go-pg/pg/v10"
	databasePackage "github.com/kaspa-live/kaspa-graph-inspector/processing/database"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/logging"
	"github.com/kaspanet/kaspad/app/appmessage"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/infrastructure/network/rpcclient"
	"github.com/pkg/errors"
)

var log = logging.Logger()

type Batch struct {
	database      *databasePackage.Database
	rpcClient     *rpcclient.RPCClient
	blocks        []*BlockAndHash
	hashes        map[externalapi.DomainHash]*BlockAndHash
	prunningBlock *externalapi.DomainBlock
}

type Block externalapi.DomainBlock

type BlockAndHash struct {
	*externalapi.DomainBlock
	hash *externalapi.DomainHash
}

func New(database *databasePackage.Database, rpcClient *rpcclient.RPCClient, prunningBlock *externalapi.DomainBlock) *Batch {
	batch := &Batch{
		database:      database,
		rpcClient:     rpcClient,
		blocks:        make([]*BlockAndHash, 0),
		hashes:        make(map[externalapi.DomainHash]*BlockAndHash),
		prunningBlock: prunningBlock,
	}
	return batch
}

// InScope returns true if `block` has a greater DAA score than the pruning block
// or if no pruning block is defined
func (b *Batch) InScope(block *externalapi.DomainBlock) bool {
	return b.prunningBlock == nil || b.prunningBlock.Header.DAAScore() <= block.Header.DAAScore()
}

// Add adds a pair `hash` and its matching `block` to the batch.
// Avoid duplicates and ignore blocks not in scope
func (b *Batch) Add(hash *externalapi.DomainHash, block *externalapi.DomainBlock) {
	if !b.Has(hash) && b.InScope(block) {
		ba := &BlockAndHash{
			DomainBlock: block,
			hash:        hash,
		}
		b.blocks = append(b.blocks, ba)
		b.hashes[*hash] = ba
	}
}

// Has returns true if `hash` exists in the batch
func (b *Batch) Has(hash *externalapi.DomainHash) bool {
	_, ok := b.hashes[*hash]
	return ok
}

// Get returns the block identified by `hash`.
// Returns false if the hash is not found
func (b *Batch) Get(hash *externalapi.DomainHash) (*externalapi.DomainBlock, bool) {
	value, ok := b.hashes[*hash]
	if !ok {
		return nil, false
	}
	return value.DomainBlock, true
}

func (b *Batch) Empty() bool {
	return len(b.blocks) == 0
}

// Pop returns the latest hash and block added and removes the pair from the batch.
// Returns false if the batch is empty
func (b *Batch) Pop() (*externalapi.DomainHash, *externalapi.DomainBlock, bool) {
	cnt := len(b.blocks)
	if cnt == 0 {
		return nil, nil, false
	}
	blockAddress := b.blocks[cnt-1]

	// remove blockAddress from batch
	if cnt > 1 {
		b.blocks = b.blocks[:cnt-1]
	} else {
		b.blocks = make([]*BlockAndHash, 0)
	}
	delete(b.hashes, *blockAddress.hash)

	return blockAddress.hash, blockAddress.DomainBlock, true
}

// CollectBlockAndDependencies adds `block` and all its missing direct and
// indirect dependencies
func (b *Batch) CollectBlockAndDependencies(databaseTransaction *pg.Tx, hash *externalapi.DomainHash, block *externalapi.DomainBlock) error {
	b.Add(hash, block)
	for i := 0; i < len(b.blocks); i++ {
		item := b.blocks[i]
		err := b.CollectDirectDependencies(databaseTransaction, item.hash, item.DomainBlock)
		if err != nil {
			return err
		}
	}
	return nil
}

// CollectDirectDependencies adds the missing direct parents of `block`
func (b *Batch) CollectDirectDependencies(databaseTransaction *pg.Tx, hash *externalapi.DomainHash, block *externalapi.DomainBlock) error {
	parentHashes := block.Header.DirectParents()
	for _, parentHash := range parentHashes {
		parentExists, err := b.database.DoesBlockExist(databaseTransaction, parentHash)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not check if parent %s for block %s does exist in database", parentHash, hash)
		}
		if !parentExists {
			rpcBlock, err := b.rpcClient.GetBlock(parentHash.String(), false)
			if err != nil {
				// We ignore the `block not found` kaspad error.
				// In this case the parent is out the node scope so we have no way
				// to include it in the batch
				log.Warnf("Parent %s for block %s not found by kaspad domain consensus; the missing dependency is ignored", parentHash, hash)
				// TODO: Check that this is actually a not found error, and return error otherwise
			} else {
				parentBlock, err := appmessage.RPCBlockToDomainBlock(rpcBlock.Block)
				if err != nil {
					return err
				}
				b.Add(parentHash, parentBlock)
				log.Warnf("Parent %s for block %s found by kaspad domain consensus; the missing dependency is registered for processing", parentHash, hash)
			}
		}
	}
	return nil
}
