// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PasskeyAccount.sol";
import "../src/PolicyManager.sol";
import "../src/SubscriptionManager.sol";
import "../src/DemoTarget.sol";
import "./PasskeyAccount.t.sol";

contract MonetizationTest is Test {
    PasskeyAccount account;
    PolicyManager policyManager;
    SubscriptionManager subscriptionManager;
    MockVerifier verifier;
    DemoTarget target;

    address treasury = address(0x7777777777777777777777777777777777777777);
    bytes32 constant X = bytes32(uint256(1));
    bytes32 constant Y = bytes32(uint256(2));

    function setUp() public {
        verifier = new MockVerifier(true);
        policyManager = new PolicyManager(address(this), 1 ether, 5 ether);
        subscriptionManager = new SubscriptionManager(treasury, 0.001 ether);

        policyManager.setSubscriptionManager(address(subscriptionManager));

        account = new PasskeyAccount(address(verifier), address(policyManager), treasury);
        target = new DemoTarget();

        account.registerPasskey(X, Y);
        vm.deal(address(account), 20 ether);
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

    function test_per_tx_fee_collected() public {
        uint256 initialTreasuryBal = treasury.balance;

        bytes memory data = abi.encodeWithSelector(DemoTarget.doSomething.selector, hex"1234");
        IPasskeyAccount.WebAuthnAuth memory auth = _createAuth(address(target), 0.5 ether, 0);

        bool executed = account.executeTransaction(address(target), 0.5 ether, data, auth);
        assertTrue(executed);

        uint256 expectedFee = 0.0001 ether; // default txFeeWei
        assertEq(treasury.balance - initialTreasuryBal, expectedFee);
    }

    function test_subscription_flow_and_policy_upgrade() public {
        address subscriber = address(0x8888888888888888888888888888888888888888);
        vm.deal(subscriber, 1 ether);

        assertFalse(subscriptionManager.isActive(subscriber));

        uint256 initialTreasuryBal = treasury.balance;
        vm.prank(subscriber);
        subscriptionManager.subscribe{value: 0.001 ether}();

        assertTrue(subscriptionManager.isActive(subscriber));
        assertEq(treasury.balance - initialTreasuryBal, 0.001 ether);

        // Account subscribed -> PolicyManager grants 5x spending limit (5 ether single tx instead of 1 ether)
        // Note: Check policy for the account address if subscribed
        // Register subscriber as account in subscriptionManager for policy testing:
        vm.prank(address(account));
        subscriptionManager.subscribe{value: 0.001 ether}();

        assertTrue(subscriptionManager.isActive(address(account)));

        // 3 ether tx was previously blocked (limit 1 ether), now allowed under 5x tier (5 ether limit)
        IPasskeyAccount.WebAuthnAuth memory auth = _createAuth(address(target), 3 ether, 0);
        bool executed = account.executeTransaction(address(target), 3 ether, "", auth);
        assertTrue(executed);
    }
}
