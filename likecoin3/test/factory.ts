import { viem, ignition } from "hardhat";
import { encodeAbiParameters, keccak256 } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

import LikeProtocolV1Module from "../ignition/modules/LikeProtocolV1";
import LikeCollectiveModule from "../ignition/modules/LikeCollective";
import LikeStakePositionModule from "../ignition/modules/LikeStakePosition";
import veLikeModule from "../ignition/modules/veLike";
import veLikeRewardModule from "../ignition/modules/veLikeReward";

export const ROYALTY_DEFAULT = 500n;

export function defaultSalt(
  _signer: { account: { address: string } },
  bookConfig: { name: string; symbol: string },
) {
  const encoded = encodeAbiParameters(
    [{ type: "string" }, { type: "string" }],
    [bookConfig.name, bookConfig.symbol],
  );
  const hashed = keccak256(encoded);
  const salt = _signer.account.address + "0000" + hashed.slice(2, 22);
  return salt;
}

export async function deployProtocol() {
  const [deployer, classOwner, likerLand, randomSigner, randomSigner2] =
    await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const { likeProtocolImpl, likeProtocol, bookNFTImpl } = await ignition.deploy(
    LikeProtocolV1Module,
    {
      parameters: {
        LikeProtocolV0Module: {
          initOwner: deployer.account.address,
        },
      },
      defaultSender: deployer.account.address,
      strategy: "create2",
    },
  );

  return {
    likeProtocolImpl,
    likeProtocol,
    bookNFTImpl,
    deployer,
    classOwner,
    likerLand,
    randomSigner,
    randomSigner2,
    publicClient,
  };
}

export async function deployCollective() {
  const [deployer, rick, kin, bob] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const { likeCollective, likecoin, likeStakePosition } = await ignition.deploy(
    LikeCollectiveModule,
    {
      parameters: {
        LikecoinModule: {
          initOwner: deployer.account.address,
        },
        LikeCollectiveV0Module: {
          initOwner: deployer.account.address,
        },
        LikeStakePositionV0Module: {
          initOwner: deployer.account.address,
        },
      },
      defaultSender: deployer.account.address,
      strategy: "create2",
    },
  );

  // Mint some LIKE tokens
  for (const a of [
    rick.account.address,
    kin.account.address,
    bob.account.address,
  ]) {
    await likecoin.write.mint([a, 10000n * 10n ** 6n], {
      account: deployer.account.address,
    });
  }

  return {
    likecoin,
    likeCollective,
    likeStakePosition,
    deployer,
    rick,
    kin,
    bob,
    publicClient,
  };
}

export async function deployLSP() {
  const [deployer, rick, kin] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const { likeStakePosition, likeStakePositionImpl } = await ignition.deploy(
    LikeStakePositionModule,
    {
      parameters: {
        LikecoinModule: {
          initOwner: deployer.account.address,
        },
        LikeCollectiveV0Module: {
          initOwner: deployer.account.address,
        },
        LikeStakePositionV0Module: {
          initOwner: deployer.account.address,
        },
      },
      defaultSender: deployer.account.address,
      strategy: "create2",
    },
  );

  return {
    likeStakePosition,
    likeStakePositionImpl,
    deployer,
    rick,
    kin,
    publicClient,
  };
}

export async function deployVeLike() {
  const [deployer, rick, kin, bob] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  const testClient = await viem.getTestClient();
  const { veLike, veLikeImpl, veLikeProxy, likecoin } = await ignition.deploy(
    veLikeModule,
    {
      parameters: {
        LikecoinModule: {
          initOwner: deployer.account.address,
        },
        veLikeV0Module: {
          initOwner: deployer.account.address,
        },
      },
      defaultSender: deployer.account.address,
    },
  );
  return {
    veLike,
    veLikeImpl,
    veLikeProxy,
    likecoin,
    deployer,
    rick,
    kin,
    bob,
    publicClient,
    testClient,
  };
}

export async function deployVeLikeReward() {
  const {
    veLike,
    veLikeImpl,
    veLikeProxy,
    likecoin,
    deployer,
    rick,
    kin,
    bob,
    publicClient,
    testClient,
  } = await loadFixture(deployVeLike);
  const { veLikeReward, veLikeRewardImpl, veLikeRewardProxy } =
    await ignition.deploy(veLikeRewardModule, {
      parameters: {
        veLikeRewardModule: {
          initOwner: deployer.account.address,
        },
      },
      defaultSender: deployer.account.address,
    });
  await veLikeReward.write.setVault([veLike.address], {
    account: deployer.account.address,
  });
  await veLikeReward.write.setLikecoin([likecoin.address], {
    account: deployer.account.address,
  });
  await veLike.write.setRewardContract([veLikeReward.address], {
    account: deployer.account.address,
  });
  return {
    veLikeReward,
    veLikeRewardImpl,
    veLikeRewardProxy,
    veLike,
    veLikeImpl,
    veLikeProxy,
    likecoin,
    deployer,
    rick,
    kin,
    bob,
    publicClient,
    testClient,
  };
}

export async function initialMint() {
  const {
    veLikeReward,
    veLike,
    likecoin,
    deployer,
    rick,
    kin,
    bob,
    publicClient,
    testClient,
  } = await loadFixture(deployVeLikeReward);
  await likecoin.write.mint([deployer.account.address, 50000n * 10n ** 6n], {
    account: deployer.account.address,
  });
  await likecoin.write.mint([rick.account.address, 10000n * 10n ** 6n], {
    account: deployer.account.address,
  });
  await likecoin.write.mint([kin.account.address, 10000n * 10n ** 6n], {
    account: deployer.account.address,
  });
  await likecoin.write.mint([bob.account.address, 10000n * 10n ** 6n], {
    account: deployer.account.address,
  });
  return {
    veLikeReward,
    veLike,
    likecoin,
    deployer,
    rick,
    kin,
    bob,
    publicClient,
    testClient,
  };
}

export async function initialCondition() {
  const {
    veLikeReward,
    veLike,
    likecoin,
    deployer,
    publicClient,
    rick,
    kin,
    bob,
    testClient,
  } = await loadFixture(initialMint);
  await likecoin.write.approve([veLikeReward.address, 10000n * 10n ** 6n], {
    account: deployer.account.address,
  });
  const block = await publicClient.getBlock();
  const startTime = block.timestamp + 100n;
  const endTime = startTime + 1000n;
  // Assume set manually by admin.
  await veLike.write.setLockTime([endTime], {
    account: deployer.account.address,
  });
  await veLikeReward.write.addReward(
    [deployer.account.address, 10000n * 10n ** 6n, startTime, endTime],
    {
      account: deployer.account.address,
    },
  );

  // This include test as deposit before the startTime.
  await likecoin.write.approve([veLike.address, 100n * 10n ** 6n], {
    account: bob.account.address,
  });
  await veLike.write.deposit([100n * 10n ** 6n, bob.account.address], {
    account: bob.account.address,
  });

  // Test case assume start of block is the startTime
  await testClient.setNextBlockTimestamp({
    timestamp: startTime,
  });
  await testClient.mine({
    blocks: 1,
  });

  return {
    veLike,
    veLikeReward,
    likecoin,
    deployer,
    publicClient,
    rick,
    kin,
    bob,
    startTime,
    endTime,
    testClient,
  };
}
