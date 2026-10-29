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
        status: status,
        title: status === 'Already eaten' ? 'Already claimed today' : status,
        message: errorMessage,
        timestamp: new Date().toLocaleTimeString()
      });
      playFeedbackAudio(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetScanner = () => {
    setScanResult(null);
    setIsPaused(false);
    setIsProcessing(false);
  };

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2">
            <span>The Kamar-Taj Refectory</span> • <span>Patel Mess</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Patel Mess Counter Scanner
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              Staff Terminal
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Real-time validation for student dining entry and single-use QR attendance at Patel Mess.
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

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Camera Scanner Feed (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live Camera Scanner</h2>
              <p className="text-xs text-slate-500">
                Hold the student's dynamic QR code in front of the lens.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-700">Active</span>
            </div>
          </div>

          <QRScannerView
            onScanSuccess={handleScan}
            isProcessing={isProcessing}
            isPaused={isPaused}
          />

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Location: Patel Mess • Counter 1</span>
            <span className="font-mono">{todayDate}</span>
          </div>
        </div>

        {/* Right: Real-Time Feedback Result Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 min-h-[380px] flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                Scan Verification Result
              </h2>

              {scanResult ? (
                scanResult.type === 'SUCCESS' ? (
                  /* Big Green Success Card */
                  <div className="bg-emerald-50 border-2 border-emerald-500/80 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                      <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                    </div>

                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full">
                      Entry Allowed
                    </span>

                    <h3 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">
                      {scanResult.student?.name}
                    </h3>
                    <div className="text-sm font-mono font-bold text-indigo-700 mt-1">
                      Roll: {scanResult.student?.roll_no}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1">
                      {scanResult.student?.hostel || 'Patel Mess'}
                    </div>

                    <div className="mt-5 pt-4 border-t border-emerald-200 text-xs flex justify-between font-medium text-emerald-900">
                      <span>Meal: <strong className="font-bold">{scanResult.meal?.name}</strong></span>
                      <span>Time: <strong>{scanResult.timestamp}</strong></span>
                    </div>
                  </div>
                ) : (
                  /* Big Red Failure Card */
                  <div className="bg-rose-50 border-2 border-rose-500/80 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-rose-500 text-white mx-auto flex items-center justify-center mb-4 shadow-lg shadow-rose-200">
                      <XCircle className="w-10 h-10 stroke-[2.5]" />
                    </div>

                    <span className="text-xs font-extrabold uppercase tracking-widest text-rose-800 bg-rose-200/60 px-3 py-1 rounded-full">
                      {scanResult.status || 'Verification Failed'}
                    </span>

                    <h3 className="text-xl font-extrabold text-slate-900 mt-4 leading-snug">
                      {scanResult.title}
                    </h3>
                    <p className="text-xs text-rose-700 mt-2 font-medium leading-relaxed">
                      {scanResult.message}
                    </p>

                    <div className="mt-5 pt-4 border-t border-rose-200 text-xs text-slate-500">
                      Timestamp: {scanResult.timestamp}
                    </div>
                  </div>
                )
              ) : (
                /* Idle Waiting State */
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mb-3 shadow-sm">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Awaiting scan</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Point camera toward the student's phone. Results will appear here with audio tone.
                  </p>
                </div>
              )}
            </div>

            {/* Resume / Next Student Button */}
            {isPaused && (
              <button
                onClick={handleResetScanner}
                className="mt-4 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                <span>Ready for Next Student</span>
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Scans Real-time Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Terminal Scans</h2>
            <p className="text-xs text-slate-500">Live feed of verified check-ins at Patel Mess</p>
          </div>
          <button
            onClick={fetchStatsAndRecent}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Feed
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Hostel / Mess</th>
                <th className="py-3 px-4">Meal</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentScans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No students scanned today yet.
                  </td>
                </tr>
              ) : (
                recentScans.map((scan) => {
                  const scanTime = new Date(scan.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return (
                    <tr key={scan.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                        {scanTime}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {scan.student_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {scan.roll_no}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {scan.hostel || 'Patel Mess'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-700">
                        {scan.meal_name}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Entry
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
