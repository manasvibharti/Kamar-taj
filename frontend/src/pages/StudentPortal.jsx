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
  ChevronRight,
  SlidersHorizontal,
  Wallet,
  Receipt,
  MessageSquare,
  Utensils,
  Lock,
  ArrowRight,
  TrendingDown,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../utils/api.js';

// Predefined Refectory Menus & Prices for Patel Mess
const MEAL_DETAILS = {
  1: {
    amount: 50,
    menu: 'Poha with Sev & Fried Peanuts, Steamed Masala Idli, Sambhar & Coconut Chutney, Boiled Eggs / Fresh Banana, Filter Coffee & Special Masala Chai.',
    cutoffHours: 3,
    cutoffTime: '04:30',
  },
  2: {
    amount: 90,
    menu: 'Paneer Butter Masala / Chicken Curry, Yellow Dal Tadka, Steamed Fragrant Basmati Rice, Fresh Tandoori Wheat Rotis, Boondi Raita, Green Salad & Mint Chutney.',
    cutoffHours: 3,
    cutoffTime: '09:30',
  },
  3: {
    amount: 90,
    menu: 'Malai Kofta / Masala Egg Curry, Slow-Cooked Dal Makhani, Jeera Rice, Fresh Butter Naan, Garden Fresh Salad, Roasted Papad & Hot Gulab Jamun.',
    cutoffHours: 3,
    cutoffTime: '16:30',
  },
};

