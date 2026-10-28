import React, { useState } from 'react';
import { Utensils, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, setAuthToken } from '../utils/api.js';

export default function Login({ onLoginSuccess, initialRole = 'student' }) {
  const [role, setRole] = useState(initialRole);
  const [identifier, setIdentifier] = useState(initialRole === 'student' ? 'CS21B042' : 'admin');
  const [password, setPassword] = useState(initialRole === 'student' ? 'password123' : 'staff123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError(null);
    if (newRole === 'student') {
      setIdentifier('CS21B042');
      setPassword('password123');
    } else {
      setIdentifier('admin');
      setPassword('staff123');
    }
  };

  const handleQuickDemo = (demoRole, idVal, passVal) => {
    setRole(demoRole);
    setIdentifier(idVal);
    setPassword(passVal);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(identifier, password, role);
      setAuthToken(res.token);
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.data?.error || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">
                MessMate
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back to the mess
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Sign in to manage meals, attendance, and member accounts for your shared dining mess.
            </p>

            {/* Role Switcher Pill */}
            <div className="mt-6 flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  role === 'student'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                Student Portal (/student)
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('staff')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  role === 'staff'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Staff Scanner (/staff)
              </button>
            </div>

            {/* Quick Demo Credentials for Fast Testing */}
            <div className="mt-4 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Instant Demo Accounts:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('student', 'CS21B042', 'password123')}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg text-[11px] font-semibold border border-indigo-200 transition-all shadow-2xs"
                >
                  Student: Aarav
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('student', 'CS21B018', 'password123')}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg text-[11px] font-semibold border border-indigo-200 transition-all shadow-2xs"
                >
                  Student: Priya
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('staff', 'admin', 'staff123')}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold transition-all shadow-2xs"
                >
                  Staff: Admin
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {role === 'student' ? 'College Roll Number' : 'Staff Username'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={role === 'student' ? 'e.g. CS21B042' : 'e.g. admin'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white font-medium transition-all"
                  />
                  <div className="absolute right-3.5 top-3.5 text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mess Passcode
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter passcode"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white font-medium transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span>Keep me signed in</span>
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Contact Mess Admin to reset passcode: admin@college.edu"); }} className="text-indigo-600 font-semibold hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3.5 px-4 font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{loading ? 'Authenticating...' : 'Enter mess'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>© 2026 MessMate System</span>
            <div className="space-x-3">
              <a href="#rules" onClick={(e) => { e.preventDefault(); alert("Mess Timings:\nBreakfast: 07:30 - 09:30\nLunch: 12:30 - 14:30\nDinner: 19:30 - 21:30"); }} className="hover:text-slate-600 underline">
                Mess rules
              </a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); alert("Mess Committee Office: Ground Floor, Hostel North Block"); }} className="hover:text-slate-600 underline">
                Contact admin
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Panel (Page 1 of attached PDF) (5 cols) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100/50 p-10 flex-col justify-between border-l border-slate-200/80 relative">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              MANAGE YOUR MESS
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Meals tracked.<br />Members accounted.
            </h2>
            <p className="text-slate-600 text-xs mt-3 leading-relaxed">
              Keep attendance, meal counts, and member accounts in one place. Run your shared dining mess with less admin and more clarity.
            </p>
          </div>

          {/* Dining Mess Illustrative Photo Card */}
          <div className="my-6 bg-white rounded-2xl p-3 shadow-lg border border-slate-200/80 relative">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=700&q=80"
              alt="Mess Dining Hall"
              className="w-full h-44 object-cover rounded-xl"
            />
            <div className="mt-3 p-2 bg-slate-50 rounded-lg flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-[10px] text-slate-700 font-medium">
                <span className="font-bold text-slate-900">Meals tracked. Members accounted.</span>
                <br />
                Attendance, meals, and member records in one place.
              </div>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs italic text-slate-700 leading-relaxed">
              "MessMate keeps our meal counts, attendance, and member accounts organized so we can focus on the food and the community."
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                PM
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Priya Mehta</div>
                <div className="text-[10px] text-slate-500 font-medium">Mess Secretary, North Block</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

