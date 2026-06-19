import { task } from "hardhat/config";
import { formatUnits } from "ethers";
import fs from "fs";
import path from "path";

// Likecoin uses 6 decimals.
const DECIMALS = 6;

type PoolRow = {
  totalStaked: string;
  totalRewarded: string;
  rewardPending: string;
  poolIndex: string;
};
type PositionRow = {
  tokenId: string;
  owner?: string;
  bookNFT: string;
  stakedAmount: string;
  posIndex: string;
  pending: string;
};
type Snapshot = {
  meta: {
    chainId: number;
    network: string;
    block: number;
    collective: string;
    stakePosition: string;
    positionCount: number;
    poolCount: number;
  };
  pools: Record<string, PoolRow>;
  positions: PositionRow[];
};

// Pick the most recent snapshot/<chainId>-<block>.json for this chain.
function latestSnapshot(dir: string, chainId: number): string | undefined {
  if (!fs.existsSync(dir)) return undefined;
  const files = fs
    .readdirSync(dir)
    .filter(
      (f) =>
        f.startsWith(`${chainId}-`) &&
        f.endsWith(".json") &&
        !f.endsWith(".drift.json") &&
        !f.endsWith(".driftpending.json"),
    )
    .map((f) => ({
      f,
      block: parseInt(f.slice(`${chainId}-`.length, -".json".length), 10),
    }))
    .sort((a, b) => b.block - a.block);
  return files.length ? path.join(dir, files[0].f) : undefined;
}

function like(raw: bigint): string {
  return `${formatUnits(raw, DECIMALS)} LIKE`;
}

