package domain

import (
	"sync"
	"sync/atomic"
	"unsafe"

	consensusPackage "github.com/kaspa-live/kaspa-graph-inspector/processing/kaspad/domain/consensus"
	"github.com/kaspa-live/kaspa-graph-inspector/processing/kaspad/domain/mining_manager"
	"github.com/kaspanet/kaspad/domain/consensus"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/dagconfig"
	"github.com/kaspanet/kaspad/domain/miningmanager"
	"github.com/kaspanet/kaspad/domain/prefixmanager"
	"github.com/kaspanet/kaspad/domain/prefixmanager/prefix"
	"github.com/kaspanet/kaspad/infrastructure/db/database"
	"github.com/pkg/errors"
)

func New(dagParams *dagconfig.Params, databaseContext database.Database) (*Domain, error) {
	err := prefixmanager.DeleteInactivePrefix(databaseContext)
	if err != nil {
		return nil, err
	}

	activePrefix, exists, err := prefixmanager.ActivePrefix(databaseContext)
	if err != nil {
		return nil, err
	}

	if !exists {
		activePrefix = &prefix.Prefix{}
		err = prefixmanager.SetPrefixAsActive(databaseContext, activePrefix)
		if err != nil {
			return nil, err
		}
	}

	consensusConfig := &consensus.Config{
		Params:                          *dagParams,
		IsArchival:                      false,
		EnableSanityCheckPruningUTXOSet: false,
	}

	consensusEventsChan := make(chan externalapi.ConsensusEvent, 100e3)

	// warning, the 2nd returned parameter (shouldMigrate) from consensusPackage.New is ignored for now
	// I don't know how to handle it
	consensusInstance, _, err := consensusPackage.New(consensusConfig, databaseContext, activePrefix, consensusEventsChan)
	if err != nil {
		return nil, err
	}

	miningManager := mining_manager.New()
	domainInstance := &Domain{
		consensus:     consensusInstance,
		miningManager: miningManager,

		databaseContext:     databaseContext,
		consensusConfig:     consensusConfig,
		consensusEventsChan: consensusEventsChan,
	}
	return domainInstance, nil
}

type Domain struct {
	consensus     *consensusPackage.Consensus
	miningManager miningmanager.MiningManager

	databaseContext      database.Database
	consensusConfig      *consensus.Config
	stagingConsensus     *consensusPackage.Consensus
	stagingConsensusLock sync.RWMutex

	onBlockAddedListener     consensusPackage.OnBlockAddedListener
	onConsensusResetListener OnConsensusResetListener
	consensusEventsChan      chan externalapi.ConsensusEvent
}

// Implementing the interface
// See kaspad\domain\domain.go

func (d *Domain) StagingConsensus() externalapi.Consensus {
	d.stagingConsensusLock.RLock()
	defer d.stagingConsensusLock.RUnlock()
	return d.stagingConsensus
}

func (d *Domain) InitStagingConsensusWithoutGenesis() error {
	cfg := *d.consensusConfig
	cfg.SkipAddingGenesis = true
	return d.initStagingConsensus(&cfg)
}

func (d *Domain) initStagingConsensus(stagingConsensusConfig *consensus.Config) error {
	d.stagingConsensusLock.Lock()
	defer d.stagingConsensusLock.Unlock()

	_, hasInactivePrefix, err := prefixmanager.InactivePrefix(d.databaseContext)
	if err != nil {
		return err
	}

	if hasInactivePrefix {
		return errors.Errorf("cannot create staging consensus when a staging consensus already exists")
	}

	activePrefix, exists, err := prefixmanager.ActivePrefix(d.databaseContext)
	if err != nil {
		return err
	}

	if !exists {
		return errors.Errorf("cannot create a staging consensus when there's " +
			"no active consensus")
	}

	inactivePrefix := activePrefix.Flip()
	err = prefixmanager.SetPrefixAsInactive(d.databaseContext, inactivePrefix)
	if err != nil {
		return err
	}

	// Warning, the 2nd returned parameter (shouldMigrate) from consensusPackage.New is ignored for now
	// I don't know how to handle it
	consensusInstance, _, err := consensusPackage.New(stagingConsensusConfig, d.databaseContext, inactivePrefix, d.consensusEventsChan)
	if err != nil {
		return err
	}

	d.stagingConsensus = consensusInstance
	return nil
}

func (d *Domain) CommitStagingConsensus() error {
	d.stagingConsensusLock.Lock()
	defer d.stagingConsensusLock.Unlock()

	dbTx, err := d.databaseContext.Begin()
	if err != nil {
		return err
	}
	defer dbTx.RollbackUnlessClosed()

	inactivePrefix, hasInactivePrefix, err := prefixmanager.InactivePrefix(d.databaseContext)
	if err != nil {
		return err
	}

	if !hasInactivePrefix {
		return errors.Errorf("there's no inactive prefix to commit")
	}

	activePrefix, exists, err := prefixmanager.ActivePrefix(dbTx)
	if err != nil {
		return err
	}

	if !exists {
		return errors.Errorf("cannot commit a staging consensus when there's " +
			"no active consensus")
	}

	err = prefixmanager.SetPrefixAsActive(dbTx, inactivePrefix)
	if err != nil {
		return err
	}

	err = prefixmanager.SetPrefixAsInactive(dbTx, activePrefix)
	if err != nil {
		return err
	}

	err = dbTx.Commit()
	if err != nil {
		return err
	}

	// We delete anything associated with the old prefix outside
	// of the transaction in order to save memory.
	err = prefixmanager.DeleteInactivePrefix(d.databaseContext)
	if err != nil {
		return err
	}

	tempConsensusPointer := unsafe.Pointer(d.stagingConsensus)
	consensusPointer := (*unsafe.Pointer)(unsafe.Pointer(&d.consensus))
	atomic.StorePointer(consensusPointer, tempConsensusPointer)
	d.stagingConsensus = nil

	d.onConsensusResetListener()

	return nil
}

func (d *Domain) DeleteStagingConsensus() error {
	d.stagingConsensusLock.Lock()
	defer d.stagingConsensusLock.Unlock()

	err := prefixmanager.DeleteInactivePrefix(d.databaseContext)
	if err != nil {
		return err
	}

	d.stagingConsensus = nil
	return nil
}

func (d *Domain) SetOnBlockAddedListener(listener consensusPackage.OnBlockAddedListener) {
	d.onBlockAddedListener = listener
	d.consensus.SetOnBlockAddedListener(listener)
}

func (d *Domain) SetOnVirtualResolvedListener(listener consensusPackage.OnVirtualResolvedListener) {
	d.consensus.SetOnVirtualResolvedListener(listener)
}

func (d *Domain) BlockGHOSTDAGData(blockHash *externalapi.DomainHash) (*externalapi.BlockGHOSTDAGData, error) {
	return d.consensus.BlockGHOSTDAGData(blockHash)
}

func (d *Domain) MiningManager() miningmanager.MiningManager {
	return d.miningManager
}

func (d *Domain) Consensus() externalapi.Consensus {
	return d.consensus
}

type OnConsensusResetListener func()

func (d *Domain) SetOnConsensusResetListener(listener OnConsensusResetListener) {
	d.onConsensusResetListener = listener
}

func (d *Domain) ConsensusEventsChannel() chan externalapi.ConsensusEvent {
	return d.consensusEventsChan
}
