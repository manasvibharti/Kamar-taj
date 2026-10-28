import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import TimeSimulator from './components/TimeSimulator.jsx';
import StudentPortal from './pages/StudentPortal.jsx';
import StaffPortal from './pages/StaffPortal.jsx';
import Login from './pages/Login.jsx';
import { api, getAuthToken, setAuthToken } from './utils/api.js';

export default function App() {
  const [currentPath, setCurrentPath] = useState(
    window.location.pathname === '/staff' ? '/staff' : '/student'
  );
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [simulatedTime, setSimulatedTimeState] = useState(null);

  // Sync with browser navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname === '/staff' ? '/staff' : '/student';
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check auth status on startup
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Auth token invalid or expired:', err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'staff') {
      navigate('/staff');
    } else {
      navigate('/student');
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500 mt-3">Loading MessMate...</p>
      </div>
    );
  }

  // Determine if login is required
  // If not logged in, or logged-in user role doesn't match the required portal role
  const requiredRole = currentPath === '/staff' ? 'staff' : 'student';
  const isAuthorized = user && user.role === requiredRole;

  if (!isAuthorized) {
    return (
      <div>
        <TimeSimulator onTimeChange={(t) => setSimulatedTimeState(t)} />
        <Login
          initialRole={requiredRole}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800">
      {/* Top Testing Time Simulator */}
      <TimeSimulator onTimeChange={(t) => setSimulatedTimeState(t)} />

      {/* Main Navigation Bar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeRoute={currentPath}
        onNavigate={navigate}
      />

      {/* Page Body */}
      <div className="flex-1 flex">
        {/* Render Sidebar for student portal (matching Page 3 of PDF) */}
        {currentPath === '/student' && (
          <Sidebar user={user} activeTab="qr" />
        )}

        {/* View Portals */}
        {currentPath === '/student' ? (
          <StudentPortal user={user} simulatedTime={simulatedTime} />
        ) : (
          <StaffPortal user={user} simulatedTime={simulatedTime} />
        )}
      </div>
    </div>
  );
}

