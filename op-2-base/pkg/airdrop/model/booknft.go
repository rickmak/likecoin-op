package model

import (
	"math/big"

	evmmodel "likenft-indexer/pkg/likenft/evm/model"

	"github.com/ethereum/go-ethereum/common"
)

type AirdropBookNFTParams struct {
	InitialOwnerAddress     common.Address
	InitialUpdaterAddresses []common.Address
	InitialMinterAddresses  []common.Address
	Name                    string
	Symbol                  string
	Metadata                *evmmodel.ContractLevelMetadata
	MaxSupply               uint64
	RoyaltyFraction         *big.Int
}
