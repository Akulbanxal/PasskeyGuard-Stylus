# PASSKEYGUARD-STYLUS — UI Design Architecture

## 0. Design Intent

The UI must read as **applied cryptographic security infrastructure**, not a generic DeFi dashboard. Reference points: hardware security consoles, biometric access-control panels, and audit/monitoring tools — precise, quiet, high-contrast, technical typography, restrained color. No token logos, no gradient-heavy "crypto app" clichés, no meme energy. Every screen should visually reinforce the product's one idea: **a passkey proves identity; the chain decides authority.**

### Visual language
- **Palette**: near-black base (`#0A0B0D`–`#111318`), a single restrained accent (deep signal blue or cold cyan, e.g. `#3B82F6`/`#2DD4BF`) reserved for "verified/allowed" states, and a distinct restrained red/amber (`#EF4444`/`#F59E0B`) reserved for "blocked/at-risk" states. No rainbow gradients; color always carries meaning, never decoration.
- **Typography**: a technical sans (Inter, IBM Plex Sans, or Geist) for UI text; a monospace face (JetBrains Mono, IBM Plex Mono) for addresses, hashes, tx data, and anything cryptographic — this typographic split is itself a security signal ("this is verifiable data, not prose").
- **Surfaces**: dark cards with 1px hairline borders (not heavy drop shadows), subtle inner glow only on active/focused security elements (e.g., the passkey prompt state).
- **Motion**: purposeful, not decorative — motion communicates a state transition (verifying → verified, or verifying → blocked), never idle bouncing/parallax.
- **Iconography**: line icons (shield, fingerprint, lock, key, checkmark-in-hex, hex-warning) — consistent stroke weight, no filled cartoon icons.

---

## 1. Information Architecture / Pages

1. **Landing / Connect** — entry point, explains the passkey-vs-policy thesis in one screen, primary CTA to create/access account.
2. **Passkey Registration Flow** — modal/stepper for first-time account creation.
3. **Wallet Dashboard** (home) — account overview, balance, quick actions, live activity feed.
4. **Send / Transaction Composer** — build a transaction, see live risk/policy preview before submitting.
5. **Passkey Authentication Overlay** — the biometric prompt moment, shown over the composer during submission.
6. **Transaction Result — Allowed** — success state with on-chain proof.
7. **Transaction Result — Blocked** — the "killer feature" screen: valid biometric, blocked by policy.
8. **Security & Policy Dashboard** — view/edit spending limits, trusted recipients, guardian config, passkey/device list.
9. **On-Chain Proof / Activity Detail** — expanded view of a single transaction's verification + policy trace, with explorer link.

---

## 2. Wallet Dashboard (home)

**Layout**: three-zone grid — left rail (nav), main column (account + activity), right rail (security status).

