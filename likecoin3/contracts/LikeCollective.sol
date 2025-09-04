// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/// @custom:security-contact rickmak@oursky.com
contract LikeCollective is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    struct CollectiveData {
        address likecoin;
    }

    // keccak256(abi.encode(uint256(keccak256("likecollective.storage")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant CLASS_DATA_STORAGE =
        0xe9c9d9e1df02920d747aa7516ca1d4362d70267096e6330bcfb24b265ac2ee00;

    function _getCollectiveData()
        private
        pure
        returns (CollectiveData storage $)
    {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := CLASS_DATA_STORAGE
        }
    }

    // Events
    // solhint-disable gas-indexed-events
    event Staked(address indexed bookNFT, address indexed account, uint256 stakedAmount);
    event Unstaked(address indexed bookNFT, address indexed account, uint256 stakedAmount);
    event RewardAdded(address indexed bookNFT, address indexed account, uint256 rewardedAmount);
    event RewardClaimed(address indexed bookNFT, address indexed account, uint256 rewardedAmount);
    event RewardDeposited(address indexed bookNFT, address indexed account, uint256 stakedAmount, uint256 rewardedAmount);
    event AllRewardClaimed(address indexed account, RewardData[] rewardedAmount);
    // solhint-enable gas-indexed-events

    struct RewardData {
        address bookNFT;
        uint256 rewardedAmount;
    }

    // Errors
    error ErrInvalidBookNFT(address bookNFT);
    error ErrInsufficientStake(uint256 required, uint256 available);
    error ErrNoRewardsToClaim();
    error ErrInvalidAmount();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __UUPSUpgradeable_init();
        __Ownable_init(initialOwner);
        __Pausable_init();
        __ReentrancyGuard_init();
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function stake(address bookNFT, uint256 amount) external whenNotPaused nonReentrant {
        // TODO: Implement stake logic
        // - Validate bookNFT
        // - Transfer tokens from user
        // - Update user stakes and total stakes
        // - Emit Staked event
    }

    function unstake(address bookNFT, uint256 amount) external whenNotPaused nonReentrant {
        // TODO: Implement unstake logic
        // - Validate bookNFT and sufficient stake
        // - Update user stakes and total stakes
        // - Transfer tokens back to user
        // - Emit Unstaked event
    }

    function claimRewards(address bookNFT) external whenNotPaused nonReentrant {
        // TODO: Implement claim rewards logic
        // - Calculate pending rewards
        // - Transfer rewards to user
        // - Update pending rewards
        // - Emit RewardClaimed event
    }

    // solhint-disable no-unused-vars
    function claimAllRewards() external whenNotPaused nonReentrant {
        // TODO: Implement claim all rewards logic
        // - Iterate through all bookNFTs user has stakes in
        // - Calculate and claim rewards for each
        // - Emit AllRewardClaimed event
    }

    function getStakeForUser(address user, address bookNFT) external view returns (uint256) {
        // TODO: Implement get stake for user
        return 0;
    }

    function getTotalStake(address bookNFT) external view returns (uint256) {
        // TODO: Implement get total stake
        return 0;
    }

    function getPendingRewards(address user, address bookNFT) external view returns (uint256) {
        // TODO: Implement get pending rewards calculation
        return 0;
    }
    // solhint-enable no-unused-vars

    function depositReward(address bookNFT, uint256 amount) external whenNotPaused {
        // TODO: Implement deposit reward logic
        // - Validate bookNFT
        // - Transfer reward tokens from caller
        // - Update book rewards
        // - Emit RewardDeposited event
    }

    function restakeReward(address bookNFT) external whenNotPaused nonReentrant {
        // TODO: Implement restake reward logic
        // - Calculate pending rewards
        // - Add rewards to user's stake
        // - Update pending rewards
        // - Emit Staked event for restaked amount
    }

    function _authorizeUpgrade(address _newImplementation) internal override onlyOwner {
        // TODO: Add any additional authorization logic if needed
    }
}
