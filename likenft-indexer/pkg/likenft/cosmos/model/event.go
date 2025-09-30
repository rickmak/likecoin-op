package model

import "time"

type Event struct {
	Action    string    `json:"action"`
	ClassId   string    `json:"class_id"`
	NftId     string    `json:"nft_id"`
	Sender    string    `json:"sender"`
	Receiver  string    `json:"receiver"`
	TxHash    string    `json:"tx_hash"`
	Timestamp time.Time `json:"timestamp"`
	Memo      string    `json:"memo"`
}
