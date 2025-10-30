import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { viem, ignition } from "hardhat";

import "./setup";
import { deployVeLikeReward, initialMint, initialCondition } from "./factory";

describe("veLikeReward ", async function () {
  describe("as ERC1967 Proxy", async function () {
    it("should have the correct owner", async function () {
      const { veLikeReward, deployer } = await loadFixture(deployVeLikeReward);
      expect(await veLikeReward.read.owner()).to.equalAddress(
        deployer.account.address,
      );
    });

    it("should have the correct asset address", async function () {
      const { veLikeReward, veLike, likecoin } = await loadFixture(initialMint);
      const [vault, likecoinConfig, rewardPool, totalStaked, lastRewardTime] =
        await veLikeReward.read.getConfig();
      expect(vault).to.equalAddress(veLike.address);
      expect(likecoinConfig).to.equalAddress(likecoin.address);
      expect(rewardPool).to.equal(0n);
      expect(totalStaked).to.equal(0n);
      expect(lastRewardTime).to.equal(0n);
    });

    it("should have the correct STORAGE_SLOT", async function () {
      const { veLike, deployer } = await loadFixture(initialMint);
      const veLikeMock = await viem.deployContract("veLikeMock");
      veLike.write.upgradeTo(veLikeMock.address, {
        account: deployer.account,
      });
      const newVeLike = await viem.getContractAt(
        "veLikeMock",
        veLikeMock.address,
      );
      expect(await newVeLike.read.version()).to.equal(2n);
      expect(await newVeLike.read.veLikeRewardDataStorage()).to.equal(
        "0xe9672d2c676bb94d428d6ce523668c779079df8febe4142a9972a2a2313d2c00",
      );
    });
  });

  describe("as pausable contract", async function () {
    it("should be paused by default", async function () {
      const { veLikeReward } = await loadFixture(initialMint);
      const paused = await veLikeReward.read.paused();
      expect(paused).to.be.false;
    });

    it("should not allow non-owner to pause", async function () {
      const { veLikeReward, rick } = await loadFixture(initialMint);
      await expect(
        veLikeReward.write.pause({ account: rick.account.address }),
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should not able to deposit on veLike Vault when pause the reward", async function () {
      const { veLikeReward, veLike, likecoin, deployer, rick } =
        await loadFixture(initialCondition);
      await veLikeReward.write.pause();

      await likecoin.write.approve([veLike.address, 100n * 10n ** 6n], {
        account: rick.account.address,
      });
      await expect(
        veLike.write.deposit([100n * 10n ** 6n, rick.account.address], {
          account: rick.account.address,
        }),
      ).to.be.rejectedWith("EnforcedPause");
    });
  });

  describe("reward condition setting", async function () {
    it("should return empty reward condition if no reward condition is set", async function () {
      const { veLikeReward } = await loadFixture(initialMint);
      const condition = await veLikeReward.read.getCurrentCondition();
      expect(condition.startTime).to.equal(0n);
      expect(condition.endTime).to.equal(0n);
      expect(condition.rewardAmount).to.equal(0n);
      expect(condition.rewardIndex).to.equal(0n);
    });

    it("should return the correct reward condition if reward condition is set", async function () {
      const { veLike, veLikeReward, likecoin, deployer, publicClient } =
        await loadFixture(initialMint);

      await likecoin.write.approve([veLikeReward.address, 10000n * 10n ** 6n], {
        account: deployer.account.address,
      });

      const block = await publicClient.getBlock();
      const startTime = block.timestamp;
      const endTime = block.timestamp + 1000n;
      await veLikeReward.write.addReward(
        [deployer.account.address, 10000n * 10n ** 6n, startTime, endTime],
        {
          account: deployer.account.address,
        },
      );

      const condition = await veLikeReward.read.getCurrentCondition();
      expect(condition.startTime).to.equal(startTime);
      expect(condition.endTime).to.equal(endTime);
      expect(condition.rewardAmount).to.equal(10000n * 10n ** 6n);
      expect(condition.rewardIndex).to.equal(0n);

      // Nothing spent yet.
      expect(
        await likecoin.read.balanceOf([deployer.account.address]),
      ).to.equal(50000n * 10n ** 6n);
      // Reward does not count toward total assets
      expect(await veLike.read.totalAssets()).to.equal(0n);
    });

    it("should not able to set reward condition with startTime before current lastRewardBlock", async function () {
      const { veLike, veLikeReward, likecoin, deployer, publicClient } =
        await loadFixture(initialMint);

      await likecoin.write.approve([veLikeReward.address, 10000n * 10n ** 6n], {
        account: deployer.account.address,
      });

      const block = await publicClient.getBlock();
      const startTime = block.timestamp;
      const endTime = block.timestamp + 1000n;
      await veLikeReward.write.addReward(
        [deployer.account.address, 10000n * 10n ** 6n, startTime, endTime],
        {
          account: deployer.account.address,
        },
      );
      // The lastRewardBlock is updated to the startTime

      await likecoin.write.approve([veLikeReward.address, 10000n * 10n ** 6n], {
        account: deployer.account.address,
      });
      await expect(
        veLikeReward.write.addReward(
          [
            deployer.account.address,
            10000n * 10n ** 6n,
            startTime - 1000n,
            endTime,
          ],
          {
            account: deployer.account.address,
          },
        ),
      ).to.be.rejectedWith("ErrConflictCondition");
    });

    it("should not able to set reward condition with endTime before current block", async function () {
      const { veLike, veLikeReward, likecoin, deployer, publicClient } =
        await loadFixture(initialMint);
      const block = await publicClient.getBlock();
      const startTime = block.timestamp + 1000n;
      const endTime = block.timestamp - 2000n;
      await expect(
        veLikeReward.write.addReward(
          [deployer.account.address, 10000n * 10n ** 6n, startTime, endTime],
          {
            account: deployer.account.address,
          },
        ),
      ).to.be.rejectedWith("ErrConflictCondition");
    });

    it("should not able to set reward condition with startTime after endTime", async function () {
      const { veLike, veLikeReward, likecoin, deployer, publicClient } =
        await loadFixture(initialMint);
      const block = await publicClient.getBlock();
      const startTime = block.timestamp + 3000n;
      const endTime = block.timestamp + 2000n;
      await expect(
        veLikeReward.write.addReward(
          [deployer.account.address, 10000n * 10n ** 6n, startTime, endTime],
          {
            account: deployer.account.address,
          },
        ),
      ).to.be.rejectedWith("ErrConflictCondition");
    });

    it("should not able to set reward condition with startTime before current endTime", async function () {
      const { veLike, veLikeReward, likecoin, deployer, publicClient } =
        await loadFixture(initialMint);

      await likecoin.write.approve([veLikeReward.address, 10000n * 10n ** 6n], {
        account: deployer.account.address,
      });
      const block = await publicClient.getBlock();
      const startTime = block.timestamp;
      const endTime = block.timestamp + 1n;
      await veLikeReward.write.addReward(
        [deployer.account.address, 10000n * 10n ** 6n, startTime, endTime],
        {
          account: deployer.account.address,
        },
      );

      await expect(
        veLikeReward.write.addReward(
          [deployer.account.address, 10000n * 10n ** 6n, startTime, endTime],
          {
            account: deployer.account.address,
          },
        ),
      ).to.be.rejectedWith("ErrConflictCondition");
    });
  });

  describe("reward distribution", async function () {
    it("should have correct initial reward condition", async function () {
      const { veLike, veLikeReward, bob, testClient } =
        await loadFixture(initialCondition);
      const condition = await veLikeReward.read.getCurrentCondition();

      // Cross check the top function not changed accidentally.
      expect(condition.endTime).to.equal(condition.startTime + 1000n);
      expect(condition.rewardAmount).to.equal(10000n * 10n ** 6n);
      expect(condition.rewardIndex).to.equal(0n);

      expect(await veLikeReward.read.getRewardPool()).to.equal(
        10000n * 10n ** 6n,
      );
      // Bob deposit before the startTime, so the lastRewardTime should be the startTime
      const lastRewardTime = await veLikeReward.read.getLastRewardTime();
      expect(lastRewardTime).to.equal(condition.startTime);

      await testClient.setNextBlockTimestamp({
        timestamp: condition.startTime + 100n,
      });
      await testClient.mine({
        blocks: 1,
      });
      const bobReward = await veLike.read.getPendingReward([
        bob.account.address,
      ]);
      expect(bobReward).to.equal(1000n * 10n ** 6n);
    });

    it("should have return zero on account never deposited", async function () {
      const { veLike, rick } = await loadFixture(initialCondition);
      expect(
        await veLike.read.getPendingReward([rick.account.address]),
      ).to.equal(0n);
    });

    it("should have update totalStaked and lastRewardTime correctly on new deposit", async function () {
      const {
        veLike,
        veLikeReward,
        likecoin,
        deployer,
        rick,
        publicClient,
        testClient,
      } = await loadFixture(initialCondition);
      await likecoin.write.approve([veLike.address, 100n * 10n ** 6n], {
        account: rick.account.address,
      });
      const depositTx = await veLike.write.deposit(
        [100n * 10n ** 6n, rick.account.address],
        {
          account: rick.account.address,
        },
      );
      const block = await publicClient.getBlock({
        blockHash: depositTx.blockHash,
      });
      const lastRewardTime = await veLikeReward.read.getLastRewardTime();
      expect(block.timestamp).to.equal(lastRewardTime);
      expect(await veLike.read.totalSupply()).to.equal(200n * 10n ** 6n);
    });

    it("should automatically claim reward on new deposit", async function () {
      const {
        veLike,
        veLikeReward,
        likecoin,
        rick,
        publicClient,
        startTime,
        testClient,
      } = await loadFixture(initialCondition);

      await likecoin.write.approve([veLike.address, 200n * 10n ** 6n], {
        account: rick.account.address,
      });
      const depositTx = await veLike.write.deposit(
        [100n * 10n ** 6n, rick.account.address],
        {
          account: rick.account.address,
        },
      );
      const block = await publicClient.getBlock({
        blockHash: depositTx.blockHash,
      });

      const timePassed = 300n;
      await testClient.setNextBlockTimestamp({
        timestamp: block.timestamp + timePassed,
      });
      await testClient.mine({
        blocks: 1,
      });

      const pendingReward = await veLike.read.getPendingReward([
        rick.account.address,
      ]);
      await testClient.setNextBlockTimestamp({
        timestamp: block.timestamp + timePassed + 5n,
      });
      await veLike.write.deposit([100n * 10n ** 6n, rick.account.address], {
        account: rick.account.address,
      });
      // Immediately check the pendingReward is still zero as no time pass yet.
      expect(
        await veLikeReward.read.getPendingReward([rick.account.address]),
      ).to.equal(0n);
      // increase the veLike
      expect(await veLike.read.balanceOf([rick.account.address])).to.equal(
        200n * 10n ** 6n,
      );
      // the likecoin balance should be the same as the initial balance.
      expect(await likecoin.read.balanceOf([rick.account.address])).to.equal(
        (10000n - 200n) * 10n ** 6n + pendingReward + 5n * 5n * 10n ** 6n,
      );
    });
  });

  describe("reward claim", async function () {
    it("should have correct reward claim as LIKE", async function () {
      const { veLike, veLikeReward, likecoin, rick, publicClient, testClient } =
        await loadFixture(initialCondition);
      await likecoin.write.approve([veLike.address, 100n * 10n ** 6n], {
        account: rick.account.address,
      });
      const depositTx = await veLike.write.deposit(
        [100n * 10n ** 6n, rick.account.address],
        {
          account: rick.account.address,
        },
      );
      const block = await publicClient.getBlock({
        blockHash: depositTx.blockHash,
      });

      const timePassed = 20n;
      await testClient.setNextBlockTimestamp({
        timestamp: block.timestamp + timePassed,
      });
      const originalRewardPool = await veLikeReward.read.getRewardPool();

      await veLike.write.claimReward([rick.account.address], {
        account: rick.account.address,
      });
      const newRewardPool = await veLikeReward.read.getRewardPool();
      const rewardClaimed = originalRewardPool - newRewardPool;
      expect(await likecoin.read.balanceOf([rick.account.address])).to.equal(
        (10000n - 100n) * 10n ** 6n + rewardClaimed,
      );

      expect(
        await veLike.read.getPendingReward([rick.account.address]),
      ).to.equal(0n);
      expect(await veLike.read.totalAssets()).to.equal(200n * 10n ** 6n);
      expect(await veLike.read.balanceOf([rick.account.address])).to.equal(
        100n * 10n ** 6n,
      );
    });

    it("should correctly restake reward", async function () {
      const {
        veLike,
        veLikeReward,
        likecoin,
        deployer,
        rick,
        publicClient,
        testClient,
      } = await loadFixture(initialCondition);
      await likecoin.write.approve([veLike.address, 100n * 10n ** 6n], {
        account: rick.account.address,
      });
      const depositTx = await veLike.write.deposit(
        [100n * 10n ** 6n, rick.account.address],
        {
          account: rick.account.address,
        },
      );
      const originalRewardPool = await veLikeReward.read.getRewardPool();

      const block = await publicClient.getBlock({
        blockHash: depositTx.blockHash,
      });
      const timePassed = 20n;
      await testClient.setNextBlockTimestamp({
        timestamp: block.timestamp + timePassed,
      });

      await veLike.write.restakeReward([rick.account.address], {
        account: rick.account.address,
      });
      const newRewardPool = await veLikeReward.read.getRewardPool();
      const rewardClaimed = originalRewardPool - newRewardPool;
      expect(await likecoin.read.balanceOf([rick.account.address])).to.equal(
        (10000n - 100n) * 10n ** 6n,
      );
      expect(await veLike.read.balanceOf([rick.account.address])).to.equal(
        100n * 10n ** 6n + rewardClaimed,
      );
    });
  });
});
