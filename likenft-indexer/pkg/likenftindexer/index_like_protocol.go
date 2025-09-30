package likenftindexer

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"likenft-indexer/pkg/util/httputil"
)

type IndexLikeProtocolResponse struct {
	Message string `json:"message"`
	TaskId  string `json:"task_id"`
}

func (c *likeNFTIndexerClient) IndexLikeProtocol(ctx context.Context) (*IndexLikeProtocolResponse, error) {
	req, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/api/index-action/like-protocol", c.baseURL), nil)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if err = httputil.HandleResponseStatus(resp); err != nil {
		return nil, err
	}
	decoder := json.NewDecoder(resp.Body)
	var response IndexLikeProtocolResponse
	err = decoder.Decode(&response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}
