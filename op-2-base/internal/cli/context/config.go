package context

import (
	"context"

	"github.com/likecoin/likecoin-op/op-2-base/internal/cli/config"
)

type configContextKey struct{}

var ConfigContextKey = &configContextKey{}

func ContextWithConfig(ctx context.Context, envCfg *config.EnvConfig) context.Context {
	return context.WithValue(ctx, ConfigContextKey, envCfg)
}

func ConfigFromContext(ctx context.Context) *config.EnvConfig {
	return ctx.Value(ConfigContextKey).(*config.EnvConfig)
}
