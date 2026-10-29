import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import StudentPortal from './pages/StudentPortal.jsx';
import StaffPortal from './pages/StaffPortal.jsx';
import AdminPortal from './pages/AdminPortal.jsx';
import Login from './pages/Login.jsx';
import { api, getAuthToken, setAuthToken, setSimulatedTime } from './utils/api.js';

// Parse current URL into active portal, tab, and path
function parseRoute(pathname) {
  const clean = pathname.replace(/\/$/, '') || '/';

  if (clean.startsWith('/admin')) {
    return {
      portal: 'admin',
      tab: 'overview',
      fullPath: clean
    };
  }

  if (clean.startsWith('/staff')) {
    return {
      portal: 'staff',
      tab: 'scanner',
      fullPath: clean
    };
  }

  // Supported student tabs
  const validTabs = ['dashboard', 'qr', 'opt-in-out', 'budget', 'expenses', 'feedback', 'history'];

  let tab = 'dashboard';
  if (clean.startsWith('/student/')) {
    const sub = clean.slice('/student/'.length);
    if (validTabs.includes(sub)) {
      tab = sub;
    }
  }

  return {
    portal: 'student',
    tab,
    fullPath: clean === '/' ? '/student' : clean
  };
}

export default function App() {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Clear any existing simulated mock time on startup so system runs strictly on real time
  useEffect(() => {
    setSimulatedTime(null);
  }, []);

  // Sync with browser navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // If user lands on root '/', update address bar to '/student' without reload
  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState({}, '', '/student');
    }
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

    // Immediately restore cached user from localStorage so reload never flashes or logs out
    const cachedUser = localStorage.getItem('refectory_user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {}
    }

    try {
      const res = await api.getMe();
      if (res?.user) {
        setUser(res.user);
        localStorage.setItem('refectory_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Auth check error:', err);
      if (err.status === 401) {
        setAuthToken(null);
        localStorage.removeItem('refectory_user');
        setUser(null);
      }
    } finally {
      setLoadingUser(false);
    }
  };

  // Navigate to explicit URL path
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setRoute(parseRoute(path));
  };

  // Switch student tab and update URL pathname so refresh stays on this exact page
  const handleStudentTabChange = (tabId) => {
    const targetPath = tabId === 'dashboard' ? '/student' : `/student/${tabId}`;
    window.history.pushState({}, '', targetPath);
    setRoute({
      portal: 'student',
      tab: tabId,
      fullPath: targetPath
    });
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('refectory_user');
    setUser(null);
    window.history.pushState({}, '', '/student');
    setRoute(parseRoute('/student'));
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem('refectory_user', JSON.stringify(loggedInUser));
    if (loggedInUser.role === 'admin') {
      navigate('/admin');
    } else if (loggedInUser.role === 'staff') {
      navigate('/staff');
    } else {
      if (window.location.pathname.startsWith('/student/') && window.location.pathname !== '/student/') {
        navigate(window.location.pathname);
      } else {
        navigate('/student');
      }
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

  // Determine role authorization
  let isAuthorized = false;
  let requiredRole = 'student';

  if (route.portal === 'admin') {
    requiredRole = 'admin';
    isAuthorized = Boolean(user && user.role === 'admin');
  } else if (route.portal === 'staff') {
    requiredRole = 'staff';
    isAuthorized = Boolean(user && (user.role === 'staff' || user.role === 'admin'));
  } else {
    requiredRole = 'student';
    isAuthorized = Boolean(user && user.role === 'student');
  }

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
        activeRoute={route.fullPath}
        onNavigate={navigate}
      />

      {/* Page Body */}
      <div className="flex-1 flex">
        {/* Render Sidebar for student portal */}
        {route.portal === 'student' && (
          <Sidebar
            user={user}
            activeTab={route.tab}
            onTabChange={handleStudentTabChange}
          />
        )}

        {/* View Portals */}
        {route.portal === 'admin' ? (
          <AdminPortal
            user={user}
            onNavigate={navigate}
          />
        ) : route.portal === 'staff' ? (
          <StaffPortal
            user={user}
          />
        ) : (
          <StudentPortal
            user={user}
            activeTab={route.tab}
            onTabChange={handleStudentTabChange}
          />
        )}
      </div>
    </div>
  );
}
