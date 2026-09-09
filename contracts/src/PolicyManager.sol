// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPolicyManager.sol";

/// @title PolicyManager
/// @notice Manages per-account spending policies and enforces them on PasskeyAccount.
///         All state-changing functions emit events for The Graph indexing.
contract PolicyManager is IPolicyManager {
    address public owner;

    uint256 public singleTxLimit;
    uint256 public dailyLimit;

    mapping(address => bool) public trustedRecipients;
    mapping(address => mapping(uint256 => uint256)) public dailySpent; // account => day => spent

    // ─── Events (indexed by The Graph) ───────────────────────────────────────

    /// @notice Emitted whenever the single-tx spending limit is updated.
    event SingleTxLimitSet(address indexed by, uint256 oldLimit, uint256 newLimit);

    /// @notice Emitted whenever the daily spending limit is updated.
    event DailyLimitSet(address indexed by, uint256 oldLimit, uint256 newLimit);

    /// @notice Emitted when a recipient's trusted status changes.
    event TrustedRecipientSet(address indexed recipient, bool trusted);

    /// @notice Emitted when an account's daily spend is recorded.
    event SpendRecorded(address indexed account, uint256 amount, uint256 dayBucket, uint256 totalDailySpent);

    /// @notice Emitted when a transaction is BLOCKED by policy.
    event PolicyBlocked(address indexed account, address indexed recipient, uint256 amount, string reason);

    /// @notice Emitted when a transaction is APPROVED by policy.
    event PolicyApproved(address indexed account, address indexed recipient, uint256 amount);

    /// @notice Emitted when ownership is transferred.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "PolicyManager: only owner");
        _;
    }

    constructor(address _owner, uint256 _singleTxLimit, uint256 _dailyLimit) {
        owner = _owner;
        singleTxLimit = _singleTxLimit;
        dailyLimit = _dailyLimit;
        emit SingleTxLimitSet(address(0), 0, _singleTxLimit);
        emit DailyLimitSet(address(0), 0, _dailyLimit);
    }

    function checkTransaction(
        address account,
        address recipient,
        uint256 amount,
        bytes calldata /* data */
    ) external returns (bool allowed, string memory reason) {
        if (trustedRecipients[recipient]) {
            emit PolicyApproved(account, recipient, amount);
            return (true, "TRUSTED_RECIPIENT");
        }

        if (amount > singleTxLimit) {
            emit PolicyBlocked(account, recipient, amount, "SINGLE_TX_LIMIT_EXCEEDED");
            return (false, "SINGLE_TX_LIMIT_EXCEEDED");
        }

        uint256 currentDay = block.timestamp / 1 days;
        uint256 projected = dailySpent[account][currentDay] + amount;
        if (projected > dailyLimit) {
            emit PolicyBlocked(account, recipient, amount, "DAILY_LIMIT_EXCEEDED");
            return (false, "DAILY_LIMIT_EXCEEDED");
        }

        emit PolicyApproved(account, recipient, amount);
        return (true, "OK");
    }

    function recordSpend(address account, uint256 amount) external {
        require(msg.sender == owner, "PolicyManager: only owner account can record spend");
        uint256 currentDay = block.timestamp / 1 days;
        dailySpent[account][currentDay] += amount;
        emit SpendRecorded(account, amount, currentDay, dailySpent[account][currentDay]);
    }

    function setSingleTxLimit(uint256 newLimit) external onlyOwner {
        uint256 old = singleTxLimit;
        singleTxLimit = newLimit;
        emit SingleTxLimitSet(msg.sender, old, newLimit);
    }

    function setDailyLimit(uint256 newLimit) external onlyOwner {
        uint256 old = dailyLimit;
        dailyLimit = newLimit;
        emit DailyLimitSet(msg.sender, old, newLimit);
    }

    function setTrustedRecipient(address recipient, bool trusted) external onlyOwner {
        trustedRecipients[recipient] = trusted;
        emit TrustedRecipientSet(recipient, trusted);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        address old = owner;
        owner = newOwner;
        emit OwnershipTransferred(old, newOwner);
    }
}
