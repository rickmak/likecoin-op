package model

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type AirdropNFTTokenParams struct {
	BaseEvmClassId common.Address
	FromAddress    common.Address
	ToAddress      common.Address
	TokenId        *big.Int
}
