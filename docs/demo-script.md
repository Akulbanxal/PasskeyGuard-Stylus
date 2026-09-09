# PasskeyGuard-Stylus: 3-Minute Showcase Demo Script

## 0:00–0:20 — Problem
**Narrator/Presenter:**
"Today, smart contract wallets rely on complex seed phrases, MPC, or centralized signers. Passkeys solve the UX problem, but verifying standard P-256 passkey signatures on EVM chains has historically been too expensive—often costing millions of gas. Furthermore, wallets confuse *authentication* with *authorization*. If someone gets your key, they get all your money. Today, we're fixing both."

## 0:20–0:45 — Create/use passkey account
**Action:** Show the Landing Page. Click "Create Account".
**Narrator/Presenter:**
"Here is PasskeyGuard. Using Arbitrum Stylus, we run a highly optimized P-256 verifier compiled from Rust to WebAssembly. I'm going to create a new smart account right now. No seed phrase—just Face ID."
**Action:** Face ID prompt appears and succeeds. The 'Passkey Active' Dashboard loads.

## 0:45–1:05 — Successful small transaction
**Action:** Click 'Send'. Enter Recipient and Amount: $100.
**Narrator/Presenter:**
"Let's send a standard transaction of $100. As I type, the live policy preview instantly tells me this is within my $1,000 single-transaction limit. I click authenticate."
**Action:** Biometric prompt. The Verification Trace UI lights up: `WAITING → SIGNED → VERIFYING`.
**Narrator/Presenter:**
"My device signs the payload, and the Arbitrum Stylus contract verifies it."
**Action:** Success screen appears.

## 1:05–1:30 — Show on-chain Stylus verification
**Action:** Click the Tx Hash linking to the Arbitrum Sepolia explorer.
**Narrator/Presenter:**
"Because Stylus executes WebAssembly at near-native speeds, this complex elliptic curve math just verified in a fraction of the gas it would normally take on standard EVM. We've proven identity cheaply and securely entirely on-chain."

## 1:30–2:00 — Attempt high-value transaction
**Action:** Return to Composer. Enter Amount: $2,000.
**Narrator/Presenter:**
"But what happens if my device is stolen, or I'm coerced into sending my entire balance? Let's try sending $2,000. Notice the policy preview immediately turns red."
**Action:** Click 'Authenticate'. Face ID prompt appears and succeeds.

## 2:00–2:25 — Show: PASSKEY VERIFIED / POLICY BLOCKED
**Action:** The trace animation runs. The UI splits into the killer view:
Left: `✓ Passkey Verified`
Right: `✕ Policy Blocked`
**Narrator/Presenter:**
"Look at this. The Passkey verification *succeeded*. My biometric proved it was me. But the transaction was *blocked* anyway because it exceeded my predefined on-chain policy limit. Authentication is not Authorization. We decoupled them at the smart contract level."

## 2:25–3:00 — Explain the architecture and final value proposition
**Narrator/Presenter:**
"With PasskeyGuard, the Arbitrum Stylus WASM pipeline handles the heavy cryptographic lifting of the P-256 signature, while our Solidity PolicyManager strictly enforces spend limits and rules. You get the frictionless UX of Web2 passkeys, the near-native execution speed of Stylus, and the bulletproof authorization policies of a smart contract wallet. Thank you."
