package consensus

import "github.com/kaspanet/kaspad/domain/consensus/model/externalapi"

func (c *Consensus) BuildBlock(coinbaseData *externalapi.DomainCoinbaseData, transactions []*externalapi.DomainTransaction) (*externalapi.DomainBlock, error) {
	return c.kaspadConsensus.BuildBlock(coinbaseData, transactions)
}

func (c *Consensus) BuildBlockTemplate(coinbaseData *externalapi.DomainCoinbaseData, transactions []*externalapi.DomainTransaction) (*externalapi.DomainBlockTemplate, error) {
	return c.kaspadConsensus.BuildBlockTemplate(coinbaseData, transactions)
}

func (c *Consensus) ValidateTransactionAndPopulateWithConsensusData(transaction *externalapi.DomainTransaction) error {
	return c.kaspadConsensus.ValidateTransactionAndPopulateWithConsensusData(transaction)
}

func (c *Consensus) GetBlock(blockHash *externalapi.DomainHash) (*externalapi.DomainBlock, bool, error) {
	return c.kaspadConsensus.GetBlock(blockHash)
}

func (c *Consensus) GetBlockHeader(blockHash *externalapi.DomainHash) (externalapi.BlockHeader, error) {
	return c.kaspadConsensus.GetBlockHeader(blockHash)
}

func (c *Consensus) GetBlockInfo(blockHash *externalapi.DomainHash) (*externalapi.BlockInfo, error) {
	return c.kaspadConsensus.GetBlockInfo(blockHash)
}

func (c *Consensus) GetHashesBetween(lowHash, highHash *externalapi.DomainHash, maxBlueScoreDifference uint64) (
	[]*externalapi.DomainHash, *externalapi.DomainHash, error) {

	return c.kaspadConsensus.GetHashesBetween(lowHash, highHash, maxBlueScoreDifference)
}

func (c *Consensus) GetAnticone(blockHash, contextHash *externalapi.DomainHash, maxBlocks uint64) (hashes []*externalapi.DomainHash, err error) {
	return c.kaspadConsensus.GetAnticone(blockHash, contextHash, maxBlocks)
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

func (c *Consensus) GetVirtualSelectedParent() (*externalapi.DomainHash, error) {
	return c.kaspadConsensus.GetVirtualSelectedParent()
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
	parents []*externalapi.DomainHash, children []*externalapi.DomainHash, err error) {

	return c.kaspadConsensus.GetBlockRelations(blockHash)
}

func (s *Consensus) GetBlockAcceptanceData(blockHash *externalapi.DomainHash) (externalapi.AcceptanceData, error) {
	return s.kaspadConsensus.GetBlockAcceptanceData(blockHash)
}

func (s *Consensus) GetBlocksAcceptanceData(blockHashes []*externalapi.DomainHash) ([]externalapi.AcceptanceData, error) {
	return s.kaspadConsensus.GetBlocksAcceptanceData(blockHashes)
}

func (c *Consensus) GetBlockEvenIfHeaderOnly(blockHash *externalapi.DomainHash) (*externalapi.DomainBlock, error) {
	return c.kaspadConsensus.GetBlockEvenIfHeaderOnly(blockHash)
}

func (c *Consensus) EstimateNetworkHashesPerSecond(startHash *externalapi.DomainHash, windowSize int) (uint64, error) {
	return c.kaspadConsensus.EstimateNetworkHashesPerSecond(startHash, windowSize)
}

func (c *Consensus) GetVirtualDAAScore() (uint64, error) {
	return c.kaspadConsensus.GetVirtualDAAScore()
}

func (c *Consensus) Init(shouldNotAddGenesis bool) error {
	return c.kaspadConsensus.Init(shouldNotAddGenesis)
}

func (c *Consensus) PruningPointAndItsAnticone() ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.PruningPointAndItsAnticone()
}

func (c *Consensus) ValidateAndInsertImportedPruningPoint(newPruningPoint *externalapi.DomainHash) error {
	return c.kaspadConsensus.ValidateAndInsertImportedPruningPoint(newPruningPoint)
}

func (c *Consensus) CreateBlockLocatorFromPruningPoint(highHash *externalapi.DomainHash, limit uint32) (externalapi.BlockLocator, error) {
	return c.kaspadConsensus.CreateBlockLocatorFromPruningPoint(highHash, limit)
}

func (c *Consensus) PopulateMass(transaction *externalapi.DomainTransaction) {
	c.kaspadConsensus.PopulateMass(transaction)
}

func (c *Consensus) ValidateAndInsertBlockWithTrustedData(block *externalapi.BlockWithTrustedData, validateUTXO bool) error {
	return c.kaspadConsensus.ValidateAndInsertBlockWithTrustedData(block, validateUTXO)
}

func (c *Consensus) GetMissingBlockBodyHashes(highHash *externalapi.DomainHash) ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.GetMissingBlockBodyHashes(highHash)
}

func (c *Consensus) ImportPruningPoints(pruningPoints []externalapi.BlockHeader) error {
	return c.kaspadConsensus.ImportPruningPoints(pruningPoints)
}

func (c *Consensus) BuildPruningPointProof() (*externalapi.PruningPointProof, error) {
	return c.kaspadConsensus.BuildPruningPointProof()
}

func (c *Consensus) ValidatePruningPointProof(pruningPointProof *externalapi.PruningPointProof) error {
	return c.kaspadConsensus.ValidatePruningPointProof(pruningPointProof)
}

func (c *Consensus) ApplyPruningPointProof(pruningPointProof *externalapi.PruningPointProof) error {
	return c.kaspadConsensus.ApplyPruningPointProof(pruningPointProof)
}

func (c *Consensus) PruningPointHeaders() ([]externalapi.BlockHeader, error) {
	return c.kaspadConsensus.PruningPointHeaders()
}

func (c *Consensus) ArePruningPointsViolatingFinality(pruningPoints []externalapi.BlockHeader) (bool, error) {
	return c.kaspadConsensus.ArePruningPointsViolatingFinality(pruningPoints)
}

func (c *Consensus) BlockDAAWindowHashes(blockHash *externalapi.DomainHash) ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.BlockDAAWindowHashes(blockHash)
}

func (c *Consensus) TrustedDataDataDAAHeader(trustedBlockHash, daaBlockHash *externalapi.DomainHash, daaBlockWindowIndex uint64) (*externalapi.TrustedDataDataDAAHeader, error) {
	return c.kaspadConsensus.TrustedDataDataDAAHeader(trustedBlockHash, daaBlockHash, daaBlockWindowIndex)
}

func (c *Consensus) TrustedBlockAssociatedGHOSTDAGDataBlockHashes(blockHash *externalapi.DomainHash) ([]*externalapi.DomainHash, error) {
	return c.kaspadConsensus.TrustedBlockAssociatedGHOSTDAGDataBlockHashes(blockHash)
}

func (c *Consensus) TrustedGHOSTDAGData(blockHash *externalapi.DomainHash) (*externalapi.BlockGHOSTDAGData, error) {
	return c.kaspadConsensus.TrustedGHOSTDAGData(blockHash)
}

func (c *Consensus) IsChainBlock(blockHash *externalapi.DomainHash) (bool, error) {
	return c.kaspadConsensus.IsChainBlock(blockHash)
}

func (c *Consensus) VirtualMergeDepthRoot() (*externalapi.DomainHash, error) {
	return c.kaspadConsensus.VirtualMergeDepthRoot()
}

func (c *Consensus) IsNearlySynced() (bool, error) {
	return c.kaspadConsensus.IsNearlySynced()
}
