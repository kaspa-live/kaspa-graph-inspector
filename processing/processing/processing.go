package processing

import (
	"sync"
	"time"

	"github.com/kaspanet/kaspad/app/appmessage"

	"github.com/go-pg/pg/v10"
	databasePackage "github.com/kaspa-live/kaspa-graph-inspector/processing/database"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/database/model"
	configPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/config"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/logging"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/network/rpcclient"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/infrastructure/tools"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/processing/batch"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/processing/block"
	versionPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/version"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/version"
	"github.com/pkg/errors"
)

var log = logging.Logger()

const RpcRouteCapacity = 1000

type Processing struct {
	config    *configPackage.Config
	database  *databasePackage.Database
	rpcClient *rpcclient.RPCClient
	appConfig *model.AppConfig

	syncBlock *block.Block
	syncing   bool

	sync.Mutex
}

func NewProcessing(config *configPackage.Config,
	database *databasePackage.Database, rpcClient *rpcclient.RPCClient) (*Processing, error) {

	appConfig := &model.AppConfig{
		ID:                true,
		KaspadVersion:     version.Version(),
		ProcessingVersion: versionPackage.Version(),
		Network:           config.NetName,
	}

	processing := &Processing{
		config:    config,
		database:  database,
		rpcClient: rpcClient,
		appConfig: appConfig,
		syncing:   false,
	}

	processing.initRpcClientEventHandler()

	err := processing.init()
	if err != nil {
		return nil, err
	}

	return processing, nil
}

func (p *Processing) init() error {
	err := p.updateRpcClientVersionAndNetwork()
	if err != nil {
		return err
	}

	err = p.RegisterAppConfig()
	if err != nil {
		return err
	}

	err = p.waitForSyncedRpcClient()
	if err != nil {
		return err
	}

	err = p.ResyncDatabase()
	if err != nil {
		return err
	}

	// // Debug: long delay before getting the first blocks via subscription will trigger a big missing dependencies DAG
	// time.Sleep(10 * time.Second)

	// Start listening to events only after resyncing is done, otherwise we get overwhelmed
	err = p.initConsensusEventsHandler()
	if err != nil {
		return err
	}

	// Do a last virtual selected parent chain resync
	err = p.ResyncVirtualSelectedParentChain()
	if err != nil {
		return err
	}

	return nil
}

func (p *Processing) initRpcClientEventHandler() {
	p.rpcClient.SetOnReconnectedHandler(func() {
		log.Infof("Handling a RPC client reconnected event...")
		if p.syncing {
			log.Infof("Disconnected during database syncing so ignoring the event")
			return
		}

		// Resync the database and resubscribe to node events
		log.Infof("Resync the database and resubscribe to the relevant node events")
		err := p.init()
		if err != nil {
			panic(err)
		}
	})
}

func (p *Processing) initConsensusEventsHandler() error {
	err := p.rpcClient.RegisterForVirtualSelectedParentChainChangedNotifications(false, func(notification *appmessage.VirtualSelectedParentChainChangedNotificationMessage) {
		added, err := block.HashesFromStrings(notification.AddedChainBlockHashes)
		if err != nil {
			panic(err)
		}

		removed, err := block.HashesFromStrings(notification.RemovedChainBlockHashes)
		if err != nil {
			panic(err)
		}

		event := &externalapi.VirtualChangeSet{
			VirtualSelectedParentChainChanges: &externalapi.SelectedChainPath{
				Added:   added,
				Removed: removed,
			},
			VirtualUTXODiff:                nil,
			VirtualParents:                 nil,
			VirtualSelectedParentBlueScore: 0,
			VirtualDAAScore:                0,
		}

		err = p.ProcessVirtualChange(event)
		if err != nil {
			logging.LogErrorAndExit("Failed to process virtual change consensus event: %s", err)
		}
	})
	if err != nil {
		return err
	}

	err = p.rpcClient.RegisterForBlockAddedNotifications(func(notification *appmessage.BlockAddedNotificationMessage) {
		block, err := block.GetBlockFromRpc(notification.Block)
		if err != nil {
			panic(err)
		}

		log.Debugf("Consensus event handler gets block %s", block.Hash)
		err = p.ProcessBlockAndDependencies(block, true)
		if err != nil {
			logging.LogErrorAndExit("Failed to process block added consensus event: %s", err)
		}
	})
	if err != nil {
		return err
	}

	return nil
}

