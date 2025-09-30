package model

type ERC721Metadata struct {
	ERC721MetadataOpenSea
	LikeCoin *ERC721MetadataLikeCoin `json:"likecoin,omitempty"`
}

// https://docs.opensea.io/docs/metadata-standards
type ERC721MetadataOpenSea struct {
	Image           string                    `json:"image,omitempty"`
	ImageData       string                    `json:"image_data,omitempty"`
	ExternalUrl     string                    `json:"external_url,omitempty"`
	Description     string                    `json:"description,omitempty"`
	Name            string                    `json:"name,omitempty"`
	Attributes      []ERC721MetadataAttribute `json:"attributes,omitempty"`
	BackgroundColor string                    `json:"background_color,omitempty"`
	AnimationUrl    string                    `json:"animation_url,omitempty"`
	YoutubeUrl      string                    `json:"youtube_url,omitempty"`
}

func EitherString(v1 string, v2 string) string {
	if v1 != "" {
		return v1
	}
	return v2
}

func EitherArray[T any](v1 []T, v2 []T) []T {
	if len(v1) > 0 {
		return v1
	}
	return v2
}

func OverrideERC721MetadataOpenSea(m ERC721MetadataOpenSea, override *ERC721MetadataOpenSea) ERC721MetadataOpenSea {
	if override == nil {
		return m
	}
	return ERC721MetadataOpenSea{
		Image:           EitherString(override.Image, m.Image),
		ImageData:       EitherString(override.ImageData, m.ImageData),
		ExternalUrl:     EitherString(override.ExternalUrl, m.ExternalUrl),
		Description:     EitherString(override.Description, m.Description),
		Name:            EitherString(override.Name, m.Name),
		Attributes:      EitherArray(override.Attributes, m.Attributes),
		BackgroundColor: EitherString(override.BackgroundColor, m.BackgroundColor),
		AnimationUrl:    EitherString(override.AnimationUrl, m.AnimationUrl),
		YoutubeUrl:      EitherString(override.YoutubeUrl, m.YoutubeUrl),
	}
}

type ERC721MetadataAttributeDisplayType string

var (
	ERC721MetadataAttributeDisplayTypeNumber          ERC721MetadataAttributeDisplayType = "number"
	ERC721MetadataAttributeDisplayTypeBoostNumber     ERC721MetadataAttributeDisplayType = "boost_number"
	ERC721MetadataAttributeDisplayTypeBoostPercentage ERC721MetadataAttributeDisplayType = "boost_percentage"
	ERC721MetadataAttributeDisplayTypeDate            ERC721MetadataAttributeDisplayType = "date"
)

type ERC721MetadataAttribute struct {
	DisplayType *ERC721MetadataAttributeDisplayType `json:"display_type,omitempty"`
	TraitType   string                              `json:"trait_type,omitempty"`
	Value       interface{}                         `json:"value,omitempty"`
}

type ERC721MetadataPotentialAction struct {
	Type   string                                    `json:"@type,omitempty"`
	Target []ERC721MetadataPotentialActionTargetItem `json:"target,omitempty"`
}

type ERC721MetadataPotentialActionTargetItem struct {
	Type        string `json:"@type,omitempty"`
	ContentType string `json:"contentType,omitempty"`
	Url         string `json:"url,omitempty"`
	Name        string `json:"name,omitempty"`
}

type ERC721MetadataLikeCoin struct {
	ISCNIdPrefix string `json:"iscnIdPrefix,omitempty"`
	ClassId      string `json:"classId,omitempty"`
	NFTId        string `json:"nftId,omitempty"`
}
