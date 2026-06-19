import { task } from "hardhat/config";
import { formatUnits } from "ethers";
import fs from "fs";
import path from "path";

// Likecoin uses 6 decimals.
const DECIMALS = 6;

type PositionRow = {
  tokenId: string;
  owner?: string;
  bookNFT: string;
  stakedAmount: string;
  posIndex: string;
  pending: string;
};
type PoolRow = {
  totalStaked: string;
  totalRewarded: string;
  rewardPending: string;
  poolIndex: string;
};
type Snapshot = {
  meta: {
    chainId: number;
    network: string;
    block: number;
    collective: string;
    stakePosition: string;
  };
  pools: Record<string, PoolRow>;
  positions: PositionRow[];
};
type DriftReport = {
  driftedBookNFTs: string[];
  drifted: { bookNFT: string }[];
  inflated: { bookNFT: string }[];
};

// One position's off-chain payout.
type Dist = {
  tokenId: string;
  owner: string;
  bookNFT: string;
  stakedAmount: string;
  claimable: string; // snapshot getRewardsOfPosition (may be inflated)
  owed: string; // funded pro-rata payout
  owedLike: string;
};
// One pool's adminResetPool(bookNFT, tokenIds, expectedTotalStaked) call args.
type PoolPlan = {
  bookNFT: string;
  positions: number;
  tokenIds: string[];
  expectedTotalStaked: string; // Σ stakedAmount, checked on-chain
  recordedTotalStaked: string; // pool.totalStaked on-chain (for reference)
  rewardPendingFunded: string; // real LIKE available to distribute
  sumClaimable: string; // Σ snapshot claimable in this pool
  inflated: boolean; // sumClaimable > rewardPendingFunded
  proratedByStake: boolean; // fallback used (no claimable but funds exist)
};
// Everything the four output writers need, computed once.
type ResetPlan = {
  pools: PoolPlan[];
  dist: Dist[];
  byOwner: Map<string, bigint>;
  grandFunded: bigint;
  grandOwed: bigint;
};

function latestSnapshot(dir: string, chainId: number): string | undefined {
  if (!fs.existsSync(dir)) return undefined;
  const files = fs
    .readdirSync(dir)
    .filter(
      (f) =>
        f.startsWith(`${chainId}-`) &&
        f.endsWith(".json") &&
        !f.includes(".drift") &&
        !f.includes(".reset"),
    )
    .map((f) => ({
      f,
      block: parseInt(f.slice(`${chainId}-`.length, -".json".length), 10),
    }))
    .sort((a, b) => b.block - a.block);
  return files.length ? path.join(dir, files[0].f) : undefined;
}

function like(raw: bigint): string {
  return formatUnits(raw, DECIMALS);
}

