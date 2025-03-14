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
	versionPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/version"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/consensus/utils/consensushashing"
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
	err := p.updateRpcClientVersion()
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

	// Start listening to events only after resyncing is done, otherwise we get overwhelmed
	err = p.initConsensusEventsHandler()
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
		added, err := hashesFromStrings(notification.AddedChainBlockHashes)
		if err != nil {
			panic(err)
		}

		removed, err := hashesFromStrings(notification.RemovedChainBlockHashes)
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
		block, err := appmessage.RPCBlockToDomainBlock(notification.Block)
		if err != nil {
			panic(err)
		}

		log.Debugf("Consensus event handler gets block %s", consensushashing.BlockHash(block))
		err = p.ProcessBlock(block)
		if err != nil {
			logging.LogErrorAndExit("Failed to process block added consensus event: %s", err)
		}
	})
	if err != nil {
		return err
	}

	return nil
}

func (p *Processing) updateRpcClientVersion() error {
	info, err := p.rpcClient.GetInfo()
	if err != nil {
		return err
	}
	p.appConfig.KaspadVersion = info.ServerVersion
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

		pruningPointHash, err := externalapi.NewDomainHashFromString(dagInfo.PruningPointHash)
		if err != nil {
			return err
		}

		rpcPruning, err := p.rpcClient.GetBlock(dagInfo.PruningPointHash, false)
		if err != nil {
			return err
		}

		pruningPointBlock, err := appmessage.RPCBlockToDomainBlock(rpcPruning.Block)
		if err != nil {
			return err
		}

		hasPruningBlock, err := p.database.DoesBlockExist(databaseTransaction, pruningPointHash)
		if err != nil {
			return err
		}

		vspcCycle := 0
		lowHash := dagInfo.PruningPointHash

		keepDatabase := hasPruningBlock && !p.config.ClearDB
		if keepDatabase {
			// The pruning block is already in the database
			// so we keep the database as it is and sync the new blocks
			log.Infof("Prunning point %s already in the database", pruningPointHash)
			log.Infof("Database kept")

			pruningBlockHeight, err := p.database.BlockHeightByHash(databaseTransaction, pruningPointHash)
			if err != nil {
				return err
			}

			log.Infof("Loading cache")
			p.database.LoadCache(databaseTransaction, pruningBlockHeight)
			log.Infof("Cache loaded from the database")

			log.Infof("Searching for an optimal sync starting point")
			lowHash = p.findOptimalSyncStartingBlock(databaseTransaction, dagInfo.PruningPointHash, pruningPointBlock.Header.DAAScore())
			if lowHash != dagInfo.PruningPointHash {
				log.Infof("Optimal sync starting point set at %s", lowHash)
			} else {
				log.Infof("Sync starting point set at the pruning point")
			}
		} else {
			// The pruning block was not found in the database
			// so we start from scratch.
			err = p.database.Clear(databaseTransaction)
			if err != nil {
				return err
			}
			log.Infof("Database cleared")

			pruningPointDatabaseBlock := &model.Block{
				BlockHash:                      pruningPointHash.String(),
				Timestamp:                      rpcPruning.Block.Header.Timestamp,
				ParentIDs:                      []uint64{},
				Height:                         0,
				HeightGroupIndex:               0,
				SelectedParentID:               nil,
				Color:                          model.ColorGray,
				IsInVirtualSelectedParentChain: true,
				MergeSetRedIDs:                 []uint64{},
				MergeSetBlueIDs:                []uint64{},
			}
			err = p.database.InsertBlock(databaseTransaction, pruningPointHash, pruningPointDatabaseBlock)
			if err != nil {
				return err
			}
			heightGroup := &model.HeightGroup{
				Height: 0,
				Size:   1,
			}
			err = p.database.InsertOrUpdateHeightGroup(databaseTransaction, heightGroup)
			if err != nil {
				return err
			}
			log.Infof("Pruning point %s has been added to the database", pruningPointHash)
		}

		for cycle := 0; ; cycle++ {
			log.Infof("Cycle %d - Load node blocks", cycle)
			hashesBetweenPruningPointAndHeadersSelectedTip, err := p.getHashesToSelectedTip(&lowHash, dagInfo.VirtualDAAScore, rpcPruning.Block.Header.DAAScore)
			if err != nil {
				return err
			}
			log.Infof("Cycle %d - Node blocks loaded", cycle)

			startIndex := int(0)
			if keepDatabase && cycle == 0 {
				// Special case occurring when launching a version of KGI supporting DAA scores on a
				// database freshly migrated and introducing DAA scores.
				pruningPointID, err := p.database.BlockIDByHash(databaseTransaction, pruningPointHash)
				if err != nil {
					return err
				}
				pruningPointDatabaseBlock, err := p.database.GetBlock(databaseTransaction, pruningPointID)
				if err != nil {
					return err
				}
				noDAAScoreCount, err := p.database.BlockCountAtDAAScore(databaseTransaction, 0)
				if err != nil {
					return err
				}
				if pruningPointDatabaseBlock.DAAScore == 0 && noDAAScoreCount > uint32(p.config.NetParams().K) {
					log.Infof("Cycle %d - Updating DAA score of %d blocks in the database", cycle, len(hashesBetweenPruningPointAndHeadersSelectedTip))
					blockIDsToDAAScores, err := p.getBlocksDAAScores(databaseTransaction, hashesBetweenPruningPointAndHeadersSelectedTip)
					log.Infof("Cycle %d - DAA scores of %d blocks collected", cycle, len(blockIDsToDAAScores))
					if err != nil {
						return err
					}
					err = p.database.UpdateBlockDAAScores(databaseTransaction, blockIDsToDAAScores)
					if err != nil {
						return err
					}
					log.Infof("Cycle %d - DAA scores of %d blocks stored in the database", cycle, len(blockIDsToDAAScores))
				}
				// End of special case

				log.Infof("Cycle %d - Syncing %d blocks with the database", cycle, len(hashesBetweenPruningPointAndHeadersSelectedTip))
				if !p.config.Resync {
					startIndex, err = p.database.FindLatestStoredBlockIndex(databaseTransaction, hashesBetweenPruningPointAndHeadersSelectedTip)
					if err != nil {
						return err
					}
					log.Infof("Cycle %d - First %d blocks already exist in the database", cycle, startIndex)
					// We start from an earlier point (~ 5 minutes) to make sure we didn't miss any mutation
					startIndex = tools.Max(startIndex-3000, 0)
				}
			} else {
				log.Infof("Cycle %d - Adding %d blocks to the database", cycle, len(hashesBetweenPruningPointAndHeadersSelectedTip))
			}

			totalToAdd := len(hashesBetweenPruningPointAndHeadersSelectedTip) - startIndex

			for i := startIndex; i < len(hashesBetweenPruningPointAndHeadersSelectedTip); i++ {
				blockHash := hashesBetweenPruningPointAndHeadersSelectedTip[i]
				rpcBlock, err := p.rpcClient.GetBlock(blockHash.String(), false)
				if err != nil {
					return err
				}
				block, err := appmessage.RPCBlockToDomainBlock(rpcBlock.Block)
				if err != nil {
					return err
				}
				if p.config.Resync || i-startIndex >= 6000 {
					err = p.processBlock(databaseTransaction, block)
				} else {
					err = p.processBlockAndDependencies(databaseTransaction, blockHash, block, pruningPointBlock)
				}
				if err != nil {
					return err
				}

				addedCount := i + 1 - startIndex
				if addedCount%1000 == 0 || addedCount == totalToAdd {
					log.Infof("Cycle %d - Added %d/%d blocks to the database", cycle, addedCount, totalToAdd)
				}
			}

			// Resync the VPSC when getting close to the tip
			if len(hashesBetweenPruningPointAndHeadersSelectedTip) < 20 {
				err := p.resyncVirtualSelectedParentChain(databaseTransaction, true)
				if err != nil {
					return err
				}
				vspcCycle++
			}

			if cycle > 0 && vspcCycle > 1 && len(hashesBetweenPruningPointAndHeadersSelectedTip) < 10 {
				log.Infof("Cycle %d - Almost at tip with last %d blocks added, stopping resync", cycle, len(hashesBetweenPruningPointAndHeadersSelectedTip))
				break
			}

			keepDatabase = true
		}

		p.syncing = false
		return nil
	})
}

