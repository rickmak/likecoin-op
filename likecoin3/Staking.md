# Staking

## Operations

### Stake

```
DOTENV_CONFIG_PATH=.env npx hardhat stake --network baseSepolia --amount 1000 --booknft 0x9EC5814c3307862e9647aA0CA6758fF294f6ba26
```

### Unstake

```
DOTENV_CONFIG_PATH=.env npx hardhat unstake --network baseSepolia --amount 1000 --booknft 0x9EC5814c3307862e9647aA0CA6758fF294f6ba26
```

### Emit Only Reward Added

```
DOTENV_CONFIG_PATH=.env npx hardhat emitOnlyRewardAdded --network baseSepolia --amount 1000 --booknft 0x9EC5814c3307862e9647aA0CA6758fF294f6ba26
```

### Claim

```
DOTENV_CONFIG_PATH=.env npx hardhat claimRewards --network baseSepolia --booknft 0x9EC5814c3307862e9647aA0CA6758fF294f6ba26
```

### Claim All Rewards

```
DOTENV_CONFIG_PATH=.env npx hardhat claimAllRewards --network baseSepolia
```

### Restake Reward

```
DOTENV_CONFIG_PATH=.env npx hardhat restakeReward --network baseSepolia --booknft 0x9EC5814c3307862e9647aA0CA6758fF294f6ba26
```
