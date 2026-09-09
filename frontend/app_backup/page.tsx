'use client';
import { useState, useEffect } from 'react';
import { registerPasskey } from '../lib/webauthn/register';
import { authenticatePasskey } from '../lib/webauthn/authenticate';
import { encodePacked, keccak256, parseEther, formatEther, getContract } from 'viem';
import { publicClient, useTransactionStatus } from '../hooks/useTransactionStatus';
import { passkeyAccountAbi } from '../lib/chain/abi';

// Replace with deployed address when testing locally
const ACCOUNT_ADDRESS = "0x0000000000000000000000000000000000000000"; 
const POLICY_LIMIT_ETH = 1000; // Simulated limit for preview if contract not available

export default function Home() {
    const [credId, setCredId] = useState('');
    const [amountEth, setAmountEth] = useState('100');
    const [policyPreview, setPolicyPreview] = useState<{allowed: boolean, reason: string} | null>(null);
    const { status, setStatus, message, setMessage, txHash, setTxHash } = useTransactionStatus();
    
    // Auth vs Policy States
    const [passkeyVerified, setPasskeyVerified] = useState<boolean | null>(null);
    const [policyPassed, setPolicyPassed] = useState<boolean | null>(null);

    useEffect(() => {
        // Simulated Preview logic
        const amt = parseFloat(amountEth) || 0;
        if (amt > POLICY_LIMIT_ETH) {
            setPolicyPreview({ allowed: false, reason: 'SINGLE_TX_LIMIT_EXCEEDED' });
        } else {
            setPolicyPreview({ allowed: true, reason: 'OK' });
        }
    }, [amountEth]);

    async function handleRegister() {
        setStatus('preparing');
        setMessage('Registering passkey...');
        try {
            const result = await registerPasskey('demoUser');
            setCredId(result.credentialId);
            setStatus('success');
            setMessage(`Registered!`);
        } catch (e: any) {
            setStatus('error');
            setMessage(`Registration failed: ${e.message}`);
        }
    }

    async function handleAuthenticate() {
        setStatus('preparing');
        setMessage('Fetching nonce...');
        setPasskeyVerified(null);
        setPolicyPassed(null);

        try {
            let nonce = BigInt(0);
            if (ACCOUNT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
                const contract = getContract({
                    address: ACCOUNT_ADDRESS as `0x${string}`,
                    abi: passkeyAccountAbi,
                    client: publicClient
                });
                nonce = await contract.read.nonce();
            }

            setStatus('authenticating');
            setMessage('Awaiting biometric authentication...');
            
            const recipient = "0x0000000000000000000000000000000000000001";
            const amount = parseEther(amountEth || "0");
            const challengeHex = keccak256(encodePacked(
                ['address', 'uint256', 'uint256'],
                [recipient, amount, nonce]
            ));
            const challengeBytes = new Uint8Array(Buffer.from(challengeHex.slice(2), 'hex'));

            // Step 1: Authentication
            const result = await authenticatePasskey(credId, challengeBytes);
            setPasskeyVerified(true);
            
            // Step 2: Policy Check (simulated execution here)
            setStatus('sending');
            setMessage('Checking policy...');
            
            await new Promise(resolve => setTimeout(resolve, 1000));

            const amt = parseFloat(amountEth) || 0;
            if (amt > POLICY_LIMIT_ETH) {
                setPolicyPassed(false);
                setStatus('error');
                setMessage('Transaction reverted: SINGLE_TX_LIMIT_EXCEEDED');
                return;
            }

            setPolicyPassed(true);
            setStatus('mining');
            setMessage('Transaction submitted. Waiting for confirmation...');
            
            // Simulate waiting for receipt
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setStatus('success');
            setTxHash('0xsimulatedtxhash...');
            setMessage(`Transaction mined successfully!`);
        } catch (e: any) {
            setStatus('error');
            setMessage(`Authentication failed: ${e.message}`);
            // If it failed during biometric prompt
            if (e.name === 'NotAllowedError') {
                setPasskeyVerified(false);
            }
        }
    }

    return (
        <main className="p-8 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">PasskeyGuard Phase 6</h1>
            
            <div className="mb-6 p-4 border rounded bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-2">1. Setup</h2>
                <button 
                    onClick={handleRegister}
                    disabled={status !== 'idle' && status !== 'success' && status !== 'error'}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    Register Passkey
                </button>
            </div>
            
            <div className="mb-6 p-4 border rounded bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-2">2. Execute Transaction</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Amount ($USD)</label>
                    <input 
                        type="number" 
                        value={amountEth} 
                        onChange={(e) => setAmountEth(e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                </div>

                {policyPreview && (
                    <div className={`mb-4 p-2 text-sm rounded ${policyPreview.allowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <strong>Preview: </strong> 
                        {policyPreview.allowed ? 'Transaction is allowed by policy.' : `Blocked by policy: ${policyPreview.reason}`}
                    </div>
                )}

                <button 
                    onClick={handleAuthenticate}
                    disabled={!credId || (status !== 'idle' && status !== 'success' && status !== 'error')}
                    className="bg-black text-white px-6 py-2 rounded disabled:opacity-50 w-full"
                >
                    Authenticate & Send
                </button>
            </div>
            
            {status !== 'idle' && (
                <div className="p-4 border rounded bg-gray-50">
                    <h3 className="font-semibold mb-3">Verification Trace</h3>
                    
                    <div className="flex items-center justify-between mb-2 p-2 bg-white rounded shadow-sm border">
                        <span>1. Passkey Verification</span>
                        {passkeyVerified === true && <span className="font-bold text-green-600">PASSKEY VERIFIED ✅</span>}
                        {passkeyVerified === false && <span className="font-bold text-red-600">FAILED ❌</span>}
                        {passkeyVerified === null && <span className="text-gray-400">Waiting...</span>}
                    </div>

                    <div className="flex items-center justify-between mb-4 p-2 bg-white rounded shadow-sm border">
                        <span>2. Policy Authorization</span>
                        {policyPassed === true && <span className="font-bold text-green-600">POLICY PASSED ✅</span>}
                        {policyPassed === false && <span className="font-bold text-red-600">POLICY BLOCKED ❌</span>}
                        {policyPassed === null && <span className="text-gray-400">Waiting...</span>}
                    </div>

                    <div className={`p-3 rounded ${status === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        <p className="font-medium">Status: {status}</p>
                        <p className="text-sm">{message}</p>
                        {txHash && <p className="text-xs font-mono mt-2 break-all">Tx: {txHash}</p>}
                    </div>
                </div>
            )}
        </main>
    );
}
