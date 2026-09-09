'use client';
import { useState, useEffect } from 'react';
import { registerPasskey } from '../../lib/webauthn/register';
import { authenticatePasskey } from '../../lib/webauthn/authenticate';
import { encodePacked, keccak256, parseEther } from 'viem';
import { useTransactionStatus } from '../../hooks/useTransactionStatus';

const POLICY_LIMIT_ETH = 1000;

export default function App() {
  const [view, setView] = useState<'landing' | 'register' | 'dashboard' | 'composer' | 'result'>('landing');
  const [credId, setCredId] = useState('');
  const [amountEth, setAmountEth] = useState('100');
  
  const { status, setStatus, txHash, setTxHash } = useTransactionStatus();
  const [policyPassed, setPolicyPassed] = useState<boolean | null>(null);

  const handleRegister = async () => {
    setView('register');
    try {
      const result = await registerPasskey('demoUser');
      setCredId(result.credentialId);
      setTimeout(() => setView('dashboard'), 2000); // show success briefly
    } catch (e: any) {
      console.error(e);
      setView('landing'); // revert on error for demo
    }
  };

  const handleAuthenticate = async () => {
    setStatus('authenticating');
    try {
      const nonce = BigInt(0);
      const recipient = "0x0000000000000000000000000000000000000001";
      const amount = parseEther(amountEth || "0");
      const challengeHex = keccak256(encodePacked(['address', 'uint256', 'uint256'], [recipient, amount, nonce]));
      
      const result = await authenticatePasskey(credId, new Uint8Array(Buffer.from(challengeHex.slice(2), 'hex')));
      
      // Verification Trace
      setStatus('sending'); // verifying
      await new Promise(r => setTimeout(r, 800));

      // Policy Check
      const amt = parseFloat(amountEth) || 0;
      if (amt > POLICY_LIMIT_ETH) {
        setPolicyPassed(false);
        setStatus('error');
        setView('result');
        return;
      }
      
      setPolicyPassed(true);
      setStatus('mining');
      await new Promise(r => setTimeout(r, 800));
      
      setStatus('success');
      setTxHash('0xsimulatedtxhash...');
      setView('result');
    } catch (e: any) {
      setStatus('idle'); // revert on cancel
    }
  };

  return (
    <div className="container">
      {view === 'landing' && (
        <div className="card centered" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>PasskeyGuard</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            A passkey proves identity. The chain decides authority.
          </p>
          <button className="btn btn-primary" onClick={handleRegister}>
            Create Account
          </button>
        </div>
      )}

      {view === 'register' && (
        <div className="card centered" style={{ textAlign: 'center' }}>
          <h2>Device Registration</h2>
          <div style={{ margin: '2rem 0', opacity: 0.6 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {credId ? "Registration Successful" : "Waiting for Face ID / Touch ID..."}
          </p>
          {credId && (
            <div className="hex-badge pass">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
        </div>
      )}

      {view === 'dashboard' && (
        <div className="grid-layout">
          <div>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Menu</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Dashboard</button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setView('composer')}>Send Funds</button>
            </div>
          </div>
          
          <div>
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>0x000...0000</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>$1,200.<span style={{ color: 'var(--text-secondary)' }}>00</span></div>
                </div>
                <div style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#1A2E24', color: 'var(--accent-cyan)', borderRadius: '4px' }}>
                  Passkey Active
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={() => setView('composer')}>Send</button>
              </div>
            </div>
            
            <h3 style={{ marginBottom: '1rem' }}>Activity</h3>
            <div className="card" style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>
              No transactions yet.
            </div>
          </div>
          
          <div>
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Security Policy</h3>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>Single Tx Limit</span>
                  <span className="mono">${POLICY_LIMIT_ETH}</span>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem' }}>Manage Policy</button>
            </div>
          </div>
        </div>
      )}

      {view === 'composer' && (
        <div className="card centered">
          <h2 style={{ marginBottom: '2rem' }}>Send Funds</h2>
          
          <div className="input-group">
            <label className="input-label">Recipient</label>
            <input type="text" className="input-field" defaultValue="0x0000000000000000000000000000000000000001" disabled />
          </div>
          
          <div className="input-group">
            <label className="input-label">Amount (USD)</label>
            <input type="number" className="input-field" value={amountEth} onChange={e => setAmountEth(e.target.value)} />
          </div>
          
          <div className={`status-strip ${(parseFloat(amountEth) || 0) > POLICY_LIMIT_ETH ? 'error' : 'ok'}`}>
            <span style={{ marginRight: '0.5rem' }}>
              {(parseFloat(amountEth) || 0) > POLICY_LIMIT_ETH ? '⚠️' : '✓'}
            </span>
            {(parseFloat(amountEth) || 0) > POLICY_LIMIT_ETH ? 'Exceeds single transaction limit. Will be blocked.' : 'Within policy limits.'}
          </div>
          
          <button className="btn btn-primary" onClick={handleAuthenticate} disabled={status !== 'idle'}>
            Authenticate & Send
          </button>
          
          {status !== 'idle' && status !== 'success' && status !== 'error' && (
            <div className="trace-container">
              <div className={`trace-step ${status === 'authenticating' ? 'active' : 'pass'}`}>
                <span className="label">Biometric Signature</span>
                <span className="status">{status === 'authenticating' ? 'WAITING' : 'SIGNED'}</span>
              </div>
              <div className={`trace-step ${(status === 'sending' || status === 'mining') ? 'active' : (status === 'authenticating' ? 'pending' : 'pass')}`}>
                <span className="label">Stylus P-256 Verification</span>
                <span className="status">VERIFYING</span>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'result' && (
        <div className="card centered">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-cyan)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Authentication</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                ✓ Passkey Verified
              </div>
            </div>
            
            <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${policyPassed ? 'var(--accent-cyan)' : 'var(--alert-red)'}` }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Authorization</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: policyPassed ? 'var(--accent-cyan)' : 'var(--alert-red)', fontWeight: 500 }}>
                {policyPassed ? '✓ Policy Passed' : '✕ Policy Blocked'}
              </div>
            </div>
          </div>
          
          {!policyPassed && (
            <div style={{ padding: '1rem', backgroundColor: '#3A1418', color: '#F87171', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', fontSize: '0.875rem' }}>
              <strong>Execution Reverted:</strong> This transaction (${amountEth}) exceeds your single-transaction limit (${POLICY_LIMIT_ETH}).
            </div>
          )}
          
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Amount</span><span>${amountEth}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Hash</span><span>{txHash || 'N/A (Reverted)'}</span></div>
          </div>
          
          <button className="btn btn-secondary" onClick={() => { setStatus('idle'); setView('dashboard'); }}>
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
