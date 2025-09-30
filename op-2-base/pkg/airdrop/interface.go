package airdrop

type AirdropBookNFTResult struct {
	TxHash      string `json:"txHash"`
	BaseClassId string `json:"baseClassId"`
}

type AirdropTokenResult struct {
	BatchMintTxHash string `json:"batchMintTxHash"`
	TransferTxHash  string `json:"transferTxHash"`
}
