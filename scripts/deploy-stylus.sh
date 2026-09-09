#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-stylus.sh — Deploy the PasskeyGuard Secp256r1Verifier Stylus contract
# to Arbitrum Sepolia testnet.
#
# Prerequisites:
#   1. Install Rust: https://www.rust-lang.org/tools/install
#   2. Install cargo-stylus: cargo install cargo-stylus
#   3. Add wasm32 target: rustup target add wasm32-unknown-unknown
#   4. Funded Arbitrum Sepolia wallet (get testnet ETH from faucet.lamprosdao.com)
#   5. Export PRIVATE_KEY as an env var or in .env
#
# Usage:
#   PRIVATE_KEY=0xYOUR_KEY ./scripts/deploy-stylus.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

RPC="https://sepolia-rollup.arbitrum.io/rpc"
STYLUS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../stylus" && pwd)"

echo "━━━ PasskeyGuard Stylus Deployment ━━━"
echo "  RPC:  $RPC"
echo "  Dir:  $STYLUS_DIR"
echo ""

# ── Validate env ─────────────────────────────────────────────────────────────
if [ -z "${PRIVATE_KEY:-}" ]; then
  echo "❌ PRIVATE_KEY is not set."
  echo "   Export it: export PRIVATE_KEY=0xYOUR_PRIVATE_KEY"
  exit 1
fi

# ── Check tools ───────────────────────────────────────────────────────────────
if ! command -v cargo-stylus &> /dev/null; then
  echo "📦 Installing cargo-stylus..."
  cargo install cargo-stylus
fi

if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
  echo "📦 Adding wasm32-unknown-unknown target..."
  rustup target add wasm32-unknown-unknown
fi

cd "$STYLUS_DIR"

# ── Check deployment ──────────────────────────────────────────────────────────
echo "🔍 Checking contract..."
cargo stylus check --endpoint "$RPC"

# ── Deploy ─────────────────────────────────────────────────────────────────────
echo ""
echo "🚀 Deploying Secp256r1Verifier to Arbitrum Sepolia..."
DEPLOY_OUTPUT=$(cargo stylus deploy \
  --private-key "$PRIVATE_KEY" \
  --endpoint "$RPC" \
  2>&1)

echo "$DEPLOY_OUTPUT"

# ── Extract address ───────────────────────────────────────────────────────────
VERIFIER_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o "contract address: 0x[0-9a-fA-F]*" | awk '{print $3}' || true)

if [ -z "$VERIFIER_ADDRESS" ]; then
  echo "⚠️  Could not auto-extract address. Check output above."
else
  echo ""
  echo "✅ Secp256r1Verifier deployed at: $VERIFIER_ADDRESS"
  echo ""
  echo "   Add to frontend/.env.local:"
  echo "   NEXT_PUBLIC_VERIFIER_ADDRESS=$VERIFIER_ADDRESS"
  
  # Auto-update docs
  sed -i'' -e "s/PENDING DEPLOYMENT (Stylus)/$VERIFIER_ADDRESS/" \
    "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/docs/deployed-addresses.md" 2>/dev/null || true
fi

echo ""
echo "━━━ Next Step: Deploy Solidity contracts ━━━"
echo "   Run: ./scripts/deploy-solidity.sh $VERIFIER_ADDRESS"
