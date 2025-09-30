package likenftindexer

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"likenft-indexer/pkg/likenftindexer/model"

	"likenft-indexer/pkg/util/httputil"
)

type TokenResponse struct {
	*model.NFT
}

func (c *likeNFTIndexerClient) Token(
	ctx context.Context,
	bookNFTId string,
	tokenId string,
) (*TokenResponse, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		"GET",
		fmt.Sprintf("%s/api/token/%s/%s", c.baseURL, bookNFTId, tokenId),
		nil,
	)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if err := httputil.HandleResponseStatus(resp); err != nil {
		return nil, err
	}

	var nft *TokenResponse
	decoder := json.NewDecoder(resp.Body)
	if err := decoder.Decode(&nft); err != nil {
		return nil, err
	}
	return nft, nil
}
