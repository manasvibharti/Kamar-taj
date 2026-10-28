import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  Coffee, 
  Sun, 
  Moon,
  Copy,
  Check,
  Info,
  ChevronRight
} from 'lucide-react';
import { api } from '../utils/api.js';

export default function StudentPortal({ user, simulatedTime }) {
  const [meals, setMeals] = useState([]);
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split('T')[0]);

  const refreshIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Fetch meals on mount and when simulatedTime changes
  useEffect(() => {
    fetchMealsAndHistory();
  }, [simulatedTime]);

  const fetchMealsAndHistory = async () => {
    try {
      const data = await api.getMeals();
      setMeals(data.meals || []);
      setTodayDate(data.date);

      // Auto-select active meal, or first available meal if none active
      const active = data.meals.find(m => m.is_active && !m.has_eaten) || data.meals.find(m => m.is_active) || data.meals[0];
      if (active && (!selectedMealId || !data.meals.some(m => m.id === selectedMealId))) {
        setSelectedMealId(active.id);
      }

      fetchHistory();
    } catch (err) {
      console.error('Error fetching meals:', err);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const histData = await api.getStudentHistory();
      setHistory(histData.history || []);
    } catch (err) {
      console.error('Error fetching student history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Selected meal object
  const currentMeal = meals.find(m => m.id === selectedMealId) || meals[0];

  // Fetch QR Token function
  const fetchQrToken = async (mealId) => {
    if (!mealId) return;
    const targetMeal = meals.find(m => m.id === mealId);
    
    // If meal already eaten today, don't fetch QR
    if (targetMeal?.has_eaten) {
      setQrToken(null);
      setQrError('You have already recorded attendance for this meal today.');
      return;
    }

    // If meal not active, show informative state
    if (targetMeal && !targetMeal.is_active) {
      setQrToken(null);
      setQrError(`This meal is not available right now (${targetMeal.start_time.slice(0, 5)} - ${targetMeal.end_time.slice(0, 5)}).`);
      return;
    }

    setLoadingQr(true);
    setQrError(null);

    try {
      const res = await api.getMealQr(mealId);
      setQrToken(res.token);
      setCountdown(30); // reset 30-second countdown
    } catch (err) {
      setQrToken(null);
      setQrError(err.data?.message || err.message || 'Failed to generate QR token.');
    } finally {
      setLoadingQr(false);
    }
  };

  // Manage 30-second rotation loop
  useEffect(() => {
    if (!selectedMealId) return;

    fetchQrToken(selectedMealId);

    // Countdown tick every second
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    // Refresh token every 30 seconds smoothly
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(() => {
      fetchQrToken(selectedMealId);
    }, 30000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [selectedMealId, simulatedTime, meals]);

  const handleCopyToken = () => {
    if (qrToken) {
      navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMealIcon = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('breakfast')) return Coffee;
    if (n.includes('lunch')) return Sun;
    return Moon;
  };

  const activeMealSession = meals.find(m => m.is_active);

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Your seat. Your meal. Your QR.
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Show your personal code at the mess counter to mark attendance.
          </p>
        </div>

        <div>
          {activeMealSession ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {activeMealSession.name} session open
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              Counter closed (Outside meal timings)
            </div>
          )}
        </div>
      </div>

      {/* 3 Meal Selector Tabs / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {meals.map((meal) => {
          const Icon = getMealIcon(meal.name);
          const isSelected = selectedMealId === meal.id;
          const isActive = meal.is_active;
          const hasEaten = meal.has_eaten;

          return (
            <div
              key={meal.id}
              onClick={() => setSelectedMealId(meal.id)}
              className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border relative ${
                isSelected
                  ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${
                    isSelected ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{meal.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {meal.start_time.slice(0, 5)} - {meal.end_time.slice(0, 5)}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                {hasEaten ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Used
                  </span>
                ) : isActive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                    Open now
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    Not available now
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                <span>{todayDate}</span>
                <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
                  {isSelected ? 'Viewing QR' : 'Select'}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: QR Presentation Card & Right Educational Sidepanel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: The Dynamic QR Code Card (8 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle top decoration */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600"></div>

          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {currentMeal ? `Today's ${currentMeal.name}` : "Today's Meal"}
              </span>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {todayDate} • {currentMeal ? `${currentMeal.start_time.slice(0, 5)} - ${currentMeal.end_time.slice(0, 5)}` : ''} • North Block
              </div>
            </div>

            {currentMeal?.has_eaten ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Attendance Recorded
              </span>
            ) : currentMeal?.is_active ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Awaiting check-in
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                Counter closed
              </span>
            )}
          </div>

          {/* QR Render Area */}
          <div className="py-8 flex flex-col items-center justify-center">
            {currentMeal?.has_eaten ? (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-8 max-w-sm text-center my-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Meal Already Claimed
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You have already used your attendance code for <span className="font-semibold text-slate-800">{currentMeal.name}</span> today. Double entries are blocked.
                </p>
                <div className="mt-4 pt-4 border-t border-emerald-200/50 text-[11px] text-emerald-800 font-medium">
                  Enjoy your meal! See you at the next slot.
                </div>
              </div>
            ) : !currentMeal?.is_active ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 max-w-sm text-center my-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-600 mx-auto flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {currentMeal?.name} is not available now
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  This meal is served between <span className="font-semibold text-slate-700">{currentMeal?.start_time.slice(0, 5)}</span> and <span className="font-semibold text-slate-700">{currentMeal?.end_time.slice(0, 5)}</span>.
                </p>
                <div className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 font-medium">
                  Tip: Use the <span className="font-bold">Time Simulator</span> at the top bar to test active meal windows anytime!
                </div>
              </div>
            ) : qrError ? (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 max-w-sm text-center my-4">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-rose-900 mb-1">
                  Cannot issue attendance QR
                </h3>
                <p className="text-xs text-rose-700 leading-relaxed mb-4">
                  {qrError}
                </p>
                <button
                  onClick={() => fetchQrToken(selectedMealId)}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-all flex items-center gap-1.5 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* QR Code Container */}
                <div className="relative p-5 bg-white rounded-3xl shadow-lg border border-slate-200 group">
                  <div className="relative">
                    {loadingQr ? (
                      <div className="w-60 h-60 flex flex-col items-center justify-center bg-slate-50 rounded-2xl">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                        <span className="text-xs text-slate-500 font-medium">Generating fresh token...</span>
                      </div>
                    ) : qrToken ? (
                      <QRCodeSVG
                        value={qrToken}
                        size={240}
                        level="H"
                        includeMargin={true}
                        className="rounded-xl"
                      />
                    ) : null}
                  </div>
                </div>

                {/* Subtitle under QR */}
                <p className="text-xs font-bold text-slate-700 tracking-wider uppercase mt-4">
                  Personal attendance code
                </p>

                {/* Smooth Countdown Timer */}
                <div className="mt-3 flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-full shadow-sm text-xs font-bold">
                  <RefreshCw className={`w-3.5 h-3.5 ${countdown <= 5 ? 'animate-spin text-amber-600' : 'text-indigo-600'}`} />
                  <span>
                    New code in 00:{countdown < 10 ? `0${countdown}` : countdown}
                  </span>
                  <div className="w-12 bg-indigo-200 h-1.5 rounded-full overflow-hidden ml-1">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${(countdown / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  Rotates every 30s • Valid for 60s • Single-use
                </p>

                {/* Student verification tag & Token Copy for tester convenience */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs">
                  <div className="text-slate-700 font-medium">
                    <span className="font-bold text-slate-900">{user?.name}</span> • Roll: <span className="font-mono font-semibold">{user?.roll_no}</span>
                  </div>
                  <button
                    onClick={handleCopyToken}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all"
                    title="Copy JWT token string for quick testing or manual scanner test"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy token string</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Educational & Security Guide Panel (Page 3 of design) (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>A fresh code. A fair system.</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Your attendance code is cryptographically signed and designed to rotate every 30 seconds. Expired codes and screenshots are automatically rejected by counter scanners, preventing proxy attendance and maintaining meal inventory accuracy.
            </p>

            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Checking in is simple
            </h4>
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <p className="text-xs text-slate-600">
                  Open this page at the mess counter on your phone.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <p className="text-xs text-slate-600">
                  Let the mess staff scan your dynamic QR code.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <p className="text-xs text-slate-600">
                  Wait for the green <span className="font-semibold text-emerald-700">"Entry allowed"</span> confirmation.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>Having trouble? Ask the counter staff to verify your college roll number or inspect camera lighting.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Section (Page 3 of design) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Attendance history</h2>
            <p className="text-xs text-slate-500">Your recent verified mess entries</p>
          </div>
          <button
            onClick={fetchHistory}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Meal</th>
                <th className="py-3 px-4">Check-in Time</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No attendance records found yet.
                  </td>
                </tr>
              ) : (
                history.map((record) => {
                  const checkInDate = new Date(record.scanned_at || record.date);
                  const timeStr = checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = checkInDate.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {record.meal_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {timeStr}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {record.scanned_by_name || 'North Block Mess Counter'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Recorded
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

