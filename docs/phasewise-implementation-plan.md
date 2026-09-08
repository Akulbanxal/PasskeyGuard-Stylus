# PASSKEYGUARD-STYLUS — Phasewise Implementation Plan

Rule for every phase: **no phase begins until the previous phase's TEST GATE passes.** If a test gate fails, stop and fix within the current phase — do not carry unresolved failures forward.

---

## Phase 0 — Repository & Environment Setup

**Objective**: A working monorepo skeleton with all three toolchains (Rust/Stylus, Solidity, frontend) installed and verified, before any real code is written.

**Files to create**
- `passkeyguard-stylus/` root, `README.md`
- `contracts/` (Foundry project init), `stylus/` (Cargo project init), `frontend/` (Next.js project init)
- `.gitignore`, `.env.example`

**Dependencies**
- Rust toolchain + `cargo-stylus` CLI
- Foundry (`forge`, `cast`, `anvil`)
- Node.js + package manager for the frontend
- Arbitrum Sepolia RPC URL + a funded testnet deployer key (faucet)

**Exact tasks**
1. Initialize the three sub-projects with their respective scaffolding tools (`cargo stylus new`, `forge init`, `create-next-app`).
2. Confirm `cargo stylus check` runs successfully on the default hello-world template.
3. Confirm `forge build` and `forge test` run on the default Foundry template.
4. Confirm the frontend dev server boots.
5. Add RPC config for Arbitrum Sepolia to all three sub-projects' env/config files.
6. Commit the skeleton.

**Expected output**: three independently buildable projects, no shared logic yet, all pointed at Arbitrum Sepolia config.

**Test cases**
- `cargo stylus check` exits 0 on the template contract.
- `forge test` exits 0 (default template tests pass).
- `npm run dev` (or equivalent) boots without runtime errors.

**Acceptance criteria**: All three toolchains build cleanly with zero custom logic. RPC connectivity to Arbitrum Sepolia confirmed (e.g., `cast block-number --rpc-url <sepolia>` returns a number).

**Common failure cases**: missing Rust `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`); Foundry not on PATH; RPC rate-limiting on public endpoints (use a dedicated RPC key).

**Definition of DONE**: All three sub-projects build and the RPC check returns a live block number.

**TEST GATE 0**: ✅ `cargo stylus check` passes, ✅ `forge test` passes on template, ✅ frontend boots, ✅ RPC reachable. All four must pass before Phase 1.

---

## Phase 1 — Stylus Workspace Setup

**Objective**: A deployable-but-trivial Stylus contract (not yet doing P-256) proving the Rust→WASM→Arbitrum pipeline works end to end.

**Files to create/change**
- `stylus/src/lib.rs` — minimal `#[entrypoint]` contract with a placeholder method (e.g., returns a constant), explicitly labeled as scaffolding, not the real verifier.
- `stylus/Cargo.toml` — dependency scaffolding (`stylus-sdk`, ABI export feature flag).

**Dependencies**: `stylus-sdk`, `cargo-stylus` CLI.

**Exact tasks**
1. Write the minimal entrypoint contract.
2. Run `cargo stylus check` against Arbitrum Sepolia to validate WASM compatibility and size.
3. Deploy to Arbitrum Sepolia with `cargo stylus deploy`.
4. Call the deployed contract's placeholder method from `cast call` to confirm round-trip works.
5. Record the deployed address in `docs/deployed-addresses.md`.

**Expected output**: a live, callable Stylus contract on Arbitrum Sepolia with a trivial method — proof the toolchain works before adding cryptographic complexity.

**Test cases**
- Unit: contract compiles and passes `cargo stylus check` (size + target validation).
- Integration: `cast call <address> "placeholderMethod()"` returns the expected constant from Arbitrum Sepolia.

**Acceptance criteria**: Deployed contract responds correctly on-chain; deployment tx confirmed on the explorer.

**Common failure cases**: WASM binary exceeds the compressed size limit even for a trivial contract (misconfigured `Cargo.toml` profile — ensure `opt-level = "z"`, `lto = true`, `panic = "abort"` release profile settings); insufficient testnet ETH for deployment gas.

**Definition of DONE**: A real, on-chain, callable Stylus contract address exists and is recorded.

**TEST GATE 1**: ✅ `cargo stylus check` passes, ✅ deployment succeeds, ✅ on-chain call returns expected value. All required before Phase 2.