func (p *Processing) updateRpcClientVersionAndNetwork() error {
	info, err := p.rpcClient.GetInfo()
	if err != nil {
		return err
	}
	p.appConfig.KaspadVersion = info.ServerVersion

	dagInfo, err := p.rpcClient.GetBlockDAGInfo()
	if err != nil {
		return err
	}
	p.appConfig.Network = dagInfo.NetworkName

	log.Infof("Node network %s", p.appConfig.Network)
	if p.config.NetName != p.appConfig.Network {
		return errors.Errorf("The network requested by command line arguments (%s) and the kaspa node network (%s) do not match", p.config.NetName, p.appConfig.Network)
	}

	return nil
}

func (p *Processing) RegisterAppConfig() error {
	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		log.Infof("Registering app config")
		log.Infof("Config = KGI version: %s, Node version: %s, Network: %s", p.appConfig.ProcessingVersion, p.appConfig.KaspadVersion, p.appConfig.Network)
		defer log.Infof("Finished registering app config")

		return p.database.StoreAppConfig(databaseTransaction, p.appConfig)
	})
}

func (p *Processing) waitForSyncedRpcClient() error {
	for cycle := 0; ; cycle++ {
		info, err := p.rpcClient.GetInfo()
		if err != nil {
			return err
		}
		if info.IsSynced {
			log.Infof("Node is synced")
			return nil
		}
		if cycle == 0 {
			log.Infof("Waiting for the node to finish IBD...")
		}
		// Wait for 3 seconds
		time.Sleep(3 * time.Second)
	}
}

func (p *Processing) ResyncDatabase() error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		p.syncing = true
		log.Infof("Resyncing database")
		defer log.Infof("Finished resyncing database")

		dagInfo, err := p.rpcClient.GetBlockDAGInfo()
		if err != nil {
			return err
		}

		p.syncBlock, err = p.getDomainBlockFromString(dagInfo.PruningPointHash)
		if err != nil {
			return err
		}
		hasPruningBlock, err := p.database.DoesBlockExist(databaseTransaction, p.syncBlock.Hash)
		if err != nil {
			return err
		}

		vspcCycle := 0
		lowBlock := p.syncBlock

		keepDatabase := hasPruningBlock && !p.config.ClearDB // && false
		if keepDatabase {
			// The pruning block is already in the database
			// so we keep the database as it is and sync the new blocks
			log.Infof("Pruning point %s is already in the database", p.syncBlock.Hash)
			log.Infof("Database kept")

			pruningBlockHeight, err := p.database.BlockHeightByHash(databaseTransaction, p.syncBlock.Hash)
			if err != nil {
				return err
			}

			log.Infof("Loading cache")
			p.database.LoadCache(databaseTransaction, pruningBlockHeight)
			log.Infof("Cache loaded from the database")

			log.Infof("Searching for an optimal sync starting point")
			lowBlock = p.findOptimalSyncStartingBlock(databaseTransaction)
			if *lowBlock.Hash != *p.syncBlock.Hash {
				log.Infof("Optimal sync starting point set at %s", lowBlock.Hash)
			} else {
				log.Infof("Sync starting point set at the pruning point %s", p.syncBlock.Hash)
			}
		} else {
			// The pruning block was not found in the database
			// so we start from scratch.
			err = p.database.Clear(databaseTransaction)
			if err != nil {
				return err
			}
			if !hasPruningBlock {
				log.Infof("Pruning point %s is not in the database", p.syncBlock.Hash)
			}
			log.Infof("Database cleared")
			log.Infof("Sync starting point set at the pruning point %s", p.syncBlock.Hash)

			// We add the full merge sets of the sync block into the database.
			// This will set the added deps as disconnected placeholders but will allow an errorless
			// block processing.
			err := p.processBlockAndDependencies(databaseTransaction, p.syncBlock, true)
			if err != nil {
				log.Errorf("Pruning point %s and its dependencies could not be added to the database", p.syncBlock.Hash)
				return err
			}
			log.Infof("Pruning point %s and its dependencies have been added to the database", p.syncBlock.Hash)
		}

		var block *block.Block
		for cycle := 0; ; cycle++ {
			log.Infof("Cycle %d - Load node blocks", cycle)
			var hashesToSelectedTip []*externalapi.DomainHash
			hashesToSelectedTip, lowBlock, err = p.getHashesToSelectedTip(cycle, lowBlock)
			if err != nil {
				return err
			}
			log.Infof("Cycle %d - Node blocks hashes loaded", cycle)

			startIndex := int(0)
			if keepDatabase && cycle == 0 {
				log.Infof("Cycle %d - Syncing %d blocks with the database", cycle, len(hashesToSelectedTip))
				startIndex, err = p.database.FindLatestStoredBlockIndex(databaseTransaction, hashesToSelectedTip)
				if err != nil {
					return err
				}
				log.Infof("Cycle %d - First %d blocks already exist in the database", cycle, startIndex)
				// We start from an earlier point (~ 5 minutes) to make sure we didn't miss any data
				startIndex = tools.Max(startIndex-3000, 0)
			}

			totalToAdd := len(hashesToSelectedTip) - startIndex
			log.Infof("Cycle %d - Adding %d blocks to the database", cycle, totalToAdd)

			for i := startIndex; i < len(hashesToSelectedTip); i++ {
				hash := hashesToSelectedTip[i]
				block, err = p.getDomainBlock(hash)
				if err != nil {
					return err
				}
				if i-startIndex >= 1000 {
					err = p.processBlock(databaseTransaction, block, FailOnMissingData)
					// Some edge cases close to the end of hashesToSelectedTip range may trigger missing dependencies
					if err != nil {
						err = p.processBlockAndDependencies(databaseTransaction, block, true)
					}
				} else {
					err = p.processBlockAndDependencies(databaseTransaction, block, true)
				}
				if err != nil {
					return err
				}

				addedCount := i + 1 - startIndex
				if addedCount%1000 == 0 || addedCount == totalToAdd {
					log.Infof("Cycle %d - Added %d/%d blocks to the database", cycle, addedCount, totalToAdd)
				}

				if addedCount%100000 == 0 || (i == len(hashesToSelectedTip)-1 && addedCount >= 1000) {
					// Here, any missing data is most probably indicative of an ongoing node pruning.
					// So we fail and force a restart of the processing tier which will be based on the
					// new pruning point.
					err := p.resyncVirtualSelectedParentChain(databaseTransaction, false, block, FailOnMissingData)
					if err != nil {
						return err
					}
				}
			}

			// Resync the VPSC when getting close to the tip
			if len(hashesToSelectedTip) < 20 {
				err := p.resyncVirtualSelectedParentChain(databaseTransaction, false, block, ReportMissingData)
				if err != nil {
					return err
				}
				vspcCycle++
			}

			if cycle > 0 && vspcCycle > 2 && len(hashesToSelectedTip) < 10 {
				log.Infof("Cycle %d - Almost at tip with last %d blocks added, stopping resync", cycle, len(hashesToSelectedTip))
				break
			}

			keepDatabase = true
		}

		p.syncing = false
		return nil
	})
}

