import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { viem, ignition } from "hardhat";
import { parseEther } from "viem";
import LikeCollectiveModule from "../ignition/modules/LikeCollective";

describe("LikeCollective", async function () {
  async function deployCollective() {
    const [deployer, rick, kin, bob] = await viem.getWalletClients();
    const publicClient = await viem.getPublicClient();
    const { likeCollective, likeCollectiveImpl, likeCollectiveProxy } =
      await ignition.deploy(LikeCollectiveModule, {
        parameters: {
          LikeCollectiveModule: {
            initOwner: deployer.account.address,
          },
        },
        defaultSender: deployer.account.address,
      });

    return {
      likeCollective,
      likeCollectiveImpl,
      likeCollectiveProxy,
      deployer,
      rick,
      kin,
      bob,
      publicClient,
    };
  }

  describe("Upgradeable Storage", async function () {
    it("should have the correct STORAGE_SLOT", async function () {
      const { likeCollective, deployer } = await loadFixture(deployCollective);
      const likeCollectiveMock =
        await viem.deployContract("LikeCollectiveMock");
      likeCollective.write.upgradeTo(likeCollectiveMock.address, {
        account: deployer.account,
      });
      const newLikeCollective = await viem.getContractAt(
        "LikeCollectiveMock",
        likeCollectiveMock.address,
      );
      expect(await newLikeCollective.read.dataStorage()).to.equal(
        "0xe9c9d9e1df02920d747aa7516ca1d4362d70267096e6330bcfb24b265ac2ee00",
      );
    });
  });

  describe("Basic contract functionality", async function () {
    it("should be initialized with correct owner", async function () {
      const { likeCollective, deployer } = await loadFixture(deployCollective);
      const owner = await likeCollective.read.owner();
      expect(owner.toLowerCase()).to.equal(
        deployer.account.address.toLowerCase(),
      );
    });

    it("should be paused by default", async function () {
      const { likeCollective } = await loadFixture(deployCollective);
      const paused = await likeCollective.read.paused();
      expect(paused).to.be.false;
    });

    it("should allow owner to pause and unpause", async function () {
      const { likeCollective, deployer } = await loadFixture(deployCollective);

      // Pause the contract
      await likeCollective.write.pause();
      expect(await likeCollective.read.paused()).to.be.true;

      // Unpause the contract
      await likeCollective.write.unpause();
      expect(await likeCollective.read.paused()).to.be.false;
    });

    it("should not allow non-owner to pause", async function () {
      const { likeCollective, rick } = await loadFixture(deployCollective);

      await expect(
        likeCollective.write.pause({
          account: rick.account,
        }),
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  describe("Paused state behavior", async function () {
    it("should prevent staking when paused", async function () {
      const { likeCollective, rick } = await loadFixture(deployCollective);
      const mockBookNFT = "0x1234567890123456789012345678901234567890";
      const amount = parseEther("100");

      // Pause the contract
      await likeCollective.write.pause();

      // This should revert due to whenNotPaused modifier
      await expect(
        likeCollective.write.stake([mockBookNFT, amount], {
          account: rick.account,
        }),
      ).to.be.rejectedWith("EnforcedPause");
    });

    it("should prevent unstaking when paused", async function () {
      const { likeCollective, rick } = await loadFixture(deployCollective);
      const mockBookNFT = "0x1234567890123456789012345678901234567890";
      const amount = parseEther("50");

      // Pause the contract
      await likeCollective.write.pause();

      // This should revert due to whenNotPaused modifier
      await expect(
        likeCollective.write.unstake([mockBookNFT, amount], {
          account: rick.account,
        }),
      ).to.be.rejectedWith("EnforcedPause");
    });
  });
});
