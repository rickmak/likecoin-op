package model

import (
	"encoding/json"
	"fmt"
	"mime"
	"net/url"
	"path"

	cosmosmodel "likenft-indexer/pkg/likenft/cosmos/model"
	"likenft-indexer/pkg/types/trimmedstring"
)

type MetadataISCN struct {
	Context             *json.RawMessage             `json:"@context,omitempty"`
	Type                *json.RawMessage             `json:"@type,omitempty"`
	Author              *cosmosmodel.Author          `json:"author,omitempty"`
	ExifInfo            *json.RawMessage             `json:"exifInfo,omitempty"`
	InLanguage          *json.RawMessage             `json:"inLanguage,omitempty"`
	ISBN                *json.RawMessage             `json:"isbn,omitempty"`
	Keywords            *json.RawMessage             `json:"keywords,omitempty"`
	Publisher           string                       `json:"publisher,omitempty"`
	ThumbnailUrl        *json.RawMessage             `json:"thumbnailUrl,omitempty"`
	Url                 string                       `json:"url,omitempty"`
	UsageInfo           *json.RawMessage             `json:"usageInfo,omitempty"`
	Version             *json.RawMessage             `json:"version,omitempty"`
	ContentFingerprints *json.RawMessage             `json:"contentFingerprints,omitempty"`
	DateCreated         *json.RawMessage             `json:"dateCreated,omitempty"`
	DatePublished       *json.RawMessage             `json:"datePublished,omitempty"`
	PotentialAction     *MetadataISCNPotentialAction `json:"potentialAction,omitempty"`
}

func MakeMetadataISCNFromCosmosISCN(cosmosISCN *cosmosmodel.ISCN) MetadataISCN {
	iscnRecord := cosmosISCN.Records[0].Data
	var datePublished *json.RawMessage
	if iscnRecord.ContentMetadata.DatePublished != nil {
		datePublished = iscnRecord.ContentMetadata.DatePublished.ToRawMessage()
	}
	return MetadataISCN{
		Context:             iscnRecord.ContentMetadata.Context,
		Type:                iscnRecord.ContentMetadata.Type,
		Author:              iscnRecord.ContentMetadata.Author,
		InLanguage:          iscnRecord.ContentMetadata.InLanguage,
		ISBN:                iscnRecord.ContentMetadata.ISBN,
		Keywords:            iscnRecord.ContentMetadata.Keywords,
		Publisher:           iscnRecord.ContentMetadata.Publisher,
		UsageInfo:           iscnRecord.ContentMetadata.UsageInfo,
		Version:             iscnRecord.ContentMetadata.Version,
		ThumbnailUrl:        iscnRecord.ContentMetadata.ThumbnailUrl,
		Url:                 iscnRecord.ContentMetadata.Url,
		DateCreated:         iscnRecord.RecordTimestamp,
		DatePublished:       datePublished,
		ExifInfo:            iscnRecord.ContentMetadata.ExifInfo,
		ContentFingerprints: iscnRecord.ContentFingerprints,
		PotentialAction:     makeMetadataISCNPotentialActionFromCosmosBook(iscnRecord.ContentMetadata),
	}
}

type MetadataISCNPotentialActionTarget struct {
	Type         string `json:"@type,omitempty"`
	ContentType  string `json:"contentType,omitempty"`
	Url          string `json:"url,omitempty"`
	Name         string `json:"name,omitempty"`
	EncodingType string `json:"encodingType,omitempty"`
}

type MetadataISCNPotentialAction struct {
	Type   string                              `json:"@type,omitempty"`
	Target []MetadataISCNPotentialActionTarget `json:"target,omitempty"`
}

func resolveActionTargetParts(
	urlString trimmedstring.TrimmedString,
) (urlPathBase string, filename string, contentType string) {
	u, err := url.Parse(urlString.String())
	if err != nil {
		return "", "", ""
	}

	urlPathBase = fmt.Sprintf("%s://%s", u.Scheme, path.Join(u.Host, u.Path))

	// file name is the nameFromPath part of the url
	// e.g. http://example.com/myfile.pdf ==> myfile.pdf
	nameFromPath := path.Base(u.Path)
	ext := path.Ext(nameFromPath)
	contentType = mime.TypeByExtension(ext)

	if contentType != "" {
		// probably a valid file name with extension
		return urlPathBase, nameFromPath, contentType
	}

	// file name is in the query params
	// e.g. ar://txid?name=myfile.epub
	nameFromQuery := u.Query().Get("name")
	if nameFromQuery != "" {
		ext := path.Ext(nameFromQuery)
		contentType = mime.TypeByExtension(ext)
		if contentType != "" {
			// probably a valid file name with extension
			return urlPathBase, nameFromQuery, contentType
		}
	}

	return "", "", ""
}

func makePotentialActionTargetFromString(
	str string,
) *MetadataISCNPotentialActionTarget {
	url, fileName, contentType := resolveActionTargetParts(trimmedstring.FromString(str))

	if contentType != "" {
		return &MetadataISCNPotentialActionTarget{
			Type:        "EntryPoint",
			ContentType: contentType,
			Name:        fileName,
			Url:         url,
		}
	}

	return nil
}

func makeMetadataISCNPotentialActionFromCosmosBook(
	b *cosmosmodel.Book,
) *MetadataISCNPotentialAction {
	targets := make([]MetadataISCNPotentialActionTarget, 0)

	for _, sameAs := range b.SameAs {
		t := makePotentialActionTargetFromString(sameAs)
		if t != nil {
			targets = append(targets, *t)
		}
	}

	if len(targets) > 0 {
		return &MetadataISCNPotentialAction{
			Type:   "ReadAction",
			Target: targets,
		}
	}

	return nil
}
