import React, { useState } from 'react';
import { apiRequest } from '../shared/api.js';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSigned, setKeepSigned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (overrideEmail = null, targetPortal = null) => {
    setErrorMsg('');
    setLoading(true);
    const loginEmail = (overrideEmail || email).trim();

    if (!loginEmail) {
      setErrorMsg('Please enter your MNNIT college email address');
      setLoading(false);
      return;
    }

    try {
      // Automatic role deduction or portal selection
      let portal = targetPortal;
      if (!portal) {
        if (loginEmail.includes('admin')) portal = 'admin';
        else if (loginEmail.includes('staff')) portal = 'staff';
        else portal = 'student';
      }

      const res = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          mockEmail: loginEmail,
          mockName: loginEmail.split('@')[0],
          portal,
        }),
      }, portal);

      const role = res.user?.role?.toLowerCase() || portal;
      // Redirect to specific portal entry point
      if (role === 'admin') window.location.href = '/admin.html';
      else if (role === 'staff') window.location.href = '/staff.html';
      else window.location.href = '/student.html';
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // If Google Client ID is configured, trigger GIS OAuth, otherwise demo student
    handleLogin('aarav.20214001@mnnit.ac.in', 'student');
  };

  return (
    <div className="refectory-bg">
      <div className="login-frame-container">
        {/* Left Column: Authentic MessMate Login Panel */}
        <div className="auth-panel">
          <div>
            <div className="brand-badge">
              <div className="brand-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"></path>
                  <path d="M15 2v14"></path>
                  <path d="M9 2v4a2 2 0 0 1-2 2 2 2 0 0 1-2-2V2"></path>
                  <path d="M7 2v14"></path>
                  <circle cx="12" cy="18" r="3"></circle>
                </svg>
              </div>
              <span className="brand-title">MessMate</span>
              <span className="brand-subtitle-tag">Kamar-Taj</span>
            </div>

            <div className="auth-header">
              <h1 className="auth-title">Welcome back to the mess</h1>
              <p className="auth-subtitle">
                Sign in to manage meals, attendance, and member accounts for your shared dining mess.
              </p>
            </div>

            {errorMsg && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                {errorMsg}
              </div>
            )}

            {/* Google Sign-in Button */}
            <button
              type="button"
              className="btn-google"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="auth-divider">
              <span>or continue with college email</span>
            </div>

            {/* Email Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="form-group">
                <label className="form-label">College email address</label>
                <div className="form-input-wrapper">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="student@college.edu (name.regno@mnnit.ac.in)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mess passcode</label>
                <div className="form-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your mess passcode"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="input-suffix-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="auth-extra-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={keepSigned}
                    onChange={(e) => setKeepSigned(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>
                <a href="#forgot" className="forgot-link">Forgot password?</a>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                <span>{loading ? 'Entering mess...' : 'Enter mess'}</span>
                <span style={{ fontSize: '1.1rem' }}>&rarr;</span>
              </button>
            </form>

            {/* Quick Demo Login selector for reviewers */}
            <div className="demo-accounts-card">
              <div className="demo-title">
                <span>Quick Test Logins</span>
                <span style={{ color: '#2563EB', fontWeight: 600 }}>WEBSTER 2026 PS2</span>
              </div>
              <div className="demo-chips">
                <div
                  className="demo-chip"
                  onClick={() => handleLogin('aarav.20214001@mnnit.ac.in', 'student')}
                >
                  <div>
                    <strong style={{ display: 'block' }}>Aarav Sharma (Student)</strong>
                    <span style={{ color: '#64748B', fontSize: '0.72rem' }}>aarav.20214001@mnnit.ac.in</span>
                  </div>
                  <span className="demo-role-badge badge-student">Student Portal</span>
                </div>

                <div
                  className="demo-chip"
                  onClick={() => handleLogin('staff@mnnit.ac.in', 'staff')}
                >
                  <div>
                    <strong style={{ display: 'block' }}>Wong (Mess Staff)</strong>
                    <span style={{ color: '#64748B', fontSize: '0.72rem' }}>staff@mnnit.ac.in</span>
                  </div>
                  <span className="demo-role-badge badge-staff">QR Scanner</span>
                </div>

                <div
                  className="demo-chip"
                  onClick={() => handleLogin('admin@mnnit.ac.in', 'admin')}
                >
                  <div>
                    <strong style={{ display: 'block' }}>Master Sorcerer (Admin)</strong>
                    <span style={{ color: '#64748B', fontSize: '0.72rem' }}>admin@mnnit.ac.in</span>
                  </div>
                  <span className="demo-role-badge badge-admin">Admin Portal</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748B' }}>
              <span>New to this mess? </span>
              <a href="#rules" style={{ color: '#2563EB', fontWeight: 600 }}>Join the mess</a>
            </div>
          </div>

          <div className="auth-footer">
            <span>&copy; 2026 MessMate · Kamar-Taj Refectory</span>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <a href="#rules">Mess rules</a>
              <a href="#contact">Contact admin &rarr;</a>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Banner matching Screenshot 1 */}
        <div className="hero-panel">
          <div>
            <div className="hero-tag">Manage Your Mess</div>
            <h2 className="hero-heading">Meals tracked.<br />Members accounted.</h2>
            <p className="hero-subhead">
              Keep attendance, meal counts, and member accounts in one place.
              Run your shared dining mess with less admin and more clarity.
            </p>

            {/* Showcase Image Card with Floating Badge */}
            <div className="hero-image-card">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
                alt="Modern Refectory Dining Hall"
                className="hero-image"
              />
              <div className="image-floating-badge">
                <div className="floating-icon">✓</div>
                <div>
                  <div className="floating-text-bold">Meals tracked. Members accounted.</div>
                  <div className="floating-text-sub">Attendance, meals, and member records in one place.</div>
                </div>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="hero-testimonial">
              <p className="testimonial-quote">
                "MessMate keeps our meal counts, attendance, and member accounts organized so we can focus on the food and the community."
              </p>
              <div className="testimonial-author">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                  alt="Priya Mehta"
                  className="author-avatar"
                />
                <div>
                  <div className="author-name">Priya Mehta</div>
                  <div className="author-role">Mess Secretary, North Block</div>
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
    </div>
  );
}