func (p *Processing) findOptimalSyncStartingBlock(databaseTransaction *pg.Tx) *block.Block {
	const OPTIMAL_START_DAA_SCORE_OFFSET = 600

	syncBlock := p.syncBlock
	highestVspcBlock, err := p.database.HighestBlockInVirtualSelectedParentChain(databaseTransaction)
	if err != nil {
		return syncBlock
	}

	if highestVspcBlock.DAAScore > OPTIMAL_START_DAA_SCORE_OFFSET && highestVspcBlock.DAAScore > p.syncBlock.Domain.Header.DAAScore() {
		startBlockID, err := p.database.BlockIDByDAAScore(databaseTransaction, highestVspcBlock.DAAScore-OPTIMAL_START_DAA_SCORE_OFFSET)
		if err != nil {
			return syncBlock
		}

		dbStart, err := p.database.GetBlock(databaseTransaction, startBlockID)
		if err != nil {
			return syncBlock
		}

		startBlock, err := p.getDomainBlockFromString(dbStart.BlockHash)
		if err != nil {
			return syncBlock
		}

		return startBlock
	}

	return syncBlock
}

func (p *Processing) getDomainBlockFromString(stringHash string) (*block.Block, error) {
	return block.GetBlockFromString(p.rpcClient, stringHash)
}

func (p *Processing) getDomainBlock(hash *externalapi.DomainHash) (*block.Block, error) {
	return block.GetBlock(p.rpcClient, hash)
}

