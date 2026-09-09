// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPasskeyAccount.sol";
import "./interfaces/IPolicyManager.sol";
import "./interfaces/ISecp256r1Verifier.sol";
import "./Base64Url.sol";

contract PasskeyAccount is IPasskeyAccount {
    ISecp256r1Verifier public verifier;
    IPolicyManager public policyManager;

    bytes32 public pubKeyX;
    bytes32 public pubKeyY;
    
    uint256 public override nonce;

    // To prevent reentrancy during execution
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    constructor(address _verifier, address _policyManager) {
        verifier = ISecp256r1Verifier(_verifier);
        policyManager = IPolicyManager(_policyManager);
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    function registerPasskey(bytes32 x, bytes32 y) external {
        require(pubKeyX == bytes32(0) && pubKeyY == bytes32(0), "PasskeyAccount: already registered");
        pubKeyX = x;
        pubKeyY = y;
    }

    function _verifyChallenge(bytes memory clientDataJSON, address recipient, uint256 amount, uint256 currentNonce) internal pure {
        bytes32 expectedChallenge = keccak256(abi.encodePacked(recipient, amount, currentNonce));
        string memory expectedChallengeB64 = Base64Url.encode(abi.encodePacked(expectedChallenge));
        bytes memory challengeKey = bytes(string.concat('"challenge":"', expectedChallengeB64, '"'));
        
        bool foundChallenge = false;
        if (clientDataJSON.length >= challengeKey.length) {
            for(uint256 i = 0; i <= clientDataJSON.length - challengeKey.length; i++) {
                bool matchFound = true;
                for(uint256 j = 0; j < challengeKey.length; j++) {
                    if(clientDataJSON[i+j] != challengeKey[j]) {
                        matchFound = false;
                        break;
                    }
                }
                if(matchFound) {
                    foundChallenge = true;
                    break;
                }
            }
        }
        require(foundChallenge, "PasskeyAccount: invalid challenge in clientDataJSON");
    }

    function executeTransaction(
        address recipient,
        uint256 amount,
        bytes calldata data,
        WebAuthnAuth calldata auth
    ) external nonReentrant returns (bool executed) {
        require(pubKeyX != bytes32(0) && pubKeyY != bytes32(0), "PasskeyAccount: not registered");

        // [SECURITY FIX]: Bind signature to the specific transaction via challenge
        _verifyChallenge(auth.clientDataJSON, recipient, amount, nonce);

        // 1. Reconstruct the WebAuthn digest
        // digest = SHA256(authenticatorData || SHA256(clientDataJSON))
        bytes32 clientDataHash = sha256(auth.clientDataJSON);
        bytes32 digest = sha256(abi.encodePacked(auth.authenticatorData, clientDataHash));

        // 2. Validate the signature against the Verifier
        bool isValidSignature = verifier.verify(digest, auth.r, auth.s, pubKeyX, pubKeyY);
        require(isValidSignature, "PasskeyAccount: invalid signature");
        emit SignatureVerified(digest);

        // 3. Check Policy
        (bool allowed, string memory reason) = policyManager.checkTransaction(address(this), recipient, amount, data);
        if (!allowed) {
            emit PolicyBlocked(recipient, amount, reason);
            revert(reason); // Revert before any execution or nonce update occurs if policy fails
        }
        emit PolicyApproved(recipient, amount);

        // 4. Update Nonce (atomic with execution)
        nonce++;

        // 5. Update daily spend on the policy manager
        // We do a low-level call or define an interface method if we are the owner.
        // Assuming PolicyManager has recordSpend. We'll call it here.
        (bool ok, ) = address(policyManager).call(abi.encodeWithSignature("recordSpend(address,uint256)", address(this), amount));
        require(ok, "PasskeyAccount: failed to record spend");

        // 6. Execute Transaction
        (bool success, ) = recipient.call{value: amount}(data);
        require(success, "PasskeyAccount: execution failed");
        
        emit TransactionExecuted(recipient, amount, data);
        return true;
    }

    receive() external payable {}
}
