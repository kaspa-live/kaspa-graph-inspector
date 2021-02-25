package domain

import "github.com/kaspanet/kaspad/domain/consensus/model/externalapi"

func (d *domain) GetBlockTemplate(coinbaseData *externalapi.DomainCoinbaseData) (*externalapi.DomainBlock, error) {
	panic("unimplemented")
}

func (d *domain) GetTransaction(transactionID *externalapi.DomainTransactionID) (*externalapi.DomainTransaction, bool) {
	panic("unimplemented")
}

func (d *domain) AllTransactions() []*externalapi.DomainTransaction {
	panic("unimplemented")
}

func (d *domain) HandleNewBlockTransactions(txs []*externalapi.DomainTransaction) ([]*externalapi.DomainTransaction, error) {
	return nil, nil
}

func (d *domain) ValidateAndInsertTransaction(transaction *externalapi.DomainTransaction, allowOrphan bool) error {
	return nil
}