func (p *Processing) findOptimalSyncStartingBlock(databaseTransaction *pg.Tx, pruningPointHash string, pruningPointDAAScore uint64) string {
	const OPTIMAL_START_DAA_SCORE_OFFSET = 600

	highestVspcBlock, err := p.database.HighestBlockInVirtualSelectedParentChain(databaseTransaction)
	if err != nil {
		return pruningPointHash
	}

	if highestVspcBlock.DAAScore > OPTIMAL_START_DAA_SCORE_OFFSET && highestVspcBlock.DAAScore > pruningPointDAAScore {
		startBlockID, err := p.database.BlockIDByDAAScore(databaseTransaction, highestVspcBlock.DAAScore-OPTIMAL_START_DAA_SCORE_OFFSET)
		if err != nil {
			return pruningPointHash
		}

		startBlock, err := p.database.GetBlock(databaseTransaction, startBlockID)
		if err != nil {
			return pruningPointHash
		}

		_, err = p.rpcClient.GetBlock(startBlock.BlockHash, false)
		if err != nil {
			return pruningPointHash
		}

		return startBlock.BlockHash
	}

	return pruningPointHash
}

func (p *Processing) getHashesToSelectedTip(lowHash *string, virtualDAAScore uint64, pruningDAAScore uint64) ([]*externalapi.DomainHash, error) {
	selectedTipHash, err := p.rpcClient.GetSelectedTipHash()
	if err != nil {
		return nil, err
	}

	hashesToSelectedTip := make([]*externalapi.DomainHash, 0)
	count := 0
outer:
	for i := 0; ; i++ {
		log.Debugf("Requesting GetBlocks with lowHash %s", *lowHash)
		getBlocks, err := p.rpcClient.GetBlocks(*lowHash, false, false)
		if err != nil {
			return nil, err
		}
		count += len(getBlocks.BlockHashes)
		if i%1000 == 0 {
			rpcBlock, err := p.rpcClient.GetBlock(getBlocks.BlockHashes[0], false)
			if err != nil {
				return nil, err
			}

			log.Infof("Time %s", time.Unix(rpcBlock.Block.Header.Timestamp/1000, 0))

			if virtualDAAScore-pruningDAAScore != 0 {
				log.Infof("Progress %d%%", 100*(rpcBlock.Block.Header.DAAScore-pruningDAAScore)/(virtualDAAScore-pruningDAAScore))
			}
		}

		hashes, err := hashesFromStrings(getBlocks.BlockHashes)
		if err != nil {
			return nil, err
		}

		hashesToSelectedTip = append(hashesToSelectedTip, hashes...)
		for _, hash := range getBlocks.BlockHashes {
			if hash == selectedTipHash.SelectedTipHash {
				break outer
			}
		}

		*lowHash = getBlocks.BlockHashes[len(getBlocks.BlockHashes)-1]
	}

	*lowHash = selectedTipHash.SelectedTipHash
	return hashesToSelectedTip, nil
}

