package booknft

import (
	"context"

	"github.com/ethereum/go-ethereum/common"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/model"
)

type BookNFTParameterResolver interface {
	Resolve(
		ctx context.Context,
		opEvmClassId common.Address,
	) (*model.AirdropBookNFTParams, error)
}
