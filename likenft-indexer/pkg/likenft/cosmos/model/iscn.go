package model

import (
	"bytes"
	"encoding/json"

	"likenft-indexer/pkg/likenft/types"
)

type AuthorString string

type AuthorWithDescription struct {
	Description string `json:"description"`
	Name        string `json:"name"`
}

type Author struct {
	str             AuthorString
	withDescription *AuthorWithDescription
}

func (au *Author) UnmarshalJSON(data []byte) error {
	if bytes.Equal(data, []byte("null")) {
		return nil
	}
	if bytes.HasPrefix(data, []byte(`"`)) {
		var s string
		err := json.Unmarshal(data, &s)
		if err != nil {
			return err
		}
		au.str = AuthorString(s)
	} else {
		var authorWithDescription AuthorWithDescription
		err := json.Unmarshal(data, &authorWithDescription)
		if err != nil {
			return err
		}
		au.withDescription = &authorWithDescription
	}
	return nil
}

func (au *Author) MarshalJSON() ([]byte, error) {
	if au.withDescription != nil {
		return json.Marshal(au.withDescription)
	}
	return json.Marshal(au.str)
}

func (a *Author) Name() string {
	if a.withDescription != nil {
		return a.withDescription.Name
	}
	return string(a.str)
}

type Book struct {
	Context         *json.RawMessage               `json:"@context"`
	Type            *json.RawMessage               `json:"@type"`
	Author          *Author                        `json:"author"`
	ContentMetadata *json.RawMessage               `json:"contentMetadata"`
	DatePublished   *types.StringPreservedDateTime `json:"datePublished"`
	ExifInfo        *json.RawMessage               `json:"exifInfo"`
	Description     string                         `json:"description"`
	InLanguage      *json.RawMessage               `json:"inLanguage"`
	ISBN            *json.RawMessage               `json:"isbn"`
	Keywords        *json.RawMessage               `json:"keywords"`
	Name            string                         `json:"name"`
	Publisher       string                         `json:"publisher"`
	ThumbnailUrl    *json.RawMessage               `json:"thumbnailUrl"`
	SameAs          []string                       `json:"sameAs"`
	Url             string                         `json:"url"`
	UsageInfo       *json.RawMessage               `json:"usageInfo"`
	Version         *json.RawMessage               `json:"version"`
}

type Record struct {
	Context             *json.RawMessage `json:"@context"`
	Id                  *json.RawMessage `json:"@id"`
	Type                *json.RawMessage `json:"@type"`
	ContentFingerprints *json.RawMessage `json:"contentFingerprints"`
	ContentMetadata     *Book            `json:"contentMetadata"`
	RecordNotes         *json.RawMessage `json:"recordNotes"`
	RecordParentIPLD    *json.RawMessage `json:"recordParentIPLD"`
	RecordTimestamp     *json.RawMessage `json:"recordTimestamp"`
	RecordVersion       *json.RawMessage `json:"recordVersion"`
	Stakeholders        *json.RawMessage `json:"stakeholders"`
}

type ISCNDataItem struct {
	Ipld string  `json:"ipld"`
	Data *Record `json:"data"`
}

type ISCN struct {
	Owner         string         `json:"owner"`
	LatestVersion string         `json:"latest_version"`
	Records       []ISCNDataItem `json:"records"`
}
