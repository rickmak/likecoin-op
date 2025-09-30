package booknft

import (
	"context"
	"fmt"
	"strconv"

	"likenft-indexer/pkg/likenftindexer"

	"github.com/ethereum/go-ethereum/common"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/model"
)

type indexerBookNFTParameterResolver struct {
	opIndexerClient likenftindexer.LikeNFTIndexerClient
}

func NewIndexerBookNFTParameterResolver(
	opIndexerClient likenftindexer.LikeNFTIndexerClient,
) BookNFTParameterResolver {
	return &indexerBookNFTParameterResolver{
		opIndexerClient,
	}
}

func (r *indexerBookNFTParameterResolver) Resolve(
	ctx context.Context,
	opEvmClassId common.Address,
) (*model.AirdropBookNFTParams, error) {
	response, err := r.opIndexerClient.BookNFT(ctx, opEvmClassId.Hex())
	if err != nil {
		return nil, fmt.Errorf("failed to get book NFT: %w", err)
	}

	initialOwnerAddress := common.HexToAddress(response.OwnerAddress)
	initialUpdaterAddresses := make([]common.Address, 0)
	initialMinterAddresses := make([]common.Address, 0)
	name := response.Name
	symbol := response.Symbol
	metadata := response.Metadata
	maxSupplyStr := response.MaxSupply
	maxSupply, err := strconv.ParseUint(maxSupplyStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse max supply: %w", err)
	}
	return &model.AirdropBookNFTParams{
		InitialOwnerAddress:     initialOwnerAddress,
		InitialUpdaterAddresses: initialUpdaterAddresses,
		InitialMinterAddresses:  initialMinterAddresses,
		Name:                    name,
		Symbol:                  symbol,
		Metadata:                metadata,
		MaxSupply:               maxSupply,
		RoyaltyFraction:         nil,
	}, nil
}
