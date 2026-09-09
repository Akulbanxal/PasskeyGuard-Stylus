# 🛡️ PasskeyGuard-Stylus

**PasskeyGuard** is a next-generation smart account system on **Arbitrum Sepolia**, leveraging **WebAuthn (Passkeys)** for biometric keyless authentication, **Arbitrum Stylus (Rust)** for hyper-optimized secp256r1 curve verification, and **Policy Engine governance** for transaction limits and recipient white-listing.

---

## 🌟 Key Features

1. **🔑 Keyless Passkey Auth (WebAuthn)**
   - Sign transactions using Face ID, Touch ID, Windows Hello, or hardware security keys (YubiKey).
   - Zero seed phrases or private key management needed.

2. **⚡ Arbitrum Stylus (Rust P-256 Verifier)**
   - High-performance, low-gas secp256r1 signature verification smart contract compiled from Rust to WASM using Arbitrum Stylus.
   - Deployed on **Arbitrum Sepolia Testnet** via RPC `https://sepolia-rollup.arbitrum.io/rpc`.

3. **🛡️ On-Chain Policy Governance**
   - **Single Transaction Limit**: Blocks transfers exceeding set threshold.
   - **24-Hour Rolling Daily Spending Limit**: Dynamic rolling window guardrails.
   - **Trusted Recipient Whitelist**: Bypass policies for designated verified addresses.

4. **🌈 RainbowKit Wallet Connect Integration**
   - Seamless Web3 multi-wallet authentication configured with WalletConnect Project ID `0a2662ef1b92e6471d69bb02b2cfd9a4`.
   - Native dark theme with teal accenting matching PasskeyGuard design aesthetics.

5. **📦 Pinata IPFS Decentralized Storage**
   - Automatically pins account registration metadata and transaction execution receipts directly to IPFS via Pinata.

6. **📊 The Graph Subgraph Indexing**
   - GraphQL API indexing all `PolicyManager` and `PasskeyAccount` events on Arbitrum Sepolia, tracking daily aggregate spends, limits, and policy blocks.

7. **✨ Tenderly-Inspired UI & AI Guard Agent**
   - Modern glassmorphism UI with **Embla Carousel** swiper effect, **Framer Motion** smooth spring micro-animations, and an interactive **AI Security Copilot** assistant floating in the bottom-right corner.

---

## 🏗️ Architecture Overview

```
                          ┌──────────────────────────┐
                          │   Next.js Frontend App   │
                          │ (RainbowKit + WebAuthn)  │
                          └─────────────┬────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
       ┌────────────────────────┐              ┌────────────────────────┐
       │   Solidity Account     │              │  Pinata IPFS Metadata  │
       │ (PasskeyAccount.sol)   │              │  & Transaction Receipts│
       └────────────┬───────────┘              └────────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌───────────────────┐ ┌────────────────────────┐
│ Arbitrum Stylus   │ │ Solidity PolicyManager │
│ (Rust P-256 WASM) │ │ (Tx Limits & Recip.)   │
└───────────────────┘ └────────────────────────┘
```

---

## 📁 Repository Structure

```
PasskeyGuard-Stylus/
├── contracts/                  # Solidity smart contracts (Foundry)
│   ├── src/
│   │   ├── PasskeyAccount.sol  # Passkey smart account with WebAuthn validation
│   │   ├── PolicyManager.sol   # Policy engine for spend limits & whitelists
│   │   └── DemoTarget.sol      # Test target contract for verification
│   └── script/
│       └── Deploy.s.sol        # Foundry deployment script
├── contracts/stylus-verifier/  # Arbitrum Stylus Rust contract
│   ├── src/
│   │   └── lib.rs              # Rust P-256 curve verifier in Stylus WASM
│   └── Cargo.toml
├── frontend/                   # Next.js 16 + React 19 Frontend
│   ├── src/
│   │   ├── app/                # App router (page.tsx, layout.tsx, globals.css)
│   │   ├── components/         # AIAgent, Embla Carousel components
│   │   └── providers/          # RainbowKit + Wagmi + React Query provider
│   ├── lib/
│   │   ├── chain/              # Wagmi config & full contract ABIs
│   │   ├── pinata.ts           # IPFS pinning helpers
│   │   └── webauthn.ts         # Browser WebAuthn API wrappers
│   └── hooks/
│       ├── usePasskeyAccount.ts# Wagmi contract hooks
│       └── useSubgraph.ts      # GraphQL queries for The Graph
├── subgraph/                   # The Graph manifest & mappings
│   ├── schema.graphql          # Entity definitions
│   ├── subgraph.yaml           # Subgraph manifest
│   └── src/mappings.ts         # AssemblyScript event handlers
└── scripts/                    # Deployment shell scripts
    ├── deploy-stylus.sh        # Deploy Rust contract to Arbitrum Sepolia
    └── deploy-solidity.sh      # Deploy Solidity contracts via Foundry
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= 18.x and `npm`
- Rust & `cargo-stylus` (for Stylus verifier compilation/deployment)
- Foundry (`forge`) for Solidity contract compilation/deployment

### 2. Environment Configuration
Copy `.env.example` to `frontend/.env.local`:
```bash
cp .env.example frontend/.env.local
```

Fill in required environment variables in `frontend/.env.local`:
```env
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="0a2662ef1b92e6471d69bb02b2cfd9a4"

# Set these after executing deploy scripts
NEXT_PUBLIC_VERIFIER_ADDRESS=""
NEXT_PUBLIC_POLICY_MANAGER_ADDRESS=""
NEXT_PUBLIC_PASSKEY_ACCOUNT_ADDRESS=""
NEXT_PUBLIC_DEMO_TARGET_ADDRESS=""
```

### 3. Running Frontend Locally
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to access the application.

---

## 📜 Deployment Instructions

### Deploy Arbitrum Stylus Rust Contract
```bash
# Obtain Arbitrum Sepolia ETH from http://faucet.lamprosdao.com/
export PRIVATE_KEY="your_wallet_private_key"
./scripts/deploy-stylus.sh
```

### Deploy Solidity Smart Contracts
```bash
export PRIVATE_KEY="your_wallet_private_key"
export VERIFIER_ADDRESS="address_from_stylus_deployment"
./scripts/deploy-solidity.sh
```

---

## 🛡️ License
MIT License
