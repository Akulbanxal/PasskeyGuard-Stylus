# PASSKEYGUARD-STYLUS — Implementation Architecture

## 0. System Summary

PasskeyGuard is an Arbitrum smart account controlled by a WebAuthn passkey (Face ID / Touch ID / Windows Hello / security key) instead of a private key held by the user. Authentication (proving control of the passkey) is cryptographically separated from authorization (whether the smart account will actually execute the requested transaction). The system has three cooperating layers:

1. **Frontend (React/Next.js + WebAuthn)** — captures a real browser passkey assertion and formats it for the chain.
2. **Solidity smart account (`PasskeyAccount.sol` + `PolicyManager.sol`)** — EVM layer that stores account state, reconstructs the signed digest, calls the verifier, enforces policy, and executes.
3. **Rust/Arbitrum Stylus verifier (`Secp256r1Verifier.rs`)** — WASM contract that performs real secp256r1 (P-256) ECDSA signature verification.

The dividing line is strict: **Stylus verifies cryptography only. Solidity owns all account state, policy, and execution.** No component "trusts" another's claim without checking it on-chain.

---

## 1. Frontend + WebAuthn Architecture

### 1.1 Responsibilities
- Register a passkey (`navigator.credentials.create`) bound to the dApp's origin (relying party ID).
- Authenticate a transaction (`navigator.credentials.get`) against a server/contract-issued challenge.
- Parse the raw WebAuthn response into the exact byte fields the smart account needs.
- Never handle private keys, seed phrases, or raw biometric data — those never leave the OS/authenticator.

### 1.2 Stack
- **React + Next.js** for the app shell and routing.
- **Browser WebAuthn API** directly, or **SimpleWebAuthn** (`@simplewebauthn/browser` + `@simplewebauthn/server`) to reduce boilerplate around registration/authentication ceremonies. SimpleWebAuthn is a well-known, actively maintained wrapper — NEEDS VALIDATION against the exact browser/authenticator matrix used for the demo (Chrome/Safari desktop, iOS Face ID, Android biometrics, Windows Hello).
- **viem** or **ethers.js** for chain reads/writes and RPC to Arbitrum Sepolia.
- **wagmi** (optional) for account/session state management in React.

### 1.3 WebAuthn Data Extraction (client-side, no crypto invented)
On `navigator.credentials.get()`, the browser returns an `AuthenticatorAssertionResponse` containing:
- `clientDataJSON` — JSON blob including the challenge, origin, and type; hashed with SHA-256 on-chain.
- `authenticatorData` — raw bytes including the RP ID hash, flags, and signature counter.
- `signature` — a DER-encoded ECDSA signature over `SHA256(authenticatorData || SHA256(clientDataJSON))`.
- `userHandle` (optional).

The frontend must:
1. Base64URL-decode all fields.
2. DER-decode the signature into raw `r` and `s` (32 bytes each). Use a tested DER parser (e.g. `@peculiar/asn1-ecc`, or the parsing utilities bundled with SimpleWebAuthn) — **do not hand-roll ASN.1 parsing**; malformed parsing is a common source of "verification always fails" bugs.
3. Send `{ authenticatorData, clientDataJSON, r, s, credentialId }` to the smart account call.

### 1.4 Frontend Pages/Modules (implementation-relevant only; see UI doc for visual design)
- `lib/webauthn/register.ts` — registration ceremony + public key extraction (COSE key → raw x/y coordinates, since the verifier needs the raw P-256 public key point, not the COSE-encoded key).
- `lib/webauthn/authenticate.ts` — authentication ceremony + DER→(r,s) parsing.
- `lib/chain/passkeyAccount.ts` — typed contract bindings for `PasskeyAccount.sol`.
- `lib/chain/policyManager.ts` — typed contract bindings for `PolicyManager.sol`.
- `hooks/useAccount.ts`, `hooks/usePolicy.ts`, `hooks/useTransactionStatus.ts` — state hooks for the dashboard.

