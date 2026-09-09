// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PasskeyAccount.sol";
import "../src/PolicyManager.sol";
import "../src/DemoTarget.sol";
import "../src/interfaces/ISecp256r1Verifier.sol";

// Mock Verifier to test account logic locally since real verifier isn't deployed on testnet
contract MockVerifier is ISecp256r1Verifier {
    bool public shouldVerify;
    constructor(bool _shouldVerify) {
        shouldVerify = _shouldVerify;
    }
    
    function setVerify(bool _shouldVerify) external {
        shouldVerify = _shouldVerify;
    }

    function verify(
        bytes32, bytes32, bytes32, bytes32, bytes32
    ) external view returns (bool) {
        return shouldVerify;
    }
}

contract PasskeyAccountTest is Test {
    PasskeyAccount account;
    PolicyManager policyManager;
    MockVerifier verifier;
    DemoTarget target;

    bytes32 constant X = bytes32(uint256(1));
    bytes32 constant Y = bytes32(uint256(2));

    function setUp() public {
        verifier = new MockVerifier(true);
        // Single Tx Limit: 1 ether, Daily Limit: 5 ether
        policyManager = new PolicyManager(address(this), 1 ether, 5 ether);
        account = new PasskeyAccount(address(verifier), address(policyManager), address(0x9999999999999999999999999999999999999999));
        target = new DemoTarget();

        // Register passkey
        account.registerPasskey(X, Y);

        // Fund the account
        vm.deal(address(account), 10 ether);
        
        // Transfer ownership of policy manager to account so it can record spend
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

    function test_valid_authorization() public {
        bytes memory data = abi.encodeWithSelector(DemoTarget.doSomething.selector, hex"deadbeef");
        IPasskeyAccount.WebAuthnAuth memory auth = _createAuth(address(target), 0.5 ether, 0);
        
        bool executed = account.executeTransaction(address(target), 0.5 ether, data, auth);
        
        assertTrue(executed);
        assertEq(target.valueReceived(), 0.5 ether);
        assertEq(target.lastData(), hex"deadbeef");
        assertEq(account.nonce(), 1);
    }

    function test_invalid_signature() public {
        verifier.setVerify(false); // Simulate bad signature
        bytes memory data = abi.encodeWithSelector(DemoTarget.doSomething.selector, hex"deadbeef");
        IPasskeyAccount.WebAuthnAuth memory auth = _createAuth(address(target), 0.5 ether, 0);
        
        vm.expectRevert("PasskeyAccount: invalid signature");
        account.executeTransaction(address(target), 0.5 ether, data, auth);
    }

    function test_policy_boundary() public {
        IPasskeyAccount.WebAuthnAuth memory authAtLimit = _createAuth(address(target), 1 ether, 0);
        
        // At limit should pass
        bool executed = account.executeTransaction(address(target), 1 ether, "", authAtLimit);
        assertTrue(executed);
        
        // Over limit should fail
        IPasskeyAccount.WebAuthnAuth memory authOverLimit = _createAuth(address(target), 1.1 ether, 1);
        vm.expectRevert("SINGLE_TX_LIMIT_EXCEEDED");
        account.executeTransaction(address(target), 1.1 ether, "", authOverLimit);
    }

    function test_execution_failure_state_reverts() public {
        IPasskeyAccount.WebAuthnAuth memory auth = _createAuth(address(target), 0.5 ether, 0);
        
        // Empty the account so execution fails
        vm.deal(address(account), 0);

        // Trying to send ETH when it has 0 should revert at the execution step
        vm.expectRevert("PasskeyAccount: insufficient balance for tx + fee");
        account.executeTransaction(address(target), 0.5 ether, "", auth);
        
        // Nonce shouldn't increment, target shouldn't receive funds
        assertEq(account.nonce(), 0);
        assertEq(target.valueReceived(), 0);
    }

    function test_nonce_increments() public {
        IPasskeyAccount.WebAuthnAuth memory auth1 = _createAuth(address(target), 0.1 ether, 0);
        account.executeTransaction(address(target), 0.1 ether, "", auth1);
        assertEq(account.nonce(), 1);
        
        IPasskeyAccount.WebAuthnAuth memory auth2 = _createAuth(address(target), 0.1 ether, 1);
        account.executeTransaction(address(target), 0.1 ether, "", auth2);
        assertEq(account.nonce(), 2);
    }
}
