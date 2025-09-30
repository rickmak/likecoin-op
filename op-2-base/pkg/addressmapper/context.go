package addressmapper

import (
	"fmt"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/likecoin/like-migration-backend/pkg/likenft/evm/book_nft"
	"github.com/likecoin/like-migration-backend/pkg/likenft/evm/model"
	"github.com/likecoin/like-migration-backend/pkg/util/jsondatauri"
)

type AddressMapperContext interface {
	GetMetadata(evmClassID common.Address) (*model.ContractLevelMetadata, error)
	GetMsgSender() common.Address
	GetNonce() [2]byte
	GetInitHash() []byte
}

type addressMapperContext struct {
	httpClient *http.Client
	ethClient  *ethclient.Client
	msgSender  common.Address
	nonce      [2]byte
	initHash   []byte
}

func NewAddressMapperContext(
	ethClient *ethclient.Client,
	msgSender common.Address,
	nonce [2]byte,
	initHash []byte,
) AddressMapperContext {
	httpClient := &http.Client{
		Timeout: 10 * time.Second,
	}
	return &addressMapperContext{
		httpClient,
		ethClient,
		msgSender,
		nonce,
		initHash,
	}
}

func (c *addressMapperContext) GetMetadata(evmClassID common.Address) (*model.ContractLevelMetadata, error) {
	instance, err := book_nft.NewBookNft(evmClassID, c.ethClient)
	if err != nil {
		return nil, fmt.Errorf("failed to create book nft instance: %w", err)
	}
	contractURI, err := instance.ContractURI(&bind.CallOpts{})
	if err != nil {
		return nil, fmt.Errorf("failed to get contract URI: %w", err)
	}
	jsonDataUri := jsondatauri.JSONDataUri(contractURI)
	var metadata *model.ContractLevelMetadata
	if err := jsonDataUri.Resolve(c.httpClient, &metadata); err != nil {
		return nil, fmt.Errorf("failed to resolve JSON Data URI: %w", err)
	}
	return metadata, nil
}

func (c *addressMapperContext) GetMsgSender() common.Address {
	return c.msgSender
}

func (c *addressMapperContext) GetNonce() [2]byte {
	return c.nonce
}

func (c *addressMapperContext) GetInitHash() []byte {
	return c.initHash
}
