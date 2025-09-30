package mintnfts

import (
	"context"
	"log/slog"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/model"
)

type MintNFTsParameterResolver interface {
	Resolve(
		ctx context.Context,
		logger *slog.Logger,
		opEvmClassId common.Address,
		toTokenId *big.Int,
	) (*model.MintNFTsParameter, error)
}
