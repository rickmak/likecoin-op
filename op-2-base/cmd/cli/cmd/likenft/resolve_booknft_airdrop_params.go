package likenft

import (
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/spf13/cobra"

	"likenft-indexer/pkg/likenftindexer"

	clicontext "github.com/likecoin/likecoin-op/op-2-base/internal/cli/context"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/parameterresolver/booknft"
)

var resolveBookNFTAirdropParamsCmd = &cobra.Command{
	Use:   "resolve-booknft-airdrop-params <op-evm-class-id>",
	Short: "Resolve book NFT airdrop params",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		ctx := cmd.Context()

		opEvmClassIdStr := args[0]
		opEvmClassId := common.HexToAddress(opEvmClassIdStr)

		envCfg := clicontext.ConfigFromContext(ctx)
		logger := slog.New(slog.Default().Handler()).WithGroup("airdropCmd")

		opEthClient, err := ethclient.Dial(envCfg.OpEthNetworkPublicRPCURL)
		if err != nil {
			panic(err)
		}

		opIndexerClient := likenftindexer.NewLikeNFTIndexerClient(
			envCfg.OpLikeNFTIndexerBaseURL,
			envCfg.OpLikeNFTIndexerAPIKey,
		)

		booknftEthClientAirdropParamsResolver := booknft.NewEthClientBookNFTParameterResolver(
			opEthClient,
		)

		booknftIndexerAirdropParamsResolver := booknft.NewIndexerBookNFTParameterResolver(
			opIndexerClient,
		)

		paramsFromEthClient, err := booknftEthClientAirdropParamsResolver.Resolve(
			ctx,
			opEvmClassId,
		)
		if err != nil {
			panic(err)
		}
		paramsFromEthClientBytes, err := json.Marshal(paramsFromEthClient)
		if err != nil {
			panic(err)
		}

		paramsFromIndexer, err := booknftIndexerAirdropParamsResolver.Resolve(
			ctx,
			opEvmClassId,
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
	LikeNFTCmd.AddCommand(resolveBookNFTAirdropParamsCmd)
}
