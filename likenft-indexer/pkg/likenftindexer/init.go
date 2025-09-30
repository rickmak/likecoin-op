package likenftindexer

import (
	"likenft-indexer/internal/evm/book_nft"
	"likenft-indexer/internal/evm/util/logconverter"
)

var BookNftLogConverter *logconverter.LogConverter

func init() {
	bookNFTABI, err := book_nft.BookNftMetaData.GetAbi()
	if err != nil {
		panic(err)
	}
	BookNftLogConverter = logconverter.NewLogConverter(bookNFTABI)
}
