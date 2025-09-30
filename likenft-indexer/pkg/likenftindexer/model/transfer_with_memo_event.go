package model

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type TransferWithMemoEvent struct {
	From    common.Address `json:"from"`
	To      common.Address `json:"to"`
	TokenId *big.Int       `json:"token_id"`
	Memo    string         `json:"memo"`
}
