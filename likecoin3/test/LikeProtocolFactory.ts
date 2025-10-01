import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { viem, ignition } from "hardhat";
import { encodeFunctionData } from "viem";

import "./setup";
import { BookConfigLoader } from "./BookConfigLoader";
import { deployProtocol } from "./factory";

describe("LikeProtocol as Beacon Factory", () => {
  it("should be able to create new BookNFT", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );

    const NewClassEvent = new Promise<{ id: `0x${string}` }>((resolve) => {
      const unwatch = likeProtocol.watchEvent.NewBookNFT({
        onLogs: (logs) => {
          const id = logs[0].args.bookNFT as `0x${string}`;
          unwatch();
          resolve({ id });
        },
      });
    });

    await likeProtocol.write.newBookNFT([
      {
        creator: deployer.account.address,
        updaters: [deployer.account.address],
        minters: [deployer.account.address],
        config: bookConfig,
      },
    ]);

    const { id: classId } = await NewClassEvent;
    const newNFTClass = await viem.getContractAt("BookNFT", classId);
    expect(await newNFTClass.read.name()).to.equal("My Book");
    expect(await newNFTClass.read.symbol()).to.equal("KOOB");
    const beacon = await newNFTClass.read.getProtocolBeacon();
    expect(beacon.toLowerCase()).to.equal(likeProtocol.address.toLowerCase());
    expect(await newNFTClass.read.contractURI()).to.equal(
      "data:application/json;base64,eyJuYW1lIjoiQ29sbGVjdGlvbiBOYW1lIiwic3ltYm9sIjoiQ29sbGVjdGlvbiBTWU1CIiwiZGVzY3JpcHRpb24iOiJDb2xsZWN0aW9uIERlc2NyaXB0aW9uIiwiaW1hZ2UiOiJpcGZzOi8vYmFmeWJlaWV6cTR5cW9zYzJ1NHNhYW5vdmU1YnNhM3ljaXVmd2hmZHVlbXk1ejZ2dmY2cTNjNWxuYmkiLCJiYW5uZXJfaW1hZ2UiOiIiLCJmZWF0dXJlZF9pbWFnZSI6IiIsImV4dGVybmFsX2xpbmsiOiJodHRwczovL3d3dy5leGFtcGxlLmNvbSIsImNvbGxhYm9yYXRvcnMiOltdfQ==",
    );
    const royalty = await newNFTClass.read.royaltyInfo([0n, 1000n]);
    expect(royalty[0].toLowerCase()).to.equal(
      deployer.account.address.toLowerCase(),
    );
    expect(royalty[1]).to.equal(0n);
  });

  it("should be able to create new BookNFT with royalty", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );

    await likeProtocol.write.newBookNFTWithRoyalty([
      {
        creator: deployer.account.address,
        updaters: [deployer.account.address],
        minters: [deployer.account.address],
        config: bookConfig,
      },
      100n,
    ]);
    const logs = await likeProtocol.getEvents.NewBookNFT();
    expect(logs.length).to.equal(1);
    const bookNFTAddress = logs[0].args.bookNFT;
    expect(await likeProtocol.read.isBookNFT([bookNFTAddress])).to.be.true;

    const newNFTClass = await viem.getContractAt("BookNFT", bookNFTAddress);
    const [receiver, royaltyAmount] = await newNFTClass.read.royaltyInfo([
      0n,
      1000n,
    ]);
    expect(receiver).to.equalAddress(deployer.account.address);
    expect(royaltyAmount).to.equal(10n);
  });

  it("should set the right royalty receiver on initialization", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const receiver = await likeProtocol.read.getRoyaltyReceiver();
    expect(receiver.toLowerCase()).to.equal(
      deployer.account.address.toLowerCase(),
    );
  });

  it("should allow owner to set the royalty receiver", async function () {
    const { likeProtocol, deployer, randomSigner } =
      await loadFixture(deployProtocol);
    await likeProtocol.write.setRoyaltyReceiver(
      [randomSigner.account.address],
      {
        account: deployer.account,
      },
    );
    const receiver = await likeProtocol.read.getRoyaltyReceiver();
    expect(receiver.toLowerCase()).to.equal(
      randomSigner.account.address.toLowerCase(),
    );
  });

  it("should not allow random address to set the royalty receiver", async function () {
    const { likeProtocol, randomSigner } = await loadFixture(deployProtocol);
    await expect(
      likeProtocol.write.setRoyaltyReceiver([randomSigner.account.address], {
        account: randomSigner.account,
      }),
    ).to.be.rejected;
  });

  it("should not allow to initialize a already initialized BookNFT", async function () {
    const { likeProtocol, deployer, randomSigner } =
      await loadFixture(deployProtocol);
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );

    const NewClassEvent = new Promise<{ id: `0x${string}` }>((resolve) => {
      const unwatch = likeProtocol.watchEvent.NewBookNFT({
        onLogs: (logs) => {
          const id = logs[0].args.bookNFT as `0x${string}`;
          unwatch();
          resolve({ id });
        },
      });
    });
    await likeProtocol.write.newBookNFT([
      {
        creator: deployer.account.address,
        updaters: [deployer.account.address],
        minters: [deployer.account.address],
        config: bookConfig,
      },
    ]);
    const { id: classId } = await NewClassEvent;

    const newNFTClass = await viem.getContractAt("BookNFT", classId);
    await expect(
      newNFTClass.write.initialize([bookConfig.name, bookConfig.symbol], {
        account: randomSigner.account,
      }),
    ).to.be.rejectedWith("InvalidInitialization()");
  });

  it("should not allow to create new BookNFT with same config", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );
    await likeProtocol.write.newBookNFT(
      [
        {
          creator: deployer.account.address,
          updaters: [deployer.account.address],
          minters: [deployer.account.address],
          config: bookConfig,
        },
      ],
      {
        account: deployer.account,
      },
    );
    await expect(
      likeProtocol.write.newBookNFT(
        [
          {
            creator: deployer.account.address,
            updaters: [deployer.account.address],
            minters: [deployer.account.address],
            config: bookConfig,
          },
        ],
        {
          account: deployer.account,
        },
      ),
    ).to.be.rejectedWith("FailedDeployment()");
  });

  it("should not allow to create new BookNFT when paused", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const classOperation = async () => {
      await likeProtocol.write.newBookNFT([
        {
          creator: deployer.account.address,
          updaters: [deployer.account.address],
          minters: [deployer.account.address],
          config: {
            name: "My Book",
            symbol: "KOOB",
            metadata: JSON.stringify({
              name: "Collection Name",
              symbol: "Collection SYMB",
              description: "Collection Description",
              image:
                "ipfs://bafybeiezq4yqosc2u4saanove5bsa3yciufwhfduemy5z6vvf6q3c5lnbi",
              banner_image: "",
              featured_image: "",
              external_link: "https://www.example.com",
              collaborators: [],
            }),
            max_supply: 10n,
          },
        },
      ]);
    };

    await expect(likeProtocol.write.pause({ account: deployer.account })).to.be
      .not.rejected;
    await expect(classOperation()).to.be.rejectedWith("EnforcedPause");
    await expect(likeProtocol.write.unpause({ account: deployer.account })).to
      .be.not.rejected;
    await expect(classOperation()).to.be.not.rejected;
  });

  it("should allow everyone to create new BookNFT", async function () {
    const { likeProtocol, randomSigner } = await loadFixture(deployProtocol);
    const newClass = async () => {
      await likeProtocol.write.newBookNFT(
        [
          {
            creator: randomSigner.account.address,
            updaters: [randomSigner.account.address],
            minters: [randomSigner.account.address],
            config: {
              name: "My Book",
              symbol: "KOOB",
              metadata: JSON.stringify({
                name: "Random by somone",
                symbol: "No data",
              }),
              max_supply: 10n,
            },
          },
        ],
        { account: randomSigner.account },
      );
    };

    await expect(newClass()).to.be.not.rejected;
  });

  it("should not allow to create new BookNFT when max supply is 0", async function () {
    const { likeProtocol, randomSigner } = await loadFixture(deployProtocol);
    const newClass = async () => {
      await likeProtocol.write.newBookNFT(
        [
          {
            creator: randomSigner.account.address,
            updaters: [randomSigner.account.address],
            minters: [randomSigner.account.address],
            config: {
              name: "My Book",
              symbol: "KOOB",
              metadata: JSON.stringify({
                name: "Random by somone",
                symbol: "No data",
              }),
              max_supply: 0n,
            },
          },
        ],
        { account: randomSigner.account },
      );
    };

    await expect(newClass()).to.be.rejectedWith("ErrMaxSupplyZero()");
  });

  it("should not allow everyone to create new BookNFT when paused", async function () {
    const { likeProtocol, deployer, randomSigner } =
      await loadFixture(deployProtocol);
    const classOperation = async () => {
      await likeProtocol.write.newBookNFT(
        [
          {
            creator: randomSigner.account.address,
            updaters: [randomSigner.account.address],
            minters: [randomSigner.account.address],
            config: {
              name: "My Book",
              symbol: "KOOB",
              metadata: JSON.stringify({
                name: "Random by somone",
                symbol: "No data",
              }),
              max_supply: 10n,
            },
          },
        ],
        { account: randomSigner.account },
      );
    };

    await expect(likeProtocol.write.pause({ account: deployer.account })).to.be
      .not.rejected;
    await expect(classOperation()).to.be.rejectedWith("EnforcedPause");
    await expect(likeProtocol.write.unpause({ account: deployer.account })).to
      .be.not.rejected;
    await expect(classOperation()).to.be.not.rejected;
  });
});