### 1.5 NEEDS VALIDATION (frontend)
- Exact COSE-key → raw (x, y) extraction path for the specific authenticator formats tested (packed vs. fido-u2f attestation).
- Cross-browser support for `-7` (ES256/P-256) algorithm negotiation during `create()` — some authenticators default to RS256 unless P-256 is explicitly requested and prioritized in `pubKeyCredParams`.
- Signature counter handling (some authenticators, notably Face ID/Touch ID via platform authenticators, return a counter of 0 always) — this affects replay-detection design, see §6.

---

## 2. Solidity Smart-Account Architecture

### 2.1 `PasskeyAccount.sol`
Owns account identity and execution. Responsibilities:
- Store the registered passkey's raw P-256 public key `(x, y)` (or a mapping of `credentialId → (x, y)` if multiple passkeys/devices are supported).
- Store and increment a **nonce** per account to prevent replay.
- Reconstruct the exact digest the passkey signed:
  `digest = SHA256(authenticatorData || SHA256(clientDataJSON))`
  This must byte-for-byte match what the authenticator signed, including flag bytes and the embedded challenge (which itself encodes the nonce/transaction hash — see §4).
- Call `Secp256r1Verifier` (the Stylus contract) with `(digest, r, s, x, y)` and require `true` before proceeding.
- Call into `PolicyManager` to authorize the specific transaction (amount, recipient, calldata) before execution.
- Execute the call (native transfer or arbitrary calldata to `DemoTarget.sol`) only if both checks pass.
- Emit events for every stage (`SignatureVerified`, `PolicyApproved`, `PolicyBlocked`, `TransactionExecuted`) so the frontend/demo can show a live trace.

### 2.2 `PolicyManager.sol`
Owns authorization rules, independent of authentication:
- Single-transaction limit (e.g. max value per call).
- Optional daily cumulative limit (rolling or calendar-day window — pick calendar-day for MVP simplicity).
- Trusted recipient allow-list (optional, "should build").
- Threshold-based step-up: below threshold → auto-execute; above threshold → require guardian approval or block (MVP: block, since guardian flow is "optional").
- Pure/view functions so `PasskeyAccount` can simulate an authorization decision before committing state changes (helps the frontend show "this would be blocked" before the user submits).

### 2.3 `Guardian/Recovery.sol` (optional — build only after core flow is stable)
- M-of-N guardian threshold to authorize registering a replacement passkey.
- Timelock delay (e.g. 24h) between a recovery request and execution, cancellable by any remaining valid passkey.
- Out of scope for MVP unless time remains after Phase 8.

### 2.4 `DemoTarget.sol`
- A trivial contract (e.g., a mock ERC-20 or a simple "vault" that accepts/releases ETH) used as the execution target so the demo has something concrete to move. Not a production asset contract.

### 2.5 Contract Interfaces

```solidity
// Verifier interface — implemented by the Stylus contract, consumed by Solidity.
interface ISecp256r1Verifier {
    /// @notice Verifies a P-256 (secp256r1) ECDSA signature.
    /// @param messageHash 32-byte digest that was signed.
    /// @param r 32-byte signature component r.
    /// @param s 32-byte signature component s (low-s normalized, see §6).
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

interface IPolicyManager {
    /// @return allowed Whether this transaction is authorized under current policy.
    /// @return reason  Machine-readable reason code for UI display (e.g. "OK", "LIMIT_EXCEEDED").
    function checkTransaction(
        address account,
        address recipient,
        uint256 amount,
        bytes calldata data
    ) external returns (bool allowed, string memory reason);

    function setSingleTxLimit(uint256 newLimit) external; // onlyAccountOwner (passkey-authorized call)
    function setDailyLimit(uint256 newLimit) external;
    function setTrustedRecipient(address recipient, bool trusted) external;
}

interface IPasskeyAccount {
    struct WebAuthnAuth {
        bytes authenticatorData;
        bytes clientDataJSON;
        bytes32 r;
        bytes32 s;
    }

    function registerPasskey(bytes32 x, bytes32 y) external; // one-time or guardian-gated
    function executeTransaction(
        address recipient,
        uint256 amount,
        bytes calldata data,
        WebAuthnAuth calldata auth
    ) external returns (bool executed);

    function nonce() external view returns (uint256);
}
```

