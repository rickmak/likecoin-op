package addressmapper

import (
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	evmmodel "github.com/likecoin/like-migration-backend/pkg/likenft/evm/model"
)

type addressMapper struct {
	logger                  *slog.Logger
	opCreateAddress2Context AddressMapperContext
	cache                   Cache
}

func NewAddressMapper(
	logger *slog.Logger,
	opCreateAddress2Context AddressMapperContext,
	cache Cache,
) GetBaseAddressFromOpAddress {
	return (&addressMapper{
		logger,
		opCreateAddress2Context,
		cache,
	}).MapAddressFromOpToBase
}

func (c *addressMapper) getMetadataSalt(metadata *evmmodel.ContractLevelMetadata) ([32]byte, error) {
	logger := c.logger.WithGroup("getMetadataSalt")

	metadataJson, err := json.Marshal(metadata)
	if err != nil {
		return [32]byte{}, fmt.Errorf("failed to marshal metadata: %w", err)
	}
	logger = logger.With(
		"metadataJson",
		string(metadataJson),
	)

	name := metadata.Name
	var targetUrl string

	if metadata.PotentialAction != nil &&
		metadata.PotentialAction.Target != nil &&
		len(metadata.PotentialAction.Target) > 0 {
		targetUrl = metadata.PotentialAction.Target[0].Url
	}

	logger = logger.With(
		"targetUrl",
		targetUrl,
		"name",
		name,
	)

	if targetUrl != "" {
		logger.Info("targetUrl selected")
		return sha256.Sum256([]byte(targetUrl)), nil
	}
	if name != "" {
		logger.Info("name selected")
		return sha256.Sum256([]byte(name)), nil
	}
	return [32]byte{}, errors.New("err cannot determine salt")
}

func (c *addressMapper) getSalt(evmClassId common.Address) ([32]byte, error) {
	logger := c.logger.WithGroup("getSalt").With("evmClassId", evmClassId)

	msgSenderAddress := c.opCreateAddress2Context.GetMsgSender()
	nonce := c.opCreateAddress2Context.GetNonce()

	metadata, err := c.opCreateAddress2Context.GetMetadata(evmClassId)
	if err != nil {
		return [32]byte{}, err
	}
	metadataSalt, err := c.getMetadataSalt(metadata)
	if err != nil {
		return [32]byte{}, err
	}

	msgSenderAddressBytes := msgSenderAddress.Bytes()

	msgSender := [20]byte{}
	copy(msgSender[:], msgSenderAddressBytes[:20])

	logger = logger.With(
		"prefix(20)",
		hexutil.Encode(msgSender[:]),
	)

	data := [10]byte{}
	copy(data[:], metadataSalt[:10])

	logger = logger.With(
		"nonce(2)",
		hexutil.Encode(nonce[:]),
	)

	logger = logger.With(
		"data(10)",
		hexutil.Encode(data[:]),
	)

	salt := c.salt(msgSender, nonce, data)
	logger.Info("salt calculated", "salt(32)", hexutil.Encode(salt[:]))
	return salt, nil
}

func (c *addressMapper) salt(msgSender [20]byte, nonce [2]byte, data [10]byte) [32]byte {
	res := [32]byte{}
	copy(res[0:20], msgSender[:])
	copy(res[20:22], nonce[:])
	copy(res[22:32], data[:])
	return res
}

func (c *addressMapper) MapAddressFromOpToBase(
	opEvmClassId common.Address,
) (baseEvmClassId common.Address, err error) {
	logger := c.logger.
		WithGroup("MapAddressFromOpToBase").
		With("opEvmClassId", opEvmClassId)

	if baseEvmClassId, ok := c.cache.Get(opEvmClassId); ok {
		logger.Info("mapped address from op to base", "baseEvmClassId", baseEvmClassId.String())
		return baseEvmClassId, nil
	}

	msgSenderAddress := c.opCreateAddress2Context.GetMsgSender()
	logger = logger.With(
		"msgSenderAddress",
		msgSenderAddress,
	)

	salt, err := c.getSalt(opEvmClassId)
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to get salt: %w", err)
	}
	logger = logger.With(
		"salt",
		hexutil.Encode(salt[:]),
	)

	initHash := c.opCreateAddress2Context.GetInitHash()
	logger = logger.With(
		"initHash",
		hexutil.Encode(initHash[:]),
	)

	baseEvmClassId = crypto.CreateAddress2(msgSenderAddress, salt, initHash)
	logger.Info("mapped address from op to base", "baseEvmClassId", baseEvmClassId.String())
	c.cache.Set(opEvmClassId, baseEvmClassId)
	return baseEvmClassId, nil
}
