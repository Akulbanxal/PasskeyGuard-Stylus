import { useState } from 'react';
import { createPublicClient, http, encodePacked, keccak256 } from 'viem';
import { localhost } from 'viem/chains';
import { passkeyAccountAbi } from '../lib/chain/abi';

// In production, this would be Arbitrum Sepolia
export const publicClient = createPublicClient({
  chain: localhost,
  transport: http(),
});

export type TxStatus = 'idle' | 'preparing' | 'authenticating' | 'sending' | 'mining' | 'success' | 'error';

export function useTransactionStatus() {
    const [status, setStatus] = useState<TxStatus>('idle');
    const [message, setMessage] = useState('');
    const [txHash, setTxHash] = useState('');

    return { status, setStatus, message, setMessage, txHash, setTxHash };
}