---

## Phase 2 — Real P-256 Verifier (the highest-risk phase)

**Objective**: Replace the placeholder with a real, tested secp256r1/P-256 ECDSA verifier using the RustCrypto `p256` crate. No placeholder `return true` anywhere.

**Files to create/change**
- `stylus/src/verify.rs` — verification logic using `p256::ecdsa::{VerifyingKey, Signature}`.
- `stylus/src/parse.rs` — bounds-checked construction of key/signature from raw bytes; rejects malformed input with `false`, never panics.
- `stylus/src/lib.rs` — wire the `verify(messageHash, r, s, x, y) -> bool` entrypoint to `verify.rs`.
- `stylus/tests/known_vectors.rs`, `stylus/tests/fuzz_inputs.rs`.
- `scripts/generate-test-vectors.ts` — produce known-good WebAuthn/P-256 test vectors off-chain (real browser or a Node WebAuthn/crypto library) for the Rust tests to consume.

**Dependencies**: `p256` crate (`default-features = false`, `features = ["ecdsa"]`), `alloc`.

**Exact tasks**
1. Add `p256` to `Cargo.toml`; confirm it builds for `wasm32-unknown-unknown` under `no_std` + `alloc` — this is the first hard checkpoint (NEEDS VALIDATION item from the architecture doc).
2. Implement raw-bytes → `VerifyingKey` construction from `(x, y)`; reject invalid/non-curve points → `false`.
3. Implement raw-bytes → `Signature` construction from `(r, s)`; reject `r`/`s` of `0` or `≥ curve order` → `false`.
4. Implement the low-S malleability policy decided in the architecture doc; document it in code comments.
5. Wire `.verify()` (or `.verify_prehash()` if applicable to the pinned crate version) against the message hash.
6. Generate 5–10 known-good WebAuthn P-256 test vectors (real signatures, real keys) and commit them as fixtures.
7. Run `cargo stylus check` again to confirm WASM size with the added crypto crate is still within limits.
8. Deploy the real verifier to Arbitrum Sepolia, replacing the Phase 1 placeholder deployment.

**Expected output**: a deployed Stylus contract that correctly verifies real P-256 signatures and correctly rejects invalid ones — with test evidence, not assumption.

**Test cases**
- Unit: known-good vector → `true`.
- Unit: same vector with 1 bit flipped in `s` → `false`.
- Unit: same vector with tampered message hash → `false`.
- Unit: out-of-range `r`/`s` (≥ curve order, or zero) → `false`, no panic.
- Unit: non-curve point for `(x, y)` → `false`, no panic.
- Unit: high-S variant of a valid signature → behavior matches the chosen malleability policy exactly.
- Integration: on-chain call to the deployed verifier with the same known-good vector returns `true` from `cast call`.

**Security test cases**
- Fuzz: random byte inputs never cause a panic/revert-with-no-reason — always resolve to `false` or a clean `require`-style revert.
- Confirm the contract has zero `return true` unconditional paths (manual code review + grep check as part of CI).

**Acceptance criteria**: All known-vector tests pass locally and on-chain; all malformed-input tests resolve to `false` without panicking; WASM size within Stylus limits.

**Common failure cases**: `p256` crate std-only sub-dependencies pulled in transitively, breaking `no_std` build; message double-hashing bugs if `.verify()` hashes the input again instead of using a prehash path; incorrect endianness when converting raw bytes to field elements.

**Definition of DONE**: Real verifier deployed on Arbitrum Sepolia, passing 100% of the known-vector and malformed-input test suite, with no placeholder logic remaining anywhere in the code.

**TEST GATE 2 (critical)**: ✅ no placeholder/`return true` exists, ✅ all known-good vectors verify `true`, ✅ all tampered/malformed vectors verify `false` without panics, ✅ WASM size within limits, ✅ on-chain call confirmed against Arbitrum Sepolia. Do not proceed to Phase 3 until this gate fully passes — this is the project's core technical risk.

---

## Phase 3 — Solidity Smart Account

**Objective**: `PasskeyAccount.sol` and `PolicyManager.sol` implemented and unit-tested against the real deployed Phase 2 verifier (via its interface), independent of any frontend.

