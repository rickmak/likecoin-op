import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LikeCollectiveModule = buildModule("LikeCollectiveModule", (m) => {
  const initOwner = m.getParameter("initOwner");
  const likeCollectiveImpl = m.contract("LikeCollective", [], { id: "LikeCollectiveImpl" });

  const initData = m.encodeFunctionCall(likeCollectiveImpl, "initialize", [
    initOwner,
  ]);
  const likeCollectiveProxy = m.contract("ERC1967Proxy", [likeCollectiveImpl, initData]);

  const likeCollective = m.contractAt("LikeCollective", likeCollectiveProxy);

  return { likeCollective, likeCollectiveImpl, likeCollectiveProxy };
});

export default LikeCollectiveModule;
