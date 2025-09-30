package cmd

import (
	"context"
	"os"

	"github.com/spf13/cobra"

	"github.com/likecoin/likecoin-op/op-2-base/cmd/cli/cmd/airdrop"
	"github.com/likecoin/likecoin-op/op-2-base/cmd/cli/cmd/likenft"
)

var rootCmd = &cobra.Command{
	Use:   "cli",
	Short: "Migration Backend CLI",
	Long:  `CLI to perform asset migration`,
}

func Execute(ctx context.Context) {
	err := rootCmd.ExecuteContext(ctx)
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.AddCommand(likenft.LikeNFTCmd)
	rootCmd.AddCommand(airdrop.AirdropCmd)
}