// ---- Plan computation -------------------------------------------------------
// Build the per-pool reset args and the funded pro-rata payout per position,
// for every pool that drifted OR has an inflated reward index. Healthy pools
// are left untouched (their indices fund real, still-accruing rewards).
function computeResetPlan(snap: Snapshot, drift: DriftReport): ResetPlan {
  const resetBooks = new Set<string>(
    [
      ...drift.driftedBookNFTs,
      ...(drift.inflated ?? []).map((d) => d.bookNFT),
    ].map((b) => b.toLowerCase()),
  );

  // Group affected positions by bookNFT, preserving snapshot order.
  const byBook = new Map<string, PositionRow[]>();
  for (const p of snap.positions) {
    const book = p.bookNFT.toLowerCase();
    if (!resetBooks.has(book)) continue;
    const list = byBook.get(book);
    if (list) list.push(p);
    else byBook.set(book, [p]);
  }

  const pools: PoolPlan[] = [];
  const dist: Dist[] = [];
  let grandFunded = 0n;

  for (const [book, positions] of byBook) {
    const pool = snap.pools[book] ?? snap.pools[positions[0].bookNFT];
    const expectedTotalStaked = positions.reduce(
      (acc, p) => acc + BigInt(p.stakedAmount),
      0n,
    );
    const funded = pool ? BigInt(pool.rewardPending) : 0n;
    const sumClaimable = positions.reduce(
      (acc, p) => acc + BigInt(p.pending),
      0n,
    );
    grandFunded += funded;

    // Weight each position by its claimable share of the pool; if nobody has
    // claimable but the pool still holds reward LIKE, fall back to stake share
    // so the funds aren't stranded.
    const proratedByStake = sumClaimable === 0n && funded > 0n;
    const weightOf = (p: PositionRow): bigint =>
      proratedByStake ? BigInt(p.stakedAmount) : BigInt(p.pending);
    const totalWeight = proratedByStake ? expectedTotalStaked : sumClaimable;

    const rows: Dist[] = positions.map((p) => {
      const owed =
        totalWeight === 0n ? 0n : (funded * weightOf(p)) / totalWeight;
      return {
        tokenId: p.tokenId,
        owner: p.owner as string,
        bookNFT: p.bookNFT,
        stakedAmount: p.stakedAmount,
        claimable: p.pending,
        owed: owed.toString(),
        owedLike: like(owed),
      };
    });

    // Conserve funds exactly: assign the integer-division dust to the
    // largest-weight position so Σ owed == funded.
    const assigned = rows.reduce((acc, r) => acc + BigInt(r.owed), 0n);
    const dust = funded - assigned;
    if (dust > 0n && rows.length > 0) {
      let maxIdx = 0;
      for (let i = 1; i < positions.length; i++) {
        if (weightOf(positions[i]) > weightOf(positions[maxIdx])) maxIdx = i;
      }
      const fixed = BigInt(rows[maxIdx].owed) + dust;
      rows[maxIdx].owed = fixed.toString();
      rows[maxIdx].owedLike = like(fixed);
    }

    pools.push({
      bookNFT: positions[0].bookNFT,
      positions: positions.length,
      tokenIds: positions.map((p) => p.tokenId),
      expectedTotalStaked: expectedTotalStaked.toString(),
      recordedTotalStaked: pool ? pool.totalStaked : "0",
      rewardPendingFunded: funded.toString(),
      sumClaimable: sumClaimable.toString(),
      inflated: sumClaimable > funded,
      proratedByStake,
    });
    dist.push(...rows);
  }

  pools.sort((a, b) => (a.bookNFT < b.bookNFT ? -1 : 1));

  // Aggregate the off-chain payout per owner.
  const byOwner = new Map<string, bigint>();
  for (const d of dist) {
    const key = d.owner.toLowerCase();
    byOwner.set(key, (byOwner.get(key) ?? 0n) + BigInt(d.owed));
  }
  const grandOwed = dist.reduce((acc, d) => acc + BigInt(d.owed), 0n);

  return { pools, dist, byOwner, grandFunded, grandOwed };
}

// ---- Output writers (one per file) ------------------------------------------

// 1. Full plan: per-pool adminResetPool args + reset batches + per-position payout.
function writePlanJson(
  base: string,
  snap: Snapshot,
  snapFile: string,
  driftFile: string,
  plan: ResetPlan,
): string {
  const out = {
    meta: {
      ...snap.meta,
      snapshotFile: snapFile,
      driftFile,
      poolsToReset: plan.pools.length,
      positionsToReset: plan.dist.length,
      grandFunded: plan.grandFunded.toString(),
      grandOwed: plan.grandOwed.toString(),
    },
    pools: plan.pools,
    distribution: plan.dist,
  };
  const file = `${base}.reset.json`;
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  return file;
}

// 2. Per-position distribution CSV (off-chain payout, per NFT).
function writeDistributionCsv(base: string, plan: ResetPlan): string {
  const csv = [
    "owner,bookNFT,tokenId,stakedAmount,claimable_raw,owed_raw,owed_like",
    ...plan.dist.map(
      (d) =>
        `${d.owner},${d.bookNFT},${d.tokenId},${d.stakedAmount},${d.claimable},${d.owed},${d.owedLike}`,
    ),
  ].join("\n");
  const file = `${base}.reset.distribution.csv`;
  fs.writeFileSync(file, csv);
  return file;
}

// 3. Per-owner payout CSV (one transfer per owner).
function writeByOwnerCsv(base: string, plan: ResetPlan): string {
  const csv = [
    "owner,owed_raw,owed_like",
    ...[...plan.byOwner.entries()]
      .sort((a, b) => (a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0))
      .map(([owner, owed]) => `${owner},${owed.toString()},${like(owed)}`),
  ].join("\n");
  const file = `${base}.reset.byowner.csv`;
  fs.writeFileSync(file, csv);
  return file;
}

