package model

import (
	"time"

	"cosmossdk.io/x/nft"
)

type Class struct {
	nft.Class
	Data *ClassData `json:"data"`
}

type ClassListItem struct {
	nft.Class
	ClassData
	CreatedAt      time.Time `json:"created_at"`
	Owner          string    `json:"owner"`
	NFTOwnedCount  uint64    `json:"nft_owned-count"`
	NFTLastOwnedAt time.Time `json:"nft_last_owned_at"`
	LastOwnedNFTID string    `json:"last_owned_nft_id"`
}

type ClassData struct {
	Metadata      ClassMetadata `json:"metadata"`
	Parent        ClassParent   `json:"parent"`
	Config        ClassConfig   `json:"config"`
	BlindBoxState BlindBoxState `json:"blind_box_state"`
}

type ClassMetadata struct {
	Image                        string `json:"image,omitempty"`
	Message                      string `json:"message,omitempty"`
	ExternalURL                  string `json:"external_url,omitempty"`
	NFTMetaCollectionID          string `json:"nft_meta_collection_id,omitempty"`
	NFTMetaCollectionName        string `json:"nft_meta_collection_name,omitempty"`
	NFTMetaCollectionDescrption  string `json:"nft_meta_collection_descrption,omitempty"`
	NFTMetaCollectionDescription string `json:"nft_meta_collection_description,omitempty"`
}

func (m *ClassMetadata) GetNFTMetaCollectionDescription() string {
	if m.NFTMetaCollectionDescrption != "" {
		return m.NFTMetaCollectionDescrption
	}
	return m.NFTMetaCollectionDescription
}

type ClassParent struct {
	Type              ClassParentType `json:"type,omitempty"`
	IscnIdPrefix      string          `json:"iscn_id_prefix,omitempty"`
	IscnVersionAtMint string          `json:"iscn_version_at_mint,omitempty"`
	Account           string          `json:"account,omitempty"`
}

type ClassParentType string

const (
	ClassParentType_UNKNOWN ClassParentType = "UNKNOWN"
	ClassParentType_ISCN    ClassParentType = "ISCN"
	ClassParentType_ACCOUNT ClassParentType = "ACCOUNT"
)

type ClassConfig struct {
	Burnable       bool            `json:"burnable,omitempty"`
	MaxSupply      string          `json:"max_supply,omitempty"`
	BlindBoxConfig *BlindBoxConfig `json:"blind_box_config,omitempty"`
}

type BlindBoxConfig struct {
	MintPeriods []MintPeriod `json:"mint_periods"`
	RevealTime  time.Time    `json:"reveal_time"`
}

type MintPeriod struct {
	StartTime        time.Time `json:"start_time"`
	AllowedAddresses []string  `json:"allowed_addresses,omitempty"`
	MintPrice        uint64    `json:"mint_price,omitempty"`
}

type BlindBoxState struct {
	ContentCount string `json:"content_count,omitempty"`
	ToBeRevealed bool   `json:"to_be_revealed,omitempty"`
}
