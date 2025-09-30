package likenftindexer

import (
	"context"
	"encoding/json"
	"fmt"

	"likenft-indexer/pkg/likenftindexer/model"

	"likenft-indexer/pkg/util/httputil"
)

type BookNFTResponse struct {
	*model.BookNFT
}

func (c *likeNFTIndexerClient) BookNFT(ctx context.Context, bookNFTId string) (*BookNFTResponse, error) {
	response, err := c.httpClient.Get(fmt.Sprintf("%s/api/booknft/%s", c.baseURL, bookNFTId))
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if err = httputil.HandleResponseStatus(response); err != nil {
		return nil, err
	}
	decoder := json.NewDecoder(response.Body)
	var bookNFTResponse *BookNFTResponse
	err = decoder.Decode(&bookNFTResponse)
	if err != nil {
		return nil, err
	}
	return bookNFTResponse, nil
}
