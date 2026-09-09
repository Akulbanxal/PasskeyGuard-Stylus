// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPasskeyAccount {
    struct WebAuthnAuth {
        bytes authenticatorData;
        bytes clientDataJSON;
        bytes32 r;
        bytes32 s;
    }

    event SignatureVerified(bytes32 indexed digest, address indexed account);
    event PolicyApproved(address indexed recipient, uint256 amount);
    event PolicyBlocked(address indexed recipient, uint256 amount, string reason);
    event TransactionExecuted(address indexed recipient, uint256 amount, bytes data, uint256 nonce);

    function registerPasskey(bytes32 x, bytes32 y) external;
    function executeTransaction(
        address recipient,
        uint256 amount,
        bytes calldata data,
        WebAuthnAuth calldata auth
    ) external payable returns (bool executed);

    function nonce() external view returns (uint256);
}