export default function StudentPortal({ 
  user, 
  simulatedTime, 
  activeTab = 'dashboard', 
  onTabChange 
}) {
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

  // Opt-in / Opt-out state (default: all opted-in 'in')
  const storageKey = `kamar_taj_opt_status_${user?.email || user?.roll_no || 'student'}_${todayDate}`;
  const [optStatus, setOptStatus] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : { 1: 'in', 2: 'in', 3: 'in' };
    } catch {
      return { 1: 'in', 2: 'in', 3: 'in' };
    }
  });

  const refreshIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Sync optStatus to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(optStatus));
    } catch (e) {
      console.warn('Failed to save opt status:', e);
    }
  }, [optStatus, storageKey]);

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

  // 3 Hours Cutoff Evaluation: returns { isCutoffPassed, message, remainingTime }
  const checkCutoffStatus = (meal) => {
    if (!meal) return { isCutoffPassed: false, message: '' };

    // Get current minutes
    let currentMinutes = 0;
    if (simulatedTime) {
      const parts = simulatedTime.split(':');
      currentMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else {
      const now = new Date();
      currentMinutes = now.getHours() * 60 + now.getMinutes();
    }

    // Meal start time minutes
    const startParts = meal.start_time.split(':');
    const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);

    // Cutoff is exactly 3 hours (180 mins) before start time
    const cutoffMinutes = startMinutes - 180;

    const isCutoffPassed = currentMinutes >= cutoffMinutes;

    const formatMins = (mins) => {
      const clamped = (mins + 1440) % 1440;
      const h = Math.floor(clamped / 60);
      const m = clamped % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dispH = h % 12 === 0 ? 12 : h % 12;
      const dispM = m < 10 ? `0${m}` : m;
      return `${dispH}:${dispM} ${ampm}`;
    };

    if (isCutoffPassed) {
      return {
        isCutoffPassed: true,
        cutoffTimeStr: formatMins(cutoffMinutes),
        message: `Cutoff passed at ${formatMins(cutoffMinutes)} (3 hrs before start). Status is locked.`,
      };
    } else {
      const diff = cutoffMinutes - currentMinutes;
      const hrsLeft = Math.floor(diff / 60);
      const minsLeft = diff % 60;
      return {
        isCutoffPassed: false,
        cutoffTimeStr: formatMins(cutoffMinutes),
        remainingTime: `${hrsLeft}h ${minsLeft}m`,
        message: `Opt-out closes in ${hrsLeft}h ${minsLeft}m (Cutoff: ${formatMins(cutoffMinutes)})`,
      };
    }
  };

  // Toggle opt-in / opt-out
  const handleToggleOpt = (mealId) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;

    const cutoff = checkCutoffStatus(meal);
    if (cutoff.isCutoffPassed) {
      alert(`Changes locked: The 3-hour cutoff (${cutoff.cutoffTimeStr}) for ${meal.name} has passed.`);
      return;
    }

    setOptStatus((prev) => {
      const current = prev[mealId] || 'in';
      const updated = current === 'in' ? 'out' : 'in';
      return { ...prev, [mealId]: updated };
    });
  };

  // Calculate Mess Refund Balance for today based on opted-out meals
  const calculateTotalRefund = () => {
    let refund = 0;
    meals.forEach((m) => {
      if (optStatus[m.id] === 'out') {
        const detail = MEAL_DETAILS[m.id];
        if (detail) refund += detail.amount;
      }
    });
    return refund;
  };

  const todayRefundAmount = calculateTotalRefund();

  // Selected meal object for QR
  const currentMeal = meals.find(m => m.id === selectedMealId) || meals[0];
  const isCurrentMealOptedOut = currentMeal && optStatus[currentMeal.id] === 'out';

  // Fetch QR Token function
  const fetchQrToken = async (mealId) => {
    if (!mealId) return;
    const targetMeal = meals.find(m => m.id === mealId);
    
    // Check if student opted out
    if (optStatus[mealId] === 'out') {
      setQrToken(null);
      setQrError('You have opted out of this meal. ₹' + (MEAL_DETAILS[mealId]?.amount || 0) + ' has been credited to your mess refund.');
      return;
    }

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
      setCountdown(30);
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

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(() => {
      fetchQrToken(selectedMealId);
    }, 30000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [selectedMealId, simulatedTime, meals, optStatus]);

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

  // -------------------------------------------------------------
  // VIEW 1: DASHBOARD (Replaces the overview function)
  // -------------------------------------------------------------
  if (activeTab === 'dashboard') {
    return (
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2">
              <span>The Kamar-Taj Refectory</span> • <span>Patel Mess</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Scholar'}!
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Patel Mess Dashboard • Roll: <span className="font-mono font-semibold text-slate-800">{user?.roll_no || '20253515'}</span> • {todayDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange && onTabChange('qr')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm shadow-indigo-200"
            >
              <span>View Attendance QR</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTabChange && onTabChange('opt-in-out')}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Opt In / Out Meals</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Mess Refund Balance */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mess Refund Balance</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              ₹{todayRefundAmount}.00
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              Credited from {Object.values(optStatus).filter(v => v === 'out').length} opted-out meals today
            </p>
          </div>

          {/* Card 2: Current Dining Status */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Mess Status</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base font-extrabold text-slate-900 truncate">
              {activeMealSession ? `${activeMealSession.name} Open` : 'Counter Closed'}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {activeMealSession 
                ? `${activeMealSession.start_time.slice(0, 5)} - ${activeMealSession.end_time.slice(0, 5)} • Patel Mess`
                : 'Next meal slot upcoming'}
            </p>
          </div>

          {/* Card 3: Today's Participation */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opt-In Status</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {meals.map(m => (
                <span 
                  key={m.id} 
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    optStatus[m.id] === 'out' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                  title={`${m.name}: ${optStatus[m.id] === 'out' ? 'Opted Out' : 'Opted In'}`}
                >
                  {m.name.slice(0, 1)}: {optStatus[m.id] === 'out' ? 'Out' : 'In'}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-2">
              Strict 3h cutoff enforced
            </p>
          </div>

          {/* Card 4: Assigned Mess */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Mess Hall</span>
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-extrabold text-slate-900">
              Patel Mess
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Counter 1 & 2 • The Kamar-Taj
            </p>
          </div>
        </div>

        {/* Today's Dining Schedule & Menus Card Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Today's Meal Schedule & Menus</h2>
              <p className="text-xs text-slate-500">
                Freshly prepared daily meal items at Patel Mess.
              </p>
            </div>
            <button
              onClick={() => onTabChange && onTabChange('opt-in-out')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Manage Opt-in/out</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {meals.map((meal) => {
              const Icon = getMealIcon(meal.name);
              const detail = MEAL_DETAILS[meal.id] || { amount: 70, menu: 'Standard balanced wholesome meal' };
              const isOptedOut = optStatus[meal.id] === 'out';
              const cutoff = checkCutoffStatus(meal);

              return (
                <div
                  key={meal.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                    isOptedOut 
                      ? 'bg-rose-50/30 border-rose-200' 
                      : 'bg-white border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{meal.name}</h3>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {meal.start_time.slice(0, 5)} - {meal.end_time.slice(0, 5)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900">
                          ₹{detail.amount}.00
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">per meal</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-3">
                      {isOptedOut ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Opted Out (₹{detail.amount} Refunded)
                        </span>
                      ) : meal.has_eaten ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Attendance Marked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Opted In (Seat Reserved)
                        </span>
                      )}
                    </div>

                    {/* What is being served */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-indigo-500" />
                        <span>Menu Being Served</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {detail.menu}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Cutoff: {cutoff.cutoffTimeStr || '3h before'}
                    </span>
                    <button
                      onClick={() => onTabChange && onTabChange('opt-in-out')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      {isOptedOut ? 'Opt Back In' : 'Opt Out'} &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Attendance History Table on Dashboard */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Attendance History</h2>
              <p className="text-xs text-slate-500">Verified entries recorded at Patel Mess</p>
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
                  history.slice(0, 4).map((record) => {
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
                          Patel Mess Counter
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

  // -------------------------------------------------------------
  // VIEW 2: MEAL OPT-IN / OPT-OUT MANAGEMENT
  // -------------------------------------------------------------
  if (activeTab === 'opt-in-out') {
    return (
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2">
              <span>The Kamar-Taj Refectory</span> • <span>Zero-Waste Forecasting</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Meal Opt-In & Opt-Out Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Choose your meals in advance. Opting out credits the exact meal amount directly to your mess refund.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              ₹
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Total Refund Credited Today
              </div>
              <div className="text-xl font-extrabold text-emerald-900">
                ₹{todayRefundAmount}.00
              </div>
            </div>
          </div>
        </div>

        {/* Strict 3-Hour Cutoff Alert Box */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Strict 3-Hour Cutoff Rule Enforced:</span> You can opt in or opt out of any meal up until <span className="font-bold underline">3 hours before</span> that meal session starts. After the cutoff passes, the kitchen finalizes headcounts and procurement, and the meal status is locked.
          </div>
        </div>

        {/* 3 Meal Cards Grid (Matching QR card styling) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {meals.map((meal) => {
            const Icon = getMealIcon(meal.name);
            const detail = MEAL_DETAILS[meal.id] || { amount: 70, menu: 'Freshly prepared meal', cutoffTime: '3h before' };
            const isOptedOut = optStatus[meal.id] === 'out';
            const cutoff = checkCutoffStatus(meal);

            return (
              <div
                key={meal.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Top Accent Gradient Line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isOptedOut 
                    ? 'bg-rose-500' 
                    : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600'
                }`}></div>

                <div>
                  {/* Top Meal Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isOptedOut ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{meal.name}</h3>
                        <div className="text-xs text-slate-500 font-medium">
                          {meal.start_time.slice(0, 5)} - {meal.end_time.slice(0, 5)} • Patel Mess
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900">
                        ₹{detail.amount}.00
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Refund value
                      </div>
                    </div>
                  </div>

                  {/* Cutoff Status Indicator */}
                  <div className="my-4">
                    {cutoff.isCutoffPassed ? (
                      <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Cutoff locked ({cutoff.cutoffTimeStr})</span>
                      </div>
                    ) : (
                      <div className="bg-blue-50/80 border border-blue-200/70 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-blue-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{cutoff.message}</span>
                      </div>
                    )}
                  </div>

                  {/* What is served at this time */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Meal Served at this time</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {detail.menu}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div className="pt-4 border-t border-slate-100">
                  {isOptedOut ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-700 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-rose-600" />
                          Opted Out
                        </span>
                        <span>+₹{detail.amount} Refunded</span>
                      </div>

                      <button
                        onClick={() => handleToggleOpt(meal.id)}
                        disabled={cutoff.isCutoffPassed}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          cutoff.isCutoffPassed
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        }`}
                      >
                        {cutoff.isCutoffPassed ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Cutoff Passed (Locked)</span>
                          </>
                        ) : (
                          <>
                            <span>Opt Back In for {meal.name}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Opted In
                        </span>
                        <span>Dine at Patel Mess</span>
                      </div>

                      <button
                        onClick={() => handleToggleOpt(meal.id)}
                        disabled={cutoff.isCutoffPassed}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          cutoff.isCutoffPassed
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/80 shadow-sm'
                        }`}
                      >
                        {cutoff.isCutoffPassed ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Opt-Out Closed (Cutoff Passed)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Opt Out & Add ₹{detail.amount} to Refund</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Educational Informational Box */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>How the Kamar-Taj Refectory Refund Model Works</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            By opting out before the 3-hour cutoff, you help our mess kitchen procure exact food quantities, eliminating food wastage. The full meal amount (₹50 for breakfast, ₹90 for lunch and dinner) is automatically credited to your monthly mess rebate ledger.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">1. Transparent Accounting</span>
              <span className="text-slate-500">Every opted-out meal is time-stamped and credited directly to your student registration code.</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">2. Strict 3-Hour Deadline</span>
              <span className="text-slate-500">Locks automatically 3 hours before start time to allow procurement and prep for remaining members.</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">3. Automated Bill Adjustment</span>
              <span className="text-slate-500">Total accumulated refund is deducted from next semester's mess fee voucher.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: QR ATTENDANCE (Live QR token scanner)
  // -------------------------------------------------------------
  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2">
            <span>The Kamar-Taj Refectory</span> • <span>Patel Mess</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Your seat. Your meal. Your QR.
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Show your personal rotating code at the Patel Mess counter to mark attendance.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
          const isOptedOut = optStatus[meal.id] === 'out';
          const detail = MEAL_DETAILS[meal.id] || { amount: 70 };

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
                {isOptedOut ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    Opted Out
                  </span>
                ) : hasEaten ? (
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
                <span>Patel Mess • ₹{detail.amount}</span>
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
        {/* Left: The Dynamic QR Code Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle top decoration */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600"></div>

          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {currentMeal ? `Today's ${currentMeal.name}` : "Today's Meal"}
              </span>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {todayDate} • {currentMeal ? `${currentMeal.start_time.slice(0, 5)} - ${currentMeal.end_time.slice(0, 5)}` : ''} • Patel Mess
              </div>
            </div>

            {isCurrentMealOptedOut ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Opted Out (Refund Credited)
              </span>
            ) : currentMeal?.has_eaten ? (
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
            {isCurrentMealOptedOut ? (
              <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-8 max-w-sm text-center my-4">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  You Have Opted Out
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  You chose to opt out of <span className="font-semibold text-slate-800">{currentMeal.name}</span> today. ₹{MEAL_DETAILS[currentMeal.id]?.amount || 0}.00 has been credited to your mess refund. QR attendance is disabled for this meal.
                </p>
                <button
                  onClick={() => onTabChange && onTabChange('opt-in-out')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all inline-flex items-center gap-1.5 shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Manage Meal Opt In/Out</span>
                </button>
              </div>
            ) : currentMeal?.has_eaten ? (
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
                  Enjoy your meal! See you at Patel Mess for the next slot.
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
                  Personal attendance code • Patel Mess
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

        {/* Right: Educational & Security Guide Panel (5 Cols) */}
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
              Checking in at Patel Mess is simple
            </h4>
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <p className="text-xs text-slate-600">
                  Open this page at the Patel Mess counter on your mobile device.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <p className="text-xs text-slate-600">
                  Present your dynamic QR code to the scanner camera.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <p className="text-xs text-slate-600">
                  Wait for the green <span className="font-semibold text-emerald-700">"Entry allowed"</span> confirmation sound and collect your food.
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

      {/* Attendance History Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Attendance history</h2>
            <p className="text-xs text-slate-500">Your recent verified mess entries at Patel Mess</p>
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
                        Patel Mess Counter
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