**Files to create/change**
- `contracts/src/PasskeyAccount.sol`
- `contracts/src/PolicyManager.sol`
- `contracts/src/DemoTarget.sol`
- `contracts/src/interfaces/ISecp256r1Verifier.sol`, `IPolicyManager.sol`, `IPasskeyAccount.sol`
- `contracts/test/PasskeyAccount.t.sol`, `PolicyManager.t.sol`

**Dependencies**: Foundry, standard Solidity OpenZeppelin library (access control patterns only).

**Exact tasks**
1. Implement digest reconstruction (`SHA256(authenticatorData || SHA256(clientDataJSON))`) exactly per the architecture doc, using the committed test vectors from Phase 2 as ground truth for expected byte layout.
2. Implement nonce storage/increment, atomic with execution.
3. Implement the call into the deployed verifier contract (address configured at deploy time).
4. Implement `PolicyManager` with single-tx limit, daily limit, and trusted-recipient allow-list.
5. Wire `executeTransaction` to call verifier → check policy → execute, in that order, reverting cleanly at each gate.
6. Emit events at every stage (`SignatureVerified`, `PolicyApproved`, `PolicyBlocked`, `TransactionExecuted`).
7. Unit test using the Phase 2 known-good test vectors as fixtures (mocking or calling the real Sepolia-deployed verifier via a fork test).

**Expected output**: A fully unit-tested smart account and policy manager, provably calling the real verifier (not a mock) for at least the fork-based integration tests.

**Test cases**
- Unit: digest reconstruction matches a captured real vector byte-for-byte.
- Unit: nonce increments exactly once per successful execution, never on revert.
- Unit: policy boundary — exactly-at-limit passes, one unit above fails.
- Unit: access control — only the registered passkey-authorized path can change policy limits.
- Integration (fork test against Arbitrum Sepolia): full call chain using a real Phase 2 test vector → verifier returns true → policy passes → execution succeeds.
- Integration: tampered signature in the same call chain → reverts before any state change.

**Acceptance criteria**: All unit and fork-integration tests pass; gas cost of a full `executeTransaction` call is measured and recorded.

**Common failure cases**: digest byte-layout mismatch between what the browser will eventually sign and what Solidity reconstructs (catch this now with static vectors, before the frontend exists, to isolate the bug source); reentrancy on external calls to `DemoTarget`/native transfer (mitigate with checks-effects-interactions and a reentrancy guard).

**Definition of DONE**: `forge test` green across all unit + fork-integration tests, gas costs recorded, no known digest-mismatch bugs.

**TEST GATE 3**: ✅ all unit tests pass, ✅ fork-integration test against the real Phase 2 verifier passes with a real known-good vector, ✅ tampered-signature integration test correctly reverts, ✅ gas costs recorded. Required before Phase 4.

---

## Phase 4 — WebAuthn Frontend

**Objective**: Real browser passkey registration and authentication, producing correctly-parsed `(authenticatorData, clientDataJSON, r, s)` payloads that match the byte layout Phase 3 expects — validated against static vectors first, live device second.

**Files to create/change**
- `frontend/lib/webauthn/register.ts`, `authenticate.ts`
- `frontend/lib/chain/passkeyAccount.ts`, `policyManager.ts` (contract bindings)
- Minimal unstyled pages wiring registration + authentication (visual polish deferred to Phase 9)

**Dependencies**: `@simplewebauthn/browser` (or direct WebAuthn API), a DER parser for signatures, `viem`/`ethers`.

**Exact tasks**
1. Implement registration ceremony; extract raw (x, y) from the COSE public key.
2. Implement authentication ceremony against a contract/server-issued challenge.
3. Implement DER→(r,s) signature parsing using a tested library, not a hand-rolled parser.
4. Cross-check a real captured browser assertion's `authenticatorData`/`clientDataJSON` bytes against the Phase 3 digest-reconstruction logic — confirm they match exactly.
5. Wire minimal UI to call `registerPasskey` and `executeTransaction` against the Phase 3 contracts on Arbitrum Sepolia (still unstyled).

**Expected output**: A real device (or platform authenticator in a supported browser) can register and authenticate, producing data that the already-tested Phase 3 contract accepts.

**Test cases**
- Manual/integration: register a passkey on at least one real platform authenticator; confirm the extracted (x, y) matches what gets stored on-chain.
- Manual/integration: authenticate and submit a transaction; confirm the contract's digest reconstruction matches the browser-signed digest (i.e., verification succeeds on a real, not synthetic, signature).
- Unit: DER parsing library correctly extracts (r, s) for a range of captured signatures.

