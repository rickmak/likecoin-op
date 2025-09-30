package config

import (
	"errors"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type EnvConfig struct {
	OpEthNetworkPublicRPCURL string `envconfig:"OP_ETH_NETWORK_PUBLIC_RPC_URL"`
	OpLikeNFTIndexerBaseURL  string `envconfig:"LIKENFT_INDEXER_BASE_URL"`
	OpLikeNFTIndexerAPIKey   string `envconfig:"LIKENFT_INDEXER_API_KEY"`

	BaseEthNetworkPublicRPCURL    string `envconfig:"BASE_ETH_NETWORK_PUBLIC_RPC_URL"`
	BaseEthSignerBaseUrl          string `envconfig:"BASE_ETH_SIGNER_BASE_URL"`
	BaseEthSignerAPIKey           string `envconfig:"BASE_ETH_SIGNER_API_KEY"`
	BaseEthLikeNFTContractAddress string `envconfig:"BASE_ETH_LIKENFT_CONTRACT_ADDRESS"`

	CreateAddress2DeployerAddress string `envconfig:"CREATE_ADDRESS_2_DEPLOYER_ADDRESS"`
	CreateAddress2InitHash        string `envconfig:"CREATE_ADDRESS_2_INIT_HASH"`
}

func NewEnvConfig() (*EnvConfig, error) {
	err := godotenv.Load()
	if errors.Is(err, os.ErrNotExist) {
		slog.Default().Warn("skip loading .env as it is absent")
	} else if err != nil {
		return nil, err
	}

	var cfg EnvConfig
	err = envconfig.Process("", &cfg)
	if err != nil {
		return nil, err
	}
	return &cfg, nil
}
