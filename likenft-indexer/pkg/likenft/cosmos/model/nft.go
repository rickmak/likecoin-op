package model

import (
	"cosmossdk.io/x/nft"
)

type NFT struct {
	nft.NFT
	Data NFTData `json:"data"`
}

type NFTData struct {
	Metadata     NFTMetadata        `json:"metadata"`
	ClassParent  NFTDataClassParent `json:"class_parent"`
	ToBeRevealed bool               `json:"to_be_revealed,omitempty"`
}

type NFTDataClassParent struct {
	Type              ClassParentType `json:"type,omitempty"`
	IscnIdPrefix      string          `json:"iscn_id_prefix,omitempty"`
	IscnVersionAtMint string          `json:"iscn_version_at_mint,omitempty"`
	Account           string          `json:"account,omitempty"`
}

type NFTMetadata struct {
	Name         string                 `json:"name,omitempty"`
	Description  string                 `json:"description,omitempty"`
	Image        string                 `json:"image,omitempty"`
	ExternalUrl  string                 `json:"external_url,omitempty"`
	FileName     string                 `json:"fileName,omitempty"`
	IpfsHash     string                 `json:"ipfs_hash,omitempty"`
	Attributes   map[string]interface{} `json:"attributes"`
	AnimationUrl string                 `json:"animation_url,omitempty"`
}
