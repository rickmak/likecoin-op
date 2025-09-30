package model

import (
	cosmosmodel "likenft-indexer/pkg/likenft/cosmos/model"
)

type ContractLevelMetadata struct {
	ContractLevelMetadataOpenSea
	MetadataAdditional
	MetadataISCN
	Attributes    []ContractLevelMetadataAttributes `json:"attributes"`
	LikeCoin      *ContractLevelMetadataLikeCoin    `json:"likecoin,omitempty"`
	RoyaltyConfig *cosmosmodel.RoyaltyConfig        `json:"royalty_config,omitempty"`
}

// https://eips.ethereum.org/EIPS/eip-7572
type ContractLevelMetadataOpenSea struct {
	Name          string   `json:"name,omitempty"`
	Symbol        string   `json:"symbol,omitempty"`
	Description   string   `json:"description,omitempty"`
	Image         string   `json:"image,omitempty"`
	BannerImage   string   `json:"banner_image,omitempty"`
	FeaturedImage string   `json:"featured_image,omitempty"`
	ExternalLink  string   `json:"external_link,omitempty"`
	Collaborators []string `json:"collaborators,omitempty"`
}

type ContractLevelMetadataLikeCoin struct {
	ISCNIdPrefix string `json:"iscnIdPrefix,omitempty"`
	ClassId      string `json:"classId,omitempty"`
}

type ContractLevelMetadataAttributes struct {
	TraitType   string `json:"trait_type,omitempty"`
	DisplayType string `json:"display_type,omitempty"`
	Value       any    `json:"value,omitempty"`
}
