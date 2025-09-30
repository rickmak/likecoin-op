package model

type MetadataAdditional struct {
	Message                      string `json:"message,omitempty"`
	NftMetaCollectionId          string `json:"nft_meta_collection_id,omitempty"`
	NftMetaCollectionName        string `json:"nft_meta_collection_name,omitempty"`
	NftMetaCollectionDescription string `json:"nft_meta_collection_description,omitempty"`
}
