package airdrop

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/likecoin/like-migration-backend/pkg/likenft/evm"
	"github.com/likecoin/like-migration-backend/pkg/likenft/evm/like_protocol"
	"github.com/likecoin/like-migration-backend/pkg/signer"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/parameterresolver/booknft"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/parameterresolver/mintnfts"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/parameterresolver/token"
)

type Airdrop interface {
	AirdropBookNFT(
		ctx context.Context,
		logger *slog.Logger,
		opEvmClassId common.Address,
	) (*AirdropBookNFTResult, error)
	AirdropToken(
		ctx context.Context,
		logger *slog.Logger,
		opEvmClassId common.Address,
		tokenId *big.Int,
	) (*AirdropTokenResult, error)
}

type airdrop struct {
	booknftParameterResolver  booknft.BookNFTParameterResolver
	mintnftsParameterResolver mintnfts.MintNFTsParameterResolver
	tokenParameterResolver    token.TokenParameterResolver
	baseEvmClient             *ethclient.Client
	baseSigner                *signer.SignerClient
	baseLikeProtocol          *evm.LikeProtocol
}

func NewAirdrop(
	booknftParameterResolver booknft.BookNFTParameterResolver,
	mintnftsParameterResolver mintnfts.MintNFTsParameterResolver,
	tokenParameterResolver token.TokenParameterResolver,
	baseEvmClient *ethclient.Client,
	baseSigner *signer.SignerClient,
	baseLikeProtocol *evm.LikeProtocol,
) Airdrop {
	return &airdrop{
		booknftParameterResolver,
		mintnftsParameterResolver,
		tokenParameterResolver,
		baseEvmClient,
		baseSigner,
		baseLikeProtocol,
	}
}

func (a *airdrop) AirdropBookNFT(
	ctx context.Context,
	logger *slog.Logger,
	opEvmClassId common.Address,
) (*AirdropBookNFTResult, error) {
	airdropBookNFTParams, err := a.booknftParameterResolver.Resolve(ctx, opEvmClassId)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve airdrop book nft params: %w", err)
	}

	metadataBytes, err := json.Marshal(airdropBookNFTParams.Metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal airdrop book nft params: %w", err)
	}

	tx, txReceipt, err := a.baseLikeProtocol.NewBookNFTWithRoyalty(
		ctx, logger, like_protocol.MsgNewBookNFT{
			Creator:  airdropBookNFTParams.InitialOwnerAddress,
			Updaters: airdropBookNFTParams.InitialUpdaterAddresses,
			Minters:  airdropBookNFTParams.InitialMinterAddresses,
			Config: like_protocol.BookConfig{
				Name:      airdropBookNFTParams.Name,
				Symbol:    airdropBookNFTParams.Symbol,
				Metadata:  string(metadataBytes),
				MaxSupply: airdropBookNFTParams.MaxSupply,
			},
		}, airdropBookNFTParams.RoyaltyFraction)
	if err != nil {
		return nil, fmt.Errorf("failed to get class id from new class transaction: %w", err)
	}

	baseClassId, err := a.baseLikeProtocol.GetClassIdFromNewClassTransaction(
		txReceipt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get class id from new class transaction: %w", err)
	}

	return &AirdropBookNFTResult{
		TxHash:      tx.Hash().Hex(),
		BaseClassId: baseClassId.Hex(),
	}, nil
}

func (a *airdrop) AirdropToken(
	ctx context.Context,
	logger *slog.Logger,
	opEvmClassId common.Address,
	tokenId *big.Int,
) (*AirdropTokenResult, error) {
	airdropTokenParams, err := a.tokenParameterResolver.Resolve(
		ctx,
		logger,
		opEvmClassId,
		tokenId,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve airdrop token params: %w", err)
	}

	likeProtocol := a.baseLikeProtocol

	bookNFT, err := evm.NewBookNFT(logger, a.baseEvmClient, a.baseSigner)
	if err != nil {
		return nil, fmt.Errorf("failed to create book nft: %w", err)
	}

	totalSupply, err := bookNFT.TotalSupply(airdropTokenParams.BaseEvmClassId)
	if err != nil {
		return nil, fmt.Errorf("failed to get total supply: %w", err)
	}

	var batchMintTx *types.Transaction
	if totalSupply.Cmp(tokenId) == -1 {
		airdropMintNFTsParams, err := a.mintnftsParameterResolver.Resolve(
			ctx,
			logger,
			airdropTokenParams.BaseEvmClassId,
			tokenId,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve airdrop mint nfts params: %w", err)
		}

		batchMintTx, _, err = bookNFT.MintNFTs(
			ctx,
			logger,
			airdropTokenParams.BaseEvmClassId,
			totalSupply,
			airdropMintNFTsParams.Tos,
			airdropMintNFTsParams.Memos,
			airdropMintNFTsParams.MetadataList,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to mint nfts: %w", err)
		}

	}

	transferTx, _, err := likeProtocol.TransferNFT(
		ctx,
		logger,
		airdropTokenParams.BaseEvmClassId,
		airdropTokenParams.FromAddress,
		airdropTokenParams.ToAddress,
		tokenId,
	)

	return &AirdropTokenResult{
		BatchMintTxHash: batchMintTx.Hash().Hex(),
		TransferTxHash:  transferTx.Hash().Hex(),
	}, nil
}