task(
  "checkDrift",
  "Analyze a snapshot/ JSON: list pools with totalStaked drift and/or an inflated rewardIndex",
)
  .addOptionalParam(
    "file",
    "Snapshot JSON path (default: latest for this chain)",
  )
  .addFlag("dump", "Dump per-position posIndex / pending for flagged pools")
  .setAction(async (args, { network }) => {
    const chainId = network.config.chainId ?? 0;
    const dir = path.join(__dirname, "..", "snapshot");
    const file = args.file || latestSnapshot(dir, chainId);
    if (!file || !fs.existsSync(file)) {
      throw new Error(
        `No snapshot found. Run \`hardhat snapshot --network ${network.name}\` first, ` +
          `or pass --file <path>.`,
      );
    }

    const snap: Snapshot = JSON.parse(fs.readFileSync(file, "utf8"));
    console.log(`Snapshot:          ${file}`);
    console.log(`Network/block:     ${snap.meta.network} @ ${snap.meta.block}`);
    console.log(`LikeCollective:    ${snap.meta.collective}`);
    console.log(`LikeStakePosition: ${snap.meta.stakePosition}`);
    console.log(
      `Positions / pools: ${snap.meta.positionCount} / ${snap.meta.poolCount}`,
    );
    console.log("");

    // Aggregate per book.
    type Agg = {
      stakedSum: bigint; // Σ position.stakedAmount  (true totalStaked)
      claimableRewardSum: bigint; // Σ getRewardsOfPosition  (claimable per index)
      count: number;
      minPosIndex: bigint;
      maxPosIndex: bigint;
      zeroPos: number; // posIndex == 0  (never settled / claimed / restaked)
      nonZeroPos: number; // posIndex != 0  (has been settled at a non-zero poolIndex)
    };
    const agg = new Map<string, Agg>();
    for (const p of snap.positions) {
      const staked = BigInt(p.stakedAmount);
      const pending = BigInt(p.pending);
      const posIndex = BigInt(p.posIndex);
      const a = agg.get(p.bookNFT);
      if (!a) {
        agg.set(p.bookNFT, {
          stakedSum: staked,
          claimableRewardSum: pending,
          count: 1,
          minPosIndex: posIndex,
          maxPosIndex: posIndex,
          zeroPos: posIndex === 0n ? 1 : 0,
          nonZeroPos: posIndex === 0n ? 0 : 1,
        });
      } else {
        a.stakedSum += staked;
        a.claimableRewardSum += pending;
        a.count += 1;
        if (posIndex < a.minPosIndex) a.minPosIndex = posIndex;
        if (posIndex > a.maxPosIndex) a.maxPosIndex = posIndex;
        if (posIndex === 0n) a.zeroPos += 1;
        else a.nonZeroPos += 1;
      }
    }

    type Row = {
      bookNFT: string;
      positions: number;
      recordedStakedAmount: bigint; // pool.totalStaked
      expectedStakedAmount: bigint; // Σ stakedAmount
      driftedStakedAmount: bigint; // expectedStakedAmount - recordedStakedAmount
      poolIndex: bigint;
      minPosIndex: bigint;
      maxPosIndex: bigint;
      zeroPos: number;
      nonZeroPos: number;
      rewardPending: bigint;
      totalRewarded: bigint;
      claimableRewardSum: bigint; // Σ claimable
      pendingRewardGap: bigint; // rewardPending - claimableRewardSum  (negative => inflated)
    };

    const rows: Row[] = [];
    for (const [bookNFT, a] of agg) {
      const pool = snap.pools[bookNFT];
      if (!pool) continue;
      const recordedStakedAmount = BigInt(pool.totalStaked);
      const rewardPending = BigInt(pool.rewardPending);
      const totalRewarded = BigInt(pool.totalRewarded);
      rows.push({
        bookNFT,
        positions: a.count,
        recordedStakedAmount,
        expectedStakedAmount: a.stakedSum,
        driftedStakedAmount: a.stakedSum - recordedStakedAmount,
        poolIndex: BigInt(pool.poolIndex),
        minPosIndex: a.minPosIndex,
        maxPosIndex: a.maxPosIndex,
        zeroPos: a.zeroPos,
        nonZeroPos: a.nonZeroPos,
        rewardPending,
        totalRewarded,
        claimableRewardSum: a.claimableRewardSum,
        pendingRewardGap: rewardPending - a.claimableRewardSum,
      });
    }

    const drifted = rows.filter((r) => r.driftedStakedAmount !== 0n);
    // Inflated index = positions can claim strictly more than rewardPending holds.
    // A small positive gap (rewardPending >= claimableRewardSum) is normal integer-division dust.
    const inflated = rows.filter((r) => r.pendingRewardGap < 0n);

    drifted.sort((a, b) =>
      a.driftedStakedAmount > b.driftedStakedAmount
        ? -1
        : a.driftedStakedAmount < b.driftedStakedAmount
          ? 1
          : 0,
    );
    inflated.sort((a, b) =>
      a.pendingRewardGap < b.pendingRewardGap
        ? -1
        : a.pendingRewardGap > b.pendingRewardGap
          ? 1
          : 0,
    );

    console.log(`Pools checked:        ${rows.length}`);
    console.log(`totalStaked drifting: ${drifted.length}`);
    console.log(`rewardIndex inflated: ${inflated.length}`);
    console.log("");

    // ---- Section 1: totalStaked drift ----
    if (drifted.length === 0) {
      console.log("✅ All pools consistent: totalStaked == Σ stakedAmount.");
    } else {
      console.log(
        "⚠️  totalStaked drift (driftedStakedAmount = expectedStakedAmount - recordedStakedAmount):",
      );
      console.log("");
      for (const r of drifted) {
        console.log(`  bookNFT:   ${r.bookNFT}`);
        console.log(`    positions:            ${r.positions}`);
        console.log(
          `    recordedStakedAmount: ${r.recordedStakedAmount.toString()}`,
        );
        console.log(
          `    expectedStakedAmount: ${r.expectedStakedAmount.toString()}`,
        );
        console.log(
          `    driftedStakedAmount:  ${r.driftedStakedAmount.toString()}  (${like(r.driftedStakedAmount)})`,
        );
        console.log(`    poolIndex:            ${r.poolIndex.toString()}`);
        console.log(
          `    posIndex:             min=${r.minPosIndex.toString()} max=${r.maxPosIndex.toString()}` +
            `  (zero=${r.zeroPos} nonzero=${r.nonZeroPos})`,
        );
        console.log(
          `    rewardPending: ${r.rewardPending.toString()}  | claimableRewardSum: ${r.claimableRewardSum.toString()}` +
            `  | index: ${r.pendingRewardGap < 0n ? "INFLATED ⛔" : "ok"}`,
        );
        console.log(
          `    totalRewarded: ${r.totalRewarded.toString()}  (${like(r.totalRewarded)})  [reward already paid out]`,
        );
        if (args.dump) {
          for (const p of snap.positions.filter(
            (p) => p.bookNFT === r.bookNFT,
          )) {
            console.log(
              `      token ${p.tokenId}: staked=${p.stakedAmount} posIndex=${p.posIndex} pending=${p.pending}`,
            );
          }
        }
        console.log("");
      }
      const totalDriftedStakedAmount = drifted.reduce(
        (acc, r) => acc + r.driftedStakedAmount,
        0n,
      );
      console.log(
        `Total under-counted: ${totalDriftedStakedAmount.toString()} (${like(totalDriftedStakedAmount)})`,
      );
      console.log("");
    }

    // ---- Section 2: rewardIndex validity ----
    console.log("──────────────────────────────────────────────");
    if (inflated.length === 0) {
      console.log(
        "✅ rewardIndex valid for every pool: claimableRewardSum <= rewardPending (only dust remainder).",
      );
    } else {
      console.log(
        "⛔ rewardIndex INFLATED (claimableRewardSum > rewardPending — over-credited by a",
      );
      console.log("   depositReward that ran while totalStaked was drifted):");
      console.log("");
      let totalOver = 0n;
      for (const r of inflated) {
        const over = -r.pendingRewardGap;
        totalOver += over;
        console.log(`  bookNFT:   ${r.bookNFT}`);
        console.log(`    positions:          ${r.positions}`);
        console.log(`    poolIndex:          ${r.poolIndex.toString()}`);
        console.log(
          `    rewardPending:      ${r.rewardPending.toString()}  (${like(r.rewardPending)})`,
        );
        console.log(
          `    totalRewarded:      ${r.totalRewarded.toString()}  (${like(r.totalRewarded)})  [already paid out]`,
        );
        console.log(
          `    claimableRewardSum: ${r.claimableRewardSum.toString()}  (${like(r.claimableRewardSum)})`,
        );
        console.log(
          `    over-credit:        ${over.toString()}  (${like(over)})  [still claimable but unfunded]`,
        );
        console.log("");
      }
      console.log(
        `Total over-credited: ${totalOver.toString()} (${like(totalOver)})`,
      );
      console.log("");
      console.log(
        "   These pools need rewardIndex reconciliation (history replay), NOT just a totalStaked fix.",
      );
    }

    // ---- Machine-readable report (consumed by driftPending) ----
    const serializeRow = (r: Row) => ({
      bookNFT: r.bookNFT,
      positions: r.positions,
      recordedStakedAmount: r.recordedStakedAmount.toString(),
      expectedStakedAmount: r.expectedStakedAmount.toString(),
      driftedStakedAmount: r.driftedStakedAmount.toString(),
      poolIndex: r.poolIndex.toString(),
      rewardPending: r.rewardPending.toString(),
      totalRewarded: r.totalRewarded.toString(),
      claimableRewardSum: r.claimableRewardSum.toString(),
      pendingRewardGap: r.pendingRewardGap.toString(),
      inflated: r.pendingRewardGap < 0n,
      zeroPos: r.zeroPos,
      nonZeroPos: r.nonZeroPos,
    });
    const report = {
      meta: { ...snap.meta, snapshotFile: file },
      driftedBookNFTs: drifted.map((r) => r.bookNFT),
      drifted: drifted.map(serializeRow),
      inflated: inflated.map(serializeRow),
    };
    const outFile = file.replace(/\.json$/, "") + ".drift.json";
    fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
    console.log("");
    console.log(`Wrote report: ${outFile}`);
  });
