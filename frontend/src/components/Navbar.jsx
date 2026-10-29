import React, { useState, useRef, useEffect } from 'react';
import { Utensils, Bell, LogOut, User, ShieldCheck, ChevronDown, X, CheckCircle, Mail, MapPin, Award, QrCode, LayoutDashboard } from 'lucide-react';

export default function Navbar({ user, onLogout, activeRoute, onNavigate }) {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const popupRef = useRef(null);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowProfilePopup(false);
      }
    };

    if (showProfilePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfilePopup]);

  const studentEmail = user?.email || (user?.roll_no ? `${user.name?.toLowerCase().replace(/\s+/g, '')}.${user.roll_no}@mnnit.ac.in` : (user?.role === 'admin' ? 'admin@mnnit.ac.in' : 'staff@mnnit.ac.in'));

  const getRoleBadge = () => {
    if (user?.role === 'admin') return 'Mess Secretary / Admin';
    if (user?.role === 'staff') return 'Patel Mess Counter Staff';
    return user?.roll_no || '20253515';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Left: Brand Header */}
      <div className="flex items-center gap-3">
        <div 
          className="flex items-center gap-2.5 cursor-pointer" 
          onClick={() => onNavigate(user?.role === 'admin' ? '/admin' : (user?.role === 'staff' ? '/staff' : '/student'))}
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <span className="font-extrabold text-sm text-white">KT</span>
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight text-base sm:text-lg flex items-center gap-1.5">
              The Kamar-Taj
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full border border-indigo-200 tracking-wider uppercase">
                Refectory
              </span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Quick-Toggle */}
        {user?.role === 'admin' && (
          <div className="hidden md:flex items-center gap-1.5 ml-6 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => onNavigate('/admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRoute?.startsWith('/admin') ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin Manager</span>
            </button>
            <button
              onClick={() => onNavigate('/staff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRoute?.startsWith('/staff') ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Counter Scanner</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Date, Notifications & Proper Profile Account Button */}
      <div className="flex items-center gap-3" ref={popupRef}>
        <div className="hidden lg:block text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          {todayFormatted}
        </div>

        <div className="relative">
          <button className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
        </div>

        {user && (
          <div className="relative pl-2 border-l border-slate-200">
            {/* Proper Account Button */}
            <button
              onClick={() => setShowProfilePopup(!showProfilePopup)}
              className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {getRoleBadge()}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showProfilePopup ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Pop-Up Modal */}
            {showProfilePopup && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-indigo-100">
                      {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                        {user.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {user.role === 'student' ? `Roll: ${user.roll_no || '20253515'}` : (user.role === 'admin' ? 'Role: Mess Administrator' : 'Role: Counter Staff')}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        {user.role === 'student' ? 'Verified Active Student' : 'Authorized Mess Personnel'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowProfilePopup(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Profile Details List */}
                <div className="py-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Official College Email</span>
                    <span className="font-semibold text-slate-800 text-right font-mono truncate max-w-[200px]" title={studentEmail}>
                      {studentEmail}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Assigned Mess Hall</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Patel Mess (Pure Veg)
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Hostel / Facility</span>
                    <span className="font-semibold text-slate-800">
                      Patel Hostel
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400 font-medium">System Role</span>
                    <span className="font-semibold text-slate-800 uppercase tracking-wider font-mono text-[11px]">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Deliberate Sign Out Button inside Pop-up */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowProfilePopup(false);
                      onLogout();
                    }}
                    className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Log Out of Account</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                    You will remain logged in on this browser until you explicitly click this button.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
