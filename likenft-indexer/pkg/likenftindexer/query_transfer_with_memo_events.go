package likenftindexer

import (
	"context"
	"likenft-indexer/internal/api/openapi/model"
	"likenft-indexer/internal/evm/book_nft"
	pkgmodel "likenft-indexer/pkg/likenftindexer/model"
	"math/big"
)

type QueryTransferWithMemoEventsResponse struct {
	TransferWithMemoEvents []pkgmodel.TransferWithMemoEvent `json:"transfer_with_memo_events"`
}

func (c *likeNFTIndexerClient) queryTransferWithMemoEventsByPage(
	ctx context.Context,
	bookNFTId string,
	tokenId *big.Int,
	page int,
) (
	transferWithMemoEvents []pkgmodel.TransferWithMemoEvent,
	totalPages int,
	err error,
) {
	signature := "TransferWithMemo(address,address,uint256,string)"
	eventsResponse, err := c.queryEventsByAddressAndSignature(
		ctx,
		bookNFTId,
		signature,
		QueryEventsParams{
			Page:   page,
			Topic3: tokenId.String(),
		},
	)
	if err != nil {
		return nil, 0, err
	}

	transferWithMemoEvents = make([]pkgmodel.TransferWithMemoEvent, 0)

	for _, event := range eventsResponse.Data {
		evmEvent, err := model.MakeEVMEvent(event)
		if err != nil {
			return nil, 0, err
		}
		transferWithMemo := new(book_nft.BookNftTransferWithMemo)
		log := BookNftLogConverter.ConvertEvmEventToLog(evmEvent)
		if err = BookNftLogConverter.UnpackLog(log, &transferWithMemo); err != nil {
			return nil, 0, err
		}
		transferWithMemoEvents = append(
			transferWithMemoEvents,
			pkgmodel.TransferWithMemoEvent{
				From:    transferWithMemo.From,
				To:      transferWithMemo.To,
				TokenId: transferWithMemo.TokenId,
				Memo:    transferWithMemo.Memo,
			},
		)
	}

	return transferWithMemoEvents, eventsResponse.Meta.TotalPages, nil
}

func (c *likeNFTIndexerClient) QueryTransferWithMemoEvents(
	ctx context.Context,
	bookNFTId string,
	tokenId *big.Int,
) (
	transferWithMemoEvents []pkgmodel.TransferWithMemoEvent,
	err error,
) {
	transferWithMemoEvents, totalPages, err := c.queryTransferWithMemoEventsByPage(
		ctx,
		bookNFTId,
		tokenId,
		0,
	)
	if err != nil {
		return nil, err
	}

	for page := 1; page < totalPages; page++ {
		transferWithMemoEvents, _, err := c.queryTransferWithMemoEventsByPage(
			ctx,
			bookNFTId,
			tokenId,
			page,
		)
		if err != nil {
			return nil, err
		}
		transferWithMemoEvents = append(transferWithMemoEvents, transferWithMemoEvents...)
	}
	return transferWithMemoEvents, nil
}
