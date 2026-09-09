# Deployed Contract Addresses

**Network:** Arbitrum Sepolia
**Chain ID:** 421614

## TEST GATE STATUS
**BLOCKED**

As established during the initial scaffolding phases, we do not currently possess a funded Arbitrum Sepolia deployer private key in the environment `.env`.

> Arbitrum Sepolia deployment and on-chain cast call require a funded deployer.

Once a valid `PRIVATE_KEY` with testnet ETH is provided, the contracts will be deployed in the following order:

1. **Secp256r1Verifier (Stylus WASM)**
   - Address: `PENDING DEPLOYMENT`
   - Tx Hash: `PENDING DEPLOYMENT`
2. **PolicyManager**
   - Address: `PENDING DEPLOYMENT`
   - Tx Hash: `PENDING DEPLOYMENT`
3. **PasskeyAccount**
   - Address: `PENDING DEPLOYMENT`
   - Tx Hash: `PENDING DEPLOYMENT`
4. **DemoTarget**
   - Address: `PENDING DEPLOYMENT`
   - Tx Hash: `PENDING DEPLOYMENT`

*Note: Frontend environment variables in `frontend/app/page.tsx` (`ACCOUNT_ADDRESS`) currently use the zero address `0x00...000` to trigger local state simulations and must be updated with the `PasskeyAccount` address once deployed.*
