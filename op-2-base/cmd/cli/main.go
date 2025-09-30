package main

import (
	"context"

	_ "github.com/lib/pq"

	"github.com/likecoin/likecoin-op/op-2-base/cmd/cli/cmd"
	clicontext "github.com/likecoin/likecoin-op/op-2-base/internal/cli/context"
)

func main() {
	ctx, err := clicontext.NewContext(context.Background())
	if err != nil {
		panic(err)
	}

	cmd.Execute(ctx)
}
