import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import StudentPortal from './pages/StudentPortal.jsx';
import StaffPortal from './pages/StaffPortal.jsx';
import Login from './pages/Login.jsx';
import { api, getAuthToken, setAuthToken, setSimulatedTime } from './utils/api.js';

export default function App() {
  const [currentPath, setCurrentPath] = useState(
    window.location.pathname === '/staff' ? '/staff' : '/student'
  );
  const [studentTab, setStudentTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Clear any existing simulated mock time on startup so system runs strictly on real time
  useEffect(() => {
    setSimulatedTime(null);
  }, []);

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
        <p className="text-xs font-semibold text-slate-500 mt-3">Loading The Kamar-Taj Refectory...</p>
      </div>
    );
  }

  // Determine if login is required
  const requiredRole = currentPath === '/staff' ? 'staff' : 'student';
  const isAuthorized = user && user.role === requiredRole;

  if (!isAuthorized) {
    return (
      <Login
        initialRole={requiredRole}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800">
      {/* Main Navigation Bar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeRoute={currentPath}
        onNavigate={navigate}
      />

      {/* Page Body */}
      <div className="flex-1 flex">
        {/* Render Sidebar for student portal */}
        {currentPath === '/student' && (
          <Sidebar
            user={user}
            activeTab={studentTab}
            onTabChange={setStudentTab}
          />
        )}

        {/* View Portals */}
        {currentPath === '/student' ? (
          <StudentPortal
            user={user}
            activeTab={studentTab}
            onTabChange={setStudentTab}
          />
        ) : (
          <StaffPortal
            user={user}
          />
        )}
      </div>
    </div>
  );
}
