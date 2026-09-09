// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPasskeyAccount {
    struct WebAuthnAuth {
        bytes authenticatorData;
        bytes clientDataJSON;
        bytes32 r;
        bytes32 s;
    }

    event SignatureVerified(bytes32 digest);
    event PolicyApproved(address recipient, uint256 amount);
    event PolicyBlocked(address recipient, uint256 amount, string reason);
    event TransactionExecuted(address recipient, uint256 amount, bytes data);

    function registerPasskey(bytes32 x, bytes32 y) external;
    function executeTransaction(
        address recipient,
        uint256 amount,
        bytes calldata data,
        WebAuthnAuth calldata auth
    ) external returns (bool executed);

    function nonce() external view returns (uint256);
}
