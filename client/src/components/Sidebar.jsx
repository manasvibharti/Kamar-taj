import React from 'react';
import { 
  LayoutDashboard, 
  QrCode, 
  SlidersHorizontal, 
  Wallet, 
  Receipt, 
  Sparkles, 
  MessageSquare, 
  HelpCircle, 
  Building2,
  ChevronDown
} from 'lucide-react';

export default function Sidebar({ user, activeTab = 'qr', onTabChange }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'qr', label: 'QR attendance', icon: QrCode, badge: 'Live' },
    { id: 'preferences', label: 'Meal preferences', icon: SlidersHorizontal },
    { id: 'budget', label: 'My meal budget', icon: Wallet },
    { id: 'expenses', label: 'Food expenses', icon: Receipt },
    { id: 'special', label: 'Special meals', icon: Sparkles },
    { id: 'feedback', label: 'Meal feedback', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-[#fbfcfd] border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        {/* Hostel / Mess selector card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                {user?.hostel || 'North Block Mess'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {user?.role === 'student' ? 'Student Workspace' : 'Staff Terminal'}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>

        {/* Navigation list */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-2">
            YOUR MESS
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange && onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-700 shadow-sm border border-indigo-100/60 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-600 text-white uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Support Card & User Status */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Need a hand?</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
            Your mess committee is here to assist with any dietary or scan issues.
          </p>
          <a
            href="#contact"
            onClick={(e) => { e.preventDefault(); alert("Mess Committee Helpline: +91 98765 43210 (Priya Mehta - Mess Secretary)"); }}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            Contact admin &rarr;
          </a>
        </div>

        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {user.hostel || 'Room N-204'}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