func (p *Processing) getHashesToSelectedTip(cycle int, lowBlock *block.Block) ([]*externalapi.DomainHash, *block.Block, error) {
	dagInfo, err := p.rpcClient.GetBlockDAGInfo()
	if err != nil {
		return nil, lowBlock, err
	}
	virtualDAAScore := dagInfo.VirtualDAAScore
	syncDAAScore := p.syncBlock.Domain.Header.DAAScore()
	selectedTipHash, err := p.rpcClient.GetSelectedTipHash()
	if err != nil {
		return nil, nil, err
	}

	hashesToSelectedTip := make([]*externalapi.DomainHash, 0)
	count := 0
outer:
	for i := 0; ; i++ {
		log.Debugf("Cycle %d - Requesting GetBlocks with lowHash %s", cycle, *lowBlock.Hash)
		getBlocks, err := p.rpcClient.GetBlocks(lowBlock.Hash.String(), false, false)
		if err != nil {
			return nil, nil, err
		}
		count += len(getBlocks.BlockHashes)
		if i%1000 == 0 {
			rpcBlock, err := p.rpcClient.GetBlock(getBlocks.BlockHashes[0], false)
			if err != nil {
				return nil, nil, err
			}

			if virtualDAAScore-syncDAAScore != 0 {
				log.Infof("Cycle %d - Time %s - Progress %d%%", cycle, time.Unix(rpcBlock.Block.Header.Timestamp/1000, 0), 100.0*(rpcBlock.Block.Header.DAAScore-syncDAAScore)/(virtualDAAScore-syncDAAScore))
			} else {
				log.Infof("Cycle %d - Time %s", cycle, time.Unix(rpcBlock.Block.Header.Timestamp/1000, 0))
			}
		}

		hashes, err := block.HashesFromStrings(getBlocks.BlockHashes)
		if err != nil {
			return nil, nil, err
		}

		hashesToSelectedTip = append(hashesToSelectedTip, hashes...)
		for _, hash := range getBlocks.BlockHashes {
			if hash == selectedTipHash.SelectedTipHash {
				break outer
			}
		}

		lowBlock, err = p.getDomainBlock(hashes[len(hashes)-1])
		if err != nil {
			return nil, nil, err
		}
	}

	lowBlock, err = p.getDomainBlockFromString(selectedTipHash.SelectedTipHash)
	if err != nil {
		return nil, nil, err
	}
	return hashesToSelectedTip, lowBlock, nil
}

func (p *Processing) ResyncVirtualSelectedParentChain() error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.resyncVirtualSelectedParentChain(databaseTransaction, true, nil, ReportMissingData)
	})
}

func (p *Processing) resyncVirtualSelectedParentChain(databaseTransaction *pg.Tx, withDependencies bool, stopBlock *block.Block, missingDataPolicy MissingDataPolicy) error {
	log.Debugf("Resyncing virtual selected parent chain")
	defer log.Debugf("Finished resyncing virtual selected parent chain")

	highestBlockVirtualSelectedParentChain, err := p.database.HighestBlockInVirtualSelectedParentChain(databaseTransaction)
	if err != nil {
		return errors.Wrapf(err, "Could not get highest block in virtual selected parent chain")
	}
	var highestBlockHash *externalapi.DomainHash
	if len(highestBlockVirtualSelectedParentChain.BlockHash) == 0 {
		// If length is zero, the database has no block set in VSPC at all so instead we use the
		// processing sync block which is the current pruning point.
		highestBlockHash = p.syncBlock.Hash
	} else {
		highestBlockHash, err = externalapi.NewDomainHashFromString(highestBlockVirtualSelectedParentChain.BlockHash)
		if err != nil {
			return nil
		}
	}
	changes, err := p.getVirtualSelectedParentChainChanges(highestBlockHash, stopBlock)
	if err != nil {
		switch missingDataPolicy {
		case ReportMissingData:
			log.Errorf("Could not get virtual selected parent chain from block %s: %s", highestBlockHash, err)
			return nil
		case FailOnMissingData:
			return errors.Wrapf(err, "Could not get virtual selected parent chain from block %s", highestBlockHash)
		}
	}

	log.Infof("Resyncing virtual selected parent chain from block %s with %d added, %d removed", highestBlockHash, len(changes.Added), len(changes.Removed))

	if len(changes.Added) > 0 {
		log.Infof("VSPC added: %s to %s", changes.Added[0], changes.Added[len(changes.Added)-1])
		if len(changes.Removed) > 0 {
			log.Infof("VSPC removed: %s to %s", changes.Removed[0], changes.Removed[len(changes.Removed)-1])
		}

		virtualSelectedParentBlock, err := p.getDomainBlock(changes.Added[len(changes.Added)-1])
		if err != nil {
			return err
		}

		blockInsertionResult := &externalapi.VirtualChangeSet{
			VirtualSelectedParentChainChanges: changes,
		}
		if withDependencies {
			err = p.processBlockAndDependencies(databaseTransaction, virtualSelectedParentBlock, true)
			if err != nil {
				return err
			}
		}
		err = p.processVirtualChange(databaseTransaction, blockInsertionResult, withDependencies)
		if err != nil {
			return err
		}
	}
	return nil
}

