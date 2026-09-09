// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPolicyManager {
    /// @return allowed Whether this transaction is authorized under current policy.
    /// @return reason  Machine-readable reason code for UI display.
    function checkTransaction(
        address account,
        address recipient,
        uint256 amount,
        bytes calldata data
    ) external returns (bool allowed, string memory reason);

    function recordSpend(address account, uint256 amount) external;
    function setSingleTxLimit(uint256 newLimit) external;
    function setDailyLimit(uint256 newLimit) external;
    function setTrustedRecipient(address recipient, bool trusted) external;
}
