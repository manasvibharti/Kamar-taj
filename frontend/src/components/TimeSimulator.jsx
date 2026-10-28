import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { getSimulatedTime, setSimulatedTime } from '../utils/api.js';

export default function TimeSimulator({ onTimeChange }) {
  const [activeTime, setActiveTime] = useState(getSimulatedTime() || 'real');
  const [isExpanded, setIsExpanded] = useState(false);

  const presets = [
    { label: 'Real System Clock', value: 'real', desc: 'Default local time' },
    { label: 'Breakfast Slot', value: '08:30:00', desc: '07:30 - 09:30' },
    { label: 'Lunch Slot', value: '13:00:00', desc: '12:30 - 14:30' },
    { label: 'Dinner Slot', value: '20:00:00', desc: '19:30 - 21:30' },
    { label: 'Off-hours (Wrong time test)', value: '16:00:00', desc: 'Outside meal windows' },
  ];

  const handleSelect = (val) => {
    setActiveTime(val);
    if (val === 'real') {
      setSimulatedTime(null);
    } else {
      setSimulatedTime(val);
    }
    if (onTimeChange) onTimeChange(val);
  };

  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs px-4 py-1.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Testing Mode / Time Simulator:
          </span>
          <span className="text-slate-400 font-mono">
            {activeTime === 'real' ? 'Real Time Active' : `Simulated: ${activeTime}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {presets.map((preset) => {
            const isSelected = activeTime === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => handleSelect(preset.value)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={preset.desc}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

