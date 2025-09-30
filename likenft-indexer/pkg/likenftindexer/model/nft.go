package model

type NFT struct {
	ContractAddress string  `json:"contract_address"`
	TokenID         string  `json:"token_id"`
	TokenURI        string  `json:"token_uri"`
	Image           *string `json:"image"`
	ImageData       *string `json:"image_data"`
	ExternalURL     *string `json:"external_url"`
	Description     *string `json:"description"`
	Name            *string `json:"name"`
	// Attributes []ERC721MetadataAttribute `json:"attributes"`
	BackgroundColor *string `json:"background_color"`
	AnimationURL    *string `json:"animation_url"`
	YoutubeURL      *string `json:"youtube_url"`
	OwnerAddress    string  `json:"owner_address"`
	MintedAt        string  `json:"minted_at"`
	UpdatedAt       string  `json:"updated_at"`
}
