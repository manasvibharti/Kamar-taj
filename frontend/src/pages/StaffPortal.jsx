import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Users, 
  Utensils, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import QRScannerView from '../components/QRScannerView.jsx';
import { api } from '../utils/api.js';

export default function StaffPortal({ user, simulatedTime }) {
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [mealStats, setMealStats] = useState([]);
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split('T')[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play audio tone on success / failure
  const playFeedbackAudio = (isSuccess) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(160, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // Audio context may require prior user interaction
    }
  };

  const fetchStatsAndRecent = async () => {
    try {
      const [statsRes, scansRes] = await Promise.all([
        api.getTodayMealStats(),
        api.getRecentScans()
      ]);
      setMealStats(statsRes.stats || []);
      setTodayDate(statsRes.date || new Date().toISOString().split('T')[0]);
      setRecentScans(scansRes.scans || []);
    } catch (err) {
      console.error('Error fetching staff dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchStatsAndRecent();
    const interval = setInterval(fetchStatsAndRecent, 10000);
    return () => clearInterval(interval);
  }, [simulatedTime]);

  const handleScan = async (tokenString) => {
    if (isProcessing || isPaused) return;

    setIsProcessing(true);
    setIsPaused(true);

    try {
      const res = await api.scanQr(tokenString);
      setScanResult({
        type: 'SUCCESS',
        title: 'Entry allowed',
        student: res.student,
        meal: res.meal,
        entry: res.entry,
        timestamp: new Date().toLocaleTimeString()
      });
      playFeedbackAudio(true);
      fetchStatsAndRecent();
    } catch (err) {
      const status = err.data?.status || 'Invalid QR';
      const errorMessage = err.data?.error || err.message || 'Verification failed';
      setScanResult({
        type: 'ERROR',
        status: status, // "Already eaten", "Invalid QR", "Expired QR", "Wrong meal time"
        message: errorMessage,
        student: err.data?.student,
        meal: err.data?.meal,
        timestamp: new Date().toLocaleTimeString()
      });
      playFeedbackAudio(false);
      fetchStatsAndRecent();
    } finally {
      setIsProcessing(false);
      // Pause for 2 seconds after each scan as requested
      setTimeout(() => {
        setIsPaused(false);
      }, 2000);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Mess Counter Scanner
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              Staff Terminal
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Real-time validation for student dining entry and meal counting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatsAndRecent}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Today's Meal Scan Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {mealStats.map((meal) => (
          <div
            key={meal.meal_id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {meal.meal_name}
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {meal.total_scans || 0}
                <span className="text-xs font-normal text-slate-500 ml-1">students served</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                Window: {meal.start_time.slice(0, 5)} - {meal.end_time.slice(0, 5)}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Utensils className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Scanner & Result Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Camera Scanner (6 Cols) */}
        <div className="lg:col-span-6">
          <QRScannerView
            onScan={handleScan}
            isPaused={isPaused}
            disabled={isProcessing}
          />
        </div>

        {/* Right: Big Prominent Scan Result (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 min-h-[380px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Verification Output
                </span>
                {scanResult && (
                  <span className="text-[11px] font-mono text-slate-400">
                    Last scan: {scanResult.timestamp}
                  </span>
                )}
              </div>

              {/* Display Result based on state */}
              {!scanResult ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-sm mb-1">Waiting for next QR scan</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Point camera at student's rotating mess QR code, or paste token string below.
                  </p>
                </div>
              ) : scanResult.type === 'SUCCESS' ? (
                /* BIG GREEN RESULT */
                <div className="py-6 animate-fadeIn">
                  <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 text-center shadow-lg shadow-emerald-500/10">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-200">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-100/80 px-3 py-1 rounded-full">
                      Verified
                    </span>
                    <h2 className="text-3xl font-black text-emerald-800 tracking-tight mt-2 mb-1">
                      Entry allowed
                    </h2>
                    <p className="text-xs text-emerald-700 font-medium">
                      Attendance recorded in database
                    </p>

                    {/* Student Info Card */}
                    <div className="mt-5 bg-white rounded-xl p-4 text-left border border-emerald-200 shadow-sm">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium text-[11px]">Student Name:</span>
                          <p className="font-bold text-slate-900 text-sm">{scanResult.student?.name}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium text-[11px]">Roll Number:</span>
                          <p className="font-mono font-bold text-slate-900 text-sm">{scanResult.student?.roll_no}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium text-[11px]">Hostel / Room:</span>
                          <p className="font-semibold text-slate-700">{scanResult.student?.hostel}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium text-[11px]">Meal Approved:</span>
                          <p className="font-bold text-emerald-700 text-sm">{scanResult.meal?.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* BIG RED RESULT */
                <div className="py-6 animate-fadeIn">
                  <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-6 text-center shadow-lg shadow-rose-500/10">
                    <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-rose-200">
                      <XCircle className="w-10 h-10" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-100/80 px-3 py-1 rounded-full">
                      Access Denied
                    </span>
                    <h2 className="text-3xl font-black text-rose-800 tracking-tight mt-2 mb-1">
                      {scanResult.status}
                    </h2>
                    <p className="text-xs text-rose-700 font-medium px-2">
                      {scanResult.message}
                    </p>

                    {scanResult.student && (
                      <div className="mt-4 bg-white/80 rounded-xl p-3 border border-rose-200 text-xs text-slate-700 font-medium">
                        Student: <span className="font-bold text-slate-900">{scanResult.student.name}</span> ({scanResult.student.roll_no})
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Scanner status indicator */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                {isPaused ? 'Paused for 2 seconds' : 'Ready for next student'}
              </span>
              <span className="text-[11px] text-slate-400">
                Logged in as: <strong className="text-slate-700">{user?.name}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live List of the Last 10 Scans */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Live Scans History</h2>
            <p className="text-xs text-slate-500">Last 10 entry logs recorded at the counter</p>
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
            Auto-refreshing
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Meal</th>
                <th className="py-3 px-4">Hostel</th>
                <th className="py-3 px-4">Scanned By</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentScans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No scans recorded yet today.
                  </td>
                </tr>
              ) : (
                recentScans.map((scan) => {
                  const scanDate = new Date(scan.scanned_at || scan.date);
                  const timeFormatted = scanDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <tr key={scan.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">
                        {timeFormatted}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {scan.student_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700">
                        {scan.roll_no}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {scan.meal_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {scan.hostel}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {scan.scanned_by_name || 'Counter Staff'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Entry allowed
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

