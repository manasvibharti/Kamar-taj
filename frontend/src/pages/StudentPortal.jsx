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
  AlertTriangle,
  QrCode,
  ArrowUpRight,
  Download,
  Search,
  Filter,
  FileText,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { api } from '../utils/api.js';

// Predefined Refectory Menus & Prices for Patel Mess
const MEAL_DETAILS = {
  1: {
    amount: 50,
    menu: 'Poha, banana & masala chai',
    cutoffHours: 3,
    cutoffTime: '04:30',
  },
  2: {
    amount: 60,
    menu: 'Rajma, steamed rice, roti & salad',
    cutoffHours: 3,
    cutoffTime: '09:30',
  },
  3: {
    amount: 70,
    menu: 'Aloo gobi, dal tadka & roti',
    cutoffHours: 3,
    cutoffTime: '16:30',
  },
};


const PURCHASE_RECORDS = [
  // STAPLES (Total: ₹24,000)
  { id: 1, date: '26 Oct', item: 'Sona masoori rice · 100 kg', category: 'Staples', cost: 6000, receiptId: 'R-026', vendor: 'CAMPUS GRAINS', rateDetail: '100 kg × ₹60 / kg' },
  { id: 2, date: '23 Oct', item: 'Atta (Whole wheat) · 100 kg', category: 'Staples', cost: 3800, receiptId: 'R-020', vendor: 'CAMPUS GRAINS', rateDetail: '100 kg × ₹38 / kg' },
  { id: 3, date: '20 Oct', item: 'Refined oil & Desi ghee · 45 L', category: 'Staples', cost: 7800, receiptId: 'R-017', vendor: 'PATANJALI DISTRIBUTORS', rateDetail: '45 L × ₹173.3 / L' },
  { id: 4, date: '16 Oct', item: 'Basmati & Parboiled rice · 80 kg', category: 'Staples', cost: 5200, receiptId: 'R-013', vendor: 'CAMPUS GRAINS', rateDetail: '80 kg × ₹65 / kg' },
  { id: 5, date: '11 Oct', item: 'Suji & Poha flakes · 50 kg', category: 'Staples', cost: 2200, receiptId: 'R-008', vendor: 'ALLAHABAD GRAIN TRADERS', rateDetail: '50 kg × ₹44 / kg' },
  { id: 6, date: '05 Oct', item: 'Mustard oil & iodized salt · 20 L', category: 'Staples', cost: 2600, receiptId: 'R-003', vendor: 'PATANJALI DISTRIBUTORS', rateDetail: '20 L × ₹130 / L' },

  // PRODUCE (Total: ₹18,000)
  { id: 7, date: '26 Oct', item: 'Seasonal vegetables · 60 kg', category: 'Produce', cost: 2460, receiptId: 'R-025', vendor: 'KVK FARM FRESH', rateDetail: '60 kg × ₹41 / kg' },
  { id: 8, date: '24 Oct', item: 'Bananas & Seasonal fruits · 30 kg', category: 'Produce', cost: 1800, receiptId: 'R-022', vendor: 'CITY FRESH FRUITS', rateDetail: '30 kg × ₹60 / kg' },
  { id: 9, date: '22 Oct', item: 'Potatoes & Onions · 80 kg', category: 'Produce', cost: 2200, receiptId: 'R-019', vendor: 'KVK FARM FRESH', rateDetail: '80 kg × ₹27.5 / kg' },
  { id: 10, date: '19 Oct', item: 'Tomatoes & Green chilies · 40 kg', category: 'Produce', cost: 1940, receiptId: 'R-016', vendor: 'KVK FARM FRESH', rateDetail: '40 kg × ₹48.5 / kg' },
  { id: 11, date: '15 Oct', item: 'Bottle gourd & Spinach · 55 kg', category: 'Produce', cost: 2100, receiptId: 'R-012', vendor: 'MANDI SUPPLIERS', rateDetail: '55 kg × ₹38.2 / kg' },
  { id: 12, date: '12 Oct', item: 'Fresh Apples & Papaya · 35 kg', category: 'Produce', cost: 2450, receiptId: 'R-009', vendor: 'CITY FRESH FRUITS', rateDetail: '35 kg × ₹70 / kg' },
  { id: 13, date: '08 Oct', item: 'Potatoes & Cauliflower · 75 kg', category: 'Produce', cost: 2550, receiptId: 'R-006', vendor: 'KVK FARM FRESH', rateDetail: '75 kg × ₹34 / kg' },
  { id: 14, date: '04 Oct', item: 'Coriander, Mint & Ginger · 25 kg', category: 'Produce', cost: 1000, receiptId: 'R-004', vendor: 'MANDI SUPPLIERS', rateDetail: '25 kg × ₹40 / kg' },
  { id: 15, date: '02 Oct', item: 'Green peas & Fresh Carrots · 30 kg', category: 'Produce', cost: 1500, receiptId: 'R-001', vendor: 'MANDI SUPPLIERS', rateDetail: '30 kg × ₹50 / kg' },

  // DAIRY (Total: ₹14,400)
  { id: 16, date: '25 Oct', item: 'Fresh Malai Paneer · 12 kg', category: 'Dairy', cost: 3600, receiptId: 'R-024', vendor: 'AMUL DAIRY SUPPLY', rateDetail: '12 kg × ₹300 / kg' },
  { id: 17, date: '23 Oct', item: 'Full cream cow milk · 80 L', category: 'Dairy', cost: 4800, receiptId: 'R-021', vendor: 'AMUL DAIRY SUPPLY', rateDetail: '80 L × ₹60 / L' },
  { id: 18, date: '18 Oct', item: 'Fresh Paneer block · 10 kg', category: 'Dairy', cost: 3000, receiptId: 'R-015', vendor: 'AMUL DAIRY SUPPLY', rateDetail: '10 kg × ₹300 / kg' },
  { id: 19, date: '13 Oct', item: 'Fresh Dahi / Curd · 30 kg', category: 'Dairy', cost: 1800, receiptId: 'R-010', vendor: 'MOTHER DAIRY', rateDetail: '30 kg × ₹60 / kg' },
  { id: 20, date: '06 Oct', item: 'Cooking Butter & Chaas · 20 kg', category: 'Dairy', cost: 1200, receiptId: 'R-005', vendor: 'AMUL DAIRY SUPPLY', rateDetail: '20 kg × ₹60 / kg' },

  // PULSES (Total: ₹8,400)
  { id: 21, date: '24 Oct', item: 'Toor dal (Arhar) · 20 kg', category: 'Pulses', cost: 2100, receiptId: 'R-023', vendor: 'ALLAHABAD GRAIN TRADERS', rateDetail: '20 kg × ₹105 / kg' },
  { id: 22, date: '21 Oct', item: 'Yellow Moong & Chana dal · 25 kg', category: 'Pulses', cost: 2650, receiptId: 'R-018', vendor: 'ALLAHABAD GRAIN TRADERS', rateDetail: '25 kg × ₹106 / kg' },
  { id: 23, date: '16 Oct', item: 'Kabuli Chhole & Rajma · 20 kg', category: 'Pulses', cost: 2000, receiptId: 'R-014', vendor: 'ALLAHABAD GRAIN TRADERS', rateDetail: '20 kg × ₹100 / kg' },
  { id: 24, date: '07 Oct', item: 'Urad & Masoor dal · 15 kg', category: 'Pulses', cost: 1650, receiptId: 'R-007', vendor: 'ALLAHABAD GRAIN TRADERS', rateDetail: '15 kg × ₹110 / kg' }
];

