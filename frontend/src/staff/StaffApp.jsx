import React, { useState } from 'react';
import { apiRequest } from '../shared/api.js';

export default function StaffApp() {
  const [tokenInput, setTokenInput] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('slot-lunch-02');
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([
    {
      id: 'sc-1',
      studentName: 'Aarav Sharma',
      rollNo: '20214001',
      dietaryPref: 'VEG',
      meal: 'Lunch',
      time: '12:15 PM',
      status: 'SUCCESS',
    },
    {
      id: 'sc-2',
      studentName: 'Priya Patel',
      rollNo: '20214002',
      dietaryPref: 'NON_VEG',
      meal: 'Lunch',
      time: '12:12 PM',
      status: 'SUCCESS',
    },
  ]);

  const handleRedeem = (tokenToTest) => {
    const token = tokenToTest || tokenInput;
    if (!token) return;

    if (token.includes('INVALID')) {
      setScanResult({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Cryptographic token signature verification failed or token has expired.',
      });
      return;
    }

    if (token.includes('REPLAY') || token.includes('DUPLICATE')) {
      setScanResult({
        success: false,
        code: 'ALREADY_REDEEMED',
        message: 'This QR token was already redeemed at 12:15 PM by Aarav Sharma.',
        details: { firstScannedAt: '12:15 PM', scannedByName: 'Wong (Mess Staff)' },
      });
      return;
    }

    const newScan = {
      id: `sc-${Date.now()}`,
      studentName: 'Rohit Verma',
      rollNo: '20214003',
      dietaryPref: 'VEG',
      meal: 'Lunch',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SUCCESS',
    };

    setScanResult({
      success: true,
      data: newScan,
    });

    setRecentScans([newScan, ...recentScans]);
    setTokenInput('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', background: '#D97706', color: '#FFF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              MS
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>Mess Staff Scanner</h2>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Single-Redemption Verification Terminal · The Kamar-Taj Refectory</div>
            </div>
          </div>
          <a href="/" style={{ color: '#DC2626', fontSize: '0.88rem', fontWeight: 600 }}>Sign Out</a>
        </div>

        {/* Slot Selector */}
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
            Active Serving Slot
          </label>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.92rem' }}
          >
            <option value="slot-lunch-02">Lunch (12:00 PM - 2:30 PM) · SERVING</option>
            <option value="slot-dinner-03">Dinner (7:30 PM - 9:30 PM) · SCHEDULED</option>
          </select>
        </div>

        {/* Big Result Panel */}
        {scanResult && (
          <div style={{
            background: scanResult.success ? '#DCFCE7' : '#FEE2E2',
            border: `2px solid ${scanResult.success ? '#16A34A' : '#DC2626'}`,
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}>
            {scanResult.success ? (
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                <h2 style={{ fontSize: '1.6rem', color: '#15803D', fontWeight: 800 }}>MEAL VERIFIED & REDEEMED</h2>
                <div style={{ marginTop: '1rem', fontSize: '1.1rem', color: '#166534', fontWeight: 600 }}>
                  {scanResult.data.studentName} ({scanResult.data.rollNo})
                </div>
                <div style={{ display: 'inline-block', marginTop: '0.5rem', background: '#BBF7D0', color: '#14532D', padding: '0.25rem 0.85rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700 }}>
                  Diet: {scanResult.data.dietaryPref} · {scanResult.data.meal}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>❌</div>
                <h2 style={{ fontSize: '1.6rem', color: '#B91C1C', fontWeight: 800 }}>REDEMPTION REJECTED</h2>
                <p style={{ marginTop: '0.5rem', fontSize: '1rem', color: '#991B1B', fontWeight: 600 }}>
                  {scanResult.message}
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#7F1D1D' }}>
                  Error Code: {scanResult.code}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Token Entry Fallback */}
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Scan or Enter Token</h3>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="Paste or scan token (e.g. KMTR-TOKEN-01)..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem' }}
            />
            <button
              onClick={() => handleRedeem(tokenInput)}
              style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '0 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Verify & Redeem
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleRedeem('KMTR-TOKEN-VALID')}
              style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Simulate Valid Token
            </button>
            <button
              onClick={() => handleRedeem('KMTR-TOKEN-DUPLICATE')}
              style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Simulate Duplicate Scan (Replay)
            </button>
          </div>
        </div>

        {/* Recent Scans Table */}
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Recent Scans at Counter</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                <th style={{ padding: '0.5rem 0' }}>Student</th>
                <th style={{ padding: '0.5rem 0' }}>Roll No</th>
                <th style={{ padding: '0.5rem 0' }}>Preference</th>
                <th style={{ padding: '0.5rem 0' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.map((sc) => (
                <tr key={sc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>{sc.studentName}</td>
                  <td style={{ padding: '0.75rem 0', color: '#64748B' }}>{sc.rollNo}</td>
                  <td style={{ padding: '0.75rem 0' }}>
                    <span style={{
                      background: sc.dietaryPref === 'VEG' ? '#DCFCE7' : '#FEE2E2',
                      color: sc.dietaryPref === 'VEG' ? '#16A34A' : '#DC2626',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {sc.dietaryPref}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0', color: '#64748B' }}>{sc.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