func (p *Processing) getVirtualSelectedParentChainChanges(startHash *externalapi.DomainHash, stopBlock *block.Block) (*externalapi.SelectedChainPath, error) {
	log.Debugf("Preparing virtual selected parent chain from block %s...", startHash)
	defer log.Debugf("Finished preparing virtual selected parent chain from block %s", startHash)

	changes := &externalapi.SelectedChainPath{
		Added:   make([]*externalapi.DomainHash, 0),
		Removed: make([]*externalapi.DomainHash, 0),
	}

	// If the start hash is the the processing sync hash, we include it in the added changes
	if *startHash == *p.syncBlock.Hash {
		changes.Added = append(changes.Added, startHash)
	}

	for {
		chainFromBlock, err := p.rpcClient.GetVirtualSelectedParentChainFromBlock(startHash.String(), false)
		if err != nil {
			return nil, err
		}

		if len(chainFromBlock.AddedChainBlockHashes) == 0 {
			// Nothing above start hash so we leave
			break
		}

		added, err := p.getHashesUntil(chainFromBlock.AddedChainBlockHashes, stopBlock)
		if err != nil {
			return nil, err
		}
		if len(added) > 0 {
			log.Debugf("Got %d filtered VSPC added: %s to %s", len(added), added[0], added[len(added)-1])
		} else {
			log.Debugf("Got 0 filtered VSPC added")
		}

		removed, err := p.getHashesUntil(chainFromBlock.RemovedChainBlockHashes, stopBlock)
		if err != nil {
			return nil, err
		}
		if len(removed) > 0 {
			log.Debugf("Got %d filtered VSPC removed: %s to %s", len(removed), removed[0], removed[len(removed)-1])
		}

		changes.Added = append(changes.Added, added...)
		changes.Removed = append(changes.Removed, removed...)

		if len(added) < len(chainFromBlock.AddedChainBlockHashes) {
			// Some added hashes were dropped so stop block was reached and we leave
			break
		}

		startHash = added[len(added)-1]
	}
	return changes, nil
}

// getHashesUntil returns all the block hashes which are not higher than the stop block in terms of DAA score
func (p *Processing) getHashesUntil(blockHashes []string, stopBlock *block.Block) ([]*externalapi.DomainHash, error) {
	hashes, err := block.HashesFromStrings(blockHashes)
	if err != nil {
		return nil, err
	}

	if len(hashes) == 0 || stopBlock == nil {
		return hashes, nil
	}

	stopDAAScore := stopBlock.Domain.Header.DAAScore()
	log.Debugf("Filtering %d hashes with a score not greater than %d", len(blockHashes), stopBlock.Domain.Header.DAAScore())

	left := 0
	leftBlock, err := p.getDomainBlock(hashes[left])
	if err != nil {
		return nil, err
	}

	right := len(hashes) - 1
	rightBlock, err := p.getDomainBlock(hashes[right])
	if err != nil {
		return nil, err
	}

	var mid int
	var midBlock *block.Block

	for left <= right {
		if stopDAAScore < leftBlock.Domain.Header.DAAScore() {
			if left == 0 {
				return make([]*externalapi.DomainHash, 0), nil
			} else {
				return hashes[0:left], nil
			}
		}
		if rightBlock.Domain.Header.DAAScore() < stopDAAScore {
			if right == len(hashes)-1 {
				return hashes, nil
			} else {
				return hashes[0 : right+1], nil
			}
		}

		mid = left + ((right - left) / 2)
		midBlock, err = p.getDomainBlock(hashes[mid])
		if err != nil {
			return nil, err
		}
		log.Debugf("Searching interval %d, %d, %d with scores %d, %d, %d", left, mid, right, leftBlock.Domain.Header.DAAScore(), midBlock.Domain.Header.DAAScore(), rightBlock.Domain.Header.DAAScore())

		if midBlock.Domain.Header.DAAScore() < stopDAAScore {
			left = mid + 1
			if left < len(hashes) {
				leftBlock, err = p.getDomainBlock(hashes[left])
				if err != nil {
					return nil, err
				}
			} else {
				return hashes, nil
			}
		} else if stopDAAScore < midBlock.Domain.Header.DAAScore() {
			right = mid - 1
			if right >= 0 {
				rightBlock, err = p.getDomainBlock(hashes[right])
				if err != nil {
					return nil, err
				}
			} else {
				return make([]*externalapi.DomainHash, 0), nil
			}
		} else {
			// The DAA score of the stop block was actually found in the array
			return hashes[0 : mid+1], nil
		}
	}

	return hashes, nil
}

func (p *Processing) ProcessBlockAndDependencies(block *block.Block, includeMergeSets bool) error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.processBlockAndDependencies(databaseTransaction, block, includeMergeSets)
	})
}

