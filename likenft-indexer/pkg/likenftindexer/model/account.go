package model

type Account struct {
	CosmosAddress string `json:"cosmos_address"`
	EvmAddress    string `json:"evm_address"`
	LikeID        string `json:"likeid"`
}
