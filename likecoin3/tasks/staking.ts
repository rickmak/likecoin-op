import { task } from "hardhat/config";
import fs from "fs";

task("stake", "Stake tokens to a bookNFT")
  .addParam("booknft", "The bookNFT to stake")
  .addParam("amount", "The amount of tokens to stake")
  .setAction(async ({ booknft, amount }, { ethers, network }) => {
    const [operator] = await ethers.getSigners();
    console.log("Operator:", operator.address);

    let likecollectiveAddress = "";
    if (
      fs.existsSync(
        `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
      )
    ) {
      const deployedAddresses = JSON.parse(
        fs.readFileSync(
          `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
          "utf8",
        ),
      );
      likecollectiveAddress =
        deployedAddresses["LikeCollectiveModule#LikeCollective"];
    } else {
      throw new Error(
        `Deployed addresses not found for chain ${network.config.chainId}`,
      );
    }

    console.log("Likecollective address:", likecollectiveAddress);

    const LikeCollective = await ethers.getContractAt(
      "LikeCollective",
      likecollectiveAddress,
    );
    const likecollective = LikeCollective.connect(operator);

    const tx = await likecollective.stake(booknft, amount);
    await tx.wait();
  });

task("unstake", "Unstake tokens from a bookNFT")
  .addParam("booknft", "The bookNFT to unstake from")
  .addParam("amount", "The amount of tokens to unstake")
  .setAction(async ({ booknft, amount }, { ethers, network }) => {
    const [operator] = await ethers.getSigners();
    console.log("Operator:", operator.address);

    let likecollectiveAddress = "";
    if (
      fs.existsSync(
        `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
      )
    ) {
      const deployedAddresses = JSON.parse(
        fs.readFileSync(
          `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
          "utf8",
        ),
      );
      likecollectiveAddress =
        deployedAddresses["LikeCollectiveModule#LikeCollective"];
    } else {
      throw new Error(
        `Deployed addresses not found for chain ${network.config.chainId}`,
      );
    }

    console.log("Likecollective address:", likecollectiveAddress);

    const LikeCollective = await ethers.getContractAt(
      "LikeCollective",
      likecollectiveAddress,
    );
    const likecollective = LikeCollective.connect(operator);

    const tx = await likecollective.unstake(booknft, amount);
    await tx.wait();
  });

task("claimRewards", "Claim rewards from a specific bookNFT")
  .addParam("booknft", "The bookNFT to claim rewards from")
  .setAction(async ({ booknft }, { ethers, network }) => {
    const [operator] = await ethers.getSigners();
    console.log("Operator:", operator.address);

    let likecollectiveAddress = "";
    if (
      fs.existsSync(
        `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
      )
    ) {
      const deployedAddresses = JSON.parse(
        fs.readFileSync(
          `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
          "utf8",
        ),
      );
      likecollectiveAddress =
        deployedAddresses["LikeCollectiveModule#LikeCollective"];
    } else {
      throw new Error(
        `Deployed addresses not found for chain ${network.config.chainId}`,
      );
    }

    console.log("Likecollective address:", likecollectiveAddress);

    const LikeCollective = await ethers.getContractAt(
      "LikeCollective",
      likecollectiveAddress,
    );
    const likecollective = LikeCollective.connect(operator);

    const tx = await likecollective.claimRewards(booknft);
    await tx.wait();
  });

task("claimAllRewards", "Claim rewards from all bookNFTs").setAction(
  async ({}, { ethers, network }) => {
    const [operator] = await ethers.getSigners();
    console.log("Operator:", operator.address);

    let likecollectiveAddress = "";
    if (
      fs.existsSync(
        `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
      )
    ) {
      const deployedAddresses = JSON.parse(
        fs.readFileSync(
          `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
          "utf8",
        ),
      );
      likecollectiveAddress =
        deployedAddresses["LikeCollectiveModule#LikeCollective"];
    } else {
      throw new Error(
        `Deployed addresses not found for chain ${network.config.chainId}`,
      );
    }

    console.log("Likecollective address:", likecollectiveAddress);

    const LikeCollective = await ethers.getContractAt(
      "LikeCollective",
      likecollectiveAddress,
    );
    const likecollective = LikeCollective.connect(operator);

    const tx = await likecollective.claimAllRewards();
    await tx.wait();
  },
);

task("depositReward", "Deposit reward tokens for a bookNFT")
  .addParam("booknft", "The bookNFT to deposit rewards for")
  .addParam("amount", "The amount of reward tokens to deposit")
  .setAction(async ({ booknft, amount }, { ethers, network }) => {
    const [operator] = await ethers.getSigners();
    console.log("Operator:", operator.address);

    let likecollectiveAddress = "";
    if (
      fs.existsSync(
        `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
      )
    ) {
      const deployedAddresses = JSON.parse(
        fs.readFileSync(
          `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
          "utf8",
        ),
      );
      likecollectiveAddress =
        deployedAddresses["LikeCollectiveModule#LikeCollective"];
    } else {
      throw new Error(
        `Deployed addresses not found for chain ${network.config.chainId}`,
      );
    }

    console.log("Likecollective address:", likecollectiveAddress);

    const LikeCollective = await ethers.getContractAt(
      "LikeCollective",
      likecollectiveAddress,
    );
    const likecollective = LikeCollective.connect(operator);

    const tx = await likecollective.depositReward(booknft, amount);
    await tx.wait();
  });

task("restakeReward", "Restake rewards from a bookNFT")
  .addParam("booknft", "The bookNFT to restake rewards from")
  .setAction(async ({ booknft }, { ethers, network }) => {
    const [operator] = await ethers.getSigners();
    console.log("Operator:", operator.address);

    let likecollectiveAddress = "";
    if (
      fs.existsSync(
        `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
      )
    ) {
      const deployedAddresses = JSON.parse(
        fs.readFileSync(
          `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
          "utf8",
        ),
      );
      likecollectiveAddress =
        deployedAddresses["LikeCollectiveModule#LikeCollective"];
    } else {
      throw new Error(
        `Deployed addresses not found for chain ${network.config.chainId}`,
      );
    }

    console.log("Likecollective address:", likecollectiveAddress);

    const LikeCollective = await ethers.getContractAt(
      "LikeCollective",
      likecollectiveAddress,
    );
    const likecollective = LikeCollective.connect(operator);

    const tx = await likecollective.restakeReward(booknft);
    await tx.wait();
  });

task("emitOnlyRewardAdded", "Emit only RewardAdded event for a bookNFT")
  .addParam("booknft", "The bookNFT to emit reward added for")
  .addParam("amount", "The amount of reward to emit")
  .setAction(async ({ booknft, amount }, { ethers, network }) => {
    const [operator] = await ethers.getSigners();
    console.log("Operator:", operator.address);

    let likecollectiveAddress = "";
    if (
      fs.existsSync(
        `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
      )
    ) {
      const deployedAddresses = JSON.parse(
        fs.readFileSync(
          `ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
          "utf8",
        ),
      );
      likecollectiveAddress =
        deployedAddresses["LikeCollectiveModule#LikeCollective"];
    } else {
      throw new Error(
        `Deployed addresses not found for chain ${network.config.chainId}`,
      );
    }

    console.log("Likecollective address:", likecollectiveAddress);

    const LikeCollective = await ethers.getContractAt(
      "LikeCollective",
      likecollectiveAddress,
    );
    const likecollective = LikeCollective.connect(operator);

    const tx = await likecollective.emitOnlyRewardAdded(booknft, amount);
    await tx.wait();
  });
