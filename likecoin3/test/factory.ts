import fs from "fs";
import { viem, ignition } from "hardhat";
import LikeProtocolV1Module from "../ignition/modules/LikeProtocolV1";
import LikeCollectiveModule from "../ignition/modules/LikeCollective";
import LikeStakePositionModule from "../ignition/modules/LikeStakePosition";

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


export function getBeaconProxyCreationCode() {
  const creationCode = fs.readFileSync("./test/fixtures/BeaconProxy.creationCode", "utf8");
  return creationCode;
}