// 4. adminResetPool calls only.
//
// This script does NOT pause/unpause and does NOT sweep — those are runbook
// steps (see patch-drift.md) the operator runs by hand around this script:
//   runbook: pause()  -> snapshot@paused -> THIS SCRIPT -> adminSweep() -> unpause()
//
// Each adminResetPool zeroes the pool + every position's reward index and
// restores totalStaked. It reverts with ErrIncompletePositionSet unless the
// on-chain Σ stakedAmount of the listed tokenIds == expectedTotalStaked, so the
// snapshot must reflect the paused state (re-snapshot at the paused block).
function writeCommandsScript(
  base: string,
  snap: Snapshot,
  snapFile: string,
  plan: ResetPlan,
  opts: { account: string },
): string {
  const acct = opts.account;
  const castSend = (sig: string, callArgs: string): string =>
    `cast send "$COLLECTIVE" "${sig}" ${callArgs}` +
    ` \\\n    --rpc-url "$RPC_URL" --account "$OWNER_ACCOUNT"`;

  const lines: string[] = [
    "#!/usr/bin/env bash",
    "#",
    `# Drift-reset adminResetPool calls for ${snap.meta.network} (chainId ${snap.meta.chainId})`,
    `# Generated from ${path.basename(snapFile)} @ block ${snap.meta.block}.`,
    `# Pools to reset: ${plan.pools.length}  |  positions: ${plan.dist.length}.`,
    "#",
    "# This script runs ONLY the adminResetPool calls. Per the runbook:",
    "#   * LikeCollective MUST already be paused before you run this.",
    "#   * LikeStakePosition MUST stay UNPAUSED throughout.",
    `#   * After this completes, sweep ${like(plan.grandFunded)} LIKE (adminSweep)`,
    "#     then unpause() — both are runbook steps, not in this script.",
    "#   * Each adminResetPool reverts (ErrIncompletePositionSet) if on-chain",
    "#     Σ stakedAmount of its tokenIds != expectedTotalStaked — re-snapshot at",
    `#     the paused block and regenerate if anything moved since block ${snap.meta.block}.`,
    "#",
    "# Usage:",
    '#   export RPC_URL="https://<chain>.g.alchemy.com/v2/<KEY>"',
    `#   export OWNER_ACCOUNT="${acct}"   # override if needed`,
    `#   bash ${path.basename(base)}.reset.commands.sh`,
    "set -euo pipefail",
    "",
    `COLLECTIVE=${snap.meta.collective}`,
    "RPC_URL=${RPC_URL:?set RPC_URL to the chain RPC endpoint}",
    `OWNER_ACCOUNT=\${OWNER_ACCOUNT:-${acct}}`,
    "",
    `echo "== adminResetPool x${plan.pools.length} =="`,
  ];

  plan.pools.forEach((p, i) => {
    lines.push(
      `# pool ${i + 1}/${plan.pools.length}  ${p.bookNFT}  ${p.positions}pos  ` +
        `recorded ${like(BigInt(p.recordedTotalStaked))} -> true ${like(BigInt(p.expectedTotalStaked))} LIKE` +
        (p.inflated ? "  [index was INFLATED]" : ""),
      castSend(
        "adminResetPool(address,uint256[],uint256)",
        `${p.bookNFT} "[${p.tokenIds.join(",")}]" ${p.expectedTotalStaked}`,
      ),
      "",
    );
  });

  lines.push(
    `echo "adminResetPool complete. Runbook next: adminSweep ${like(plan.grandFunded)} LIKE, then unpause()."`,
    "",
  );

  const file = `${base}.reset.commands.sh`;
  fs.writeFileSync(file, lines.join("\n"));
  return file;
}

