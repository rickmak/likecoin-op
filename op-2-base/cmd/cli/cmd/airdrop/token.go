package airdrop

import (
	"encoding/json"
	"fmt"
	"likenft-indexer/pkg/likenftindexer"
	"log/slog"
	"math/big"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/likecoin/like-migration-backend/pkg/likenft/evm"
	"github.com/likecoin/like-migration-backend/pkg/signer"
	"github.com/spf13/cobra"

	clicontext "github.com/likecoin/likecoin-op/op-2-base/internal/cli/context"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/addressmapper"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/parameterresolver/booknft"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/parameterresolver/mintnfts"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/airdrop/parameterresolver/token"
)

var TokenCmd = &cobra.Command{
	Use:   "token <op-evm-class-id> <token-id>",
	Short: "CLI for Token Airdrop",
	Args:  cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		ctx := cmd.Context()
		logger := slog.New(slog.Default().Handler()).WithGroup("airdropCmd")

		opEvmClassId := common.HexToAddress(args[0])
		tokenId, ok := new(big.Int).SetString(args[1], 10)
		if !ok {
			panic("invalid token id")
		}

		envCfg := clicontext.ConfigFromContext(ctx)

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

		baseLikeProtocol := evm.NewLikeProtocol(
			logger,
			baseEthClient,
			baseSignerClient,
			common.HexToAddress(envCfg.BaseEthLikeNFTContractAddress),
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

		booknftParameterResolver := booknft.NewIndexerBookNFTParameterResolver(
			opIndexerClient,
		)

		mintnftsParameterResolver := mintnfts.NewIndexerMintNFTsParameterResolver(
			opIndexerClient,
			baseSignerClient,
			&http.Client{
				Timeout: 10 * time.Second,
			},
			getBaseAddressFromOpAddress,
		)

		tokenParameterResolver := token.NewIndexerTokenParameterResolver(
			opIndexerClient,
			baseSignerClient,
			getBaseAddressFromOpAddress,
		)

		airdrop := airdrop.NewAirdrop(
			booknftParameterResolver,
			mintnftsParameterResolver,
			tokenParameterResolver,
			opEthClient,
			baseSignerClient,
			&baseLikeProtocol,
		)

		airdropResult, err := airdrop.AirdropToken(ctx, logger, opEvmClassId, tokenId)
		if err != nil {
			panic(err)
		}

		airdropResultBytes, err := json.Marshal(airdropResult)
		if err != nil {
			panic(err)
		}

		fmt.Println(string(airdropResultBytes))
	},
}

func init() {
	AirdropCmd.AddCommand(TokenCmd)
}
