package addressmapper

import "github.com/ethereum/go-ethereum/common"

type GetBaseAddressFromOpAddress func(opEvmClassId common.Address) (common.Address, error)
