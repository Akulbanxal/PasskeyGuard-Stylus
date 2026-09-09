// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PasskeyAccount.sol";
import "../src/PolicyManager.sol";
import "../src/DemoTarget.sol";
import "./PasskeyAccount.t.sol"; // reuse MockVerifier and Base64Url
import "../src/Base64Url.sol";

contract SecurityTest is Test {
    PasskeyAccount account;
    PolicyManager policyManager;
    MockVerifier verifier;
    DemoTarget target;

    bytes32 constant X = bytes32(uint256(1));
    bytes32 constant Y = bytes32(uint256(2));

    function setUp() public {
        verifier = new MockVerifier(true);
        policyManager = new PolicyManager(address(this), 1 ether, 5 ether);
        account = new PasskeyAccount(address(verifier), address(policyManager));
        target = new DemoTarget();

        account.registerPasskey(X, Y);
        vm.deal(address(account), 10 ether);
        policyManager.transferOwnership(address(account));
    }

    function _createAuth(address recipient, uint256 amount, uint256 expectedNonce) internal pure returns (IPasskeyAccount.WebAuthnAuth memory) {
        bytes32 expectedChallenge = keccak256(abi.encodePacked(recipient, amount, expectedNonce));
        string memory b64 = Base64Url.encode(abi.encodePacked(expectedChallenge));
        bytes memory clientDataJSON = bytes(string.concat('{"challenge":"', b64, '","origin":"http://localhost"}'));
        return IPasskeyAccount.WebAuthnAuth({
            authenticatorData: hex"112233",
            clientDataJSON: clientDataJSON,
            r: bytes32(uint256(7)),
            s: bytes32(uint256(8))
        });
    }

    function test_replay_attack() public {
        IPasskeyAccount.WebAuthnAuth memory auth = _createAuth(address(target), 0.1 ether, 0);
        
        // First transaction works
        bool executed = account.executeTransaction(address(target), 0.1 ether, "", auth);
        assertTrue(executed);
        
        // Replay exactly the same auth - should fail because nonce advanced to 1
        vm.expectRevert("PasskeyAccount: invalid challenge in clientDataJSON");
        account.executeTransaction(address(target), 0.1 ether, "", auth);
    }

    function test_unbound_transaction_parameters() public {
        // Create an auth payload for a 0.1 ether transaction
        IPasskeyAccount.WebAuthnAuth memory auth = _createAuth(address(target), 0.1 ether, 0);
        
        // Attacker attempts to reuse it for a 1 ether transaction!
        // Should fail because the challenge expected for 1 ether will not match the clientDataJSON
        vm.expectRevert("PasskeyAccount: invalid challenge in clientDataJSON");
        account.executeTransaction(address(target), 1 ether, "", auth);
    }
}
