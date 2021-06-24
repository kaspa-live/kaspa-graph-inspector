package consensus

import "github.com/kaspanet/kaspad/domain/consensus/model/externalapi"

func (c *Consensus) BuildBlock(coinbaseData *externalapi.DomainCoinbaseData, transactions []*externalapi.DomainTransaction) (*externalapi.DomainBlock, error) {
	return c.kaspadConsensus.BuildBlock(coinbaseData, transactions)
}

func (c *Consensus) ValidateTransactionAndPopulateWithConsensusData(transaction *externalapi.DomainTransaction) error {
	return c.kaspadConsensus.ValidateTransactionAndPopulateWithConsensusData(transaction)
}

func (c *Consensus) GetBlock(blockHash *externalapi.DomainHash) (*externalapi.DomainBlock, error) {
	return c.kaspadConsensus.GetBlock(blockHash)
}

func (c *Consensus) GetBlockHeader(blockHash *externalapi.DomainHash) (externalapi.BlockHeader, error) {
	return c.kaspadConsensus.GetBlockHeader(blockHash)
}

func (c *Consensus) GetBlockInfo(blockHash *externalapi.DomainHash) (*externalapi.BlockInfo, error) {
	return c.kaspadConsensus.GetBlockInfo(blockHash)
}

func (c *Consensus) GetBlockAcceptanceData(blockHash *externalapi.DomainHash) (externalapi.AcceptanceData, error) {
	return c.kaspadConsensus.GetBlockAcceptanceData(blockHash)
}

func (c *Consensus) GetHashesBetween(lowHash, highHash *externalapi.DomainHash, maxBlueScoreDifference uint64) (
	[]*externalapi.DomainHash, *externalapi.DomainHash, error) {

	return c.kaspadConsensus.GetHashesBetween(lowHash, highHash, maxBlueScoreDifference)
}

func (c *Consensus) GetMissingBlockBodyHashes(highHash *externalapi.DomainHash) ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.GetMissingBlockBodyHashes(highHash)
}

func (c *Consensus) GetPruningPointUTXOs(expectedPruningPointHash *externalapi.DomainHash, fromOutpoint *externalapi.DomainOutpoint, limit int) ([]*externalapi.OutpointAndUTXOEntryPair, error) {
	return c.kaspadConsensus.GetPruningPointUTXOs(expectedPruningPointHash, fromOutpoint, limit)
}

func (c *Consensus) GetVirtualUTXOs(expectedVirtualParents []*externalapi.DomainHash, fromOutpoint *externalapi.DomainOutpoint, limit int) ([]*externalapi.OutpointAndUTXOEntryPair, error) {
	return c.kaspadConsensus.GetVirtualUTXOs(expectedVirtualParents, fromOutpoint, limit)
}

func (c *Consensus) PruningPoint() (*externalapi.DomainHash, error) {
	return c.kaspadConsensus.PruningPoint()
}

func (c *Consensus) ClearImportedPruningPointData() error {
	return c.kaspadConsensus.ClearImportedPruningPointData()
}

func (c *Consensus) AppendImportedPruningPointUTXOs(outpointAndUTXOEntryPairs []*externalapi.OutpointAndUTXOEntryPair) error {
	return c.kaspadConsensus.AppendImportedPruningPointUTXOs(outpointAndUTXOEntryPairs)
}

func (c *Consensus) ValidateAndInsertImportedPruningPoint(newPruningPoint *externalapi.DomainBlock) error {
	return c.kaspadConsensus.ValidateAndInsertImportedPruningPoint(newPruningPoint)
}

func (c *Consensus) GetVirtualSelectedParent() (*externalapi.DomainHash, error) {
	return c.kaspadConsensus.GetVirtualSelectedParent()
}

func (c *Consensus) CreateBlockLocator(lowHash, highHash *externalapi.DomainHash, limit uint32) (externalapi.BlockLocator, error) {
	return c.kaspadConsensus.CreateBlockLocator(lowHash, highHash, limit)
}

func (c *Consensus) CreateHeadersSelectedChainBlockLocator(lowHash, highHash *externalapi.DomainHash) (externalapi.BlockLocator, error) {
	return c.kaspadConsensus.CreateHeadersSelectedChainBlockLocator(lowHash, highHash)
}

func (c *Consensus) CreateFullHeadersSelectedChainBlockLocator() (externalapi.BlockLocator, error) {
	return c.kaspadConsensus.CreateFullHeadersSelectedChainBlockLocator()
}

func (c *Consensus) GetSyncInfo() (*externalapi.SyncInfo, error) {
	return c.kaspadConsensus.GetSyncInfo()
}

func (c *Consensus) Tips() ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.Tips()
}

func (c *Consensus) GetVirtualInfo() (*externalapi.VirtualInfo, error) {
	return c.kaspadConsensus.GetVirtualInfo()
}

func (c *Consensus) IsValidPruningPoint(blockHash *externalapi.DomainHash) (bool, error) {
	return c.kaspadConsensus.IsValidPruningPoint(blockHash)
}

func (c *Consensus) GetVirtualSelectedParentChainFromBlock(blockHash *externalapi.DomainHash) (*externalapi.SelectedChainPath, error) {
	return c.kaspadConsensus.GetVirtualSelectedParentChainFromBlock(blockHash)
}

func (c *Consensus) IsInSelectedParentChainOf(blockHashA *externalapi.DomainHash, blockHashB *externalapi.DomainHash) (bool, error) {
	return c.kaspadConsensus.IsInSelectedParentChainOf(blockHashA, blockHashB)
}

func (c *Consensus) GetHeadersSelectedTip() (*externalapi.DomainHash, error) {
	return c.kaspadConsensus.GetHeadersSelectedTip()
}

func (c *Consensus) Anticone(blockHash *externalapi.DomainHash) ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.Anticone(blockHash)
}

func (c *Consensus) GetBlockRelations(blockHash *externalapi.DomainHash) (
	parents []*externalapi.DomainHash, selectedParent *externalapi.DomainHash, children []*externalapi.DomainHash, err error) {

	return c.kaspadConsensus.GetBlockRelations(blockHash)
}

func (c *Consensus) GetBlockEvenIfHeaderOnly(blockHash *externalapi.DomainHash) (*externalapi.DomainBlock, error) {
	return c.kaspadConsensus.GetBlockEvenIfHeaderOnly(blockHash)
}

func (c *Consensus) EstimateNetworkHashesPerSecond(startHash *externalapi.DomainHash,windowSize int) (uint64, error) {
	return c.kaspadConsensus.EstimateNetworkHashesPerSecond(startHash, windowSize)
}

func (c *Consensus) GetVirtualDAAScore() (uint64, error) {
	return c.kaspadConsensus.GetVirtualDAAScore()
}

