package token

import (
	"context"
	"fmt"
	"log/slog"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/likecoin/like-migration-backend/pkg/likenft/evm/book_nft"
	"github.com/likecoin/like-migration-backend/pkg/signer"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/addressmapper"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/model"
)

type ethClientTokenParameterResolver struct {
	opEthClient                 *ethclient.Client
	baseSignerClient            *signer.SignerClient
	getBaseAddressFromOpAddress addressmapper.GetBaseAddressFromOpAddress
}

func NewEthClientTokenParameterResolver(
	opEthClient *ethclient.Client,
	baseSignerClient *signer.SignerClient,
	getBaseAddressFromOpAddress addressmapper.GetBaseAddressFromOpAddress,
) TokenParameterResolver {
	return &ethClientTokenParameterResolver{
		opEthClient,
		baseSignerClient,
		getBaseAddressFromOpAddress,
	}
}

func (r *ethClientTokenParameterResolver) Resolve(
	ctx context.Context,
	logger *slog.Logger,
	opEvmClassId common.Address,
	tokenId *big.Int,
) (*model.AirdropNFTTokenParams, error) {
	opBookNFT, err := book_nft.NewBookNft(opEvmClassId, r.opEthClient)
	if err != nil {
		return nil, fmt.Errorf("failed to get book NFT: %w", err)
	}

	baseEvmClassId, err := r.getBaseAddressFromOpAddress(opEvmClassId)
	if err != nil {
		return nil, fmt.Errorf("failed to get base signer address: %w", err)
	}

	baseSignerAddressStr, err := r.baseSignerClient.GetSignerAddress()
	if err != nil {
		return nil, fmt.Errorf("failed to get base signer address: %w", err)
	}
	baseSignerAddress := common.HexToAddress(*baseSignerAddressStr)

	owner, err := opBookNFT.OwnerOf(&bind.CallOpts{
		Context: ctx,
	}, tokenId)
	if err != nil {
		return nil, fmt.Errorf("failed to get owner of token: %w", err)
	}

	return &model.AirdropNFTTokenParams{
		BaseEvmClassId: baseEvmClassId,
		FromAddress:    baseSignerAddress,
		ToAddress:      owner,
		TokenId:        tokenId,
	}, nil
}
