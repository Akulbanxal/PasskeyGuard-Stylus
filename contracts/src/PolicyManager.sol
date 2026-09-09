// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPolicyManager.sol";

contract PolicyManager is IPolicyManager {
    address public owner;
    
    uint256 public singleTxLimit;
    uint256 public dailyLimit;
    
    mapping(address => bool) public trustedRecipients;
    mapping(address => mapping(uint256 => uint256)) public dailySpent; // account => day => amount

    modifier onlyOwner() {
        require(msg.sender == owner, "PolicyManager: only owner");
        _;
    }

    constructor(address _owner, uint256 _singleTxLimit, uint256 _dailyLimit) {
        owner = _owner;
        singleTxLimit = _singleTxLimit;
        dailyLimit = _dailyLimit;
    }

    function checkTransaction(
        address account,
        address recipient,
        uint256 amount,
        bytes calldata /* data */
    ) external view returns (bool allowed, string memory reason) {
        if (trustedRecipients[recipient]) {
            return (true, "OK");
        }

        if (amount > singleTxLimit) {
            return (false, "SINGLE_TX_LIMIT_EXCEEDED");
        }

        uint256 currentDay = block.timestamp / 1 days;
        if (dailySpent[account][currentDay] + amount > dailyLimit) {
            return (false, "DAILY_LIMIT_EXCEEDED");
        }

        return (true, "OK");
    }

    function recordSpend(address account, uint256 amount) external {
        require(msg.sender == owner, "PolicyManager: only owner account can record spend");
        uint256 currentDay = block.timestamp / 1 days;
        dailySpent[account][currentDay] += amount;
    }

    function setSingleTxLimit(uint256 newLimit) external onlyOwner {
        singleTxLimit = newLimit;
    }

    function setDailyLimit(uint256 newLimit) external onlyOwner {
        dailyLimit = newLimit;
    }

    function setTrustedRecipient(address recipient, bool trusted) external onlyOwner {
        trustedRecipients[recipient] = trusted;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
