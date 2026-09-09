#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-solidity.sh — Deploy SubscriptionManager, PolicyManager, and PasskeyAccount to Arbitrum Sepolia
#
# Usage:
#   PRIVATE_KEY=0xYOUR_KEY ./scripts/deploy-solidity.sh <VERIFIER_ADDRESS> [TREASURY_WALLET_ADDRESS]
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

RPC="https://sepolia-rollup.arbitrum.io/rpc"
CONTRACTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../contracts" && pwd)"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

VERIFIER_ADDRESS="${1:-${NEXT_PUBLIC_VERIFIER_ADDRESS:-}}"
TREASURY_WALLET_ADDRESS="${2:-${TREASURY_WALLET_ADDRESS:-${NEXT_PUBLIC_TREASURY_WALLET_ADDRESS:-}}}"

echo "━━━ PasskeyGuard Solidity Deployment ━━━"

if [ -z "${PRIVATE_KEY:-}" ]; then
  echo "❌ PRIVATE_KEY not set. Export it first."
  exit 1
fi

if [ -z "$VERIFIER_ADDRESS" ]; then
  echo "❌ VERIFIER_ADDRESS not provided."
  echo "   Usage: ./scripts/deploy-solidity.sh <VERIFIER_ADDRESS> [TREASURY_WALLET_ADDRESS]"
  exit 1
fi

if [ -z "$TREASURY_WALLET_ADDRESS" ]; then
  DEPLOYER_ADDR=$(cast wallet address "$PRIVATE_KEY")
  echo "⚠️ TREASURY_WALLET_ADDRESS not specified. Defaulting to deployer: $DEPLOYER_ADDR"
  TREASURY_WALLET_ADDRESS="$DEPLOYER_ADDR"
fi

if ! command -v forge &> /dev/null; then
  echo "❌ Foundry not found. Install: curl -L https://foundry.paradigm.xyz | bash"
  exit 1
fi

cd "$CONTRACTS_DIR"

DEPLOYER=$(cast wallet address "$PRIVATE_KEY")
MONTHLY_FEE_WEI=$(cast to-wei 0.001)      # 0.001 ETH monthly subscription fee

# ── 1. Deploy SubscriptionManager ─────────────────────────────────────────────
echo ""
echo "📄 Deploying SubscriptionManager..."
echo "   Treasury: $TREASURY_WALLET_ADDRESS"
echo "   Monthly Fee: 0.001 ETH ($MONTHLY_FEE_WEI wei)"

