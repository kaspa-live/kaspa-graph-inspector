package mining_manager

import (
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/miningmanager"
	miningmanagermodel "github.com/kaspanet/kaspad/domain/miningmanager/model"
)

func New() miningmanager.MiningManager {
	return &miningManager{}
}

type miningManager struct{}

func (mm *miningManager) ValidateAndInsertTransaction(transaction *externalapi.DomainTransaction, isHighPriority bool, allowOrphan bool) (acceptedTransactions []*externalapi.DomainTransaction, err error) {
	return nil, nil
}

func (mm *miningManager) RevalidateHighPriorityTransactions() (validTransactions []*externalapi.DomainTransaction, err error) {
	return nil, nil
}

func (mm *miningManager) GetOrphanTransaction(transactionID *externalapi.DomainTransactionID) (*externalapi.DomainTransaction, bool) {
	panic("unimplemented")
}

func (mm *miningManager) AllOrphanTransactions() []*externalapi.DomainTransaction {
	panic("unimplemented")
}

func (mm *miningManager) TransactionCount(includeTransactionPool bool, includeOrphanPool bool) int {
	return 0
}

func (mm *miningManager) GetBlockTemplate(coinbaseData *externalapi.DomainCoinbaseData) (*externalapi.DomainBlock, bool, error) {
	panic("unimplemented")
}

func (mm *miningManager) ClearBlockTemplate() {
}

func (mm *miningManager) GetBlockTemplateBuilder() miningmanagermodel.BlockTemplateBuilder {
	panic("unimplemented")
}

func (mm *miningManager) GetTransaction(transactionID *externalapi.DomainTransactionID, includeTransactionPool bool, includeOrphanPool bool) (
	transactionPoolTransaction *externalapi.DomainTransaction,
	isOrphan bool,
	found bool) {
	return nil, false, false
}

func (mm *miningManager) GetTransactionsByAddresses(includeTransactionPool bool, includeOrphanPool bool) (
	sendingInTransactionPool map[string]*externalapi.DomainTransaction,
	receivingInTransactionPool map[string]*externalapi.DomainTransaction,
	sendingInOrphanPool map[string]*externalapi.DomainTransaction,
	receivingInOrphanPool map[string]*externalapi.DomainTransaction,
	err error) {
	return nil, nil, nil, nil, nil
}

func (mm *miningManager) AllTransactions(includeTransactionPool bool, includeOrphanPool bool) (
	transactionPoolTransactions []*externalapi.DomainTransaction,
	orphanPoolTransactions []*externalapi.DomainTransaction) {
	return nil, nil
}

func (mm *miningManager) HandleNewBlockTransactions(txs []*externalapi.DomainTransaction) ([]*externalapi.DomainTransaction, error) {
	return nil, nil
}
