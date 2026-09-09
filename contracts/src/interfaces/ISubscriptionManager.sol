// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISubscriptionManager {
    function isActive(address account) external view returns (bool);
    function subscriptionExpiry(address account) external view returns (uint256);
    function monthlyFeeWei() external view returns (uint256);
    function subscribe() external payable;
}
