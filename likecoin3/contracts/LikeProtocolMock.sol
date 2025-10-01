// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {LikeProtocol, IBookNFTInterface} from "../contracts/LikeProtocol.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
contract LikeProtocolMock is LikeProtocol {
    function version() public pure returns (uint256) {
        return 2;
    }

    function protocolDataStorage() external pure returns (bytes32) {
        return
            keccak256(
                abi.encode(uint256(keccak256("likeprotocol.storage")) - 1)
            ) & ~bytes32(uint256(0xff));
    }

    function creationCode() public pure returns (bytes memory) {
        return type(BeaconProxy).creationCode;
    }

    function initCodeHash(
        address protocolAddress,
        string memory name,
        string memory symbol
    ) public pure returns (bytes32) {
        bytes memory initData = abi.encodeWithSelector(
            IBookNFTInterface.initialize.selector,
            name,
            symbol
        );
        bytes memory proxyCreationCode = abi.encodePacked(
            type(BeaconProxy).creationCode,
            abi.encode(protocolAddress, initData)
        );
        return keccak256(proxyCreationCode);
    }
}
