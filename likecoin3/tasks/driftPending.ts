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
type Snapshot = {
  meta: {
    chainId: number;
    network: string;
    block: number;
    collective: string;
    stakePosition: string;
  };
  pools: Record<string, unknown>;
  positions: PositionRow[];
};
type DriftReport = {
  meta: { snapshotFile: string; block: number; network: string };
  driftedBookNFTs: string[];
  drifted: {
    bookNFT: string;
    inflated: boolean;
    recordedStakedAmount: string;
  }[];
  inflated: { bookNFT: string }[];
};

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
  return formatUnits(raw, DECIMALS);
}

task(
  "driftPending",
  "Per-user outstanding reward (getRewardsOfPosition) for drifted pools only — what each user would be owed if pending is reset to zero",
)
  .addOptionalParam(
    "file",
    "Snapshot JSON path (default: latest for this chain)",
  )
  .addOptionalParam(
    "drift",
    "checkDrift report JSON (default: <snapshot>.drift.json)",
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
        "Snapshot has no `owner` field on positions. Re-run `hardhat snapshot` (it now records ownerOf).",
      );
    }

    const driftedBooks = new Set(
      drift.driftedBookNFTs.map((b) => b.toLowerCase()),
    );
    const inflatedBooks = new Set(
      (drift.inflated ?? []).map((d) => d.bookNFT.toLowerCase()),
    );
    // bookNFT -> pool.totalStaked (recorded on-chain).
    const recordedByBook = new Map<string, bigint>(
      drift.drifted.map((d) => [
        d.bookNFT.toLowerCase(),
        BigInt(d.recordedStakedAmount),
      ]),
    );
    console.log(`Snapshot:      ${snapFile}`);
    console.log(`Drift report:  ${driftFile}`);
    console.log(`Block:         ${snap.meta.block}`);
    console.log(`Drifted pools: ${driftedBooks.size}`);

    // Inflated pools that are NOT totalStaked-drifted are excluded from this
    // refund list (we only cover drifted books) — surface them explicitly.
    const inflatedNotDrifted = [...inflatedBooks].filter(
      (b) => !driftedBooks.has(b),
    );
    if (inflatedNotDrifted.length > 0) {
      console.log("");
      console.log(
        `⚠️  ${inflatedNotDrifted.length} INFLATED pool(s) are NOT totalStaked-drifted and are`,
      );
      console.log(
        "   therefore NOT in this refund list, but still have corrupt pending:",
      );
      for (const b of inflatedNotDrifted) console.log(`     ${b}`);
    }
    console.log("");

    // Aggregate outstanding pending by (user, book), restricted to drifted pools.
    // key = `${owner}|${bookNFT}`
    type Cell = {
      user: string;
      bookNFT: string;
      outstanding: bigint;
      tokenIds: string[];
      inflated: boolean;
    };
    const cells = new Map<string, Cell>();
    const userTotal = new Map<string, bigint>();

    for (const p of snap.positions) {
      const book = p.bookNFT.toLowerCase();
      if (!driftedBooks.has(book)) continue;
      const pending = BigInt(p.pending);
      const owner = p.owner as string;
      const key = `${owner.toLowerCase()}|${book}`;
      let cell = cells.get(key);
      if (!cell) {
        cell = {
          user: owner,
          bookNFT: p.bookNFT,
          outstanding: 0n,
          tokenIds: [],
          inflated: inflatedBooks.has(book),
        };
        cells.set(key, cell);
      }
      cell.outstanding += pending;
      cell.tokenIds.push(p.tokenId);
      userTotal.set(
        owner.toLowerCase(),
        (userTotal.get(owner.toLowerCase()) ?? 0n) + pending,
      );
    }

    const rows = [...cells.values()].sort((a, b) =>
      a.outstanding > b.outstanding
        ? -1
        : a.outstanding < b.outstanding
          ? 1
          : 0,
    );
    const perUser = [...userTotal.entries()]
      .map(([user, total]) => ({ user, total }))
      .sort((a, b) => (a.total > b.total ? -1 : a.total < b.total ? 1 : 0));

    const grandTotal = perUser.reduce((acc, u) => acc + u.total, 0n);
    const inflatedTotal = rows
      .filter((r) => r.inflated)
      .reduce((acc, r) => acc + r.outstanding, 0n);

    console.log(`Users with outstanding reward: ${perUser.length}`);
    console.log(`(user, book) cells:            ${rows.length}`);
    console.log(
      `Total outstanding to refund:   ${grandTotal.toString()}  (${like(grandTotal)} LIKE)`,
    );
    console.log(
      `  of which on INFLATED pools:  ${inflatedTotal.toString()}  (${like(inflatedTotal)} LIKE)  ⚠️ over-credited, do NOT refund at face value`,
    );
    console.log("");

    console.log("Top users by total outstanding:");
    for (const u of perUser.slice(0, 20)) {
      console.log(
        `  ${u.user}  ${u.total.toString()}  (${like(u.total)} LIKE)`,
      );
    }
    console.log("");

    // ---- Write outputs ----
    const out = {
      meta: {
        ...snap.meta,
        snapshotFile: snapFile,
        driftFile,
        driftedPools: driftedBooks.size,
        grandTotal: grandTotal.toString(),
        grandTotalLike: like(grandTotal),
        inflatedTotal: inflatedTotal.toString(),
      },
      // per (user, book) — granular, with the positions involved
      byUserBook: rows.map((r) => ({
        user: r.user,
        bookNFT: r.bookNFT,
        poolTotalStakedRecorded: (
          recordedByBook.get(r.bookNFT.toLowerCase()) ?? 0n
        ).toString(),
        outstanding: r.outstanding.toString(),
        outstandingLike: like(r.outstanding),
        inflated: r.inflated,
        tokenIds: r.tokenIds,
      })),
      // per user — what you'd send if refunding one transfer per user
      byUser: perUser.map((u) => ({
        user: u.user,
        outstanding: u.total.toString(),
        outstandingLike: like(u.total),
      })),
    };
    const outFile = snapFile.replace(/\.json$/, "") + ".driftpending.json";
    fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
    console.log(`Wrote: ${outFile}`);

    // Also a flat CSV for the offchain refund step.
    const csv = [
      "user,bookNFT,poolTotalStakedRecorded,outstanding_raw,outstanding_like,inflated",
      ...rows.map(
        (r) =>
          `${r.user},${r.bookNFT},${(recordedByBook.get(r.bookNFT.toLowerCase()) ?? 0n).toString()},${r.outstanding.toString()},${like(r.outstanding)},${r.inflated}`,
      ),
    ].join("\n");
    const csvFile = snapFile.replace(/\.json$/, "") + ".driftpending.csv";
    fs.writeFileSync(csvFile, csv);
    console.log(`Wrote: ${csvFile}`);
  });
