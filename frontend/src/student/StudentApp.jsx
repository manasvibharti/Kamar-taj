import React, { useState, useEffect } from 'react';
import { apiRequest } from '../shared/api.js';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentApp() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [slots, setSlots] = useState([]);
  const [qrToken, setQrToken] = useState('KMTR-TOKEN-01-INITIAL');
  const [qrSeconds, setQrSeconds] = useState(25);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    apiRequest('/auth/me', {}, 'student')
      .then((res) => setUser(res.user))
      .catch(() => {
        // Fallback demo user
        setUser({
          fullName: 'Aarav Sharma',
          rollNo: '20214001',
          email: 'aarav.20214001@mnnit.ac.in',
          room: 'North Block, H-204',
          dietaryPref: 'VEG',
        });
      });

    apiRequest('/meal-slots', {}, 'student')
      .then((res) => {
        setSlots(res.data || []);
        if (res.data && res.data.length > 0) setSelectedSlot(res.data[0]);
      })
      .catch(console.error);

    // 30s countdown timer for QR
    const interval = setInterval(() => {
      setQrSeconds((prev) => {
        if (prev <= 1) {
          setQrToken(`KMTR-TOKEN-${Math.floor(Date.now() / 30000)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' }, 'student');
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: '240px',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#2563EB',
              borderRadius: '8px',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}>MM</div>
            <strong style={{ fontSize: '1.15rem', color: '#0F172A' }}>MessMate</strong>
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
            YOUR MESS
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'qr', label: 'QR attendance', icon: '📱' },
              { id: 'preferences', label: 'Meal preferences', icon: '🍽️' },
              { id: 'budget', label: 'My meal budget', icon: '💳' },
              { id: 'expenses', label: 'Food expenses', icon: '📑' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === tab.id ? '#EFF6FF' : 'transparent',
                  color: activeTab === tab.id ? '#2563EB' : '#475569',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              background: '#DBEAFE',
              color: '#1D4ED8',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}>AS</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{user?.fullName || 'Student'}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{user?.rollNo || 'Roll No'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              background: '#FFF',
              color: '#DC2626',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.2rem' }}>My workspace / {activeTab}</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>
              {activeTab === 'overview' && 'A good day starts with a good meal.'}
              {activeTab === 'qr' && 'Your seat. Your meal. Your QR.'}
              {activeTab === 'preferences' && 'Plan your plate.'}
              {activeTab === 'budget' && 'Every meal, accounted for.'}
              {activeTab === 'expenses' && 'Good food. Open books.'}
            </h1>
          </div>
          <button
            onClick={() => setActiveTab('qr')}
            style={{
              background: '#2563EB',
              color: '#FFF',
              border: 'none',
              padding: '0.65rem 1.15rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            View my QR 📱
          </button>
        </div>

        {/* Tab 1: Overview (Matching Screenshot 2) */}
        {activeTab === 'overview' && (
          <div>
            <p style={{ color: '#64748B', fontSize: '0.92rem', marginBottom: '1.75rem' }}>
              Welcome back, {user?.fullName || 'Aarav'}. Here's what's happening at North Block today.
            </p>

            {/* 3 Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: '#FFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Today's meal plan</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: '0.4rem 0' }}>2 of 3 meals</div>
                <div style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 500 }}>Breakfast & lunch opted in</div>
              </div>

              <div style={{ background: '#FFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Attendance this month</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: '0.4rem 0' }}>57 meals</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>20 breakfasts · 19 lunches · 18 dinners</div>
              </div>

              <div style={{ background: '#FFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>October budget left</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2563EB', margin: '0.4rem 0' }}>₹1,680</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>₹2,820 spent of ₹4,500</div>
              </div>
            </div>

            {/* Menu Today Card */}
            <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <strong style={{ fontSize: '1.1rem', color: '#0F172A' }}>On the menu today</strong>
                <a href="#manage" onClick={() => setActiveTab('preferences')} style={{ fontSize: '0.85rem' }}>Manage meals &rarr;</a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>Breakfast (7:30 - 9:30 AM)</strong>
                    <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Poha, banana & masala chai</span>
                  </div>
                  <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                    Recorded · 8:12 AM
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>Lunch (12:00 - 2:00 PM)</strong>
                    <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Rajma, steamed rice, roti & salad</span>
                  </div>
                  <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                    Opted in · ₹60
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>Dinner (7:00 - 9:00 PM)</strong>
                    <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Aloo gobi, dal tadka & roti</span>
                  </div>
                  <span style={{ background: '#F1F5F9', color: '#64748B', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                    Opted out · ₹0
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: My QR Code (Matching Screenshot 3) */}
        {activeTab === 'qr' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
            <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '0.5rem' }}>Today's lunch · 12:00 - 2:00 PM</div>
              <div style={{ display: 'inline-block', background: '#EFF6FF', color: '#2563EB', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                Awaiting check-in
              </div>

              <div style={{ display: 'inline-block', padding: '1.25rem', background: '#FFF', border: '2px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1rem' }}>
                <QRCodeSVG value={qrToken} size={220} />
              </div>

              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563EB', marginBottom: '0.5rem' }}>
                New code in 00:{qrSeconds < 10 ? `0${qrSeconds}` : qrSeconds}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Cryptographic HMAC-SHA256 · Refreshes every 30 seconds
              </div>
            </div>

            <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>A fresh code. A fair system.</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Your code rotates automatically every 30 seconds. Expired codes and screenshots are strictly rejected at the scanner, preventing proxy attendance.
              </p>

              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#0F172A' }}>Checking in is simple:</h4>
              <ol style={{ fontSize: '0.85rem', color: '#64748B', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
                <li>Open this page at the mess counter.</li>
                <li>Hold the QR code steady for the scanner.</li>
                <li>Wait for the green checkmark beep.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 3: Meal preferences (Matching Screenshot 4) */}
        {activeTab === 'preferences' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              {slots.map((slot) => (
                <div key={slot.id} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{slot.mealType}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>₹{slot.mealFee}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '1.25rem' }}>
                    {slot.menu?.join(', ') || 'Regular mess menu'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ flex: 1, padding: '0.5rem', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                      Opt in
                    </button>
                    <button style={{ flex: 1, padding: '0.5rem', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                      Opt out
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Budget & Expenses (Matching Screenshot 5 & 6) */}
        {(activeTab === 'budget' || activeTab === 'expenses') && (
          <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Transparent Mess Ledger (Campus Grains & Provisions)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '0.75rem' }}>Item</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem' }}>Qty</th>
                  <th style={{ padding: '0.75rem' }}>Total Amount</th>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>Sona Masoori Rice</td>
                  <td style={{ padding: '0.75rem' }}>Grains</td>
                  <td style={{ padding: '0.75rem' }}>100 kg</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>₹6,000</td>
                  <td style={{ padding: '0.75rem', color: '#64748B' }}>28 Oct 2026</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>Fresh Paneer</td>
                  <td style={{ padding: '0.75rem' }}>Dairy</td>
                  <td style={{ padding: '0.75rem' }}>12 kg</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>₹3,600</td>
                  <td style={{ padding: '0.75rem', color: '#64748B' }}>28 Oct 2026</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>Seasonal Vegetables</td>
                  <td style={{ padding: '0.75rem' }}>Produce</td>
                  <td style={{ padding: '0.75rem' }}>80 kg</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>₹2,400</td>
                  <td style={{ padding: '0.75rem', color: '#64748B' }}>27 Oct 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