func (p *Processing) ResyncVirtualSelectedParentChain() error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.resyncVirtualSelectedParentChain(databaseTransaction, false)
	})
}

func (p *Processing) resyncVirtualSelectedParentChain(databaseTransaction *pg.Tx, withDependencies bool) error {
	log.Infof("Resyncing virtual selected parent chain")
	defer log.Infof("Finished resyncing virtual selected parent chain")

	highestBlockVirtualSelectedParentChain, err := p.database.HighestBlockInVirtualSelectedParentChain(databaseTransaction)
	if err != nil {
		return errors.Wrapf(err, "Could not get highest block in virtual selected parent chain")
	}
	highestBlockHash, err := externalapi.NewDomainHashFromString(highestBlockVirtualSelectedParentChain.BlockHash)
	if err != nil {
		return err
	}
	log.Infof("Resyncing virtual selected parent chain from block %s", highestBlockHash)

	chainFromBlock, err := p.rpcClient.GetVirtualSelectedParentChainFromBlock(highestBlockVirtualSelectedParentChain.BlockHash, false)
	if err != nil {
		// This may occur when restoring a kgi database on a system which kaspad database
		// is older than the kgi database.
		log.Errorf("Could not get virtual selected parent chain from block %s: %s", highestBlockHash, err)
		return nil
	}

	if len(chainFromBlock.AddedChainBlockHashes) > 0 {
		virtualSelectedParentHash, err := externalapi.NewDomainHashFromString(chainFromBlock.AddedChainBlockHashes[len(chainFromBlock.AddedChainBlockHashes)-1])
		if err != nil {
			return err
		}

		virtualSelectedParentBlockRPCBlock, err := p.rpcClient.GetBlock(chainFromBlock.AddedChainBlockHashes[len(chainFromBlock.AddedChainBlockHashes)-1], false)
		if err != nil {
			return err
		}

		virtualSelectedParentBlock, err := appmessage.RPCBlockToDomainBlock(virtualSelectedParentBlockRPCBlock.Block)
		if err != nil {
			return err
		}

		added, err := hashesFromStrings(chainFromBlock.AddedChainBlockHashes)
		if err != nil {
			return err
		}

		removed, err := hashesFromStrings(chainFromBlock.AddedChainBlockHashes)
		if err != nil {
			return err
		}

		blockInsertionResult := &externalapi.VirtualChangeSet{
			VirtualSelectedParentChainChanges: &externalapi.SelectedChainPath{
				Added:   added,
				Removed: removed,
			},
		}
		if withDependencies {
			err = p.processBlockAndDependencies(databaseTransaction, virtualSelectedParentHash, virtualSelectedParentBlock, nil)
			if err != nil {
				return err
			}
		}
		err = p.processVirtualChange(databaseTransaction, blockInsertionResult, withDependencies)
		if err != nil {
			return err
		}
		log.Infof("Updated the virtual selected parent chain")
	}
	return nil
}

