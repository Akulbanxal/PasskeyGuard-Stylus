// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPasskeyAccount.sol";
import "./interfaces/IPolicyManager.sol";
import "./interfaces/ISecp256r1Verifier.sol";
import "./Base64Url.sol";

/// @title PasskeyAccount
/// @notice A smart-contract wallet secured by a WebAuthn P-256 passkey with automated fee monetization.
///         The Stylus WASM contract handles on-chain ECDSA verification.
contract PasskeyAccount is IPasskeyAccount {
    address public owner;
    ISecp256r1Verifier public verifier;
    IPolicyManager public policyManager;

    address public feeRecipient;
    uint256 public txFeeWei;

    bytes32 public pubKeyX;
    bytes32 public pubKeyY;

    uint256 public override nonce;

    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // ─── Events ──────────────────────────────────────────────────────────────

    /// @notice Emitted when a passkey (public key) is registered for this account.
    event PasskeyRegistered(bytes32 indexed x, bytes32 indexed y, address indexed account);

    /// @notice Emitted when the verifier contract is updated.
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    /// @notice Emitted after a successful P-256 signature verification.
    event SignatureVerified(bytes32 indexed digest, address indexed account);

    /// @notice Emitted when a transaction is blocked by the policy manager.
    event PolicyBlocked(address indexed recipient, uint256 amount, string reason);

    /// @notice Emitted when a transaction passes the policy check.
    event PolicyApproved(address indexed recipient, uint256 amount);

    /// @notice Emitted after a transaction is successfully executed.
    event TransactionExecuted(
        address indexed recipient,
        uint256 amount,
        bytes data,
        uint256 nonce,
        address indexed executor
    );

    /// @notice Emitted when a per-transaction protocol fee is collected.
    event FeeCollected(address indexed account, address indexed recipient, uint256 amount, uint256 timestamp);

    /// @notice Emitted when fee recipient is updated.
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    /// @notice Emitted when transaction fee amount is updated.
    event TxFeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when ETH is received.
    event Received(address indexed from, uint256 amount);

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier onlyOwner() {
        require(msg.sender == owner || owner == address(0), "PasskeyAccount: only owner");
        _;
    }

    constructor(address _verifier, address _policyManager, address _feeRecipient) {
        require(_feeRecipient != address(0), "PasskeyAccount: invalid fee recipient");
        owner = msg.sender;
        verifier = ISecp256r1Verifier(_verifier);
        policyManager = IPolicyManager(_policyManager);
        feeRecipient = _feeRecipient;
        txFeeWei = 1e14; // Default 0.0001 ETH protocol fee
        _status = _NOT_ENTERED;
        emit FeeRecipientUpdated(address(0), _feeRecipient);
        emit TxFeeUpdated(0, txFeeWei);
    }

    function registerPasskey(bytes32 x, bytes32 y) external {
        require(pubKeyX == bytes32(0) && pubKeyY == bytes32(0), "PasskeyAccount: already registered");
        pubKeyX = x;
        pubKeyY = y;
        emit PasskeyRegistered(x, y, address(this));
    }

    function setTxFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = txFeeWei;
        txFeeWei = newFee;
        emit TxFeeUpdated(oldFee, newFee);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "PasskeyAccount: invalid recipient");
        address old = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(old, newRecipient);
    }

    function _verifyChallenge(
        bytes memory clientDataJSON,
        address recipient,
        uint256 amount,
        uint256 currentNonce
    ) internal pure {
        bytes32 expectedChallenge = keccak256(abi.encodePacked(recipient, amount, currentNonce));
        string memory expectedChallengeB64 = Base64Url.encode(abi.encodePacked(expectedChallenge));
        bytes memory challengeKey = bytes(string.concat('"challenge":"', expectedChallengeB64, '"'));

        bool foundChallenge = false;
        if (clientDataJSON.length >= challengeKey.length) {
            for (uint256 i = 0; i <= clientDataJSON.length - challengeKey.length; i++) {
                bool matchFound = true;
                for (uint256 j = 0; j < challengeKey.length; j++) {
                    if (clientDataJSON[i + j] != challengeKey[j]) {
                        matchFound = false;
                        break;
                    }
                }
                if (matchFound) { foundChallenge = true; break; }
            }
        }
        require(foundChallenge, "PasskeyAccount: invalid challenge in clientDataJSON");
    }

    function executeTransaction(
        address recipient,
        uint256 amount,
        bytes calldata data,
        WebAuthnAuth calldata auth
    ) external payable nonReentrant returns (bool executed) {
        require(pubKeyX != bytes32(0) && pubKeyY != bytes32(0), "PasskeyAccount: not registered");
        require(address(this).balance >= amount + txFeeWei, "PasskeyAccount: insufficient balance for tx + fee");

        // 1. Bind signature to specific transaction via challenge
        _verifyChallenge(auth.clientDataJSON, recipient, amount, nonce);

        // 2. Reconstruct WebAuthn digest: SHA256(authenticatorData || SHA256(clientDataJSON))
        bytes32 clientDataHash = sha256(auth.clientDataJSON);
        bytes32 digest = sha256(abi.encodePacked(auth.authenticatorData, clientDataHash));

        // 3. Validate P-256 signature via Stylus verifier
        bool isValidSignature = verifier.verify(digest, auth.r, auth.s, pubKeyX, pubKeyY);
        require(isValidSignature, "PasskeyAccount: invalid signature");
        emit SignatureVerified(digest, address(this));

        // 4. Check policy (only transfer amount counts against policy limits, not infrastructure fee)
        (bool allowed, string memory reason) = policyManager.checkTransaction(
            address(this), recipient, amount, data
        );
        if (!allowed) {
            emit PolicyBlocked(recipient, amount, reason);
            revert(reason);
        }
        emit PolicyApproved(recipient, amount);

        // 5. Skim protocol fee & forward to feeRecipient (treasury)
        if (txFeeWei > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: txFeeWei}("");
            require(feeSuccess, "PasskeyAccount: fee transfer failed");
            emit FeeCollected(address(this), feeRecipient, txFeeWei, block.timestamp);
        }

        // 6. Increment nonce atomically
        uint256 currentNonce = nonce;
        nonce++;

        // 7. Record spend on policy manager
        (bool ok, ) = address(policyManager).call(
            abi.encodeWithSignature("recordSpend(address,uint256)", address(this), amount)
        );
        require(ok, "PasskeyAccount: failed to record spend");

        // 8. Execute main target call
        (bool success, ) = recipient.call{value: amount}(data);
        require(success, "PasskeyAccount: execution failed");

        emit TransactionExecuted(recipient, amount, data, currentNonce, msg.sender);
        return true;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
