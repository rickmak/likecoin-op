package likenftindexer

import (
	"context"
	"encoding/json"
	"fmt"
	"likenft-indexer/openapi/api"
	"likenft-indexer/pkg/util/httputil"
	"net/http"
	"net/url"
	"strconv"
)

type QueryEventsParams struct {
	Page   int    `json:"page,omitempty"`
	Topic1 string `json:"topic1,omitempty"`
	Topic2 string `json:"topic2,omitempty"`
	Topic3 string `json:"topic3,omitempty"`
	Topic0 string `json:"topic0,omitempty"`
}

func (c *likeNFTIndexerClient) queryEventsByAddressAndSignature(
	ctx context.Context,
	bookNFTId string,
	signature string,
	params QueryEventsParams,
) (*api.EventsByAddressAndSignatureOK, error) {
	queryParams := url.Values{}
	if params.Page != 0 {
		queryParams.Add("page", strconv.Itoa(params.Page))
	}
	if params.Topic1 != "" {
		queryParams.Add("topic1", params.Topic1)
	}
	if params.Topic2 != "" {
		queryParams.Add("topic2", params.Topic2)
	}
	if params.Topic3 != "" {
		queryParams.Add("topic3", params.Topic3)
	}

	req, err := http.NewRequestWithContext(
		ctx, "GET",
		fmt.Sprintf(
			"%s/api/events/%s/%s?%s",
			c.baseURL,
			bookNFTId,
			signature,
			queryParams.Encode(),
		),
		nil,
	)
	if err != nil {
		return nil, err
	}

	response, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if err = httputil.HandleResponseStatus(response); err != nil {
		return nil, err
	}

	decoder := json.NewDecoder(response.Body)
	var eventsResponse *api.EventsByAddressAndSignatureOK
	err = decoder.Decode(&eventsResponse)
	if err != nil {
		return nil, err
	}

	return eventsResponse, nil
}
