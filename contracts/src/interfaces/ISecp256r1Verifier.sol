// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISecp256r1Verifier {
    /// @notice Verifies a P-256 (secp256r1) ECDSA signature.
    /// @param messageHash 32-byte digest that was signed.
    /// @param r 32-byte signature component r.
    /// @param s 32-byte signature component s (low-s normalized).
    /// @param x 32-byte public key x-coordinate.
    /// @param y 32-byte public key y-coordinate.
    /// @return valid True only if the signature verifies against (x, y) for messageHash.
    function verify(
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        bytes32 x,
        bytes32 y
    ) external view returns (bool valid);
}
