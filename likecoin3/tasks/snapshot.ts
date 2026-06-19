import { task } from "hardhat/config";
import fs from "fs";
import path from "path";

// LikeCollective storage layout (erc-7201 namespaced).
//   keccak256(abi.encode(uint256(keccak256("likecollective.storage")) - 1)) & ~0xff
//   struct CollectiveData { Likecoin likecoin; LikeStakePosition likeStakePosition; mapping(bookNFT => PoolData) pools; }
//     likecoin            -> base + 0
//     likeStakePosition   -> base + 1
//     pools mapping       -> base + 2
//   struct PoolData { totalStaked; totalRewarded; rewardPending; rewardIndex; mapping rewardIndexes; }
//     totalStaked   -> loc + 0
//     totalRewarded -> loc + 1
//     rewardPending -> loc + 2
//     rewardIndex   -> loc + 3   (poolIndex; no getter — read from storage)
const COLLECTIVE_STORAGE_BASE = BigInt(
  "0xe9c9d9e1df02920d747aa7516ca1d4362d70267096e6330bcfb24b265ac2ee00",
);
const POOLS_MAPPING_SLOT = COLLECTIVE_STORAGE_BASE + 2n;

function resolveDeployedAddress(
  chainId: number,
  key: string,
): string | undefined {
  const file = path.join(
    __dirname,
    "..",
    "ignition",
    "deployments",
    `chain-${chainId}`,
    "deployed_addresses.json",
  );
  if (!fs.existsSync(file)) return undefined;
  const addresses = JSON.parse(fs.readFileSync(file, "utf8"));
  return addresses[key];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

task(
  "snapshot",
  "Fetch all LikeStakePosition + LikeCollective state at a block and write it to snapshot/",
)
  .addOptionalParam("collective", "LikeCollective proxy address")
  .addOptionalParam("stakeposition", "LikeStakePosition proxy address")
  .addOptionalParam("batch", "Concurrent RPC calls per batch", "50")
  .addOptionalParam("block", "Block number to pin reads to (default: latest)")
  .setAction(async (args, { ethers, network }) => {
    const chainId = network.config.chainId ?? 0;

    const collectiveAddr =
      args.collective ||
      resolveDeployedAddress(chainId, "LikeCollectiveModule#LikeCollective");
    const stakePosAddr =
      args.stakeposition ||
      resolveDeployedAddress(
        chainId,
        "LikeStakePositionModule#LikeStakePosition",
      );

    if (!collectiveAddr || !stakePosAddr) {
      throw new Error(
        `Could not resolve contract addresses for chain ${chainId}. ` +
          `Pass --collective and --stakeposition explicitly.`,
      );
    }

    const batchSize = parseInt(args.batch, 10);
    const provider = ethers.provider;
    const block = args.block
      ? parseInt(args.block, 10)
      : await provider.getBlockNumber();

    console.log(`Network:           ${network.name} (chainId ${chainId})`);
    console.log(`Block:             ${block}`);
    console.log(`LikeCollective:    ${collectiveAddr}`);
    console.log(`LikeStakePosition: ${stakePosAddr}`);
    console.log("");

    const collective = await ethers.getContractAt(
      "LikeCollective",
      collectiveAddr,
    );
    const stakePosition = await ethers.getContractAt(
      "LikeStakePosition",
      stakePosAddr,
    );

    // 1. Enumerate every live position (ERC721Enumerable), pinned to `block`.
    const totalSupply = Number(
      await stakePosition.totalSupply({ blockTag: block }),
    );
    console.log(`Live positions: ${totalSupply}`);

    const indices = Array.from({ length: totalSupply }, (_, i) => i);
    const tokenIds: bigint[] = [];
    for (const group of chunk(indices, batchSize)) {
      const ids = await Promise.all(
        group.map((i) => stakePosition.tokenByIndex(i, { blockTag: block })),
      );
      tokenIds.push(...ids);
    }

    // 2. Read each position + its pending reward.
    type PositionRow = {
      tokenId: string;
      owner: string; // current NFT owner = reward payee
      bookNFT: string;
      stakedAmount: string;
      posIndex: string; // position.rewardIndex
      pending: string; // getRewardsOfPosition()
    };
    const positions: PositionRow[] = [];
    let scanned = 0;
    for (const group of chunk(tokenIds, batchSize)) {
      const rows = await Promise.all(
        group.map(async (id) => {
          const [p, pending, owner] = await Promise.all([
            stakePosition.getPosition(id, { blockTag: block }),
            collective.getRewardsOfPosition(id, { blockTag: block }),
            stakePosition.ownerOf(id, { blockTag: block }),
          ]);
          return {
            tokenId: id.toString(),
            owner,
            bookNFT: p.bookNFT,
            stakedAmount: p.stakedAmount.toString(),
            posIndex: p.rewardIndex.toString(),
            pending: pending.toString(),
          } as PositionRow;
        }),
      );
      positions.push(...rows);
      scanned += group.length;
      process.stdout.write(`\rScanned ${scanned}/${totalSupply} positions`);
    }
    process.stdout.write("\n");

    // 3. For each pool (unique bookNFT among live positions) read pool state.
    //    totalStaked + rewardPending come from getters; rewardIndex (poolIndex)
    //    and totalRewarded come from storage. We cross-check the storage slot
    //    math against the getters so a wrong layout fails loudly.
    const bookNFTs = [...new Set(positions.map((p) => p.bookNFT))];
    console.log(`Pools: ${bookNFTs.length}`);

    const coder = ethers.AbiCoder.defaultAbiCoder();
    const poolLoc = (book: string): bigint =>
      BigInt(
        ethers.keccak256(
          coder.encode(["address", "uint256"], [book, POOLS_MAPPING_SLOT]),
        ),
      );
    const readSlot = async (slot: bigint): Promise<bigint> =>
      BigInt(
        await provider.getStorage(collectiveAddr, ethers.toBeHex(slot), block),
      );

    type PoolRow = {
      totalStaked: string;
      totalRewarded: string;
      rewardPending: string;
      poolIndex: string;
    };
    const pools: Record<string, PoolRow> = {};
    let mismatch = 0;
    let done = 0;
    for (const group of chunk(bookNFTs, batchSize)) {
      await Promise.all(
        group.map(async (book) => {
          const loc = poolLoc(book);
          const [
            totalStakedGetter,
            rewardPendingGetter,
            sTotalStaked,
            sTotalRewarded,
            sRewardPending,
            sRewardIndex,
          ] = await Promise.all([
            collective.getTotalStake(book, { blockTag: block }),
            collective.getPendingRewardsPool(book, { blockTag: block }),
            readSlot(loc + 0n),
            readSlot(loc + 1n),
            readSlot(loc + 2n),
            readSlot(loc + 3n),
          ]);
          // Cross-check storage layout against getters.
          if (
            sTotalStaked !== totalStakedGetter ||
            sRewardPending !== rewardPendingGetter
          ) {
            mismatch++;
            console.error(
              `\n⚠️  storage/getter mismatch for ${book}: ` +
                `totalStaked storage=${sTotalStaked} getter=${totalStakedGetter}; ` +
                `rewardPending storage=${sRewardPending} getter=${rewardPendingGetter}`,
            );
          }
          pools[book] = {
            totalStaked: totalStakedGetter.toString(),
            totalRewarded: sTotalRewarded.toString(),
            rewardPending: rewardPendingGetter.toString(),
            poolIndex: sRewardIndex.toString(),
          };
        }),
      );
      done += group.length;
      process.stdout.write(`\rRead ${done}/${bookNFTs.length} pools`);
    }
    process.stdout.write("\n");

    if (mismatch > 0) {
      throw new Error(
        `${mismatch} pool(s) had a storage/getter mismatch — the storage layout ` +
          `assumption is wrong; refusing to write a misleading snapshot.`,
      );
    }

    const snapshot = {
      meta: {
        chainId,
        network: network.name,
        block,
        collective: collectiveAddr,
        stakePosition: stakePosAddr,
        positionCount: positions.length,
        poolCount: bookNFTs.length,
      },
      pools,
      positions,
    };

    const dir = path.join(__dirname, "..", "snapshot");
    fs.mkdirSync(dir, { recursive: true });
    const outFile = path.join(dir, `${chainId}-${block}.json`);
    fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));
    console.log("");
    console.log(`Wrote ${outFile}`);
  });
