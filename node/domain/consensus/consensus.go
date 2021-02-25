package consensus

import (
	kaspadConsensus "github.com/kaspanet/kaspad/domain/consensus"
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/dagconfig"
	"github.com/kaspanet/kaspad/infrastructure/db/database"
)

func New(dagParams *dagconfig.Params, databaseContext database.Database) (externalapi.Consensus, error) {
	kaspadConsensusFactory := kaspadConsensus.NewFactory()
	kaspadConsensusInstance, err := kaspadConsensusFactory.NewConsensus(dagParams, databaseContext, false)
	if err != nil {
		return nil, err
	}

	return &consensus{kaspadConsensus: kaspadConsensusInstance}, nil
}

type consensus struct {
	kaspadConsensus externalapi.Consensus
}

func (c *consensus) BuildBlock(coinbaseData *externalapi.DomainCoinbaseData, transactions []*externalapi.DomainTransaction) (*externalapi.DomainBlock, error) {
	return c.kaspadConsensus.BuildBlock(coinbaseData, transactions)
}

func (c *consensus) ValidateAndInsertBlock(block *externalapi.DomainBlock) (*externalapi.BlockInsertionResult, error) {
	return c.kaspadConsensus.ValidateAndInsertBlock(block)
}

func (c *consensus) ValidateTransactionAndPopulateWithConsensusData(transaction *externalapi.DomainTransaction) error {
	return c.kaspadConsensus.ValidateTransactionAndPopulateWithConsensusData(transaction)
}

func (c *consensus) GetBlock(blockHash *externalapi.DomainHash) (*externalapi.DomainBlock, error) {
	return c.kaspadConsensus.GetBlock(blockHash)
}

func (c *consensus) GetBlockHeader(blockHash *externalapi.DomainHash) (externalapi.BlockHeader, error) {
	return c.kaspadConsensus.GetBlockHeader(blockHash)
}

func (c *consensus) GetBlockInfo(blockHash *externalapi.DomainHash) (*externalapi.BlockInfo, error) {
	return c.kaspadConsensus.GetBlockInfo(blockHash)
}

func (c *consensus) GetBlockAcceptanceData(blockHash *externalapi.DomainHash) (externalapi.AcceptanceData, error) {
	return c.kaspadConsensus.GetBlockAcceptanceData(blockHash)
}

func (c *consensus) GetHashesBetween(lowHash, highHash *externalapi.DomainHash, maxBlueScoreDifference uint64) ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.GetHashesBetween(lowHash, highHash, maxBlueScoreDifference)
}

func (c *consensus) GetMissingBlockBodyHashes(highHash *externalapi.DomainHash) ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.GetMissingBlockBodyHashes(highHash)
}

func (c *consensus) GetPruningPointUTXOs(expectedPruningPointHash *externalapi.DomainHash, fromOutpoint *externalapi.DomainOutpoint, limit int) ([]*externalapi.OutpointAndUTXOEntryPair, error) {
	return c.kaspadConsensus.GetPruningPointUTXOs(expectedPruningPointHash, fromOutpoint, limit)
}

func (c *consensus) GetVirtualUTXOs(expectedVirtualParents []*externalapi.DomainHash, fromOutpoint *externalapi.DomainOutpoint, limit int) ([]*externalapi.OutpointAndUTXOEntryPair, error) {
	return c.kaspadConsensus.GetVirtualUTXOs(expectedVirtualParents, fromOutpoint, limit)
}

func (c *consensus) PruningPoint() (*externalapi.DomainHash, error) {
	return c.kaspadConsensus.PruningPoint()
}

func (c *consensus) ClearImportedPruningPointData() error {
	return c.kaspadConsensus.ClearImportedPruningPointData()
}

func (c *consensus) AppendImportedPruningPointUTXOs(outpointAndUTXOEntryPairs []*externalapi.OutpointAndUTXOEntryPair) error {
	return c.kaspadConsensus.AppendImportedPruningPointUTXOs(outpointAndUTXOEntryPairs)
}

func (c *consensus) ValidateAndInsertImportedPruningPoint(newPruningPoint *externalapi.DomainBlock) error {
	return c.kaspadConsensus.ValidateAndInsertImportedPruningPoint(newPruningPoint)
}

func (c *consensus) GetVirtualSelectedParent() (*externalapi.DomainHash, error) {
	return c.kaspadConsensus.GetVirtualSelectedParent()
}

func (c *consensus) CreateBlockLocator(lowHash, highHash *externalapi.DomainHash, limit uint32) (externalapi.BlockLocator, error) {
	return c.kaspadConsensus.CreateBlockLocator(lowHash, highHash, limit)
}

func (c *consensus) CreateHeadersSelectedChainBlockLocator(lowHash, highHash *externalapi.DomainHash) (externalapi.BlockLocator, error) {
	return c.kaspadConsensus.CreateHeadersSelectedChainBlockLocator(lowHash, highHash)
}

func (c *consensus) CreateFullHeadersSelectedChainBlockLocator() (externalapi.BlockLocator, error) {
	return c.kaspadConsensus.CreateFullHeadersSelectedChainBlockLocator()
}

func (c *consensus) GetSyncInfo() (*externalapi.SyncInfo, error) {
	return c.kaspadConsensus.GetSyncInfo()
}

func (c *consensus) Tips() ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.Tips()
}

func (c *consensus) GetVirtualInfo() (*externalapi.VirtualInfo, error) {
	return c.kaspadConsensus.GetVirtualInfo()
}

func (c *consensus) IsValidPruningPoint(blockHash *externalapi.DomainHash) (bool, error) {
	return c.kaspadConsensus.IsValidPruningPoint(blockHash)
}

func (c *consensus) GetVirtualSelectedParentChainFromBlock(blockHash *externalapi.DomainHash) (*externalapi.SelectedChainPath, error) {
	return c.kaspadConsensus.GetVirtualSelectedParentChainFromBlock(blockHash)
}

func (c *consensus) IsInSelectedParentChainOf(blockHashA *externalapi.DomainHash, blockHashB *externalapi.DomainHash) (bool, error) {
	return c.kaspadConsensus.IsInSelectedParentChainOf(blockHashA, blockHashB)
}

func (c *consensus) GetHeadersSelectedTip() (*externalapi.DomainHash, error) {
	return c.kaspadConsensus.GetHeadersSelectedTip()
}

func (c *consensus) Anticone(blockHash *externalapi.DomainHash) ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.Anticone(blockHash)
}