// processBlockAndDependencies processes `block` and all its missing dependencies
// On missing deps during processing, we just report the missing part in the logs
// and process the block with the available information.
func (p *Processing) processBlockAndDependencies(databaseTransaction *pg.Tx, block *block.Block, includeMergeSets bool) error {

	batch := batch.New(p.database, p.rpcClient, p.syncBlock)
	err := batch.CollectBlockAndDependencies(databaseTransaction, block, includeMergeSets)
	if err != nil {
		return err
	}
	ordered := batch.TopologicalSort()
	for i, ba := range ordered {
		// Ignore the block passed as arg to this function
		if *ba.Hash() == *block.Hash {
			continue
		}

		// Process missing dependency block
		log.Warnf("Handling missing dependency block #%d %s", i, ba.Hash())
		err = p.processBlock(databaseTransaction, ba.Block, ReportMissingData)
		if err != nil {
			return err
		}
	}

	// Process the block passed as arg
	if len(ordered) > 1 {
		log.Warnf("Handling block %s after its missing dependencies (%d)", block.Hash, len(ordered)-1)
	}
	err = p.processBlock(databaseTransaction, block, ReportMissingData)
	if err != nil {
		return err
	}

	return nil
}

func (p *Processing) processBlock(databaseTransaction *pg.Tx, newBlock *block.Block, missingDataPolicy MissingDataPolicy) error {
	log.Debugf("Processing block %s", newBlock.Hash)
	defer log.Debugf("Finished processing block %s", newBlock.Hash)

	isIncompleteBlock := false
	blockExists, err := p.database.DoesBlockExist(databaseTransaction, newBlock.Hash)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not check if block %s does exist in database", newBlock.Hash)
	}
	if !blockExists {
		var selectedParentID *uint64
		parentIDs := make([]uint64, 0)
		parentHeights := make([]uint64, 0)
		mergeSetRedIDs := make([]uint64, 0)
		mergeSetBlueIDs := make([]uint64, 0)
		// If the block is located below the sync point, ignore its parents and merge sets
		if !newBlock.IsPlaceholder {
			selectedParentID, err = p.GetSelectedParentID(databaseTransaction, newBlock)
			if err != nil {
				return errors.Wrapf(err, "Could not get id of selected parent block %s", newBlock.Rpc.VerboseData.SelectedParentHash)
			}

			parentHashes := newBlock.Domain.Header.DirectParents()
			existingParentHashes := make([]*externalapi.DomainHash, 0, len(parentHashes))
			for _, parentHash := range parentHashes {
				parentExists, err := p.database.DoesBlockExist(databaseTransaction, parentHash)
				if err != nil {
					// enhanced error description
					return errors.Wrapf(err, "Could not check if parent %s for block %s does exist in database", parentHash, newBlock.Hash)
				}
				if !parentExists {
					switch missingDataPolicy {
					case ReportMissingData:
						log.Warnf("Parent %s for block %s does not exist in the database", parentHash, newBlock.Hash)
						isIncompleteBlock = true
						continue

					case FailOnMissingData:
						return errors.Wrapf(err, "Block processing error: Parent %s for block %s does not exist in the database", parentHash, newBlock.Hash)
					}
				}
				existingParentHashes = append(existingParentHashes, parentHash)
			}

			parentIDs, parentHeights, err = p.database.BlockIDsAndHeightsByHashes(databaseTransaction, existingParentHashes)
			if err != nil {
				return errors.Errorf("Could not resolve parent IDs for block %s: %s", newBlock.Hash, err)
			}

			// Some edge cases can trigger missing merge sets blocks, particularly blocks in the close future
			// of the sync block merging blocks located deeper than the sync block in terms of DAA score

			mergeSetReds, err := block.HashesFromStrings(newBlock.Rpc.VerboseData.MergeSetRedsHashes)
			if err != nil {
				return err
			}
			var missingReds []*externalapi.DomainHash
			mergeSetRedIDs, missingReds = p.database.HashesToBlockIDs(databaseTransaction, mergeSetReds)
			if len(missingReds) > 0 {
				switch missingDataPolicy {
				case ReportMissingData:
					log.Errorf("Could not get mergeset reds ids for block %s: %s", newBlock.Hash, missingReds)
					isIncompleteBlock = true

				case FailOnMissingData:
					return errors.Wrapf(err, "Block processing error: Could not get mergeset reds ids for block %s: %s", newBlock.Hash, missingReds)
				}
			}

			mergeSetBlues, err := block.HashesFromStrings(newBlock.Rpc.VerboseData.MergeSetBluesHashes)
			if err != nil {
				return err
			}
			var missingBlues []*externalapi.DomainHash
			mergeSetBlueIDs, missingBlues = p.database.HashesToBlockIDs(databaseTransaction, mergeSetBlues)
			if len(missingBlues) > 0 {
				switch missingDataPolicy {
				case ReportMissingData:
					log.Errorf("Could not get mergeset blues ids for block %s: %s", newBlock.Hash, missingBlues)
					isIncompleteBlock = true

				case FailOnMissingData:
					return errors.Wrapf(err, "Block processing error: Could not get mergeset blues ids for block %s: %s", newBlock.Hash, missingBlues)
				}
			}
		}

		blockHeight := uint64(0)
		if newBlock.IsGenesis() {
			blockHeight = 1
		}
		for _, height := range parentHeights {
			blockHeight = tools.Max(blockHeight, height+1)
		}

		heightGroupSize, err := p.database.HeightGroupSize(databaseTransaction, blockHeight)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not resolve group size for highest parent height %d for block %s", blockHeight, newBlock.Hash)
		}
		blockHeightGroupIndex := heightGroupSize

		databaseBlock := &model.Block{
			BlockHash:                      newBlock.Hash.String(),
			Timestamp:                      newBlock.Domain.Header.TimeInMilliseconds(),
			ParentIDs:                      parentIDs,
			Height:                         blockHeight,
			HeightGroupIndex:               blockHeightGroupIndex,
			SelectedParentID:               selectedParentID,
			Color:                          model.ColorGray,
			IsInVirtualSelectedParentChain: false,
			MergeSetRedIDs:                 mergeSetRedIDs,
			MergeSetBlueIDs:                mergeSetBlueIDs,
			DAAScore:                       newBlock.Domain.Header.DAAScore(),
		}
		err = p.database.InsertBlock(databaseTransaction, newBlock.Hash, databaseBlock)
		if err != nil {
			return errors.Wrapf(err, "Could not insert block %s", newBlock.Hash)
		}
		blockID := databaseBlock.ID

		heightGroup := &model.HeightGroup{
			Height: blockHeight,
			Size:   blockHeightGroupIndex + 1,
		}
		err = p.database.InsertOrUpdateHeightGroup(databaseTransaction, heightGroup)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not insert or update height group %d for block %s", blockHeight, newBlock.Hash)
		}

		for i, parentID := range parentIDs {
			parentHeight := parentHeights[i]
			parentHeightGroupIndex, err := p.database.BlockHeightGroupIndex(databaseTransaction, parentID)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not get height group index of parent id %d for block %s", parentID, newBlock.Hash)
			}
			edge := &model.Edge{
				FromBlockID:          blockID,
				ToBlockID:            parentID,
				FromHeight:           blockHeight,
				ToHeight:             parentHeight,
				FromHeightGroupIndex: blockHeightGroupIndex,
				ToHeightGroupIndex:   parentHeightGroupIndex,
			}
			err = p.database.InsertEdge(databaseTransaction, edge)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not insert edge from block %s to parent id %d", newBlock.Hash, parentID)
			}
		}
	} else {
		log.Debugf("Block %s already exists in database; not processed", newBlock.Hash)
	}

	if isIncompleteBlock {
		log.Infof("Block %s is incomplete but has been processed anyway", newBlock.Hash)
	} else if newBlock.Rpc.VerboseData.IsHeaderOnly {
		log.Infof("Block %s is header only but has been processed anyway", newBlock.Hash)
	}

	return nil
}

