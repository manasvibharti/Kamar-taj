import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ShieldCheck,
  UserCheck,
  Database
} from 'lucide-react';
import QRScannerView from '../components/QRScannerView.jsx';
import { api } from '../utils/api.js';

export default function StaffPortal({ user }) {
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const todayDate = new Date().toISOString().split('T')[0];

  const handleScan = async (tokenString) => {
    if (isProcessing || isPaused) return;

    setIsProcessing(true);
    setIsPaused(true);

    try {
      const res = await api.scanQr(tokenString);
      setScanResult({
        type: 'SUCCESS',
        title: 'Entry Allowed',
        student: res.student,
        meal: res.meal,
        entry: res.entry,
        timestamp: new Date().toLocaleTimeString(),
        dbStatus: 'Recorded in PostgreSQL (mess_entries)'
      });
    } catch (err) {
      const status = err.data?.status || 'Invalid QR';
      const errorMessage = err.data?.error || err.message || 'Verification failed';
      setScanResult({
        type: 'ERROR',
        status: status,
        title: status === 'Already eaten' ? 'Already claimed today' : status,
        message: status === 'Already eaten' 
          ? 'Automatic database verification rejected this QR: This student has already redeemed their single-use meal attendance today.' 
          : errorMessage,
        timestamp: new Date().toLocaleTimeString(),
        dbStatus: 'Database Unique Constraint Check Triggered'
      });
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
    <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Patel Mess Counter Staff Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Meal QR Scanner
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Dedicated scanner for counter entry. Automatic database validation prevents duplicate attendance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>PostgreSQL Active</span>
          </div>
        </div>
      </div>

      {/* Main Dedicated Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Camera Scanner Feed (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Camera Scanner Feed</h2>
              <p className="text-xs text-slate-500">
                Hold student QR (or screenshot) in front of the counter camera.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-700">Scanner Ready</span>
            </div>
          </div>

          <QRScannerView
            onScanSuccess={handleScan}
            isProcessing={isProcessing}
            isPaused={isPaused}
          />

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Terminal: Patel Mess Entrance Counter</span>
            <span className="font-mono text-slate-500">{todayDate}</span>
          </div>
        </div>

        {/* Right: Instant Database Verification Result (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 min-h-[380px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Database Verification
                </h2>
                {scanResult && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {scanResult.timestamp}
                  </span>
                )}
              </div>

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

                    <div className="mt-5 pt-3 border-t border-emerald-200 text-xs flex justify-between font-medium text-emerald-900">
                      <span>Meal: <strong className="font-bold">{scanResult.meal?.name}</strong></span>
                      <span>Status: <strong>Verified</strong></span>
                    </div>

                    <div className="mt-2 text-[11px] text-emerald-700 font-mono">
                      ✓ {scanResult.dbStatus}
                    </div>
                  </div>
                ) : (
                  /* Big Red Failure Card */
                  <div className="bg-rose-50 border-2 border-rose-500/80 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-rose-500 text-white mx-auto flex items-center justify-center mb-4 shadow-lg shadow-rose-200">
                      <XCircle className="w-10 h-10 stroke-[2.5]" />
                    </div>

                    <span className="text-xs font-extrabold uppercase tracking-widest text-rose-800 bg-rose-200/60 px-3 py-1 rounded-full">
                      {scanResult.status === 'Already eaten' ? 'Duplicate Rejected' : scanResult.status}
                    </span>

                    <h3 className="text-xl font-extrabold text-slate-900 mt-4 leading-snug">
                      {scanResult.title}
                    </h3>
                    <p className="text-xs text-rose-700 mt-2 font-medium leading-relaxed">
                      {scanResult.message}
                    </p>

                    <div className="mt-4 pt-3 border-t border-rose-200 text-[11px] text-rose-800 font-mono">
                      🔒 {scanResult.dbStatus}
                    </div>
                  </div>
                )
              ) : (
                /* Idle Waiting State */
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mb-3 shadow-sm">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Awaiting student QR</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Present student meal QR in front of the lens. Automatic database lookup executes immediately.
                  </p>
                </div>
              )}
            </div>

            {/* Next Student Scanner Reset */}
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
    </div>
  );
}
