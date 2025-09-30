package likenftindexer

import (
	"context"
	pkgmodel "likenft-indexer/pkg/likenftindexer/model"
	"math/big"
	"net/http"
)

type LikeNFTIndexerClient interface {
	BookNFT(ctx context.Context, bookNFTId string) (*BookNFTResponse, error)
	IndexLikeProtocol(ctx context.Context) (*IndexLikeProtocolResponse, error)
	IndexBookNFT(ctx context.Context, bookNFTId string) (*IndexBookNFTResponse, error)
	Token(ctx context.Context, bookNFTId string, tokenId string) (*TokenResponse, error)
	QueryTransferWithMemoEvents(
		ctx context.Context,
		bookNFTId string,
		tokenId *big.Int,
	) ([]pkgmodel.TransferWithMemoEvent, error)
}

type likeNFTIndexerClient struct {
	httpClient *http.Client
	baseURL    string
	apiKey     string
}

func NewLikeNFTIndexerClient(baseURL string, apiKey string) LikeNFTIndexerClient {
	httpClient := NewHTTPClient(apiKey)
	return &likeNFTIndexerClient{
		httpClient,
		baseURL,
		apiKey,
	}
}