SM_OUTPUT=$(forge create src/SubscriptionManager.sol:SubscriptionManager \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$RPC" \
  --constructor-args "$TREASURY_WALLET_ADDRESS" "$MONTHLY_FEE_WEI" \
  2>&1)

echo "$SM_OUTPUT"
SM_ADDRESS=$(echo "$SM_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo "✅ SubscriptionManager: $SM_ADDRESS"

# ── 2. Deploy PolicyManager ───────────────────────────────────────────────────
echo ""
echo "📄 Deploying PolicyManager..."

SINGLE_TX_LIMIT_WEI=$(cast to-wei 1000)   # 1000 ETH single tx limit
DAILY_LIMIT_WEI=$(cast to-wei 5000)        # 5000 ETH daily limit

PM_OUTPUT=$(forge create src/PolicyManager.sol:PolicyManager \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$RPC" \
  --constructor-args "$DEPLOYER" "$SINGLE_TX_LIMIT_WEI" "$DAILY_LIMIT_WEI" \
  2>&1)

echo "$PM_OUTPUT"
PM_ADDRESS=$(echo "$PM_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo "✅ PolicyManager: $PM_ADDRESS"

echo "🔗 Linking SubscriptionManager to PolicyManager..."
cast send "$PM_ADDRESS" "setSubscriptionManager(address)" "$SM_ADDRESS" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$RPC"

# ── 3. Deploy PasskeyAccount ──────────────────────────────────────────────────
echo ""
echo "📄 Deploying PasskeyAccount..."
echo "   Fee Recipient (Treasury): $TREASURY_WALLET_ADDRESS"

PA_OUTPUT=$(forge create src/PasskeyAccount.sol:PasskeyAccount \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$RPC" \
  --constructor-args "$VERIFIER_ADDRESS" "$PM_ADDRESS" "$TREASURY_WALLET_ADDRESS" \
  2>&1)

echo "$PA_OUTPUT"
PA_ADDRESS=$(echo "$PA_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo "✅ PasskeyAccount: $PA_ADDRESS"

# ── 4. Deploy DemoTarget ──────────────────────────────────────────────────────
echo ""
echo "📄 Deploying DemoTarget..."

DT_OUTPUT=$(forge create src/DemoTarget.sol:DemoTarget \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$RPC" \
  2>&1)

echo "$DT_OUTPUT"
DT_ADDRESS=$(echo "$DT_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo "✅ DemoTarget: $DT_ADDRESS"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━ Deployment Complete ━━━"
echo ""
echo "Add these to frontend/.env.local:"
echo ""
echo "NEXT_PUBLIC_VERIFIER_ADDRESS=$VERIFIER_ADDRESS"
echo "NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS=$SM_ADDRESS"
echo "NEXT_PUBLIC_POLICY_MANAGER_ADDRESS=$PM_ADDRESS"
echo "NEXT_PUBLIC_PASSKEY_ACCOUNT_ADDRESS=$PA_ADDRESS"
echo "NEXT_PUBLIC_DEMO_TARGET_ADDRESS=$DT_ADDRESS"
echo "NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=$TREASURY_WALLET_ADDRESS"
echo "NEXT_PUBLIC_TX_FEE_WEI=100000000000000"
echo "NEXT_PUBLIC_MONTHLY_FEE_WEI=1000000000000000"
echo ""
echo "Add these to subgraph/subgraph.yaml:"
echo "  SubscriptionManager address: $SM_ADDRESS"
echo "  PolicyManager address: $PM_ADDRESS"
echo "  PasskeyAccount address: $PA_ADDRESS"

# ── Update docs ───────────────────────────────────────────────────────────────
cat > "$ROOT_DIR/docs/deployed-addresses.md" << EOF
# Deployed Contract Addresses

**Network:** Arbitrum Sepolia
**Chain ID:** 421614
**RPC:** https://sepolia-rollup.arbitrum.io/rpc

## Contracts

| Contract | Address | Explorer |
|---|---|---|
| Secp256r1Verifier (Stylus WASM) | \`$VERIFIER_ADDRESS\` | [View](https://sepolia.arbiscan.io/address/$VERIFIER_ADDRESS) |
| SubscriptionManager | \`$SM_ADDRESS\` | [View](https://sepolia.arbiscan.io/address/$SM_ADDRESS) |
| PolicyManager | \`$PM_ADDRESS\` | [View](https://sepolia.arbiscan.io/address/$PM_ADDRESS) |
| PasskeyAccount | \`$PA_ADDRESS\` | [View](https://sepolia.arbiscan.io/address/$PA_ADDRESS) |
| DemoTarget | \`$DT_ADDRESS\` | [View](https://sepolia.arbiscan.io/address/$DT_ADDRESS) |

## Treasury & Monetization Info
- Treasury Wallet: \`$TREASURY_WALLET_ADDRESS\`
- Per-Tx Protocol Fee: 0.0001 ETH (\`100000000000000 wei\`)
- Monthly Subscription Fee: 0.001 ETH (\`1000000000000000 wei\`)
- Premium Tier Multiplier: 5x limits

## Deployment Info
- Deployer: \`$DEPLOYER\`
- PolicyManager Single Tx Limit: 1000 ETH
- PolicyManager Daily Limit: 5000 ETH
EOF

echo "📝 Updated docs/deployed-addresses.md"
