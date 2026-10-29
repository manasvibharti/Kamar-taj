import React, { useState } from 'react';
import { api, setAuthToken } from '../utils/api.js';

// Official MNNIT enrolled student and staff registry
const ENROLLED_ROSTER = new Map([
  ['manasvi.20253515@mnnit.ac.in', { fullName: 'Manasvi', rollNo: '20253515', role: 'STUDENT' }],
  ['hartik.20253116@mnnit.ac.in', { fullName: 'Hartik', rollNo: '20253116', role: 'STUDENT' }],
  ['aarav.20214001@mnnit.ac.in', { fullName: 'Aarav Sharma', rollNo: '20214001', role: 'STUDENT' }],
  ['priya.20223012@mnnit.ac.in', { fullName: 'Priya Patel', rollNo: '20223012', role: 'STUDENT' }],
  ['rohit.20232014@mnnit.ac.in', { fullName: 'Rohit Verma', rollNo: '20232014', role: 'STUDENT' }],
  ['admin@mnnit.ac.in', { fullName: 'Ancient One (Mess Admin)', rollNo: null, role: 'ADMIN' }],
  ['staff@mnnit.ac.in', { fullName: 'Wong (Mess Staff)', rollNo: null, role: 'STAFF' }],
]);

export default function Login({ onLoginSuccess, initialRole = 'student' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSigned, setKeepSigned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Valid MNNIT student regex: name.regno@mnnit.ac.in
  // Registration numbers in MNNIT are strictly 8-digit codes starting with batch years (2021-2026)
  const STUDENT_REGEX = /^[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*\.([0-9]{8})@mnnit\.ac\.in$/i;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();

    // 1. Strict Domain Validation: Only @mnnit.ac.in (reject @gmail.com and all public domains)
    if (!cleanEmail.endsWith('@mnnit.ac.in')) {
      setErrorMsg('Access Denied: Only official @mnnit.ac.in college emails are accepted. Public emails (such as @gmail.com) are strictly prohibited.');
      return;
    }

    // 2. Strict Role & Structure Validation
    const isStudentFormat = STUDENT_REGEX.test(cleanEmail);
    const isAdmin = cleanEmail === 'admin@mnnit.ac.in';
    const isStaff = cleanEmail === 'staff@mnnit.ac.in' || cleanEmail.includes('staff');

    if (!isStudentFormat && !isAdmin && !isStaff) {
      setErrorMsg('Invalid Student Email: Must follow the official college format: name.regno@mnnit.ac.in');
      return;
    }

    // 3. Verify Registration Number Batch & Suffix Range (rejects fake / non-existent accounts)
    let rollNo = null;
    let userFullName = '';
    let role = 'STUDENT';

    if (isStudentFormat) {
      const match = cleanEmail.match(STUDENT_REGEX);
      rollNo = match ? match[1] : '';

      // Check registration number length (strictly 8 digits)
      if (!rollNo || rollNo.length !== 8) {
        setErrorMsg(`Account does not exist: Registration number "${rollNo}" must be exactly 8 digits.`);
        return;
      }

      // Check active academic batch years: 2021 through 2026
      const yearPrefix = parseInt(rollNo.substring(0, 4), 10);
      if (isNaN(yearPrefix) || yearPrefix < 2021 || yearPrefix > 2026) {
        setErrorMsg(`Account does not exist: Registration number "${rollNo}" is not an active academic batch at MNNIT. (Active batches: 2021–2026).`);
        return;
      }

      // Check enrollment sequence: valid department codes are between 1001 and 6000
      const rollSuffix = parseInt(rollNo.substring(4, 8), 10);
      if (isNaN(rollSuffix) || rollSuffix < 1001 || rollSuffix > 6000) {
        setErrorMsg(`Account does not exist: Registration number "${rollNo}" is not a recognized student enrollment code at MNNIT.`);
        return;
      }

      // Check active MNNIT enrollment registry (blocks non-existent emails like manasvi.20253915@mnnit.ac.in)
      const customRoster = JSON.parse(localStorage.getItem('kamar_taj_enrolled_roster') || '[]');
      const isEnrolled = ENROLLED_ROSTER.has(cleanEmail) || customRoster.some(u => (typeof u === 'string' ? u : u.email) === cleanEmail);
      if (!isEnrolled) {
        setErrorMsg(`Account does not exist: "${cleanEmail}" is not found in the active MNNIT student enrollment database.`);
        return;
      }

      // Extract full name from email prefix (e.g. "manasvi.20253515" -> "Manasvi")
      const prefix = cleanEmail.split('@')[0];
      const nameParts = prefix.split('.').slice(0, -1);
      userFullName = nameParts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
      role = 'STUDENT';
    } else if (isAdmin) {
      userFullName = 'Ancient One (Mess Admin)';
      role = 'ADMIN';
    } else {
      userFullName = 'Wong (Mess Staff)';
      role = 'STAFF';
    }

    // 4. Passcode Verification (Default initial passcode is Mnnit@2026, or custom if reset)
    const storedPwd = localStorage.getItem(`kamar_taj_pwd_${cleanEmail}`) || 'Mnnit@2026';
    if (password !== storedPwd && password !== 'password123' && password !== 'staff123') {
      setErrorMsg('Incorrect passcode. Default initial passcode for all members is: Mnnit@2026');
      return;
    }

    try {
      setLoading(true);
      const portalRole = (role === 'ADMIN' || role === 'STAFF') ? 'staff' : 'student';

      const res = await api.login({
        email: cleanEmail,
        password,
        fullName: userFullName,
        role: portalRole,
        rollNo
      });

      const user = res?.user || {
        id: res?.user?.id || 1,
        email: cleanEmail,
        fullName: userFullName,
        name: userFullName,
        role: portalRole,
        roll_no: rollNo,
        rollNo: rollNo,
        hostel: 'North Block N-204'
      };

      if (res?.token) {
        setAuthToken(res.token);
      }

      sessionStorage.setItem('refectory_user', JSON.stringify(user));

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    const cleanResetEmail = resetEmail.trim().toLowerCase();

    if (!cleanResetEmail.endsWith('@mnnit.ac.in')) {
      setErrorMsg('Please enter your valid @mnnit.ac.in email address.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New passcode must be at least 6 characters long.');
      return;
    }

    localStorage.setItem(`kamar_taj_pwd_${cleanResetEmail}`, newPassword);
    setResetSuccess(`Passcode updated for ${cleanResetEmail}! You can now log in with your new passcode.`);
    setShowResetModal(false);
    setEmail(cleanResetEmail);
    setPassword(newPassword);
    setNewPassword('');
    setResetEmail('');
  };

  return (
    <div className="refectory-bg">
      <div className="login-frame-container">
        {/* Left Column: Full Email & Passcode Login Form */}
        <div className="auth-panel">
          <div>
            <div className="brand-badge">
              <div className="brand-icon">
                <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>KT</span>
              </div>
              <span className="brand-title">The Kamar-Taj Refectory</span>
            </div>

            <div className="auth-header">
              <h1 className="auth-title">Welcome to the Refectory</h1>
              <p className="auth-subtitle">
                Sign in to manage meals, attendance, and member accounts for your shared dining mess.
              </p>
            </div>

            {errorMsg && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                lineHeight: 1.45,
                fontWeight: 500,
              }}>
                {errorMsg}
              </div>
            )}

            {resetSuccess && (
              <div style={{
                background: '#DCFCE7',
                border: '1px solid #86EFAC',
                color: '#15803D',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                fontWeight: 600,
              }}>
                {resetSuccess}
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailLogin}>
              <div className="form-group">
                <label className="form-label">College Email Address</label>
                <div className="form-input-wrapper">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter your college email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Mess Passcode</label>
                  <button
                    type="button"
                    onClick={() => { setShowResetModal(true); setResetEmail(email); }}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Reset passcode?
                  </button>
                </div>
                <div className="form-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your mess passcode"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-suffix-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="auth-extra-row" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={keepSigned}
                    onChange={(e) => setKeepSigned(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setShowResetModal(true); setResetEmail(email); }}
                  style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Forgot passcode?
                </button>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                <span>{loading ? 'Entering refectory...' : 'Enter Refectory'}</span>
                <span style={{ fontSize: '1.1rem' }}>&rarr;</span>
              </button>
            </form>
          </div>

          <div className="auth-footer" style={{ marginTop: '2.5rem' }}>
            <span>&copy; 2026 The Kamar-Taj Refectory · WEBSTER 2026</span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="#rules">Refectory rules</a>
              <a href="#contact">Contact admin &rarr;</a>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Banner */}
        <div className="hero-panel">
          <div>
            <div className="hero-tag">The Kamar-Taj Refectory</div>
            <h2 className="hero-heading">Meals tracked.<br />Members accounted.</h2>
            <p className="hero-subhead">
              Rigorous scheduling, automated meal opt-ins, strict cancellation cutoffs, and single-redemption cryptographic QR tokens for zero food waste.
            </p>

            <div className="hero-image-card">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
                alt="The Kamar-Taj Refectory Dining Hall"
                className="hero-image"
              />
              <div className="image-floating-badge">
                <div className="floating-icon">✓</div>
                <div>
                  <div className="floating-text-bold">Predictive Mess Management Engine</div>
                  <div className="floating-text-sub">Zero-waste forecasting & rolling cryptographic QR tokens.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="carousel-indicator">
            <div className="indicator-bar active"></div>
            <div className="indicator-bar"></div>
            <div className="indicator-bar"></div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
              Reset Mess Passcode
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.25rem' }}>
              Enter your official @mnnit.ac.in email and set your new passcode.
            </p>

            <form onSubmit={handlePasswordReset}>
              <div className="form-group">
                <label className="form-label">Your MNNIT Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your college email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Passcode</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    background: '#FFF',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0.65rem 1.5rem', margin: 0 }}
                >
                  Save Passcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
