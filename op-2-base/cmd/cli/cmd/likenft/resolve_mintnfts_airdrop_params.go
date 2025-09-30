package likenft

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"math/big"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/spf13/cobra"

	"github.com/likecoin/like-migration-backend/pkg/signer"

	likenftindexer "likenft-indexer/pkg/likenftindexer"

	clicontext "github.com/likecoin/likecoin-op/op-2-base/internal/cli/context"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/addressmapper"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/parameterresolver/mintnfts"
)

var resolveMintNFTsAirdropParamsCmd = &cobra.Command{
	Use:   "resolve-mintnfts-airdrop-params <op-evm-class-id>",
	Short: "Resolve mint NFTs airdrop params",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		ctx := cmd.Context()

		opEvmClassIdStr := args[0]
		opEvmClassId := common.HexToAddress(opEvmClassIdStr)

		tokenIdStr := args[1]
		tokenId, ok := new(big.Int).SetString(tokenIdStr, 10)
		if !ok {
			panic(fmt.Errorf("invalid token ID: %s", tokenIdStr))
		}

		envCfg := clicontext.ConfigFromContext(ctx)
		logger := slog.New(slog.Default().Handler()).WithGroup("airdropCmd")

		opEthClient, err := ethclient.Dial(envCfg.OpEthNetworkPublicRPCURL)
		if err != nil {
			panic(err)
		}

		baseEthClient, err := ethclient.Dial(envCfg.BaseEthNetworkPublicRPCURL)
		if err != nil {
			panic(err)
		}

		opIndexerClient := likenftindexer.NewLikeNFTIndexerClient(
			envCfg.OpLikeNFTIndexerBaseURL,
			envCfg.OpLikeNFTIndexerAPIKey,
		)

		baseSignerClient := signer.NewSignerClient(
			&http.Client{
				Timeout: 10 * time.Second,
			},
			envCfg.BaseEthSignerBaseUrl,
			envCfg.BaseEthSignerAPIKey,
		)

		getBaseAddressFromOpAddress := addressmapper.NewAddressMapper(
			logger,
			addressmapper.NewAddressMapperContext(
				opEthClient,
				common.HexToAddress(envCfg.CreateAddress2DeployerAddress),
				[2]byte{0, 0},
				hexutil.MustDecode(envCfg.CreateAddress2InitHash),
			),
			addressmapper.NewMemoryCache(),
		)

		tokenEthClientAirdropParamsResolver := mintnfts.NewEthclientMintNFTsParameterResolver(
			opEthClient,
			baseEthClient,
			baseSignerClient,
			&http.Client{
				Timeout: 10 * time.Second,
			},
			getBaseAddressFromOpAddress,
		)

		paramsFromEthClient, err := tokenEthClientAirdropParamsResolver.Resolve(
			ctx,
			logger,
			opEvmClassId,
			tokenId,
		)
		if err != nil {
			panic(err)
		}
		paramsFromEthClientBytes, err := json.Marshal(paramsFromEthClient)
		if err != nil {
			panic(err)
		}

		tokenIndexerAirdropParamsResolver := mintnfts.NewIndexerMintNFTsParameterResolver(
			opIndexerClient,
			baseSignerClient,
			&http.Client{
				Timeout: 10 * time.Second,
			},
			getBaseAddressFromOpAddress,
		)

		paramsFromIndexer, err := tokenIndexerAirdropParamsResolver.Resolve(
			ctx,
			logger,
			opEvmClassId,
			tokenId,
		)
		if err != nil {
			panic(err)
		}
		paramsFromIndexerBytes, err := json.Marshal(paramsFromIndexer)
		if err != nil {
			panic(err)
		}

		logger.Info("paramsFromEthClient", "params", string(paramsFromEthClientBytes))
		logger.Info("paramsFromIndexer", "params", string(paramsFromIndexerBytes))
		fmt.Println(string(paramsFromIndexerBytes))
	},
}

func init() {
	LikeNFTCmd.AddCommand(resolveMintNFTsAirdropParamsCmd)
}
