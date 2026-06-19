# LikeCollective drift patch — action plan

Recovering LikeCollective pools whose `totalStaked` drifted below `Σ stakedAmount`
(and whose reward index inflated as a result), by resetting affected pools to a
clean, internally-consistent slate on-chain and redistributing the funded reward
off-chain.

**Reference snapshot:** block `47542905` → 56 pools to reset, 433 positions,
  `48384.355513 LIKE` to sweep.

Q1. Do 3ook.com need to redistribution.
YES

Q2: How the off-chain redistribution:

The off-chain payout is **funded pro-rata**: each position is owed its share
of the pool's real `rewardPending` (weighted by claimable, or by stake if nobody
has claimable), with integer-division dust assigned to the largest-weight
position so `Σ owed == grandFunded`.

Q3. Address of the API wallet

Even we might use likecoin-deployer.eth, but from API wallet seem easier to understand on chain.

## Contract upgrade for admin (`contracts/LikeCollective.sol`)

```solidity
function adminResetPool(address bookNFT, uint256[] calldata tokenIds, uint256 expectedTotalStaked) external onlyOwner;
function adminSweep(address to, uint256 amount) external onlyOwner;
```
- **Completeness is NOT enforced by the contract** — it only checks the sum over
  the tokens you pass. The tooling must supply *every* live position of the pool
  (it does; see below).
- `adminResetPool` — Reset the Pool with the expectedTotalStake prep by toolings.
- `adminSweep` — transfers the now-orphaned reward LIKE out for off-chain
  redistribution. Emits `AdminSwept`.
- Both are `onlyOwner`, neither is `whenNotPaused`, so they run while
  LikeCollective is paused. **LikeStakePosition must stay UNPAUSED** —
  `adminResetPool` calls its `whenNotPaused` `updatePositionRewardIndex`.

## Tooling pipeline (`tasks/`)

```
snapshot      → snapshot/<chainId>-<block>.json              (reads chain)
checkDrift    → <snap>.drift.json                            (file-only)
driftPending  → <snap>.driftpending.{json,csv}               (file-only, refund view)
resetLedger   → <snap>.reset.json
                <snap>.reset.distribution.csv  (per-position funded payout)
                <snap>.reset.byowner.csv       (one transfer per owner)
                <snap>.reset.commands.sh       (ready-to-run cast send runbook)
```

`resetLedger` reset set = pools that drifted OR have an inflated index. Healthy
pools are left untouched.

> ⚠️ INFLATED pools: on-chain claimable is corrupt (~`3.18e15 LIKE` at the
> reference block). Do **not** refund at face value — use the funded `owed`
> column in `*.reset.distribution.csv`.

## Execution runbook

### 0. Prep
- Confirm you control the LikeCollective owner key (cast keystore/ledger account,
  e.g. `likecoin-deployer.eth`).
- Confirm LikeStakePosition is unpaused and stays unpaused throughout.

`COLLECTIVE = 0x4506Ac2dD1e9A470d92a3D1656E1a99C676E1c8E` (LikeCollective proxy).
The reset/sweep are **manual runbook steps**; the generated `commands.sh` contains
only the `adminResetPool` calls.

```
export COLLECTIVE=0x4506Ac2dD1e9A470d92a3D1656E1a99C676E1c8E 
export RPC_URL="https://base-mainnet.g.alchemy.com/v2/<KEY>"
export OWNER_ACCOUNT="likecoin-deployer.eth"
export SWEEP_TO="0x..."   # downstream book store / treasury
```

### 1. Pause + snapshot at the paused block
`expectedTotalStaked` must match on-chain `Σ stakedAmount` at execution time, or
`adminResetPool` reverts with `ErrIncompletePositionSet` (a safety feature). So:

1. `cast send $COLLECTIVE "pause()" --account $OWNER_ACCOUNT` — freeze user stake/claim writes. # TODO: Replace collective with actual address
2. Re-snapshot at the paused block, then regenerate the plan:
   ```bash
   npx hardhat snapshot   --network base --block <PAUSED_BLOCK>
   npx hardhat checkDrift --network base --file snapshot/8453-<PAUSED_BLOCK>.json
   npx hardhat resetLedger --network base \
       --file snapshot/8453-<PAUSED_BLOCK>.json \
       --account $OWNER_ACCOUNT \
       --sweepto $SWEEP_TO
   ```
   (`snapshot`/`checkDrift`/`resetLedger` are idempotent; only `snapshot` touches
   the chain. `pause()` is already in the generated script as Step 1 — skip the
   manual pause above if you let the script do it, but pausing first then
   snapshotting is what guarantees a consistent plan.)

### 2. Run the on-chain reset
Review `snapshot/8453-<block>.reset.commands.sh`, then: #TODO: since the play book pause above, aupdate the task resetLedger to generate command without pause/unpause.
```bash

bash snapshot/8453-<block>.reset.commands.sh
```
The script runs: `pause()` → `adminResetPool` ×N (one per pool) →
`adminSweep(SWEEP_TO, grandFunded)` → `unpause()`. # TODO: the adminSweep should in runbook, not in the generate.sh;

### 3. Off-chain redistribution

Pay each owner from `snapshot/8453-<block>.reset.distribution.csv` (the funded
`owed` column), sourced from the swept LIKE. `*.reset.byowner.csv` aggregates to
one transfer per owner. `Σ owed == grandFunded`.