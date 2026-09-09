/**
 * Pinata IPFS integration for PasskeyGuard.
 * Stores account metadata and transaction receipts on IPFS.
 *
 * Usage:
 *   import { pinAccountMetadata, getFromIPFS } from '../lib/pinata'
 */

// ─── Types ────────────────────────────────────────────────────────────────

export interface AccountMetadata {
  version: 1;
  type: 'passkey_account';
  pubKeyX: string;
  pubKeyY: string;
  accountAddress: string;
  registeredAt: number;      // Unix timestamp (ms)
  network: 'arbitrum-sepolia';
  chainId: 421614;
}

export interface TxReceiptMetadata {
  version: 1;
  type: 'tx_receipt';
  accountAddress: string;
  recipient: string;
  amount: string;            // wei as string
  nonce: number;
  txHash: string;
  status: 'success' | 'blocked';
  reason?: string;
  timestamp: number;
  network: 'arbitrum-sepolia';
}

export type PinataMetadata = AccountMetadata | TxReceiptMetadata;

// ─── Helper: call Pinata public gateway ──────────────────────────────────

const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? 'https://gateway.pinata.cloud';

/**
 * Upload JSON data to IPFS via Pinata.
 * Requires PINATA_JWT environment variable (server-side only).
 * For browser uploads, proxy through a Next.js API route.
 */
export async function pinJSON(
  data: PinataMetadata,
  name: string,
): Promise<{ IpfsHash: string; PinSize: number; Timestamp: string }> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error('PINATA_JWT not set');

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: data,
      pinataMetadata: { name },
      pinataOptions: { cidVersion: 1 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata upload failed: ${err}`);
  }

  return res.json();
}

/**
 * Fetch JSON content from IPFS via Pinata gateway.
 */
export async function getFromIPFS<T = unknown>(cid: string): Promise<T> {
  const res = await fetch(`${GATEWAY}/ipfs/${cid}`);
  if (!res.ok) throw new Error(`IPFS fetch failed for CID ${cid}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

/**
 * Pin account metadata to IPFS.
 * Call this after a successful passkey registration.
 */
export async function pinAccountMetadata(
  meta: Omit<AccountMetadata, 'version' | 'type' | 'network' | 'chainId'>
): Promise<string> {
  const payload: AccountMetadata = {
    version: 1,
    type: 'passkey_account',
    network: 'arbitrum-sepolia',
    chainId: 421614,
    ...meta,
  };
  const result = await pinJSON(payload, `passkey-account-${meta.accountAddress}`);
  return result.IpfsHash;
}

/**
 * Pin a transaction receipt to IPFS.
 * Call this after executeTransaction resolves.
 */
export async function pinTxReceipt(
  receipt: Omit<TxReceiptMetadata, 'version' | 'type' | 'network'>
): Promise<string> {
  const payload: TxReceiptMetadata = {
    version: 1,
    type: 'tx_receipt',
    network: 'arbitrum-sepolia',
    ...receipt,
  };
  const result = await pinJSON(payload, `tx-receipt-${receipt.txHash}`);
  return result.IpfsHash;
}

/**
 * Build the full IPFS URL for a given CID.
 */
export function ipfsUrl(cid: string): string {
  return `${GATEWAY}/ipfs/${cid}`;
}