### 2.6 NEEDS VALIDATION (Solidity)
- Exact byte layout Solidity must reconstruct for `clientDataJSON` hashing must match the browser's serialization exactly (JSON key order, whitespace) — verify against real captured assertions before assuming a fixed template.
- Gas cost of calling a Stylus contract from Solidity via the standard `call` interface on Arbitrum Sepolia — budget for this in the policy/execution flow so a legitimate transaction doesn't run out of gas mid-verification.

---

## 3. Rust + Arbitrum Stylus P-256 Verifier Architecture

### 3.1 Why Stylus
Ethereum's native precompiles cover secp256k1, not secp256r1/P-256 (the curve WebAuthn passkeys use). Stylus lets a Rust contract compiled to WASM sit alongside the EVM and be called like any other contract, so P-256 verification can be done with a real elliptic-curve library instead of emulating it in expensive Solidity opcodes.

### 3.2 Recommended crate approach
Use the **RustCrypto `p256` crate** (`p256 = { version = "...", default-features = false, features = ["ecdsa"] }`) for verification:
- It is a pure-Rust implementation of NIST P-256 with ECDSA verify support, built on the `elliptic-curve`/`ecdsa` trait crates from the same organization.
- It can be compiled `no_std` (with `alloc`) and targets `wasm32-unknown-unknown`, which matches Stylus's supported target triple.
- It does not depend on floating point, threads, or OS randomness for **verification** (verification is deterministic; only key *generation* needs an RNG, which this project never does on-chain).

**NEEDS VALIDATION**: the RustCrypto `p256` crate's README states its elliptic-curve arithmetic "has never been independently audited." This is acceptable for a hackathon MVP but must be disclosed, not hidden, in the demo and in this document. Alternative approaches (e.g., a C-based P-256 implementation via `wasi-sdk`, as seen in community Stylus P-256 examples) require the `wasi` target, which is **not** the Stylus VM's currently supported target (`wasm32-unknown-unknown`) — treat any C/wasi-based verifier as **NEEDS VALIDATION / likely incompatible** unless proven otherwise against the current Stylus SDK.