// ---- Task -------------------------------------------------------------------
task(
  "resetLedger",
  "Plan the drift reset: per-pool adminResetPool args, and the " +
    "pro-rata (funded) reward each position is owed off-chain.",
)
  .addOptionalParam(
    "file",
    "Snapshot JSON path (default: latest for this chain)",
  )
  .addOptionalParam(
    "drift",
    "checkDrift report JSON (default: <snapshot>.drift.json)",
  )
  .addOptionalParam(
    "account",
    "cast --account name (keystore/ledger) used to sign the admin calls",
    "likecoin-deployer.eth",
  )
  .addOptionalParam(
    "sweepto",
    "Destination for adminSweep (downstream book store / treasury). " +
      "Left as a placeholder if omitted.",
  )
  .setAction(async (args, { network }) => {
    const chainId = network.config.chainId ?? 0;
    const dir = path.join(__dirname, "..", "snapshot");

    const snapFile = args.file || latestSnapshot(dir, chainId);
    if (!snapFile || !fs.existsSync(snapFile)) {
      throw new Error(
        `No snapshot found. Run \`hardhat snapshot --network ${network.name}\` first, or pass --file.`,
      );
    }
    const driftFile =
      args.drift || snapFile.replace(/\.json$/, "") + ".drift.json";
    if (!fs.existsSync(driftFile)) {
      throw new Error(
        `No drift report at ${driftFile}. Run \`hardhat checkDrift --file ${snapFile}\` first, or pass --drift.`,
      );
    }

    const snap: Snapshot = JSON.parse(fs.readFileSync(snapFile, "utf8"));
    const drift: DriftReport = JSON.parse(fs.readFileSync(driftFile, "utf8"));

    if (snap.positions.some((p) => !p.owner)) {
      throw new Error(
        "Snapshot has no `owner` field on positions. Re-run `hardhat snapshot`.",
      );
    }

    const plan = computeResetPlan(snap, drift);

    // ---- Console summary ----
    console.log(`Snapshot:      ${snapFile}`);
    console.log(`Drift report:  ${driftFile}`);
    console.log(`Block:         ${snap.meta.block}`);
    console.log(`Pools to reset: ${plan.pools.length}`);
    console.log("");
    console.log(`Positions to reset:     ${plan.dist.length}`);
    console.log(`Owners to pay:          ${plan.byOwner.size}`);
    console.log(
      `Reward LIKE to sweep:   ${plan.grandFunded.toString()}  (${like(plan.grandFunded)} LIKE)`,
    );
    console.log(
      `Distributed (Σ owed):   ${plan.grandOwed.toString()}  (${like(plan.grandOwed)} LIKE)`,
    );
    if (plan.grandOwed !== plan.grandFunded) {
      console.log(
        `⚠️  Σ owed != funded by ${(plan.grandFunded - plan.grandOwed).toString()} — check pools with no claimable & no stake.`,
      );
    }
    console.log("");
    console.log("Pools (recorded -> true totalStaked | funded / claimable):");
    for (const p of plan.pools) {
      const flag = p.inflated ? " INFLATED⛔" : "";
      const fb = p.proratedByStake ? " [by-stake]" : "";
      console.log(
        `  ${p.bookNFT}  ${p.positions}pos  ` +
          `${like(BigInt(p.recordedTotalStaked))} -> ${like(BigInt(p.expectedTotalStaked))} LIKE  | ` +
          `funded ${like(BigInt(p.rewardPendingFunded))} / claimable ${like(BigInt(p.sumClaimable))}${flag}${fb}`,
      );
    }
    console.log("");

    // ---- Outputs: four files, one writer each ----
    const base = snapFile.replace(/\.json$/, "");
    console.log(
      `Wrote plan:         ${writePlanJson(base, snap, snapFile, driftFile, plan)}`,
    );
    console.log(`Wrote distribution: ${writeDistributionCsv(base, plan)}`);
    console.log(`Wrote by-owner:     ${writeByOwnerCsv(base, plan)}`);
    console.log(
      `Wrote commands:     ${writeCommandsScript(base, snap, snapFile, plan, { account: args.account })}  (adminResetPool x${plan.pools.length} only)`,
    );

    // The script does adminResetPool only. pause/sweep/unpause are runbook steps —
    // print the exact cast commands so they can go straight into the runbook.
    const sweepTo = args.sweepto || "<SWEEP_TO>";
    const cast = (sig: string, a: string) =>
      `  cast send ${snap.meta.collective} "${sig}" ${a} --rpc-url "$RPC_URL" --account ${args.account}`;
    console.log("");
    console.log("Runbook steps around the script (NOT generated into it):");
    console.log(`  [before] ${cast("pause()", "").trim()}`);
    console.log(
      `  [after ] ${cast("adminSweep(address,uint256)", `${sweepTo} ${plan.grandFunded.toString()}`).trim()}   # ${like(plan.grandFunded)} LIKE`,
    );
    console.log(`  [after ] ${cast("unpause()", "").trim()}`);
    if (sweepTo === "<SWEEP_TO>") {
      console.log(
        "  ⚠️  pass --sweepto to fill the adminSweep destination above.",
      );
    }
  });