**Components**
- **Account Card** (top of main column): account address (monospace, truncated with copy button), balance (large numeral, small-caps currency label), network badge ("Arbitrum Sepolia" with a small live-dot indicator), passkey status chip ("Passkey Active — Face ID" with a small fingerprint icon in accent color).
- **Quick Actions**: `Send`, `View Policy`, `View Proof` — three equal-weight buttons, not a crowded toolbar.
- **Live Activity Feed**: a vertical timeline (not a plain table) where each entry shows four stacked micro-states in sequence: `Passkey → Verification → Policy → Result`, each with its own small status dot (grey = pending, cyan = pass, red = blocked). This is the dashboard's signature visual motif and should reappear (miniaturized) in the transaction result screens.
- **Right rail — Security Status Card**: single-transaction limit, daily limit (with a thin progress bar showing today's usage against the limit), trusted-recipient count, guardian status (if configured) — all as compact stat rows, each with a "view details" chevron into the Security Dashboard.

**Visual states**
- Empty activity feed (new account): a muted illustrative line-art state ("No transactions yet — your first passkey payment will appear here"), not a blank void.
- Balance loading: skeleton shimmer on the numeral only, rest of the card static (avoid full-card skeletons that feel like a slow generic app).

**Responsive**
- Desktop: three-column grid as above.
- Tablet: right rail collapses under the main column as a horizontal stat strip.
- Mobile: single column; Account Card, then Quick Actions as a sticky bottom action bar, then Activity Feed; Security Status becomes a link/summary chip that opens the full Security Dashboard as a separate view.

---

## 3. Passkey Registration Flow

A 3-step modal stepper, not a full page (keeps focus, low ceremony):

1. **Step 1 — Explain**: one sentence + one diagram-style illustration (device silhouette + key glyph) explaining "Your device becomes your signer. No seed phrase."
2. **Step 2 — Create**: single large CTA button "Continue with Face ID / Touch ID / Security Key" (label adapts to detected platform capability via `PublicKeyCredential.isConditionalMediationAvailable`/platform authenticator checks). Triggers the OS-native biometric sheet (outside the app's visual control — the app's job is just to lead into it cleanly and wait).
3. **Step 3 — Confirm**: success state — a checkmark animates in inside a hexagonal badge (see §7 for the shared "verified" motif), account address is revealed, CTA "Go to Dashboard."

**Failure/edge states**
- Authenticator not available (no biometric hardware, or non-HTTPS context): inline warning card explaining requirements, with a fallback path suggestion (security key).
- User cancels the OS prompt: return to Step 2 with a calm retry affordance, no error-red — this is a normal, expected path, not a fault.

---

## 4. Transaction Composer (Send flow)

**Layout**: single centered card, generous whitespace — this screen should feel deliberate and slow-you-down (contrast with typical "instant send" crypto UX, because the product's thesis is "not everything should be instant").

**Fields**
- Recipient (address input with a small trusted-recipient checkmark badge if it matches the allow-list).
- Amount (large numeric input, currency toggle if supporting a token beyond native ETH).
- **Live Policy Preview** (updates as amount changes, before any signature is requested): a horizontal status strip showing one of three states — `Within limits`, `Requires approval` (if a step-up threshold exists), or `Exceeds limit — will be blocked` — each with matching color coding (cyan/amber/red). This preview is a key premium touch: the product tells the user the outcome *before* they even authenticate, reinforcing that policy is independent of the biometric step.
- Primary CTA: `Authenticate & Send`.

**Visual states**
- Preview state transitions animate the status strip's color and icon (shield-check / shield-alert / shield-cross) smoothly rather than snapping, since this is the moment the "authentication ≠ authorization" idea becomes visible.

---

## 5. Passkey Authentication Overlay

A focused, full-card overlay (not a full-page navigation) shown while the WebAuthn ceremony is in flight:

- Centered fingerprint/security-key glyph with a slow pulsing ring animation (indicates "waiting on device," not "loading a server").
- Text: "Confirm on your device" + secondary line naming the exact transaction amount/recipient being authorized (so the user is confirming *specifics*, reinforcing non-repudiation).
- On success: ring animation collapses into a solid checkmark, overlay transitions directly into the on-chain verification state (see §6) without a jarring page change.
- On cancel/timeout: overlay dismisses to a neutral retry state on the composer, not an error page.

---

## 6. On-Chain Verification / Result Sequencing

After the biometric succeeds, before the final result, show a brief **live trace** (1–3 seconds, not skippable, because this *is* the product's proof):

`Signature received → Verifying on Stylus (P-256) → Checking policy → Executing`

Each stage lights up in sequence (grey → active/pulsing → solid complete), mirroring the Activity Feed's four-stage motif from the dashboard. This sequencing is the most important animation in the product — it is the visual proof that on-chain checks actually ran, not a fake spinner.

### 6.1 Transaction Result — Allowed
- Large success state: checkmark-in-hex badge (accent color), "Transaction Confirmed."
- Transaction detail block (monospace): amount, recipient, tx hash (with copy + "View on Explorer" link), verifier contract address, gas used.
- Secondary CTA back to dashboard.

### 6.2 Transaction Result — Blocked (the killer screen)
This is the single most important screen in the product and must be visually distinct — not just a red version of the success screen:
- Header explicitly states the split: **"Passkey Verified"** (with a small cyan checkmark) directly next to **"Policy Blocked"** (with a red/amber cross) — both shown together, side by side, never one without the other. This juxtaposition *is* the message.
- Explanation line naming the exact rule that fired (e.g., "This transaction ($1,500) exceeds your single-transaction limit ($500).").
- A direct-action link: "Adjust this limit" → deep-links into the Security Dashboard's relevant control.
- No ambiguity language ("something went wrong") — the copy must be precise and confident, because this is a feature working correctly, not an error.

---

## 7. Security & Policy Dashboard

**Layout**: settings-panel style, grouped cards, each independently editable (no single giant form — encourages the "these are independent, composable rules" mental model).

**Cards**
- **Spending Limits**: single-transaction limit and daily limit, each as a labeled input + a small live example ("A $600 transfer would currently be blocked.").
- **Trusted Recipients**: list with add/remove, each row showing address (monospace, truncated) + a "trusted" tag.
- **Guardian & Recovery** (optional module): guardian addresses, threshold (e.g. "2 of 3"), recovery delay countdown display if a recovery is pending.
- **Registered Passkeys/Devices**: list of registered credentials with device labels (best-effort from authenticator metadata), each with a "Remove" action (guarded by re-authentication).

**Shared visual motif — the hex badge**: a checkmark-in-hexagon for "verified/secure" states and a warning-triangle-in-hexagon for "blocked/attention" states are used consistently across the Registration success step, the Result — Allowed screen, and status chips throughout — this repetition is what makes the product feel designed rather than assembled from generic components.

---

## 8. On-Chain Proof / Activity Detail

A single transaction expanded to show the full seven-step pipeline from the architecture doc's data flow (Register → Prepare → Authenticate → Reconstruct → Verify → Authorize → Execute), rendered as a vertical stepper with a timestamp and a one-line technical note per step (e.g., "Verify — Stylus contract `0x...` returned `true` in ~[X] gas"). This screen exists specifically so judges can self-serve the "prove it's real" question without asking.

---

## 9. Animation & Motion Principles

- **State-transition motion only**: every animation corresponds to a real backend/chain state change (verifying, verified, blocked, executing). No ambient/idle motion for its own sake.
- **Duration discipline**: micro-transitions 150–250ms; the multi-stage verification trace (§6) intentionally runs slightly slower (600–900ms per stage) so it reads as "checking," not instant/fake.
- **Blocked-state motion is deliberately non-alarming**: a firm, single settle-into-place motion for the red/amber state, not shaking or flashing — the message is "this is working as designed," not "something is wrong with the app."
- Respect `prefers-reduced-motion`: all sequenced traces degrade to instant state-swaps with no loss of information.

---

## 10. Responsive Layout Summary

| Breakpoint | Dashboard | Composer | Result screens | Security dashboard |
|---|---|---|---|---|
| Desktop (≥1200px) | 3-column grid | Centered card, max-width ~480px | Centered card | 2-column card grid |
| Tablet (768–1199px) | 2-column (right rail becomes stat strip) | Centered card, full padding | Centered card | Single column, full-width cards |
| Mobile (<768px) | Single column, sticky bottom actions | Full-width card, sticky CTA | Full-screen takeover | Single column, accordion-style cards |

---

## 11. Component Inventory (for implementation handoff)

- `AccountCard`, `SecurityStatusCard`, `ActivityFeedItem` (4-stage variant), `QuickActionBar`
- `PolicyPreviewStrip` (three color states), `TransactionComposerForm`
- `PasskeyAuthOverlay` (pulsing-ring + collapse-to-check animation)
- `VerificationTraceStepper` (4-stage sequenced reveal)
- `ResultAllowedCard`, `ResultBlockedCard` (dual-badge header)
- `HexBadge` (checkmark / warning variants — shared atom used across the product)
- `SecurityDashboardCard` (generic settings-card shell used for Limits/Recipients/Guardians/Devices)
- `OnChainProofStepper` (7-stage detail view)
- `TrustBadge` (trusted-recipient tag), `NetworkBadge`, `PasskeyStatusChip`
