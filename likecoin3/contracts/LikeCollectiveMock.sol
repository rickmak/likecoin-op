// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {LikeCollective} from "../contracts/LikeCollective.sol";

contract LikeCollectiveMock is LikeCollective {
    function version() public pure returns (uint256) {
        return 2;
    }

    function dataStorage() external pure returns (bytes32) {
        return
            keccak256(
                abi.encode(uint256(keccak256("likecollective.storage")) - 1)
            ) & ~bytes32(uint256(0xff));
    }
}