const DAILY_CHARGES = [
  { date: '26 Oct 2026', breakfast: '₹30', lunch: 'Pending', dinner: 'Opted out', extras: '—', total: '₹30' },
  { date: '25 Oct 2026', breakfast: '₹30', lunch: '₹60', dinner: '₹60', extras: '—', total: '₹150' },
  { date: '24 Oct 2026', breakfast: '₹30', lunch: 'Opted out', dinner: '₹60', extras: '—', total: '₹90' },
  { date: '23 Oct 2026', breakfast: '₹30', lunch: '₹60', dinner: '₹60', extras: '—', total: '₹150' },
  { date: '22 Oct 2026', breakfast: '₹30', lunch: '₹60', dinner: '₹60', extras: '—', total: '₹150' },
  { date: '21 Oct 2026', breakfast: '₹30', lunch: '₹60', dinner: 'Opted out', extras: '—', total: '₹90' },
  { date: '20 Oct 2026', breakfast: '₹30', lunch: '₹60', dinner: '₹60', extras: '—', total: '₹150' },
  { date: '19 Oct 2026', breakfast: '₹30', lunch: '₹60', dinner: '₹60', extras: '—', total: '₹150' },
  { date: '18 Oct 2026', breakfast: '₹30', lunch: 'Opted out', dinner: '₹60', extras: '—', total: '₹90' },
  { date: '17 Oct 2026', breakfast: '₹30', lunch: '₹60', dinner: '₹60', extras: '—', total: '₹150' },
  { date: '16 Oct 2026', breakfast: '₹30', lunch: '₹60', dinner: '₹60', extras: '—', total: '₹150' },
];

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
    const [selectedExpenseCategory, setSelectedExpenseCategory] = useState('All');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState({
    id: 1,
    date: '26 Oct',
    item: 'Rice · 100 kg',
    category: 'Staples',
    cost: 6000,
    receiptId: 'R-026',
    vendor: 'CAMPUS GRAINS',
    rateDetail: '100 kg × ₹60 / kg'
  });
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split('T')[0]);

  // Opt-in / Opt-out state (default: Breakfast & Lunch opted in, Dinner opted out to match mock)
  const storageKey = `kamar_taj_opt_status_${user?.email || user?.roll_no || 'student'}_${todayDate}`;
  const [optStatus, setOptStatus] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : { 1: 'in', 2: 'in', 3: 'out' };
    } catch {
      return { 1: 'in', 2: 'in', 3: 'out' };
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

      // Sync saved optStatus from server
      try {
        const optRes = await api.getOptStatus(data.date);
        if (optRes && optRes.optStatus) {
          setOptStatus(optRes.optStatus);
          try {
            localStorage.setItem(`kamar_taj_opt_status_${user?.email || user?.roll_no || 'student'}_${data.date}`, JSON.stringify(optRes.optStatus));
          } catch {}
        }
      } catch (err) {
        console.warn('Failed to load opt status from server:', err);
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
  const handleToggleOpt = async (mealId) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;

    const cutoff = checkCutoffStatus(meal);
    if (cutoff.isCutoffPassed) {
      alert(`Changes locked: The 3-hour cutoff (${cutoff.cutoffTimeStr}) for ${meal.name} has passed.`);
      return;
    }

    const current = optStatus[mealId] || 'in';
    const updatedVal = current === 'in' ? 'out' : 'in';
    const updated = { ...optStatus, [mealId]: updatedVal };
    setOptStatus(updated);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      await api.saveOptStatus(todayDate, updated);
    } catch (err) {
      console.warn('Failed to save opt status to server:', err);
    }
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

  // Fetch deterministic QR once per meal selection (screenshots work)
  useEffect(() => {
    if (!selectedMealId) return;
    fetchQrToken(selectedMealId);
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

  const isMealPast = (meal) => {
    if (!meal || !meal.end_time) return false;
    let currentMinutes = 0;
    if (simulatedTime) {
      const parts = simulatedTime.split(':');
      currentMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else {
      const now = new Date();
      currentMinutes = now.getHours() * 60 + now.getMinutes();
    }
    const [endH, endM] = meal.end_time.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    return currentMinutes > endMinutes;
  };

  const getMealRecordedTime = (meal) => {
    const entry = history.find(h => 
      (h.meal_name?.toLowerCase() === meal.name?.toLowerCase() || h.meal_id === meal.id) &&
      (h.date === todayDate || (h.scanned_at && h.scanned_at.startsWith(todayDate)))
    );
    if (entry && entry.scanned_at) {
      const d = new Date(entry.scanned_at);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return '8:12 AM';
  };

  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const formatH = (tStr) => {
      const [h, m] = tStr.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dispH = h % 12 === 0 ? 12 : h % 12;
      const dispM = m < 10 ? `0${m}` : m;
      return { str: `${dispH}:${dispM}`, ampm };
    };
    const start = formatH(startTime);
    const end = formatH(endTime);
    if (start.ampm === end.ampm) {
      return `${start.str} - ${end.str} ${end.ampm}`;
    }
    return `${start.str} ${start.ampm} - ${end.str} ${end.ampm}`;
  };

  const renderMealStatusPill = (meal) => {
    const isOptedOut = optStatus[meal.id] === 'out';
    const hasEaten = meal.has_eaten;
    const isPast = isMealPast(meal);

    // 1. Opted out
    if (isOptedOut) {
      return (
        <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200/60 px-3 py-1 rounded-full">
          Opted out · ₹0
        </span>
      );
    }

    // 2. Claimed / Scanned
    if (hasEaten) {
      const timeStr = getMealRecordedTime(meal);
      return (
        <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
          Recorded · {timeStr}
        </span>
      );
    }

    // 3. Opted in, but window passed without scan -> Unclaimed!
    if (isPast) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          Unclaimed · Not scanned
        </span>
      );
    }

    // 4. Opted in & Active or Upcoming
    const detail = MEAL_DETAILS[meal.id] || { amount: 60 };
    return (
      <span className="inline-flex items-center text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
        Opted in · ₹{detail.amount}
      </span>
    );
  };

  // -------------------------------------------------------------
  // VIEW 1: DASHBOARD
  // -------------------------------------------------------------
  if (activeTab === 'dashboard') {
    const optedInMeals = meals.filter(m => optStatus[m.id] !== 'out');
    const mealPlanSubtitle = optedInMeals.length > 0 
      ? `${optedInMeals.map(m => m.name.toLowerCase()).join(' & ')} opted in`
      : 'All meals opted out today';

    return (
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              A good day starts with a good meal.
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, {user?.name?.split(' ')[0] || 'Aarav'}. Here's what's happening at Patel Mess today.
            </p>
          </div>
          <div>
            <button
              onClick={() => onTabChange && onTabChange('qr')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>View my QR</span>
            </button>
          </div>
        </div>

        {/* Top 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Today's meal plan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Today's meal plan</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {optedInMeals.length} of {meals.length || 3} meals
            </div>
            <p className="text-xs text-slate-500 mt-1 capitalize">
              {mealPlanSubtitle}
            </p>
          </div>

          {/* Card 2: Attendance this month */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Attendance this month</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              57 meals
            </div>
            <p className="text-xs text-slate-500 mt-1">
              20 breakfasts · 19 lunches · 18 dinners
            </p>
          </div>

          {/* Card 3: October budget left */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-medium text-slate-500">October budget left</span>
            <div className="text-2xl font-bold text-indigo-600 mt-2">
              ₹1,680
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ₹2,820 spent of ₹4,500
            </p>
          </div>
        </div>

        {/* Middle Section: On the menu today & Your October budget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: On the menu today (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">On the menu today</h2>
                <button
                  onClick={() => onTabChange && onTabChange('opt-in-out')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Manage meals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Meal Rows */}
              <div className="divide-y divide-slate-100">
                {meals.map((meal) => {
                  const Icon = getMealIcon(meal.name);
                  const detail = MEAL_DETAILS[meal.id] || { amount: 60, menu: 'Wholesome balanced meal' };
                  const timingStr = formatTimeRange(meal.start_time, meal.end_time);

                  return (
                    <div key={meal.id} className="py-4 first:pt-0 last:pb-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-slate-900">{meal.name}</span>
                            <span className="text-xs text-slate-400 font-normal">{timingStr}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {detail.menu}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {renderMealStatusPill(meal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Banner at bottom of menu card */}
            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                {activeMealSession 
                  ? `${activeMealSession.name} is being served. Show your current QR at the counter.`
                  : 'Lunch is being served. Show your current QR at the counter.'}
              </span>
            </div>
          </div>

          {/* Right: Your October budget (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Your October budget</h2>
                <Wallet className="w-4 h-4 text-indigo-600" />
              </div>

              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">₹1,680</div>
                <p className="text-xs text-slate-500 mt-1">remaining of ₹4,500</p>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '63%' }} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>63% spent</span>
                  <span>5 days left</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mt-6">
                Only opted-in meals are charged. Special meal extras are listed separately.
              </p>
            </div>

            <button
              onClick={() => onTabChange && onTabChange('budget')}
              className="mt-6 w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>See budget breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Section: Your mess, at a glance (2 wide cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Where your food money goes</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Open-book mess accounting. Review all 24 verified grocery, produce, and dairy invoices for October.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">₹68,400 across 24 receipts</span>
              <button
                onClick={() => onTabChange && onTabChange('expenses')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View purchases</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">How was your last meal?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Rate breakfast, lunch, or dinner taste, hygiene, and counter service to guide kitchen preparations.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Patel Mess Committee</span>
              <button
                onClick={() => onTabChange && onTabChange('feedback')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Share meal feedback</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // VIEW: MEAL BUDGET (activeTab === 'budget')
  // -------------------------------------------------------------
  if (activeTab === 'budget') {
    return (
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Every meal, accounted for.
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              A clear view of your October allowance and the meals charged to it.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
              <span>October 2026</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Monthly meal budget</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ₹4,500
            </div>
            <p className="text-xs text-slate-400 mt-1">
              1 – 31 October 2026
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Consumed / spent</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ₹2,820
            </div>
            <p className="text-xs text-slate-400 mt-1">
              57 meals charged so far
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Remaining balance</span>
            <div className="text-2xl font-bold text-indigo-600 mt-2">
              ₹1,680
            </div>
            <p className="text-xs text-slate-400 mt-1">
              37.3% of your budget available
            </p>
          </div>
        </div>

        {/* Middle Section: October at a glance & Budget note */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">October at a glance</h2>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-slate-700">₹2,820 spent</span>
                  <span className="text-indigo-600">₹1,680 available</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '62.7%' }} />
              </div>

              {/* 3 Stats: Breakfasts, Lunches, Dinners */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">20</div>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">Breakfasts</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">₹30 × 20 = ₹600</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">19</div>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">Lunches</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">₹60 × 19 = ₹1,140</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">18</div>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">Dinners</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">₹60 × 18 = ₹1,080</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#f8f9ff] rounded-2xl border border-indigo-100/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider mb-3">
                Budget note
              </span>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                No surprises on your plate.
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Charges appear after each meal session. Today's Lunch (₹60) is still pending and isn't in your spent total.
              </p>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-indigo-100/60">
              Only opted-in meals are charged to your monthly ledger.
            </p>
          </div>
        </div>

        {/* Daily meal charges Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-900">Daily meal charges</h2>
            <button
              onClick={() => alert('Statement for October 2026 downloaded.')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <span>Download statement</span>
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">DATE</th>
                  <th className="py-3 px-3">BREAKFAST</th>
                  <th className="py-3 px-3">LUNCH</th>
                  <th className="py-3 px-3">DINNER</th>
                  <th className="py-3 px-3">EXTRAS</th>
                  <th className="py-3 px-3 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAILY_CHARGES.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3 font-medium text-slate-700">{row.date}</td>
                    <td className="py-3.5 px-3">
                      {row.breakfast === 'Opted out' ? (
                        <span className="text-slate-400 font-medium">Opted out</span>
                      ) : row.breakfast === 'Pending' ? (
                        <span className="text-amber-600 font-medium">Pending</span>
                      ) : (
                        <span className="font-medium text-slate-800">{row.breakfast}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {row.lunch === 'Opted out' ? (
                        <span className="text-slate-400 font-medium">Opted out</span>
                      ) : row.lunch === 'Pending' ? (
                        <span className="text-amber-600 font-medium">Pending</span>
                      ) : (
                        <span className="font-medium text-slate-800">{row.lunch}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {row.dinner === 'Opted out' ? (
                        <span className="text-slate-400 font-medium">Opted out</span>
                      ) : row.dinner === 'Pending' ? (
                        <span className="text-amber-600 font-medium">Pending</span>
                      ) : (
                        <span className="font-medium text-slate-800">{row.dinner}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">{row.extras}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: FOOD EXPENSES (activeTab === 'expenses')
  // -------------------------------------------------------------
  if (activeTab === 'expenses') {
    const filteredPurchases = PURCHASE_RECORDS.filter(p => {
      const matchCat = selectedExpenseCategory === 'All' || p.category === selectedExpenseCategory;
      const matchQuery = !expenseSearchQuery || 
        p.item.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
        p.vendor.toLowerCase().includes(expenseSearchQuery.toLowerCase());
      return matchCat && matchQuery;
    });

    return (
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Good food. Open books.
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              See what your mess managers buy, what it costs, and the receipts behind it.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
              <span>October 2026</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Food purchases · October</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ₹68,400
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Across 24 recorded purchases
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Receipts available</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              24 of 24
            </div>
            <p className="text-xs text-slate-400 mt-1">
              All purchase records have receipts
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Last updated</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              26 Oct
            </div>
            <p className="text-xs text-slate-400 mt-1">
              By Priya Mehta · Mess Secretary
            </p>
          </div>
        </div>

        {/* Where the money goes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Where the money goes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600">Staples</span>
                <span className="text-sm font-bold text-slate-900">₹24,000</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600">Produce</span>
                <span className="text-sm font-bold text-slate-900">₹18,000</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600">Dairy</span>
                <span className="text-sm font-bold text-slate-900">₹14,400</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600">Pulses</span>
                <span className="text-sm font-bold text-slate-900">₹8,400</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-300 h-full rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Purchase records & Receipt Preview (8 cols & 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Purchase records Table (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Purchase records</h2>
              <button
                onClick={() => alert('All 24 purchases exported as CSV.')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <span>Export</span>
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
              <div className="relative w-full sm:w-44">
                <select
                  value={selectedExpenseCategory}
                  onChange={(e) => setSelectedExpenseCategory(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All categories</option>
                  <option value="Staples">Staples</option>
                  <option value="Produce">Produce</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Pulses">Pulses</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>

              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search purchases"
                  value={expenseSearchQuery}
                  onChange={(e) => setExpenseSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">DATE</th>
                    <th className="py-2.5 px-3">ITEM / QUANTITY</th>
                    <th className="py-2.5 px-3">COST</th>
                    <th className="py-2.5 px-3 text-right">RECEIPT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.map((p) => {
                    const isSelected = selectedReceipt?.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedReceipt(p)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">{p.date}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{p.item}</div>
                          <div className="text-[11px] text-slate-400">{p.category}</div>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">₹{p.cost.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 font-semibold text-xs ${
                            isSelected ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-indigo-600'
                          }`}>
                            <span>{p.receiptId}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Preview (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Receipt preview</h2>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {selectedReceipt?.receiptId || 'R-026'}
                </span>
              </div>

              {/* Physical Receipt Container */}
              <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 text-xs font-mono space-y-3">
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <div className="font-bold text-slate-900 text-sm tracking-wider">
                    {selectedReceipt?.vendor || 'CAMPUS GRAINS'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Food supplies · Patel Mess
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">
                    ILLUSTRATIVE RECEIPT
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>Purchase date: <span className="text-slate-800 font-semibold">{selectedReceipt?.date || '26 Oct 2026'}</span></div>
                  <div>Reference: <span className="text-slate-800 font-semibold">DG-1026 · Patel Mess</span></div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{selectedReceipt?.item || 'Sona masoori rice'}</span>
                    <span>₹{selectedReceipt?.cost.toLocaleString('en-IN') || '6,000'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {selectedReceipt?.rateDetail || '100 kg × ₹60 / kg'}
                  </div>
                </div>

                <div className="pt-3 border-t border-dashed border-slate-300 flex items-center justify-between font-bold text-slate-900 text-sm">
                  <span>TOTAL PAID</span>
                  <span className="text-indigo-600">₹{selectedReceipt?.cost.toLocaleString('en-IN') || '6,000'}</span>
                </div>

                <div className="text-[10px] text-slate-500 pt-1">
                  Paid via bank transfer · No additional charges
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] text-emerald-700 font-sans font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recorded by Priya Mehta · {selectedReceipt?.date || '26 Oct'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3">
              <button
                onClick={() => alert(`Full digital tax invoice for ${selectedReceipt?.receiptId || 'R-026'} opened.`)}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open full receipt</span>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Sample records for transparency. Receipt previews are illustrative.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <p className="text-xs text-slate-500 leading-relaxed">
                  This meal is served between <span className="font-semibold text-slate-700">{currentMeal?.start_time.slice(0, 5)}</span> and <span className="font-semibold text-slate-700">{currentMeal?.end_time.slice(0, 5)}</span>.
                </p>
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

                {/* Single Daily Meal QR Badge */}
                <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-full shadow-sm text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Single-use daily meal QR • Screenshots accepted</span>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  Valid for this meal session • Scannable once • Deactivated immediately upon entry
                </p>

                {/* Student verification tag */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center text-xs">
                  <div className="text-slate-700 font-medium">
                    <span className="font-bold text-slate-900">{user?.name}</span> • Roll: <span className="font-mono font-semibold">{user?.roll_no}</span>
                  </div>
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
              Your attendance code is unique to you, this meal, and today. You can display it live or take a screenshot to show at the counter. Once scanned at the counter, your entry is locked and the QR cannot be reused by anyone.
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
