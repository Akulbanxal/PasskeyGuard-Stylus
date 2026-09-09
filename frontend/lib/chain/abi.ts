/**
 * Full ABI definitions for PasskeyGuard contracts.
 * Includes PasskeyAccount, PolicyManager, and Secp256r1Verifier (Stylus).
 */

export const passkeyAccountAbi = [
  // ── State reads ──────────────────────────────────────────────
  { name: 'nonce',          inputs: [], outputs: [{ type: 'uint256' }],   stateMutability: 'view',      type: 'function' },
  { name: 'pubKeyX',        inputs: [], outputs: [{ type: 'bytes32' }],   stateMutability: 'view',      type: 'function' },
  { name: 'pubKeyY',        inputs: [], outputs: [{ type: 'bytes32' }],   stateMutability: 'view',      type: 'function' },
  { name: 'verifier',       inputs: [], outputs: [{ type: 'address' }],   stateMutability: 'view',      type: 'function' },
  { name: 'policyManager',  inputs: [], outputs: [{ type: 'address' }],   stateMutability: 'view',      type: 'function' },
  // ── Writes ──────────────────────────────────────────────────
  {
    name: 'registerPasskey',
    inputs: [{ name: 'x', type: 'bytes32' }, { name: 'y', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    name: 'executeTransaction',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount',    type: 'uint256' },
      { name: 'data',      type: 'bytes' },
      {
        name: 'auth',
        type: 'tuple',
        components: [
          { name: 'authenticatorData', type: 'bytes'   },
          { name: 'clientDataJSON',    type: 'bytes'   },
          { name: 'r',                 type: 'bytes32' },
          { name: 's',                 type: 'bytes32' },
        ],
      },
    ],
    outputs: [{ name: 'executed', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ── Events ──────────────────────────────────────────────────
  { name: 'PasskeyRegistered',  type: 'event', inputs: [{ name: 'x', type: 'bytes32', indexed: true }, { name: 'y', type: 'bytes32', indexed: true }, { name: 'account', type: 'address', indexed: true }] },
  { name: 'SignatureVerified',  type: 'event', inputs: [{ name: 'digest', type: 'bytes32', indexed: true }, { name: 'account', type: 'address', indexed: true }] },
  { name: 'PolicyBlocked',     type: 'event', inputs: [{ name: 'recipient', type: 'address', indexed: true }, { name: 'amount', type: 'uint256' }, { name: 'reason', type: 'string' }] },
  { name: 'PolicyApproved',    type: 'event', inputs: [{ name: 'recipient', type: 'address', indexed: true }, { name: 'amount', type: 'uint256' }] },
  { name: 'TransactionExecuted', type: 'event', inputs: [{ name: 'recipient', type: 'address', indexed: true }, { name: 'amount', type: 'uint256' }, { name: 'data', type: 'bytes' }, { name: 'nonce', type: 'uint256' }, { name: 'executor', type: 'address', indexed: true }] },
  { type: 'receive', stateMutability: 'payable' },
] as const;

export const policyManagerAbi = [
  // ── State reads ──────────────────────────────────────────────
  { name: 'singleTxLimit',      inputs: [], outputs: [{ type: 'uint256' }],  stateMutability: 'view', type: 'function' },
  { name: 'dailyLimit',         inputs: [], outputs: [{ type: 'uint256' }],  stateMutability: 'view', type: 'function' },
  { name: 'owner',              inputs: [], outputs: [{ type: 'address' }],  stateMutability: 'view', type: 'function' },
  {
    name: 'trustedRecipients',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // ── Writes ──────────────────────────────────────────────────
  {
    name: 'setSingleTxLimit',
    inputs: [{ name: 'newLimit', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    name: 'setDailyLimit',
    inputs: [{ name: 'newLimit', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    name: 'setTrustedRecipient',
    inputs: [{ name: 'recipient', type: 'address' }, { name: 'trusted', type: 'bool' }],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ── Events ──────────────────────────────────────────────────
  { name: 'SingleTxLimitSet',   type: 'event', inputs: [{ name: 'by', type: 'address', indexed: true }, { name: 'oldLimit', type: 'uint256' }, { name: 'newLimit', type: 'uint256' }] },
  { name: 'DailyLimitSet',      type: 'event', inputs: [{ name: 'by', type: 'address', indexed: true }, { name: 'oldLimit', type: 'uint256' }, { name: 'newLimit', type: 'uint256' }] },
  { name: 'PolicyBlocked',      type: 'event', inputs: [{ name: 'account', type: 'address', indexed: true }, { name: 'recipient', type: 'address', indexed: true }, { name: 'amount', type: 'uint256' }, { name: 'reason', type: 'string' }] },
  { name: 'PolicyApproved',     type: 'event', inputs: [{ name: 'account', type: 'address', indexed: true }, { name: 'recipient', type: 'address', indexed: true }, { name: 'amount', type: 'uint256' }] },
  { name: 'SpendRecorded',      type: 'event', inputs: [{ name: 'account', type: 'address', indexed: true }, { name: 'amount', type: 'uint256' }, { name: 'dayBucket', type: 'uint256' }, { name: 'totalDailySpent', type: 'uint256' }] },
  { name: 'OwnershipTransferred', type: 'event', inputs: [{ name: 'previousOwner', type: 'address', indexed: true }, { name: 'newOwner', type: 'address', indexed: true }] },
] as const;

/** Stylus P-256 Verifier ABI (WASM contract — same interface as Solidity) */
export const secp256r1VerifierAbi = [
  {
    name: 'verify',
    inputs: [
      { name: 'message_hash', type: 'bytes32' },
      { name: 'r',            type: 'bytes32' },
      { name: 's',            type: 'bytes32' },
      { name: 'x',            type: 'bytes32' },
      { name: 'y',            type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
