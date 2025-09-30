package booknft

import (
	"context"
	"fmt"
	"net/http"
	"time"

	evmmodel "likenft-indexer/pkg/likenft/evm/model"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/likecoin/like-migration-backend/pkg/likenft/evm/book_nft"
	"github.com/likecoin/like-migration-backend/pkg/util/jsondatauri"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/model"
)

type ethClientBookNFTParameterResolver struct {
	opEthClient *ethclient.Client
}

func NewEthClientBookNFTParameterResolver(opEthClient *ethclient.Client) BookNFTParameterResolver {
	return &ethClientBookNFTParameterResolver{
		opEthClient: opEthClient,
	}
}

func (r *ethClientBookNFTParameterResolver) Resolve(
	ctx context.Context,
	opEvmClassId common.Address,
) (*model.AirdropBookNFTParams, error) {
	bookNFT, err := book_nft.NewBookNft(opEvmClassId, r.opEthClient)
	if err != nil {
		return nil, fmt.Errorf("failed to create book NFT: %w", err)
	}

	// TODO
	initialMinterAddresses := make([]common.Address, 0)
	initialUpdaterAddresses := make([]common.Address, 0)
	initialOwnerAddress := common.Address{}

	name, err := bookNFT.Name(&bind.CallOpts{})
	if err != nil {
		return nil, fmt.Errorf("failed to get book NFT name: %w", err)
	}

	symbol, err := bookNFT.Symbol(&bind.CallOpts{})
	if err != nil {
		return nil, fmt.Errorf("failed to get book NFT symbol: %w", err)
	}

	contractURIStr, err := bookNFT.ContractURI(&bind.CallOpts{})
	if err != nil {
		return nil, fmt.Errorf("failed to get book NFT contract URI: %w", err)
	}
	contractURIJsonDataUri := jsondatauri.JSONDataUri(contractURIStr)

	var contractLevelMetadata *evmmodel.ContractLevelMetadata
	if err := contractURIJsonDataUri.Resolve(&http.Client{
		Timeout: 10 * time.Second,
	}, &contractLevelMetadata); err != nil {
		return nil, fmt.Errorf("failed to resolve book NFT contract URI: %w", err)
	}

	maxSupply, err := bookNFT.MaxSupply(&bind.CallOpts{})
	if err != nil {
		return nil, fmt.Errorf("failed to get book NFT max supply: %w", err)
	}

	return &model.AirdropBookNFTParams{
		InitialOwnerAddress:     initialOwnerAddress,
		InitialUpdaterAddresses: initialUpdaterAddresses,
		InitialMinterAddresses:  initialMinterAddresses,
		Name:                    name,
		Symbol:                  symbol,
		Metadata:                contractLevelMetadata,
		MaxSupply:               maxSupply,
	}, nil
}