func (p *Processing) processMissingBlock(databaseTransaction *pg.Tx, blockHash *externalapi.DomainHash) (uint64, error) {
	block, err := p.getDomainBlock(blockHash)
	if err != nil {
		return 0, err
	}
	err = p.processBlockAndDependencies(databaseTransaction, block, true)
	if err != nil {
		return 0, err
	}
	blockID, err := p.database.BlockIDByHash(databaseTransaction, blockHash)
	if err != nil {
		// enhanced error description
		return 0, errors.Wrapf(err, "Could not get id for block %s", blockHash)
	}
	return blockID, nil
}

func (p *Processing) GetSelectedParentID(databaseTransaction *pg.Tx, block *block.Block) (*uint64, error) {
	var id *uint64
	if len(block.Rpc.VerboseData.SelectedParentHash) > 0 {
		id = new(uint64)
		selectedParent, err := externalapi.NewDomainHashFromString(block.Rpc.VerboseData.SelectedParentHash)
		if err != nil {
			return nil, err
		}
		selectedParentID, err := p.database.BlockIDByHash(databaseTransaction, selectedParent)
		if err != nil {
			return nil, err
		}
		*id = selectedParentID
	}
	return id, nil
}

func (p *Processing) ProcessVirtualChange(blockInsertionResult *externalapi.VirtualChangeSet) error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.processVirtualChange(databaseTransaction, blockInsertionResult, true)
	})
}