**Acceptance criteria**: At least one full real-device registration + authentication + successful on-chain execution, end to end, even without final styling.

**Common failure cases**: `pubKeyCredParams` not prioritizing ES256(-7), causing the authenticator to register an RSA key instead of P-256; origin/RP-ID mismatch between the deployed frontend's actual origin and what's hardcoded in registration options; clientDataJSON serialization differences across browsers breaking the byte-exact assumption from Phase 3 (fix by reconstructing from raw bytes, not the JSON contents, as designed).

**Definition of DONE**: One successful real-device end-to-end transaction is recorded (tx hash) using this phase's frontend code and the Phase 2/3 contracts.

**TEST GATE 4**: ✅ real device registration succeeds, ✅ real device authentication produces a signature the Phase 2 verifier accepts, ✅ at least one full unstyled end-to-end transaction succeeds on Arbitrum Sepolia. Required before Phase 5.

---

## Phase 5 — End-to-End Integration

**Objective**: Stabilize the full pipeline (frontend → account → Stylus verifier → policy → execution) as one coherent, repeatable flow, fixing any integration gaps found once all pieces are combined.

**Files to create/change**
- `frontend/hooks/useAccount.ts`, `usePolicy.ts`, `useTransactionStatus.ts`
- Wiring/glue code between contract events and frontend state (no new contract logic)

**Dependencies**: none new — this phase is integration and stabilization, not new features.

**Exact tasks**
1. Run the full flow (register → prepare → authenticate → reconstruct → verify → authorize → execute) repeatedly (≥10 runs) and log failures.
2. Fix any flakiness (RPC timing, event-indexing races, nonce race conditions from double-submits).
3. Implement basic transaction status polling/subscription so the frontend reflects real on-chain state, not optimistic assumptions.
4. Confirm the "prepare" step's challenge correctly binds the current on-chain nonce so two rapid submissions can't race.

**Expected output**: A flow that succeeds reliably (not just once) across repeated runs.

**Test cases**
- Integration: 10 consecutive successful runs with no manual intervention beyond the biometric prompt itself.
- Integration: double-submit protection — rapidly triggering two transactions does not corrupt nonce state or double-execute.
- Integration: network hiccup (delayed RPC response) does not cause the frontend to show a false success/failure state.

**Acceptance criteria**: ≥9 of 10 consecutive runs succeed without code changes between runs; any remaining failure is understood and documented, not silently ignored.

**Common failure cases**: stale nonce reads causing "already used nonce" reverts on rapid re-submission; frontend showing success before the transaction is actually mined.

**Definition of DONE**: Reliable, repeatable end-to-end flow with documented failure modes (if any remain).

**TEST GATE 5**: ✅ ≥9/10 consecutive successful runs, ✅ double-submit protection confirmed, ✅ status reflects real on-chain state. Required before Phase 6.

---

## Phase 6 — Transaction Policy (blocked-transaction demo path)

**Objective**: Make the "authentication ≠ authorization" thesis visibly demonstrable — a valid passkey, blocked transaction, with a clear on-screen reason.

**Files to create/change**
- `contracts/src/PolicyManager.sol` (extend if needed — trusted recipients, daily limit, if not already complete from Phase 3)
- `frontend/components/PolicyPreviewStrip` logic (data wiring; visual polish in Phase 9)
- `frontend/lib/chain/policyManager.ts` (read functions for live preview)

**Dependencies**: none new.

**Exact tasks**
1. Confirm/extend `PolicyManager` to support a live "would this be allowed" view call (no state change) so the frontend can preview before submission.
2. Wire the frontend to call this preview function as the user types an amount.
3. Confirm the on-chain `PolicyBlocked` event fires correctly and is captured by the frontend for the blocked-result screen's copy (exact rule that fired).
4. Prepare the two canonical demo scenarios: (a) a normal payment under the limit, (b) an over-limit payment with a valid passkey.

**Expected output**: Both demo scenarios work reliably and the blocked scenario surfaces a precise, correct reason.

**Test cases**
- Integration: under-limit transaction executes; live preview correctly showed "within limits" beforehand.
- Integration: over-limit transaction is blocked on-chain; live preview correctly showed "will be blocked" beforehand; the frontend surfaces the exact numeric rule that fired.
- Integration: trusted-recipient exception (if implemented) correctly allows a normally-blocked amount when the recipient is trusted, if that rule is designed to interact this way — confirm the exact intended interaction and test it explicitly.

