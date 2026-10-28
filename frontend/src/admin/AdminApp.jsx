import React, { useState } from 'react';

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex' }}>
      {/* Admin Sidebar */}
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
              background: '#16A34A',
              borderRadius: '8px',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}>AD</div>
            <strong style={{ fontSize: '1.15rem', color: '#0F172A' }}>Admin Portal</strong>
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
            REFECTORY MANAGEMENT
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {[
              { id: 'dashboard', label: 'Executive Dashboard', icon: '📈' },
              { id: 'forecast', label: 'Predictive Headcount', icon: '🔮' },
              { id: 'menu', label: 'Menu & Slots', icon: '🍲' },
              { id: 'students', label: 'Students Directory', icon: '👥' },
              { id: 'groceries', label: 'Grocery Expenses', icon: '📦' },
              { id: 'audit', label: 'Audit & Ledger', icon: '📋' },
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
                  background: activeTab === tab.id ? '#DCFCE7' : 'transparent',
                  color: activeTab === tab.id ? '#15803D' : '#475569',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: '0.88rem',
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
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.2rem' }}>Master Sorcerer</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginBottom: '0.75rem' }}>admin@mnnit.ac.in</div>
          <a href="/" style={{ display: 'block', textAlign: 'center', padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px', color: '#DC2626', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
            Sign Out
          </a>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Admin Console / {activeTab}</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>
              The Kamar-Taj Refectory Management
            </h1>
          </div>
          <span style={{ background: '#DCFCE7', color: '#15803D', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
            System Status: 100% Zero-Waste Online
          </span>
        </div>

        {/* Dashboard Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: '#FFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Today's Opted In</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: '0.3rem 0' }}>184</div>
            <div style={{ fontSize: '0.78rem', color: '#16A34A' }}>130 Veg · 54 Non-Veg</div>
          </div>

          <div style={{ background: '#FFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Checked In (Redeemed)</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2563EB', margin: '0.3rem 0' }}>142</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>42 pending scans</div>
          </div>

          <div style={{ background: '#FFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Predicted Headcount</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#7C3AED', margin: '0.3rem 0' }}>176</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Moving average (95.6% conf.)</div>
          </div>

          <div style={{ background: '#FFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Zero Waste Margin</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16A34A', margin: '0.3rem 0' }}>+1.8%</div>
            <div style={{ fontSize: '0.78rem', color: '#16A34A' }}>Near optimal batch size</div>
          </div>
        </div>

        {/* Predictive Headcount & Cooking Recommendation */}
        <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.75rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>🔮 Kitchen Production Forecast (WEBSTER 2026 Engine)</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>
            Algorithmic moving average based on 30-day weekday patterns, opt-out trends, and real check-in ratios.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                <th style={{ padding: '0.75rem 0' }}>Meal Slot</th>
                <th style={{ padding: '0.75rem 0' }}>Opt-in Count</th>
                <th style={{ padding: '0.75rem 0' }}>Historical Show Rate</th>
                <th style={{ padding: '0.75rem 0' }}>Recommended Portions</th>
                <th style={{ padding: '0.75rem 0' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>Today Lunch (Rajma Rice)</td>
                <td style={{ padding: '0.75rem 0' }}>184 students</td>
                <td style={{ padding: '0.75rem 0' }}>92.4%</td>
                <td style={{ padding: '0.75rem 0', fontWeight: 700, color: '#16A34A' }}>Cook for 172 portions</td>
                <td style={{ padding: '0.75rem 0' }}><span style={{ background: '#DCFCE7', color: '#16A34A', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>HIGH CONFIDENCE</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>Today Dinner (Paneer / Dal)</td>
                <td style={{ padding: '0.75rem 0' }}>162 students</td>
                <td style={{ padding: '0.75rem 0' }}>88.0%</td>
                <td style={{ padding: '0.75rem 0', fontWeight: 700, color: '#16A34A' }}>Cook for 145 portions</td>
                <td style={{ padding: '0.75rem 0' }}><span style={{ background: '#DCFCE7', color: '#16A34A', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>HIGH CONFIDENCE</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