func (p *Processing) ProcessBlock(block *externalapi.DomainBlock) error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.processBlockAndDependencies(databaseTransaction, consensushashing.BlockHash(block), block, nil)
	})
}

// processBlockAndDependencies processes `block` and all its missing dependencies
func (p *Processing) processBlockAndDependencies(databaseTransaction *pg.Tx, hash *externalapi.DomainHash,
	block, pruningBlock *externalapi.DomainBlock) error {

	batch := batch.New(p.database, p.rpcClient, pruningBlock)
	err := batch.CollectBlockAndDependencies(databaseTransaction, hash, block)
	if err != nil {
		return err
	}
	for {
		_, block, ok := batch.Pop()
		if !ok {
			break
		}
		if !batch.Empty() {
			log.Warnf("Handling missing dependency block %s", consensushashing.BlockHash(block))
		}
		err = p.processBlock(databaseTransaction, block)
		if err != nil {
			return err
		}
	}
	return nil
}

func (p *Processing) processBlock(databaseTransaction *pg.Tx, block *externalapi.DomainBlock) error {

	blockHash := consensushashing.BlockHash(block)
	log.Debugf("Processing block %s", blockHash)
	defer log.Debugf("Finished processing block %s", blockHash)

	isIncompleteBlock := false
	blockExists, err := p.database.DoesBlockExist(databaseTransaction, blockHash)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not check if block %s does exist in database", blockHash)
	}
	if !blockExists {
		parentHashes := block.Header.DirectParents()
		existingParentHashes := make([]*externalapi.DomainHash, 0, len(parentHashes))
		for _, parentHash := range parentHashes {
			parentExists, err := p.database.DoesBlockExist(databaseTransaction, parentHash)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not check if parent %s for block %s does exist in database", parentHash, blockHash)
			}
			if !parentExists {
				log.Warnf("Parent %s for block %s does not exist in the database", parentHash, blockHash)
				isIncompleteBlock = true
				continue
			}
			existingParentHashes = append(existingParentHashes, parentHash)
		}

		parentIDs, parentHeights, err := p.database.BlockIDsAndHeightsByHashes(databaseTransaction, existingParentHashes)
		if err != nil {
			return errors.Errorf("Could not resolve "+
				"parent IDs for block %s: %s", blockHash, err)
		}

		blockHeight := uint64(0)
		for _, height := range parentHeights {
			blockHeight = tools.Max(blockHeight, height+1)
		}

		heightGroupSize, err := p.database.HeightGroupSize(databaseTransaction, blockHeight)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not resolve group size for highest parent height %d for block %s", blockHeight, blockHash)
		}
		blockHeightGroupIndex := heightGroupSize

		databaseBlock := &model.Block{
			BlockHash:                      blockHash.String(),
			Timestamp:                      block.Header.TimeInMilliseconds(),
			ParentIDs:                      parentIDs,
			Height:                         blockHeight,
			HeightGroupIndex:               blockHeightGroupIndex,
			SelectedParentID:               nil,
			Color:                          model.ColorGray,
			IsInVirtualSelectedParentChain: false,
			MergeSetRedIDs:                 []uint64{},
			MergeSetBlueIDs:                []uint64{},
			DAAScore:                       block.Header.DAAScore(),
		}
		err = p.database.InsertBlock(databaseTransaction, blockHash, databaseBlock)
		if err != nil {
			return errors.Wrapf(err, "Could not insert block %s", blockHash)
		}

		blockID, err := p.database.BlockIDByHash(databaseTransaction, blockHash)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not get id for block %s", blockHash)
		}
		heightGroup := &model.HeightGroup{
			Height: blockHeight,
			Size:   blockHeightGroupIndex + 1,
		}
		err = p.database.InsertOrUpdateHeightGroup(databaseTransaction, heightGroup)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not insert or update height group %d for block %s", blockHeight, blockHash)
		}

		for _, parentID := range parentIDs {
			parentHeight, err := p.database.BlockHeight(databaseTransaction, parentID)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not get block height of parent id %d for block %s", parentID, blockHash)
			}
			parentHeightGroupIndex, err := p.database.BlockHeightGroupIndex(databaseTransaction, parentID)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not get height group index of parent id %d for block %s", parentID, blockHash)
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
				return errors.Wrapf(err, "Could not insert edge from block %s to parent id %d", blockHash, parentID)
			}
		}
	} else {
		log.Debugf("Block %s already exists in database; not processed", blockHash)
	}

	rpcBlock, err := p.rpcClient.GetBlock(blockHash.String(), false)
	if err != nil {
		return err
	}

	if rpcBlock.Block.VerboseData.IsHeaderOnly || isIncompleteBlock {
		return nil
	}

	selectedParent, err := externalapi.NewDomainHashFromString(rpcBlock.Block.VerboseData.SelectedParentHash)
	if err != nil {
		return err
	}
	selectedParentID, err := p.database.BlockIDByHash(databaseTransaction, selectedParent)
	if err != nil {
		return errors.Wrapf(err, "Could not get id of selected parent block %s", selectedParent)
	}

	blockID, err := p.database.BlockIDByHash(databaseTransaction, blockHash)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not get id of block %s", blockHash)
	}

	err = p.database.UpdateBlockSelectedParent(databaseTransaction, blockID, selectedParentID)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not update selected parent of block %s", blockHash)
	}

	mergeSetReds, err := hashesFromStrings(rpcBlock.Block.VerboseData.MergeSetRedsHashes)
	if err != nil {
		return err
	}

	mergeSetRedIDs, err := p.database.BlockIDsByHashes(databaseTransaction, mergeSetReds)
	if err != nil {
		// enhanced error description
		// return errors.Wrapf(err, "Could not get ids of merge set reds for block %s", blockHash)

		// Let's ignore this error temporarily and just report it in the log
		// This occures sometimes when the app was fresly started, at the end or just after ResyncDatabase
		// The actual conditions and the way to solve this has to be determined yet.
		// Update 2022-04-22: processBlockAndDependencies should solve the issue
		log.Errorf("Could not get ids of merge set reds for block %s: %s", blockHash, mergeSetReds)
	}

	mergeSetBlues, err := hashesFromStrings(rpcBlock.Block.VerboseData.MergeSetBluesHashes)
	if err != nil {
		return err
	}

	mergeSetBlueIDs, err := p.database.BlockIDsByHashes(databaseTransaction, mergeSetBlues)
	if err != nil {
		// enhanced error description
		// return errors.Wrapf(err, "Could not get ids of merge set blues for block %s", blockHash)

		// Let's ignore this error temporarily and just report it in the log
		// This occures sometimes when the app was fresly started, at the end or just after ResyncDatabase
		// The actual conditions and the way to solve this has to be determined yet.
		// Update 2022-04-22: processBlockAndDependencies should solve the issue
		log.Errorf("Could not get ids of merge set blues for block %s: %s", blockHash, mergeSetBlues)
	}
	err = p.database.UpdateBlockMergeSet(databaseTransaction, blockID, mergeSetRedIDs, mergeSetBlueIDs)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not update merge sets colors for block %s", blockHash)
	}

	return nil
}