### 3.3 Contract Responsibilities (`Secp256r1Verifier.rs`)
- Accept `(message_hash, r, s, pubkey_x, pubkey_y)` as calldata.
- Reconstruct a `VerifyingKey` from the raw uncompressed point `(x, y)` using `p256::ecdsa::VerifyingKey::from_encoded_point`.
- Reconstruct a `Signature` from raw `(r, s)` using `p256::ecdsa::Signature::from_scalars`.
- Call `.verify(message_hash, &signature)` using the `Verifier` trait (or `verify_prehash` if the crate's verify API expects a prehashed digest — WebAuthn digests are already SHA-256 hashed, so a prehash-verify path avoids re-hashing).
- Return a boolean. **Never a hardcoded `true`.** Any code path that cannot complete verification (malformed point, malformed scalar, out-of-range `r`/`s`) must return `false`, not panic and not default-approve.
- No storage of key material inside the verifier itself if avoidable — keep it a stateless, pure verification function; `PasskeyAccount.sol` owns the actual registered public key. This keeps the verifier reusable and minimizes Stylus storage costs.

### 3.4 Signature Malleability / Low-S Enforcement
ECDSA signatures have two mathematically valid `s` values (`s` and `n - s`). To prevent malleability-based replay tricks:
- Reject signatures where `s > n/2` (enforce "low-S") inside the verifier, OR normalize before comparison — pick one approach and apply it consistently. The `p256` crate's `Signature` type exposes a `normalize_s()` helper — **NEEDS VALIDATION** that browser/authenticator-produced WebAuthn signatures are not already assumed low-S by spec (WebAuthn does not mandate low-S), so the verifier — not the browser — must be the enforcement point.
- Reject `r == 0`, `s == 0`, or values `>= curve order n`.

### 3.5 Repository Layout for the Stylus Crate
```
stylus/
  Cargo.toml
  src/
    lib.rs              // Stylus entrypoint, #[entrypoint] macro, ABI export
    verify.rs           // P-256 verification logic wrapping the p256 crate
    parse.rs            // raw-bytes -> (VerifyingKey, Signature) construction + bounds checks
  tests/
    known_vectors.rs     // verification against NIST/WebAuthn known-good test vectors
    fuzz_inputs.rs        // malformed-input handling (never panics, never returns true)
```

### 3.6 Build/Deploy Toolchain
- `cargo stylus` CLI for checking WASM size, gas estimation, and deployment (`cargo stylus check`, `cargo stylus deploy`).
- Target: `wasm32-unknown-unknown`.
- `#![no_std]` with `extern crate alloc` if the `p256` crate's std-dependent features are disabled; otherwise validate whether `std` support is acceptable within Stylus's WASM size limits (24KB compressed contract size ceiling) — **NEEDS VALIDATION**: measure actual compiled size early (Phase 1) since crypto crates can be large.

### 3.7 NEEDS VALIDATION (Stylus/Rust — consolidated)
- Final compiled WASM size of the verifier with the `p256` crate under the Stylus 24KB compressed limit.
- Whether `p256`'s `ecdsa` feature set builds cleanly under `no_std` + `wasm32-unknown-unknown` with the exact Stylus SDK version in use (SDK versions change target support over time).
- Gas cost of one verification call on Arbitrum Sepolia (affects UX and the demo's perceived "speed").
- Whether `verify_prehash` (avoiding a redundant hash) is available in the pinned `p256`/`ecdsa` crate version, or whether the contract must call `.verify()` on the raw message and let the crate hash it (double-hashing risk if not handled carefully).

---

## 4. On-Chain vs. Off-Chain Responsibilities (authoritative split)

| Responsibility | Location | Rationale |
|---|---|---|
| Biometric capture (Face ID/Touch ID/etc.) | Off-chain, OS/authenticator | Biometric data never leaves the device; blockchain only ever sees a signature. |
| WebAuthn ceremony (challenge/response) | Off-chain, browser | Browser API is the only interface that can talk to the platform authenticator. |
| DER signature parsing → (r, s) | Off-chain, frontend | Pure data transformation, no trust decision made here — result is re-verified on-chain regardless. |
| COSE public key → raw (x, y) extraction | Off-chain, frontend (at registration time only) | One-time setup step; the resulting (x, y) is stored on-chain and becomes the source of truth. |
| P-256 signature verification | **On-chain, Stylus (`Secp256r1Verifier.rs`)** | This is the trust boundary — must be enforced where funds live, not trusted from a server or frontend claim. |
| Digest reconstruction (authenticatorData/clientDataJSON hashing) | **On-chain, Solidity (`PasskeyAccount.sol`)** | If reconstructed off-chain and merely "reported," a compromised frontend could lie about what was signed. |
| Nonce/replay tracking | **On-chain, Solidity** | Must be atomic with execution to prevent race/replay. |
| Spending limits, trusted recipients, thresholds | **On-chain, `PolicyManager.sol`** | The core "authentication ≠ authorization" thesis requires this decision to be unbypassable by the frontend. |
| Transaction execution | **On-chain, `PasskeyAccount.sol`** | Standard smart-account execution pattern. |
| UI state (balances, history, policy status display) | Off-chain, frontend (reads on-chain state) | Purely presentational; must always be a read of on-chain truth, never an independent source of truth. |

**Rule of thumb used throughout this project:** if a compromised or malicious frontend could change the outcome by lying, that decision belongs on-chain.

---

## 5. End-to-End Data Flow

1. **Register**: User creates a passkey; browser returns a COSE public key; frontend extracts raw (x, y); `PasskeyAccount.registerPasskey(x, y)` stores it on-chain.
2. **Prepare**: User picks a transaction (recipient, amount); frontend/contract derives a challenge that binds to a fresh nonce (e.g. `challenge = keccak256(recipient, amount, data, nonce)`, base64url-encoded into the WebAuthn challenge field).
3. **Authenticate**: Browser prompts Face ID/Touch ID/Windows Hello/security key; authenticator signs `SHA256(authenticatorData || SHA256(clientDataJSON))` and returns the assertion.
4. **Reconstruct**: `PasskeyAccount.sol` recomputes the same digest on-chain from the submitted `authenticatorData`/`clientDataJSON` bytes — it does not trust a pre-computed hash from the client.
5. **Verify**: `PasskeyAccount.sol` calls `Secp256r1Verifier.verify(digest, r, s, x, y)` (Stylus). Invalid signature → revert immediately.
6. **Authorize**: `PasskeyAccount.sol` calls `PolicyManager.checkTransaction(...)`. Policy violation → revert with reason, no state change, no funds move.
7. **Execute**: If both checks pass, nonce increments and the call/transfer executes on Arbitrum Sepolia.
8. **Observe**: Events emitted at each stage feed the frontend's live activity feed and the on-chain proof panel (tx hash, verifier address, explorer link).

---

## 6. Security Model

| Threat | Mitigation | Layer |
|---|---|---|
| Invalid P-256 signature | Verifier returns `false`; caller reverts | Stylus + Solidity |
| Replay of an old valid request | Nonce increment is atomic with execution; challenge embeds the nonce so an old signature can't be resubmitted for a new nonce | Solidity |
| Signature malleability | Enforce valid `r`/`s` ranges and low-S normalization inside the verifier | Stylus |
| Wrong origin / relying party | `clientDataJSON.origin` and `authenticatorData`'s RP-ID hash are checked on-chain against the account's configured origin/RP-ID before accepting the assertion | Solidity |
| Overspending with a valid passkey | `PolicyManager` enforces limits independent of signature validity | Solidity |
| Compromised frontend | Frontend cannot construct a valid signature or bypass policy — it can only submit data that is independently re-checked on-chain | Solidity + Stylus |
| Malformed cryptographic input (bad point, bad scalar) | Bounds-checked parsing before any curve operation; malformed input → `false`, never a panic, never a default-approve | Stylus |
| Replay via authenticator signature counter reuse | **NEEDS VALIDATION**: many platform authenticators (Face ID/Touch ID) always report a signature counter of 0, making counter-based replay detection unreliable — this project relies on the on-chain nonce/challenge binding instead, not the WebAuthn counter, as the primary replay defense |
| Stolen device | Out of MVP scope; guardian/recovery module (Phase optional) provides a path to revoke and re-register a passkey |
| Unaudited cryptographic library risk | Explicitly disclosed (see §3.2); acceptable for hackathon MVP, flagged as a pre-production blocker |

---

## 7. Repository Structure

```
passkeyguard-stylus/
├── contracts/                      # Solidity (Foundry or Hardhat)
│   ├── src/
│   │   ├── PasskeyAccount.sol
│   │   ├── PolicyManager.sol
│   │   ├── GuardianRecovery.sol    # optional
│   │   ├── DemoTarget.sol
│   │   └── interfaces/
│   │       ├── ISecp256r1Verifier.sol
│   │       ├── IPolicyManager.sol
│   │       └── IPasskeyAccount.sol
│   ├── test/
│   │   ├── PasskeyAccount.t.sol
│   │   ├── PolicyManager.t.sol
│   │   └── Integration.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── foundry.toml
├── stylus/                         # Rust/Stylus verifier
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs
│   │   ├── verify.rs
│   │   └── parse.rs
│   └── tests/
│       ├── known_vectors.rs
│       └── fuzz_inputs.rs
├── frontend/                       # React/Next.js
│   ├── app/ (or pages/)
│   ├── lib/
│   │   ├── webauthn/
│   │   └── chain/
│   ├── hooks/
│   ├── components/
│   └── public/
├── scripts/
│   └── generate-test-vectors.ts    # produces known-good WebAuthn assertions for contract tests
├── docs/
│   └── (this file, UI doc, phase plan)
└── README.md
```

---

## 8. Dependencies

**Frontend**
- `next`, `react`, `react-dom`
- `@simplewebauthn/browser` (client ceremonies)
- `viem` or `ethers`
- `wagmi` (optional, account/session state)
- `@peculiar/asn1-ecc` or equivalent DER parser (or SimpleWebAuthn's internal parsing utilities) for signature decoding

**Solidity**
- Foundry (`forge`, `cast`) or Hardhat as the framework — Foundry recommended for fast unit testing and fuzzing.
- OpenZeppelin Contracts (standard access-control, `Ownable`/`ReentrancyGuard` patterns) — **not** `openzeppelin-stylus`, which is for Rust; use the standard Solidity OpenZeppelin library here.

**Stylus/Rust**
- `stylus-sdk` (Rust SDK for Stylus contracts, `#[entrypoint]` macro, ABI export)
- `p256` crate, `default-features = false`, `features = ["ecdsa"]` (verification only, no key generation on-chain)
- `alloy-primitives` (or the types re-exported by `stylus-sdk`) for byte/address handling
- `cargo-stylus` CLI (dev tool, not a crate dependency) for check/deploy

**Tooling**
- `cargo stylus check` / `cargo stylus deploy`
- Arbitrum Sepolia RPC endpoint + faucet-funded deployer key
- A block explorer for Arbitrum Sepolia (for the "on-chain proof" panel)

---

## 9. Deployment Structure

1. Deploy `Secp256r1Verifier` (Stylus/WASM) to Arbitrum Sepolia via `cargo stylus deploy`. Record its address.
2. Deploy `PolicyManager.sol`, configured with initial limits.
3. Deploy `PasskeyAccount.sol`, wired to the verifier address and the policy manager address (constructor or initializer).
4. Deploy `DemoTarget.sol` (or use plain native transfers for the simplest MVP path).
5. Register the demo passkey's public key on the deployed account.
6. Record all four addresses + the deployment tx hashes in `docs/deployed-addresses.md` for the demo's "on-chain proof" panel and for judges to independently verify on the explorer.
7. Frontend `.env` points at these addresses and the Arbitrum Sepolia RPC/chain ID.

---

## 10. Testing Strategy

**Stylus/Rust unit tests**
- Verify against NIST/WebAuthn known-good P-256 test vectors (known message, known key, known valid signature → `true`).
- Verify tampered signature (`r` or `s` altered by 1 bit) → `false`.
- Verify tampered message hash → `false`.
- Verify malformed/out-of-range inputs (r/s ≥ curve order, invalid point not on curve) → `false`, never panic.
- Verify high-S vs. low-S signature handling per the malleability policy chosen in §3.4.

**Solidity unit tests (Foundry)**
- Digest reconstruction matches a real captured WebAuthn assertion byte-for-byte.
- Nonce increments exactly once per successful execution, never on a reverted attempt.
- Policy limit boundary tests (exactly at limit passes, one unit above fails).
- Access control: only the registered account can call `executeTransaction`; only passkey-authorized calls can change policy limits.

**Integration tests**
- Full flow: register → prepare → authenticate (using a locally generated test vector, not a live browser) → reconstruct → verify → authorize → execute, on a local Stylus+EVM test node or Arbitrum Sepolia fork.
- Blocked-policy flow: valid signature, over-limit amount → transaction reverts, funds unchanged, event shows `PolicyBlocked`.
- Invalid-signature flow: tampered signature → reverts before any policy check runs (cheap-fail ordering).

**Security-focused tests**
- Replay attempt: resubmit a previously successful `(auth, r, s)` tuple for a new nonce → must fail (challenge/nonce binding).
- Signature malleability attempt: submit the alternate valid `s` (`n - s`) for an already-used signature → must fail if already consumed, or be rejected outright if high-S is disallowed.
- Cross-origin/RP substitution attempt: assertion produced for a different origin submitted to this account → must fail RP/origin check.

**End-to-end (manual, pre-demo)**
- Real device passkey registration and authentication on the actual deployed contracts on Arbitrum Sepolia, at least once per supported platform (e.g., one desktop browser + one mobile biometric), before the live demo.
