/**
 * Wagmi hooks for PasskeyAccount and PolicyManager contract interactions.
 * Chain: Arbitrum Sepolia (421614)
 */

'use client';

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
  useAccount,
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { passkeyAccountAbi, policyManagerAbi } from '../lib/chain/abi';
import { CONTRACT_ADDRESSES, MONETIZATION_CONFIG } from '../lib/chain/config';

// ─── Read hooks ───────────────────────────────────────────────────────────

/** Read the account nonce */
export function useAccountNonce() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.passkeyAccount,
    abi: passkeyAccountAbi,
    functionName: 'nonce',
    query: { enabled: CONTRACT_ADDRESSES.passkeyAccount !== '0x0000000000000000000000000000000000000000' },
  });
}

/** Read per-transaction protocol fee in wei */
export function useTxFeeWei() {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESSES.passkeyAccount,
    abi: passkeyAccountAbi,
    functionName: 'txFeeWei',
    query: { enabled: CONTRACT_ADDRESSES.passkeyAccount !== '0x0000000000000000000000000000000000000000' },
  });
  return (data as bigint | undefined) ?? MONETIZATION_CONFIG.txFeeWei;
}

/** Read fee recipient (treasury) address */
export function useFeeRecipient() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.passkeyAccount,
    abi: passkeyAccountAbi,
    functionName: 'feeRecipient',
    query: { enabled: CONTRACT_ADDRESSES.passkeyAccount !== '0x0000000000000000000000000000000000000000' },
  });
}

/** Read the registered public key X coordinate */
export function usePublicKeyX() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.passkeyAccount,
    abi: passkeyAccountAbi,
    functionName: 'pubKeyX',
  });
}

/** Read the registered public key Y coordinate */
export function usePublicKeyY() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.passkeyAccount,
    abi: passkeyAccountAbi,
    functionName: 'pubKeyY',
  });
}

/** Check if a passkey is registered (pubKeyX != bytes32(0)) */
export function useIsPasskeyRegistered() {
  const { data: x, isLoading } = usePublicKeyX();
  const isRegistered = x !== undefined && x !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  return { isRegistered, isLoading };
}

/** Read the single-transaction spending limit from PolicyManager */
export function useSingleTxLimit() {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.policyManager,
    abi: policyManagerAbi,
    functionName: 'singleTxLimit',
    query: { enabled: CONTRACT_ADDRESSES.policyManager !== '0x0000000000000000000000000000000000000000' },
  });
  return {
    raw: data as bigint | undefined,
    formatted: data ? formatEther(data as bigint) : undefined,
    isLoading,
  };
}

/** Read the daily spending limit from PolicyManager */
export function useDailyLimit() {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.policyManager,
    abi: policyManagerAbi,
    functionName: 'dailyLimit',
  });
  return {
    raw: data as bigint | undefined,
    formatted: data ? formatEther(data as bigint) : undefined,
    isLoading,
  };
}

/** Read ETH balance of the PasskeyAccount contract */
export function useAccountBalance() {
  return useBalance({
    address: CONTRACT_ADDRESSES.passkeyAccount,
    query: {
      enabled: CONTRACT_ADDRESSES.passkeyAccount !== '0x0000000000000000000000000000000000000000',
    },
  });
}

/** Check if a recipient is on the trusted list */
export function useTrustedRecipient(recipient: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.policyManager,
    abi: policyManagerAbi,
    functionName: 'trustedRecipients',
    args: recipient ? [recipient] : undefined,
    query: { enabled: !!recipient },
  });
}

// ─── Write hooks ─────────────────────────────────────────────────────────

/** Register a passkey on-chain */
export function useRegisterPasskey() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const register = (x: `0x${string}`, y: `0x${string}`) => {
    writeContract({
      address: CONTRACT_ADDRESSES.passkeyAccount,
      abi: passkeyAccountAbi,
      functionName: 'registerPasskey',
      args: [x, y],
    });
  };

  return { register, hash, isPending, isConfirming, isSuccess, error };
}

/** Execute a transaction via the PasskeyAccount */
export function useExecuteTransaction() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });
  const txFeeWei = useTxFeeWei();

  const execute = (
    recipient: `0x${string}`,
    amount: string,           // ETH as string e.g. "0.1"
    auth: {
      authenticatorData: `0x${string}`;
      clientDataJSON: `0x${string}`;
      r: `0x${string}`;
      s: `0x${string}`;
    },
    valueOverride?: bigint
  ) => {
    const targetWei = parseEther(amount);
    const totalRequiredValue = valueOverride ?? (targetWei + (txFeeWei ?? BigInt(0)));

    writeContract({
      address: CONTRACT_ADDRESSES.passkeyAccount,
      abi: passkeyAccountAbi,
      functionName: 'executeTransaction',
      args: [recipient, targetWei, '0x', auth],
      value: totalRequiredValue,
    });
  };

  return { execute, hash, isPending, isConfirming, isSuccess, receipt, error };
}

/** Update single-tx limit (owner only) */
export function useSetSingleTxLimit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const setLimit = (newLimit: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.policyManager,
      abi: policyManagerAbi,
      functionName: 'setSingleTxLimit',
      args: [parseEther(newLimit)],
    });
  };

  return { setLimit, hash, isPending, isSuccess, error };
}

// ─── Composite hook ──────────────────────────────────────────────────────

/** All account state in one hook */
export function usePasskeyAccountState() {
  const { address: walletAddress, isConnected } = useAccount();
  const { data: nonce } = useAccountNonce();
  const { isRegistered } = useIsPasskeyRegistered();
  const { raw: singleTxLimit, formatted: singleTxLimitEth } = useSingleTxLimit();
  const { raw: dailyLimit, formatted: dailyLimitEth } = useDailyLimit();
  const { data: balance } = useAccountBalance();
  const txFeeWei = useTxFeeWei();

  return {
    isConnected,
    walletAddress,
    contractAddress: CONTRACT_ADDRESSES.passkeyAccount,
    nonce: nonce as bigint | undefined,
    isRegistered,
    singleTxLimit,
    singleTxLimitEth,
    dailyLimit,
    dailyLimitEth,
    balance,
    txFeeWei,
  };
}
