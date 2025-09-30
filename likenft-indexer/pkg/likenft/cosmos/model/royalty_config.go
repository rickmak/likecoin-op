package model

type RoyaltyConfig struct {
	RateBasisPoints string                     `json:"rate_basis_points"`
	Stakeholders    []RoyaltyConfigStakeholder `json:"stakeholders"`
}

type RoyaltyConfigStakeholder struct {
	Account string `json:"account"`
	Weight  string `json:"weight"`
}