describe("LikeProtocol as Beacon Factory with deterministic address", () => {
  it("should be able to create new BookNFT", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );
    await likeProtocol.write.newBookNFT([
      {
        creator: deployer.account.address,
        updaters: [deployer.account.address],
        minters: [deployer.account.address],
        config: bookConfig,
      },
    ]);
    const logs = await likeProtocol.getEvents.NewBookNFT();
    expect(logs.length).to.equal(1);
    const bookNFTAddress = logs[0].args.bookNFT;
    expect(await likeProtocol.read.isBookNFT([bookNFTAddress])).to.be.true;
  });

  it("should be able to precompute address", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    // Any upgrade to openzeppelin would cause this test to fail, event comments updates
    const salt =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );
    const deployerAddress = deployer.account.address;
    expect(deployerAddress).to.equalAddress(
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    );
    expect(likeProtocol.address).to.equalAddress(
      "0x95f846D5c646D3eefb0b56932B8Abf3995A3F9e5",
    );
    const msgNewBookNFT = {
      creator: deployer.account.address,
      updaters: [deployer.account.address],
      minters: [deployer.account.address],
      config: bookConfig,
    };
    const targetAddress = await likeProtocol.read.precomputeBookNFTAddress([
      salt,
      msgNewBookNFT,
    ]);
    expect(targetAddress).to.equal(
      "0xE35E23Feb6BC683B6AADEE5D3a3249Ba584c005f",
    );
    const bookConfig1 = BookConfigLoader.load(
      "./test/fixtures/BookConfig1.json",
    );
    const msgNewBookNFT1 = {
      creator: deployer.account.address,
      updaters: [deployer.account.address],
      minters: [deployer.account.address],
      config: bookConfig1,
    };
    const targetAddress1 = await likeProtocol.read.precomputeBookNFTAddress([
      salt,
      msgNewBookNFT1,
    ]);
    expect(targetAddress1).to.equalAddress(
      "0x16EaCc97945f2C61E99c1f77Fc97B44D557F288e",
    );
  });

  it("should be able to create new BookNFT with precomputed address", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const salt = ("0x" +
      deployer.account.address.slice(2) +
      "0".repeat(24)) as `0x${string}`;
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );
    const msgNewBookNFT = {
      creator: deployer.account.address,
      updaters: [deployer.account.address],
      minters: [deployer.account.address],
      config: bookConfig,
    };
    const precomputedAddress = await likeProtocol.read.precomputeBookNFTAddress(
      [salt, msgNewBookNFT],
    );

    await likeProtocol.write.newBookNFTWithSalt([salt, msgNewBookNFT], {
      account: deployer.account,
    });
    const logs = await likeProtocol.getEvents.NewBookNFT();
    expect(logs.length).to.equal(1);
    const actualAddress = logs[0].args.bookNFT;
    expect(await likeProtocol.read.isBookNFT([actualAddress])).to.be.true;

    const book0NFT = await viem.getContractAt("BookNFT", actualAddress);
    expect(await book0NFT.read.name()).to.equal("My Book");
    expect(await book0NFT.read.symbol()).to.equal("KOOB");
    const beacon = await book0NFT.read.getProtocolBeacon();
    expect(beacon.toLowerCase()).to.equal(likeProtocol.address.toLowerCase());
    expect(await book0NFT.read.contractURI()).to.equal(
      "data:application/json;base64,eyJuYW1lIjoiQ29sbGVjdGlvbiBOYW1lIiwic3ltYm9sIjoiQ29sbGVjdGlvbiBTWU1CIiwiZGVzY3JpcHRpb24iOiJDb2xsZWN0aW9uIERlc2NyaXB0aW9uIiwiaW1hZ2UiOiJpcGZzOi8vYmFmeWJlaWV6cTR5cW9zYzJ1NHNhYW5vdmU1YnNhM3ljaXVmd2hmZHVlbXk1ejZ2dmY2cTNjNWxuYmkiLCJiYW5uZXJfaW1hZ2UiOiIiLCJmZWF0dXJlZF9pbWFnZSI6IiIsImV4dGVybmFsX2xpbmsiOiJodHRwczovL3d3dy5leGFtcGxlLmNvbSIsImNvbGxhYm9yYXRvcnMiOltdfQ==",
    );
    const royalty = await book0NFT.read.royaltyInfo([0n, 1000n]);
    expect(royalty[0].toLowerCase()).to.equal(
      deployer.account.address.toLowerCase(),
    );
    expect(royalty[1]).to.equal(0n);

    expect(actualAddress).to.equalAddress(precomputedAddress);
  });

  it("should be not able to create same BookNFT with same salt", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const salt = ("0x" +
      deployer.account.address.slice(2) +
      "0".repeat(24)) as `0x${string}`;
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );
    const msgNewBookNFT = {
      creator: deployer.account.address,
      updaters: [deployer.account.address],
      minters: [deployer.account.address],
      config: bookConfig,
    };
    const precomputedAddress = await likeProtocol.read.precomputeBookNFTAddress(
      [salt, msgNewBookNFT],
    );

    await likeProtocol.write.newBookNFTWithSalt([salt, msgNewBookNFT], {
      account: deployer.account,
    });
    const logs = await likeProtocol.getEvents.NewBookNFT();
    expect(logs.length).to.equal(1);
    const actualAddress = logs[0].args.bookNFT;
    expect(await likeProtocol.read.isBookNFT([actualAddress])).to.be.true;

    await expect(
      likeProtocol.write.newBookNFTWithSalt([salt, msgNewBookNFT], {
        account: deployer.account,
      }),
    ).to.be.rejectedWith("FailedDeployment()");
  });

  it("should not alter computed address after BookNFT upgrade", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const salt = ("0x" +
      deployer.account.address.slice(2) +
      "0".repeat(24)) as `0x${string}`;
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );
    const msgNewBookNFT = {
      creator: deployer.account.address,
      updaters: [deployer.account.address],
      minters: [deployer.account.address],
      config: bookConfig,
    };
    const precomputedAddress = await likeProtocol.read.precomputeBookNFTAddress(
      [salt, msgNewBookNFT],
    );

    const bookNFTMock = await viem.deployContract("BookNFTMock");
    await likeProtocol.write.upgradeTo([bookNFTMock.address], {
      account: deployer.account,
    });
    const newAddress = await likeProtocol.read.precomputeBookNFTAddress([
      salt,
      msgNewBookNFT,
    ]);
    expect(newAddress).to.equal(precomputedAddress);
  });

  it("should not alter computed address after LikeProtocol upgrade", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const salt = ("0x" +
      deployer.account.address.slice(2) +
      "0".repeat(24)) as `0x${string}`;
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );
    const msgNewBookNFT = {
      creator: deployer.account.address,
      updaters: [deployer.account.address],
      minters: [deployer.account.address],
      config: bookConfig,
    };
    const precomputedAddress = await likeProtocol.read.precomputeBookNFTAddress(
      [salt, msgNewBookNFT],
    );

    const likeProtocolMock = await viem.deployContract("LikeProtocolMock");
    await likeProtocol.write.upgradeToAndCall(
      [likeProtocolMock.address, "0x"],
      {
        account: deployer.account,
      },
    );
    const newAddress = await likeProtocol.read.precomputeBookNFTAddress([
      salt,
      msgNewBookNFT,
    ]);
    expect(newAddress).to.equal(precomputedAddress);
  });

  it("should not alter computed address after LikeProtocol upgrade with BookNFT upgrade", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const salt = ("0x" +
      deployer.account.address.slice(2) +
      "0".repeat(24)) as `0x${string}`;
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );
    const msgNewBookNFT = {
      creator: deployer.account.address,
      updaters: [deployer.account.address],
      minters: [deployer.account.address],
      config: bookConfig,
    };
    const precomputedAddress = await likeProtocol.read.precomputeBookNFTAddress(
      [salt, msgNewBookNFT],
    );

    const likeProtocolMock = await viem.deployContract("LikeProtocolMock");
    const bookNFTMock = await viem.deployContract("BookNFTMock");
    const upgradeToAndCallData = await encodeFunctionData({
      abi: likeProtocol.abi,
      functionName: "upgradeTo",
      args: [bookNFTMock.address],
    });
    await likeProtocol.write.upgradeToAndCall(
      [likeProtocolMock.address, upgradeToAndCallData],
      {
        account: deployer.account,
      },
    );
    const newAddress = await likeProtocol.read.precomputeBookNFTAddress([
      salt,
      msgNewBookNFT,
    ]);
    expect(newAddress).to.equal(precomputedAddress);
  });

  it("should be able to create new BookNFT with royalty and salt", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const salt = ("0x" +
      deployer.account.address.slice(2) +
      "0".repeat(24)) as `0x${string}`;
    const bookConfig = BookConfigLoader.load(
      "./test/fixtures/BookConfig0.json",
    );
    const msgNewBookNFT = {
      creator: deployer.account.address,
      updaters: [deployer.account.address],
      minters: [deployer.account.address],
      config: bookConfig,
    };
    await likeProtocol.write.newBookNFTWithRoyaltyAndSalt(
      [salt, msgNewBookNFT, 100n],
      {
        account: deployer.account,
      },
    );
    const logs = await likeProtocol.getEvents.NewBookNFT();
    expect(logs.length).to.equal(1);
    const bookNFTAddress = logs[0].args.bookNFT;
    expect(await likeProtocol.read.isBookNFT([bookNFTAddress])).to.be.true;
    const bookNFT = await viem.getContractAt("BookNFT", bookNFTAddress);
    const [receiver, royaltyAmount] = await bookNFT.read.royaltyInfo([
      0n,
      1000n,
    ]);
    expect(receiver).to.equalAddress(deployer.account.address);
    expect(royaltyAmount).to.equal(10n);
  });
});

describe("LikeProtocol initCode hash used for BookNFT", () => {
  it("should be able to get initCode hash", async function () {
    const { likeProtocol, deployer } = await loadFixture(deployProtocol);
    const likeProtocolMock = await viem.deployContract("LikeProtocolMock");
    likeProtocol.write.upgradeToAndCall([likeProtocolMock.address, "0x"], {
      account: deployer.account,
    });
    const hash1 = await likeProtocolMock.read.initCodeHash([
      "0x95f846D5c646D3eefb0b56932B8Abf3995A3F9e5",
      "My Book",
      "KOOB",
    ]);
    expect(hash1).to.equal(
      "0x7e65ffed265e51945dbcf640933e6d0928a9e18928a68dfd8f93065d740932d7",
    );
    const hash2 = await likeProtocolMock.read.initCodeHash([
      "0x95f846D5c646D3eefb0b56932B8Abf3995A3F9e5",
      "MoneyVerse",
      "BOOK",
    ]);
    expect(hash2).to.equal(
      "0x1709254a71813e6b744513297b0532632180a457627653968926837642a06033",
    );
  });
});
