# PasskeyGuard Security Findings

During the Phase 7 adversarial security pass, the following threat vectors were analyzed, tested, and mitigated.

## 1. Unbound Transaction Parameters (Signature Malleability across calls)
* **Severity:** CRITICAL
* **Reproduction:** An attacker intercepts a valid `auth` (WebAuthn signature) payload from the mempool for a $1 transaction. They call `executeTransaction` but change the `amount` to $10,000. Because the smart account only verified the signature over the generic `clientDataJSON` and did not verify that `clientDataJSON` contained a challenge bound to the specific transaction parameters, the transaction succeeded.
* **Impact:** Complete loss of funds up to policy limits via transaction replay/modification.
* **Fix/Mitigation:** Modified `PasskeyAccount.sol` to reconstruct the expected challenge (`keccak256(recipient, amount, nonce)`) and base64url-encode it using a new `Base64Url` library. Added `_verifyChallenge` which enforces that the `clientDataJSON` contains the exact expected challenge before continuing to signature verification.
* **Status:** **RESOLVED for MVP.** Automated tests `test_unbound_transaction_parameters` now correctly pass by expecting a revert.

## 2. Replay Attack / Nonce Reuse
* **Severity:** HIGH
* **Reproduction:** An attacker submits an identical, previously executed transaction.
* **Impact:** Draining of funds via duplicated authorized transactions.
* **Fix/Mitigation:** The smart account increments the `nonce` atomically with every successful execution. Because the `nonce` is embedded in the challenge (which is now strictly enforced), old signatures cannot be reused since the current on-chain nonce will expect a different challenge hash.
* **Status:** **RESOLVED for MVP.** Tested via `test_replay_attack` and `test_nonce_increments`.

## 3. High-S / Signature Malleability
* **Severity:** LOW
* **Reproduction:** An attacker takes a valid ECDSA signature `(r, s)` and flips `s` to `N - s` to create a valid but different signature hash.
* **Impact:** Minimal. The transaction is still bound to the nonce, preventing replay, but could cause transaction ID malleability.
* **Fix/Mitigation:** Handled safely inside the Stylus `p256` crate verifier which enforces low-S during the elliptic curve signature verification phase.
* **Status:** **RESOLVED in Phase 2.**

## 4. Reentrancy on Execution
* **Severity:** HIGH
* **Reproduction:** The `PasskeyAccount` calls a malicious contract as the `recipient`. The malicious contract calls `executeTransaction` again during the callback before the nonce increments.
* **Impact:** Bypassing nonce increment, potentially draining funds up to policy limits.
* **Fix/Mitigation:** Applied `nonReentrant` modifier to `executeTransaction`.
* **Status:** **RESOLVED for MVP.**

## 5. Malformed P-256 Input / Invalid Public Key
* **Severity:** MEDIUM
* **Reproduction:** Providing points off the curve or infinity points.
* **Impact:** Could trick a naive verifier into always returning `true`.
* **Fix/Mitigation:** `p256` crate thoroughly validates coordinates and curve membership.
* **Status:** **RESOLVED in Phase 2.** (Tested via Rust fuzzing).

## 6. Wrong WebAuthn Origin / RP Attempt
* **Severity:** LOW (for smart contract), HIGH (for user security)
* **Reproduction:** Phishing site attempts to get a passkey signature.
* **Fix/Mitigation:** Passkeys are strongly bound to the Relying Party (RP) ID (domain) by the browser/OS. The authenticator will refuse to provide a signature to `attacker.com` for a credential registered to `legitimate.com`. While the smart contract could parse `clientDataJSON` to verify the origin explicitly, relying on the platform's origin binding combined with our Challenge enforcement is secure for MVP.
* **Status:** **ACCEPTED for MVP.**

## Summary
The complete existing test suite (9/9 tests across Solidity and Stylus contracts) now passes, including the new adversarial vectors. No critical unresolved issues remain.
