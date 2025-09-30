package model

import (
	evmmodel "likenft-indexer/pkg/likenft/evm/model"
)

type BookNFT struct {
	Address             string                          `json:"address"`
	Name                string                          `json:"name"`
	Symbol              string                          `json:"symbol"`
	OwnerAddress        string                          `json:"owner_address"`
	TotalSupply         string                          `json:"total_supply"`
	MaxSupply           string                          `json:"max_supply"`
	Metadata            *evmmodel.ContractLevelMetadata `json:"metadata"`
	BannerImage         string                          `json:"banner_image"`
	FeaturedImage       string                          `json:"featured_image"`
	DeployerAddress     string                          `json:"deployer_address"`
	DeployedBlockNumber string                          `json:"deployed_block_number"`
	MintedAt            string                          `json:"minted_at"`
	UpdatedAt           string                          `json:"updated_at"`
	Owner               *Account                        `json:"owner"`
}
