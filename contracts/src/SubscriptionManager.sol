// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISubscriptionManager.sol";

/// @title SubscriptionManager
/// @notice Manages monthly premium subscriptions for PasskeyGuard account spending policy upgrades.
///         All collected subscription fees are forwarded immediately to the developer treasury wallet.
contract SubscriptionManager is ISubscriptionManager {
    address public owner;
    address public treasury;
    uint256 public monthlyFeeWei;

    mapping(address => uint256) public override subscriptionExpiry;

    // ─── Events ──────────────────────────────────────────────────────────────

    /// @notice Emitted when an account renews or activates a monthly subscription.
    event SubscriptionRenewed(address indexed account, uint256 newExpiry, uint256 amountPaid);

    /// @notice Emitted when monthly subscription fee amount is updated.
    event MonthlyFeeSet(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when treasury recipient address is updated.
    event TreasurySet(address indexed oldTreasury, address indexed newTreasury);

    /// @notice Emitted when contract ownership is transferred.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "SubscriptionManager: only owner");
        _;
    }

    constructor(address _treasury, uint256 _monthlyFeeWei) {
        require(_treasury != address(0), "SubscriptionManager: invalid treasury");
        owner = msg.sender;
        treasury = _treasury;
        monthlyFeeWei = _monthlyFeeWei > 0 ? _monthlyFeeWei : 1e15; // default 0.001 ETH
        emit TreasurySet(address(0), _treasury);
        emit MonthlyFeeSet(0, monthlyFeeWei);
    }

    /// @notice Purchase or extend a 30-day subscription for msg.sender.
    function subscribe() external payable override {
        require(msg.value >= monthlyFeeWei, "SubscriptionManager: insufficient ETH fee");

        uint256 baseTime = subscriptionExpiry[msg.sender] > block.timestamp
            ? subscriptionExpiry[msg.sender]
            : block.timestamp;

        uint256 newExpiry = baseTime + 30 days;
        subscriptionExpiry[msg.sender] = newExpiry;

        (bool success, ) = treasury.call{value: msg.value}("");
        require(success, "SubscriptionManager: treasury transfer failed");

        emit SubscriptionRenewed(msg.sender, newExpiry, msg.value);
    }

    /// @notice Returns true if the given account has an active subscription.
    function isActive(address account) public view override returns (bool) {
        return subscriptionExpiry[account] >= block.timestamp;
    }

    // ─── Admin Settings ───────────────────────────────────────────────────────

    function setMonthlyFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = monthlyFeeWei;
        monthlyFeeWei = newFee;
        emit MonthlyFeeSet(oldFee, newFee);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "SubscriptionManager: invalid treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasurySet(oldTreasury, newTreasury);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "SubscriptionManager: invalid owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
