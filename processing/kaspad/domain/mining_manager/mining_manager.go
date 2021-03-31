package mining_manager

import (
	"github.com/kaspanet/kaspad/domain/consensus/model/externalapi"
	"github.com/kaspanet/kaspad/domain/miningmanager"
)

func New() miningmanager.MiningManager {
	return &miningManager{}
}

type miningManager struct{}

func (mm *miningManager) TransactionCount() int {
	panic("implement me")
}

func (mm *miningManager) GetBlockTemplate(coinbaseData *externalapi.DomainCoinbaseData) (*externalapi.DomainBlock, error) {
	panic("unimplemented")
}

func (mm *miningManager) GetTransaction(transactionID *externalapi.DomainTransactionID) (*externalapi.DomainTransaction, bool) {
	return nil, false
}

func (mm *miningManager) AllTransactions() []*externalapi.DomainTransaction {
	panic("unimplemented")
}

func (mm *miningManager) HandleNewBlockTransactions(txs []*externalapi.DomainTransaction) ([]*externalapi.DomainTransaction, error) {
	return nil, nil
}

func (mm *miningManager) ValidateAndInsertTransaction(transaction *externalapi.DomainTransaction, allowOrphan bool) error {
	return nil
}
