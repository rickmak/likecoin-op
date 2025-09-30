package addressmapper

import "github.com/ethereum/go-ethereum/common"

type Cache interface {
	Get(opEvmClassId common.Address) (baseEvmClassId common.Address, ok bool)
	Set(opEvmClassId common.Address, baseEvmClassId common.Address)
}

type memoryCache struct {
	mappedAddressFromOpToBase map[common.Address]common.Address
}

func NewMemoryCache() Cache {
	mappedAddressFromOpToBase := make(map[common.Address]common.Address)
	return &memoryCache{
		mappedAddressFromOpToBase,
	}
}

func (c *memoryCache) Get(opEvmClassId common.Address) (baseEvmClassId common.Address, ok bool) {
	return c.mappedAddressFromOpToBase[opEvmClassId], ok
}

func (c *memoryCache) Set(opEvmClassId common.Address, baseEvmClassId common.Address) {
	c.mappedAddressFromOpToBase[opEvmClassId] = baseEvmClassId
}