**Acceptance criteria**: Both demo scenarios are reproducible on demand, not by luck.

**Common failure cases**: preview (view call) and actual execution disagree because the view call doesn't account for the same daily-limit rolling state as the real execution — keep both paths reading identical state.

**Definition of DONE**: The blocked-transaction demo path is reliable and the displayed reason is accurate every time.

**TEST GATE 6**: ✅ allowed-path demo reproducible, ✅ blocked-path demo reproducible, ✅ preview and actual execution agree in all tested cases. Required before Phase 7.

---

## Phase 7 — Security Testing

**Objective**: Adversarial pass over the whole system before touching UI polish or deployment finalization — this is a dedicated phase, not an afterthought.

**Files to create/change**
- `contracts/test/Security.t.sol` (replay, malleability, cross-origin attempts)
- `stylus/tests/fuzz_inputs.rs` (extend if new cases found)
- `docs/security-findings.md` (record findings + fixes)

**Dependencies**: none new.

**Exact tasks**
1. Attempt replay: resubmit a previously successful `(auth, r, s)` tuple against a new nonce — confirm failure.
2. Attempt signature malleability: submit the alternate valid `s` (`n - s`) for an already-consumed signature — confirm failure per the chosen policy.
3. Attempt cross-origin/RP substitution: craft/capture an assertion for a different origin, submit to this account — confirm failure.
4. Attempt malformed-input flooding against the Stylus verifier directly (bypassing Solidity) — confirm no panics, always `false` on invalid input.
5. Review for reentrancy on `executeTransaction`'s external call.
6. Review for front-running risk on `registerPasskey` (can an attacker race to register before the legitimate user? Mitigate via commit-reveal or restricting registration to a specific deployer/owner-gated call if relevant to the MVP's threat model).
7. Document every finding and its fix/mitigation, even if "accepted risk for MVP."

**Expected output**: A documented, tested security review with no unresolved critical findings.

**Test cases**: all six adversarial scenarios above, each as an automated test where feasible (replay, malleability, malformed input) and as a documented manual review where automation isn't practical (front-running, RP substitution capture).

**Acceptance criteria**: no critical finding left unresolved; all resolved or explicitly accepted-and-documented as out of MVP scope.

**Common failure cases**: discovering a digest-reconstruction ambiguity that allows two different byte layouts to hash to signatures accepted for the same key — treat as critical if found, must fix before Phase 8.

**Definition of DONE**: `docs/security-findings.md` complete, all critical items resolved, `forge test` and `cargo test`/`cargo stylus check` still green.

**TEST GATE 7**: ✅ all adversarial tests pass (attacks fail as intended), ✅ no unresolved critical findings, ✅ full existing test suite (Phases 2–6) still green after any fixes. Required before Phase 8.

---

## Phase 8 — Arbitrum Sepolia Deployment (final)

**Objective**: Final, clean deployment of the fully-tested system to Arbitrum Sepolia, replacing any interim Phase 1/2 deployments, with all addresses recorded for the demo.

**Files to create/change**
- `contracts/script/Deploy.s.sol` (final deployment script, ordered per the architecture doc's §9)
- `docs/deployed-addresses.md` (final addresses, tx hashes, explorer links)
- `frontend/.env.production` (final contract addresses)

**Dependencies**: funded deployer key on Arbitrum Sepolia.

**Exact tasks**
1. Deploy final `Secp256r1Verifier` (Stylus) if any changes occurred since Phase 2/7.
2. Deploy final `PolicyManager.sol` with demo-appropriate initial limits.
3. Deploy final `PasskeyAccount.sol` wired to both.
4. Deploy `DemoTarget.sol` if used.
5. Register the demo passkey on the final deployed account.
6. Run the full Phase 5 integration flow once against this final deployment (not a prior one) to confirm nothing broke in redeployment.
7. Record every address, deployment tx, and the explorer links.

**Expected output**: A final, addressable, judge-verifiable deployment.

**Test cases**
- Integration: full end-to-end flow (allowed + blocked scenarios) re-run against the final deployment addresses.
- Manual: each contract address independently verified as live and correctly linked on the Arbitrum Sepolia explorer.

**Acceptance criteria**: Both demo scenarios succeed against the final deployment; all addresses documented and explorer-verified.

**Common failure cases**: frontend still pointing at a stale interim deployment address (double-check `.env` values); verifier address mismatch between what `PasskeyAccount` was constructed with and the final verifier deployment.

**Definition of DONE**: Final addresses recorded, both demo scenarios pass against them, explorer links verified.

**TEST GATE 8**: ✅ final deployment complete, ✅ both demo scenarios pass against final addresses, ✅ addresses explorer-verified and documented. Required before Phase 9.

---

## Phase 9 — UI Polish

**Objective**: Apply the full visual design from `UI_DESIGN_ARCHITECTURE.md` to the now-functionally-complete, already-tested flow. No new contract or verification logic in this phase.

**Files to create/change**
- `frontend/components/*` (all components listed in the UI doc's §11 inventory)
- `frontend/styles/*` (design tokens: color, type scale, spacing)

**Dependencies**: none new (styling libraries already present from Phase 0/4).

**Exact tasks**
1. Implement the design token set (palette, type scale) per the UI doc §0.
2. Build out each page/component per UI doc §§2–8 against already-working data/logic — do not touch contract calls, only presentation.
3. Implement the verification trace and blocked-screen dual-badge treatment (UI doc §6) — this is the highest-value visual moment for the demo.
4. Implement responsive behavior per UI doc §10.
5. Confirm `prefers-reduced-motion` fallback behavior.

**Expected output**: The functionally-verified flow now looks and feels like the target design.

**Test cases**
- Visual/manual QA against each screen in the UI doc.
- Regression: re-run the Phase 5 end-to-end integration test to confirm styling changes didn't break any functional wiring.
- Responsive QA at desktop/tablet/mobile breakpoints.

**Acceptance criteria**: All pages match the UI doc's intent; no functional regression from Phase 5–8 test suites.

**Common failure cases**: styling refactors accidentally changing event handler wiring or breaking a `useEffect` dependency that was polling transaction status.

**Definition of DONE**: Full visual design implemented, zero functional regressions confirmed by re-running prior test gates.

**TEST GATE 9**: ✅ all screens match design intent, ✅ Phase 5 integration flow still passes post-styling, ✅ responsive QA passes at all three breakpoints. Required before Phase 10.

---

## Phase 10 — Final Demo Preparation

**Objective**: A rehearsed, reliable, judge-ready 3-minute demo with a fallback plan.

**Files to create/change**
- `docs/demo-script.md` (the exact 3-minute beat sheet)
- A recorded fallback screen-capture video of a full successful run (allowed + blocked scenarios), stored for offline backup.

**Dependencies**: stable internet/RPC access at demo time; charged device with the registered passkey.

**Exact tasks**
1. Write the exact demo script matching the beat sheet: problem framing → account creation → normal payment → on-chain trace → attempted over-limit payment (blocked) → policy view → close.
2. Rehearse the live demo at least 3 times end to end without code changes in between.
3. Record a full fallback video in case live network/demo-day conditions fail.
4. Prepare answers to the anticipated judge questions (why blockchain, why Arbitrum, why Rust, does biometric data go on-chain, what if the frontend is hacked, is this production-ready) grounded in what was actually built and tested, not aspirational claims.
5. Final check: confirm the deployed addresses from Phase 8 are still live and match what the rehearsed demo uses.

**Expected output**: A demo that can be run live with a verified fallback if live conditions fail.

**Test cases**
- Full live run-through, timed, at least 3 times, with zero manual workarounds.
- Fallback video plays correctly and covers both the allowed and blocked scenarios.

**Acceptance criteria**: Live demo completes within the 3-minute target at least 2 of the last 3 rehearsals; fallback video is complete and accurate.

**Common failure cases**: demo-day Wi-Fi/RPC instability (mitigate with a mobile hotspot backup and the pre-recorded fallback); authenticator not registered on the demo device used on the day (rehearse on the actual device that will be used live).

**Definition of DONE**: Rehearsed live demo + verified fallback video + prepared Q&A, using the final Phase 8 deployment addresses.

**TEST GATE 10 (final)**: ✅ ≥2 of last 3 live rehearsals succeed within time target, ✅ fallback video verified complete, ✅ demo script finalized against the real deployed addresses. Project is demo-ready once this gate passes.
