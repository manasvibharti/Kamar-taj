import React from 'react';
import { Utensils, Bell, LogOut, User, QrCode, ShieldCheck, ChevronRight } from 'lucide-react';

export default function Navbar({ user, onLogout, activeRoute, onNavigate }) {
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Left: Brand & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate(user?.role === 'staff' ? '/staff' : '/student')}>
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

        <div className="hidden md:flex items-center text-xs text-slate-500 font-medium">
          <span>Patel Mess</span>
          <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
          <span className="text-slate-900 font-semibold capitalize">
            {activeRoute === '/student' ? 'Student Workspace' : 'Staff Scanner Terminal'}
          </span>
        </div>
      </div>

      {/* Middle: Switch Portal Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => onNavigate('/student')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeRoute === '/student'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Student</span> Portal
        </button>
        <button
          onClick={() => onNavigate('/staff')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeRoute === '/staff'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Staff</span> Scanner
        </button>
      </div>

      {/* Right: Date, Notifications & User Info */}
      <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {user.role === 'student' ? (user.roll_no || 'Patel Mess') : 'Patel Mess Staff'}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="ml-1 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
