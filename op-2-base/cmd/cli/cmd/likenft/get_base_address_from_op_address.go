package likenft

import (
	"fmt"
	"log/slog"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/spf13/cobra"

	clicontext "github.com/likecoin/likecoin-op/op-2-base/internal/cli/context"
	"github.com/likecoin/likecoin-op/op-2-base/pkg/addressmapper"
)

var getBaseAddressFromOpAddressCmd = &cobra.Command{
	Use:   "get-base-address-from-op-address <op-evm-class-id>",
	Short: "Get base address from OP address",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		ctx := cmd.Context()

		envCfg := clicontext.ConfigFromContext(ctx)
		logger := slog.New(slog.Default().Handler()).WithGroup("getBaseAddressFromOpAddressCmd")

		deployerAddressStr := envCfg.CreateAddress2DeployerAddress
		deployerAddress := common.HexToAddress(deployerAddressStr)

		initHashStr := envCfg.CreateAddress2InitHash
		initHash := hexutil.MustDecode(initHashStr)

		opEvmClassIdStr := args[0]
		opEvmClassId := common.HexToAddress(opEvmClassIdStr)

		ethClient, err := ethclient.Dial(envCfg.OpEthNetworkPublicRPCURL)
		if err != nil {
			panic(err)
		}

		addressMapperCtx := addressmapper.NewAddressMapperContext(
			ethClient,
			deployerAddress,
			[2]byte{0, 0},
			initHash,
		)
		getBaseAddressFromOpAddress := addressmapper.NewAddressMapper(
			logger, addressMapperCtx, addressmapper.NewMemoryCache(),
		)
		baseEvmClassId, err := getBaseAddressFromOpAddress(opEvmClassId)
		if err != nil {
			panic(err)
		}
		fmt.Println(baseEvmClassId)
	},
}

func init() {
	LikeNFTCmd.AddCommand(getBaseAddressFromOpAddressCmd)
}
