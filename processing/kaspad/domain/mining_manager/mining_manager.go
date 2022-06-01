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

func (mm *miningManager) TransactionCount() int {
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

func (mm *miningManager) GetTransaction(transactionID *externalapi.DomainTransactionID) (*externalapi.DomainTransaction, bool) {
	return nil, false
}

func (mm *miningManager) AllTransactions() []*externalapi.DomainTransaction {
	return nil
}

func (mm *miningManager) HandleNewBlockTransactions(txs []*externalapi.DomainTransaction) ([]*externalapi.DomainTransaction, error) {
	return nil, nil
}