func (p *Processing) processVirtualChange(databaseTransaction *pg.Tx, blockInsertionResult *externalapi.VirtualChangeSet, withDependencies bool) error {
	if blockInsertionResult == nil || blockInsertionResult.VirtualSelectedParentChainChanges == nil {
		return nil
	}

	blockColors := make(map[uint64]string)
	blockIsInVirtualSelectedParentChain := make(map[uint64]bool)
	removedBlockHashes := blockInsertionResult.VirtualSelectedParentChainChanges.Removed
	if len(removedBlockHashes) > 0 {
		for _, removedBlockHash := range removedBlockHashes {
			removedBlockID, err := p.database.BlockIDByHash(databaseTransaction, removedBlockHash)
			if err == nil {
				blockColors[removedBlockID] = model.ColorGray
				blockIsInVirtualSelectedParentChain[removedBlockID] = false
			} else if withDependencies {
				removedBlockID, err = p.processMissingBlock(databaseTransaction, removedBlockHash)
				if err == nil {
					blockIsInVirtualSelectedParentChain[removedBlockID] = false
				} else {
					log.Errorf("Could not get id of virtual change removed block %s", removedBlockHash)
				}
			}
		}
	}

	addedBlockHashes := blockInsertionResult.VirtualSelectedParentChainChanges.Added
	if len(addedBlockHashes) > 0 {
		for _, addedBlockHash := range addedBlockHashes {
			addedBlockID, err := p.database.BlockIDByHash(databaseTransaction, addedBlockHash)
			if err == nil {
				blockIsInVirtualSelectedParentChain[addedBlockID] = true
			} else if withDependencies {
				addedBlockID, err = p.processMissingBlock(databaseTransaction, addedBlockHash)
				if err == nil {
					blockIsInVirtualSelectedParentChain[addedBlockID] = true
				} else {
					log.Errorf("Could not get id of virtual change added block %s", addedBlockHash)
				}
			}
		}
	}
	err := p.database.UpdateBlockIsInVirtualSelectedParentChain(databaseTransaction, blockIsInVirtualSelectedParentChain)
	if len(blockIsInVirtualSelectedParentChain) > 1000 {
		log.Infof("Updated the VSPC status of %d blocks", len(blockIsInVirtualSelectedParentChain))
	}
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not update the virtual selected parent chain status of some blocks")
	}

	for i, addedBlockHash := range addedBlockHashes {
		rpcBlock, err := p.rpcClient.GetBlock(addedBlockHash.String(), false)
		if err != nil {
			return err
		}

		blueHashes, err := block.HashesFromStrings(rpcBlock.Block.VerboseData.MergeSetBluesHashes)
		if err != nil {
			return err
		}

		for _, blueHash := range blueHashes {
			blueBlockID, err := p.database.BlockIDByHash(databaseTransaction, blueHash)
			if err == nil {
				blockColors[blueBlockID] = model.ColorBlue
			} else if withDependencies {
				log.Errorf("Could not get id of merge set blue block %s", blueHash)
			}
		}

		redHashes, err := block.HashesFromStrings(rpcBlock.Block.VerboseData.MergeSetRedsHashes)
		if err != nil {
			return err
		}

		for _, redHash := range redHashes {
			redBlockID, err := p.database.BlockIDByHash(databaseTransaction, redHash)
			if err == nil {
				blockColors[redBlockID] = model.ColorRed
			} else if withDependencies {
				log.Errorf("Could not get id of merge set red block %s", redHash)
			}
		}

		if (i+1)%10000 == 0 || (i+1 == len(addedBlockHashes) && len(addedBlockHashes) > 10000) {
			log.Infof("Loaded merge set colors of %d/%d VSPC blocks", i+1, len(addedBlockHashes))
		}
	}
	if len(addedBlockHashes) >= 10000 {
		defer log.Infof("Updated color of %d blocks", len(blockColors))
	}
	return p.database.UpdateBlockColors(databaseTransaction, blockColors)
}

type MissingDataPolicy int

const (
	ReportMissingData MissingDataPolicy = iota
	FailOnMissingData
)

var missingDataPolicyName = map[MissingDataPolicy]string{
	ReportMissingData: "report",
	FailOnMissingData: "fail",
}

func (ss MissingDataPolicy) String() string {
	return missingDataPolicyName[ss]
}
