package mintnfts

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/big"
	"net/http"
	"strings"

	"likenft-indexer/pkg/likenftindexer"

	"github.com/ethereum/go-ethereum/common"
	evmmodel "github.com/likecoin/like-migration-backend/pkg/likenft/evm/model"
	"github.com/likecoin/like-migration-backend/pkg/signer"
	"github.com/likecoin/like-migration-backend/pkg/util/jsondatauri"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/addressmapper"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/model"
)

type indexerMintNFTsParameterResolver struct {
	opIndexerClient             likenftindexer.LikeNFTIndexerClient
	baseSignerClient            *signer.SignerClient
	httpClient                  *http.Client
	getBaseAddressFromOpAddress addressmapper.GetBaseAddressFromOpAddress
}

func NewIndexerMintNFTsParameterResolver(
	opIndexerClient likenftindexer.LikeNFTIndexerClient,
	baseSignerClient *signer.SignerClient,
	httpClient *http.Client,
	getBaseAddressFromOpAddress addressmapper.GetBaseAddressFromOpAddress,
) MintNFTsParameterResolver {
	return &indexerMintNFTsParameterResolver{
		opIndexerClient,
		baseSignerClient,
		httpClient,
		getBaseAddressFromOpAddress,
	}
}

func (r *indexerMintNFTsParameterResolver) Resolve(
	ctx context.Context,
	logger *slog.Logger,
	opEvmClassId common.Address,
	toTokenId *big.Int,
) (*model.MintNFTsParameter, error) {
	signerAddress, err := r.baseSignerClient.GetSignerAddress()
	if err != nil {
		return nil, fmt.Errorf("failed to get signer address: %w", err)
	}

	baseEvmClassId, err := r.getBaseAddressFromOpAddress(opEvmClassId)
	if err != nil {
		return nil, fmt.Errorf("failed to get base signer address: %w", err)
	}

	bookNFT, err := r.opIndexerClient.BookNFT(ctx, baseEvmClassId.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get book NFT: %w", err)
	}

	totalSupply, ok := big.NewInt(0).SetString(bookNFT.TotalSupply, 10)
	if !ok {
		return nil, fmt.Errorf("failed to set total supply: %w", err)
	}

	tos := make([]common.Address, 0)
	memos := make([]string, 0)
	metadataList := make([]string, 0)

	for i := totalSupply.Uint64(); i < toTokenId.Uint64(); i++ {
		token, err := r.opIndexerClient.Token(ctx, opEvmClassId.String(), fmt.Sprintf("%d", i))
		if err != nil {
			return nil, fmt.Errorf("failed to get token: %w", err)
		}
		tokenURI := token.TokenURI
		tokenURIJsonDataUri := jsondatauri.JSONDataUri(tokenURI)
		var metadata *evmmodel.ERC721Metadata
		if err = tokenURIJsonDataUri.Resolve(r.httpClient, &metadata); err != nil {
			return nil, fmt.Errorf("failed to resolve token URI: %w", err)
		}

		metadataBytes, err := json.Marshal(metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}

		memosOfToken := make([]string, 0)

		transferWithMemoEvents, err := r.opIndexerClient.QueryTransferWithMemoEvents(ctx, opEvmClassId.String(), big.NewInt(0).SetUint64(i))
		if err != nil {
			return nil, fmt.Errorf("failed to query transfer with memo events: %w", err)
		}
		for _, transferWithMemoEvent := range transferWithMemoEvents {
			memosOfToken = append(memosOfToken, transferWithMemoEvent.Memo)
		}
		memo := strings.Join(memosOfToken, "\n\n")

		tos = append(tos, common.HexToAddress(*signerAddress))
		memos = append(memos, memo)
		metadataList = append(metadataList, string(metadataBytes))
	}

	return &model.MintNFTsParameter{
		ClassId:      opEvmClassId,
		FromTokenId:  totalSupply,
		Tos:          tos,
		Memos:        memos,
		MetadataList: metadataList,
	}, nil
}
