package model

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type MintNFTsParameter struct {
	ClassId      common.Address
	FromTokenId  *big.Int
	Tos          []common.Address
	Memos        []string
	MetadataList []string
}