func (p *Processing) processMissingBlock(databaseTransaction *pg.Tx, blockHash *externalapi.DomainHash) (uint64, error) {
	rpcBlock, err := p.rpcClient.GetBlock(blockHash.String(), false)
	if err != nil {
		return 0, err
	}
	block, err := appmessage.RPCBlockToDomainBlock(rpcBlock.Block)
	if err != nil {
		return 0, err
	}
	err = p.processBlockAndDependencies(databaseTransaction, consensushashing.BlockHash(block), block, nil)
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

func hashesFromStrings(strs []string) ([]*externalapi.DomainHash, error) {
	hashes := make([]*externalapi.DomainHash, len(strs))
	for i, str := range strs {
		var err error
		hashes[i], err = externalapi.NewDomainHashFromString(str)
		if err != nil {
			return nil, err
		}
	}
	return hashes, nil
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
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not update the virtual selected parent chain status of some blocks")
	}

	for _, addedBlockHash := range addedBlockHashes {
		rpcBlock, err := p.rpcClient.GetBlock(addedBlockHash.String(), false)
		if err != nil {
			return err
		}

		blueHashes, err := hashesFromStrings(rpcBlock.Block.VerboseData.MergeSetBluesHashes)
		if err != nil {
			return err
		}

		if len(blueHashes) > 0 {
			for _, blueHash := range blueHashes {
				blueBlockID, err := p.database.BlockIDByHash(databaseTransaction, blueHash)
				if err == nil {
					blockColors[blueBlockID] = model.ColorBlue
				} else if withDependencies {
					log.Errorf("Could not get id of merge set blue block %s", blueHash)
				}
			}
		}

		redHashes, err := hashesFromStrings(rpcBlock.Block.VerboseData.MergeSetRedsHashes)
		if err != nil {
			return err
		}

		if len(redHashes) > 0 {
			for _, redHash := range redHashes {
				redBlockID, err := p.database.BlockIDByHash(databaseTransaction, redHash)
				if err == nil {
					blockColors[redBlockID] = model.ColorRed
				} else if withDependencies {
					log.Errorf("Could not get id of merge set red block %s", redHash)
				}
			}
		}
	}
	return p.database.UpdateBlockColors(databaseTransaction, blockColors)
}

// Get a map of DAA Scores associated to database block ids.
// The blocks are retrieved from the DAG by hash.
// Their DAG DAA score is then associated to their id in the database.
// Only matching DAG and database blocks are added to the returned map.
func (p *Processing) getBlocksDAAScores(databaseTransaction *pg.Tx, blockHashes []*externalapi.DomainHash) (map[uint64]uint64, error) {
	results := make(map[uint64]uint64)
	for _, blockHash := range blockHashes {
		block, err := p.rpcClient.GetBlock(blockHash.String(), false)
		if err != nil {
			return nil, err
		}

		blockID, err := p.database.BlockIDByHash(databaseTransaction, blockHash)
		// We ignore non-existing blocks in the database
		if err == nil {
			results[blockID] = block.Block.Header.DAAScore
		}
	}
	return results, nil
}
