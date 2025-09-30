package context

import (
	"context"

	"github.com/likecoin/likecoin-op/op-2-base/internal/cli/config"
)

func NewContext(ctx context.Context) (context.Context, error) {
	if ctx == nil {
		ctx = context.Background()
	}

	envCfg, err := config.NewEnvConfig()
	if err != nil {
		return nil, err
	}

	ctx = ContextWithConfig(ctx, envCfg)
	return ctx, nil
}
