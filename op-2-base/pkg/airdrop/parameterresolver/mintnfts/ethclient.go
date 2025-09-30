package mintnfts

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/big"
	"net/http"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/likecoin/like-migration-backend/pkg/likenft/evm/book_nft"
	evmmodel "github.com/likecoin/like-migration-backend/pkg/likenft/evm/model"
	"github.com/likecoin/like-migration-backend/pkg/signer"
	"github.com/likecoin/like-migration-backend/pkg/util/jsondatauri"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/addressmapper"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/model"
)

type ethclientMintNFTsParameterResolver struct {
	opEthClient                 *ethclient.Client
	baseEthClient               *ethclient.Client
	baseSignerClient            *signer.SignerClient
	httpClient                  *http.Client
	getBaseAddressFromOpAddress addressmapper.GetBaseAddressFromOpAddress
}

func NewEthclientMintNFTsParameterResolver(
	opEthClient *ethclient.Client,
	baseEthClient *ethclient.Client,
	baseSignerClient *signer.SignerClient,
	httpClient *http.Client,
	getBaseAddressFromOpAddress addressmapper.GetBaseAddressFromOpAddress,
) MintNFTsParameterResolver {
	return &ethclientMintNFTsParameterResolver{
		opEthClient,
		baseEthClient,
		baseSignerClient,
		httpClient,
		getBaseAddressFromOpAddress,
	}
}

func (r *ethclientMintNFTsParameterResolver) Resolve(
	ctx context.Context,
	logger *slog.Logger,
	opEvmClassId common.Address,
	toTokenId *big.Int,
) (*model.MintNFTsParameter, error) {
	opBookNFT, err := book_nft.NewBookNft(opEvmClassId, r.opEthClient)
	if err != nil {
		return nil, fmt.Errorf("failed to get op book NFT: %w", err)
	}

	baseEvmClassId, err := r.getBaseAddressFromOpAddress(opEvmClassId)
	if err != nil {
		return nil, fmt.Errorf("failed to get base signer address: %w", err)
	}

	baseBookNFT, err := book_nft.NewBookNft(baseEvmClassId, r.baseEthClient)
	if err != nil {
		return nil, fmt.Errorf("failed to get base book NFT: %w", err)
	}

	totalSupply, err := baseBookNFT.TotalSupply(&bind.CallOpts{
		Context: ctx,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get total supply: %w", err)
	}

	if totalSupply.Cmp(toTokenId) >= 0 {
		return nil, fmt.Errorf("total supply sufficient")
	}

	signerAddress, err := r.baseSignerClient.GetSignerAddress()
	if err != nil {
		return nil, fmt.Errorf("failed to get signer address: %w", err)
	}

	tos := make([]common.Address, 0)
	memos := make([]string, 0)
	metadataList := make([]string, 0)

	for i := totalSupply.Uint64(); i < toTokenId.Uint64(); i++ {
		tokenURI, err := opBookNFT.TokenURI(&bind.CallOpts{
			Context: ctx,
		}, big.NewInt(int64(i)))
		if err != nil {
			return nil, fmt.Errorf("failed to get token URI: %w", err)
		}
		tokenURIJsonDataUri := jsondatauri.JSONDataUri(tokenURI)
		var metadata *evmmodel.ERC721Metadata
		if err = tokenURIJsonDataUri.Resolve(r.httpClient, &metadata); err != nil {
			return nil, fmt.Errorf("failed to resolve token URI: %w", err)
		}

		metadataBytes, err := json.Marshal(metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}

		tos = append(tos, common.HexToAddress(*signerAddress))
		memos = append(memos, fmt.Sprintf("Mint %d", i))
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
