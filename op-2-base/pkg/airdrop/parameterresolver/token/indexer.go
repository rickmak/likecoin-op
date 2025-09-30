package token

import (
	"context"
	"log/slog"
	"math/big"

	"likenft-indexer/pkg/likenftindexer"

	"github.com/ethereum/go-ethereum/common"
	"github.com/likecoin/like-migration-backend/pkg/signer"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/addressmapper"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/model"
)

type indexerTokenParameterResolver struct {
	opIndexerClient             likenftindexer.LikeNFTIndexerClient
	baseSignerClient            *signer.SignerClient
	getBaseAddressFromOpAddress addressmapper.GetBaseAddressFromOpAddress
}

func NewIndexerTokenParameterResolver(
	opIndexerClient likenftindexer.LikeNFTIndexerClient,
	baseSignerClient *signer.SignerClient,
	getBaseAddressFromOpAddress addressmapper.GetBaseAddressFromOpAddress,
) TokenParameterResolver {
	return &indexerTokenParameterResolver{
		opIndexerClient,
		baseSignerClient,
		getBaseAddressFromOpAddress,
	}
}

func (r *indexerTokenParameterResolver) Resolve(
	ctx context.Context,
	logger *slog.Logger,
	opEvmClassId common.Address,
	tokenId *big.Int,
) (*model.AirdropNFTTokenParams, error) {

	baseEvmClassId, err := r.getBaseAddressFromOpAddress(opEvmClassId)
	if err != nil {
		return nil, err
	}

	baseSignerAddressStr, err := r.baseSignerClient.GetSignerAddress()
	if err != nil {
		return nil, err
	}
	baseSignerAddress := common.HexToAddress(*baseSignerAddressStr)

	token, err := r.opIndexerClient.Token(
		ctx,
		opEvmClassId.String(),
		tokenId.String(),
	)
	if err != nil {
		return nil, err
	}
	opOwnerAddress := common.HexToAddress(token.OwnerAddress)

	return &model.AirdropNFTTokenParams{
		BaseEvmClassId: baseEvmClassId,
		FromAddress:    baseSignerAddress,
		ToAddress:      opOwnerAddress,
		TokenId:        tokenId,
	}, nil
}
