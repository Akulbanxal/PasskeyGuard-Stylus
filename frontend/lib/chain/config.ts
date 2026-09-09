/**
 * Arbitrum Sepolia chain configuration for Wagmi + RainbowKit.
 * PasskeyGuard Project ID: 0a2662ef1b92e6471d69bb02b2cfd9a4
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from 'wagmi/chains';
import { http } from 'wagmi';

export const WALLETCONNECT_PROJECT_ID = '0a2662ef1b92e6471d69bb02b2cfd9a4';

export const ARBITRUM_SEPOLIA_RPC = 'https://sepolia-rollup.arbitrum.io/rpc';

// Contract addresses — update after deployment
export const CONTRACT_ADDRESSES = {
  secp256r1Verifier: (process.env.NEXT_PUBLIC_VERIFIER_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  policyManager:     (process.env.NEXT_PUBLIC_POLICY_MANAGER_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  passkeyAccount:    (process.env.NEXT_PUBLIC_PASSKEY_ACCOUNT_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  demoTarget:        (process.env.NEXT_PUBLIC_DEMO_TARGET_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
} as const;

// The Graph endpoints
export const GRAPH_ENDPOINTS = {
  studio: process.env.NEXT_PUBLIC_GRAPH_STUDIO_URL ?? '',
  // Example hosted: 'https://api.thegraph.com/subgraphs/name/akulbanxal/passkeyguard'
} as const;

// Pinata config
export const PINATA_CONFIG = {
  gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? 'https://gateway.pinata.cloud',
  jwt: process.env.PINATA_JWT ?? '',
} as const;

// Wagmi + RainbowKit configuration
export const wagmiConfig = getDefaultConfig({
  appName: 'PasskeyGuard',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [arbitrumSepolia],
  ssr: true,
  transports: {
    [arbitrumSepolia.id]: http(ARBITRUM_SEPOLIA_RPC),
  },
});
