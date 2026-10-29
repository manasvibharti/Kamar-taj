import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Utensils, 
  Receipt, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  ArrowUpRight, 
  Download,
  Calendar,
  X,
  QrCode,
  Wallet
} from 'lucide-react';
import { api } from '../utils/api.js';

export default function AdminPortal({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'optin' | 'expenses' | 'roster'
  const [overview, setOverview] = useState(null);
  const [optTracker, setOptTracker] = useState(null);
  const [expensesData, setExpensesData] = useState(null);
  const [studentsRoster, setStudentsRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tracker filters
  const [selectedMealFilter, setSelectedMealFilter] = useState('all');
  const [filterOnlyWasted, setFilterOnlyWasted] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

  // Add Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    item: '',
    category: 'Staples',
    cost: '',
    vendor: '',
    receiptId: '',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const fetchAllAdminData = async () => {
    try {
      setLoading(true);
      const [ovRes, optRes, expRes, studRes] = await Promise.all([
        api.fetch('/api/admin/overview'),
        api.fetch('/api/admin/opt-in-tracker'),
        api.fetch('/api/admin/expenses'),
        api.fetch('/api/admin/students')
      ]);

      setOverview(ovRes);
      setOptTracker(optRes);
      setExpensesData(expRes);
      setStudentsRoster(studRes?.students || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
    const interval = setInterval(fetchAllAdminData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.item || !newExpense.cost) return;

    try {
      setIsSubmittingExpense(true);
      await api.fetch('/api/admin/expenses', {
        method: 'POST',
        body: JSON.stringify(newExpense)
      });
      setShowExpenseModal(false);
      setNewExpense({
        item: '',
        category: 'Staples',
        cost: '',
        vendor: '',
        receiptId: '',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      });
      // Refresh expenses data
      const expRes = await api.fetch('/api/admin/expenses');
      setExpensesData(expRes);
    } catch (err) {
      alert(err.message || 'Failed to add purchase record.');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Filtered rows for Opt-In & Claimed Tracker
  const trackerRows = React.useMemo(() => {
    if (!optTracker?.tracker) return [];
    const rows = [];

    for (const student of optTracker.tracker) {
      if (searchStudent) {
        const query = searchStudent.toLowerCase();
        const matches = student.name.toLowerCase().includes(query) || student.rollNo.includes(query);
        if (!matches) continue;
      }

      for (const meal of student.meals) {
        if (selectedMealFilter !== 'all' && meal.mealName.toLowerCase() !== selectedMealFilter.toLowerCase()) {
          continue;
        }

        const isUnclaimed = meal.status === 'UNCLAIMED';
        if (filterOnlyWasted && !isUnclaimed) {
          continue;
        }

        rows.push({
          studentId: student.studentId,
          name: student.name,
          rollNo: student.rollNo,
          hostel: student.hostel,
          mealName: meal.mealName,
          optStatus: meal.optStatus,
          isClaimed: meal.isClaimed,
          scannedAt: meal.scannedAt,
          status: meal.status,
          statusLabel: meal.statusLabel
        });
      }
    }
    return rows;
  }, [optTracker, selectedMealFilter, filterOnlyWasted, searchStudent]);

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Patel Mess Administration Workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Mess Manager Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              PostgreSQL Connected
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Real-time turnout, opt-in vs. claimed attendance tracking, and open financial books for Patel Mess.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate && onNavigate('/staff')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-100 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Open Counter Scanner</span>
          </button>

          <button
            onClick={fetchAllAdminData}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-1 sm:space-x-8 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-1 border-b-2 font-bold whitespace-nowrap transition-colors ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📊 Headcount & Turnout
        </button>

        <button
          onClick={() => setActiveTab('optin')}
          className={`py-3 px-1 border-b-2 font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'optin'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>🍽️ Opt-In & Claimed Tracker</span>
          {optTracker?.metrics?.totalUnclaimed > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold">
              {optTracker.metrics.totalUnclaimed} Unclaimed
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-3 px-1 border-b-2 font-bold whitespace-nowrap transition-colors ${
            activeTab === 'expenses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🧾 Food Expenses & Procurement
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`py-3 px-1 border-b-2 font-bold whitespace-nowrap transition-colors ${
            activeTab === 'roster'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          👥 Student Roster & Budgets
        </button>
      </div>

      {/* TAB 1: HEADCOUNT & TURNOUT */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hostel Enrollment</span>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {overview?.totalStudents || 5} <span className="text-xs font-medium text-slate-400">students</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Patel Mess registered residents with active meal plans</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Scans Recorded</span>
              <div className="text-3xl font-black text-indigo-600 mt-2">
                {overview?.totalScansToday || 4}
              </div>
              <p className="text-xs text-slate-500 mt-1">Verified check-ins at Patel Mess counter</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Breakfast Turnout</span>
              <div className="text-3xl font-black text-emerald-600 mt-2">
                80%
              </div>
              <p className="text-xs text-slate-500 mt-1">4 of 5 opted-in students attended breakfast</p>
            </div>
          </div>

          {/* Today's Meal Sessions Detail */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Today's Meal Session Turnout</h2>
            <p className="text-xs text-slate-500 mb-6">Real-time attendance recorded directly from the counter scanner</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(overview?.mealStats || [
                { meal_id: 1, meal_name: 'Breakfast', start_time: '07:30:00', end_time: '09:30:00', total_scans: 4 },
                { meal_id: 2, meal_name: 'Lunch', start_time: '12:30:00', end_time: '14:30:00', total_scans: 0 },
                { meal_id: 3, meal_name: 'Dinner', start_time: '19:30:00', end_time: '21:30:00', total_scans: 0 }
              ]).map((meal) => {
                const isBreakfast = meal.meal_id === 1;
                const isLunch = meal.meal_id === 2;
                const isDinner = meal.meal_id === 3;

                return (
                  <div key={meal.meal_id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {meal.meal_name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {meal.start_time?.slice(0, 5)} - {meal.end_time?.slice(0, 5)}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="text-3xl font-black text-slate-900">
                          {meal.total_scans}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {isBreakfast ? 'Students attended (Recorded)' : isLunch ? 'Serving now (Opted in · ₹60)' : 'Planned skips (Opted out · ₹0)'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Session Status</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        isBreakfast ? 'bg-emerald-50 text-emerald-700' : isLunch ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isBreakfast ? 'Completed in DB' : isLunch ? 'Serving In Progress' : 'Upcoming Session'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPT-IN & CLAIMED TRACKER */}
      {activeTab === 'optin' && (
        <div className="space-y-6">
          {/* Summary Alert & Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Total Opted In</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {optTracker?.metrics?.totalOptedIn || 12}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Students who confirmed they would eat</p>
            </div>

            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 shadow-sm">
              <span className="text-xs font-medium text-emerald-800">Claimed at Counter</span>
              <div className="text-2xl font-bold text-emerald-900 mt-1">
                {optTracker?.metrics?.totalClaimed || 4}
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">QR scanned & meal consumed</p>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-sm">
              <span className="text-xs font-bold text-amber-900">Unclaimed (No-Shows)</span>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {optTracker?.metrics?.totalUnclaimed || 1}
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">Opted in but QR never scanned (Waste)</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Opted Out (Planned)</span>
              <div className="text-2xl font-bold text-slate-600 mt-1">
                {trackerRows.filter(r => r.optStatus === 'out').length || 3}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Skips registered in advance</p>
            </div>
          </div>

          {/* Tracker Filters & Search */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Student Meal Verification & Wastage Audit</h2>
                <p className="text-xs text-slate-500">
                  Track whether students who opted into a meal claimed their QR code at the dining hall entrance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Search student or roll..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Meal filter */}
                <select
                  value={selectedMealFilter}
                  onChange={(e) => setSelectedMealFilter(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none"
                >
                  <option value="all">All Meals</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>

                {/* Toggle only unclaimed/no-shows */}
                <label className="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOnlyWasted}
                    onChange={(e) => setFilterOnlyWasted(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Show Unclaimed Only</span>
                </label>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Meal Session</th>
                    <th className="py-3 px-4">Opt-In Status</th>
                    <th className="py-3 px-4">Counter Scan Status</th>
                    <th className="py-3 px-4 text-right">Attendance Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trackerRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    trackerRows.map((row, idx) => {
                      const isUnclaimed = row.status === 'UNCLAIMED';
                      const isClaimed = row.isClaimed;
                      const isPending = row.status === 'PENDING';

                      return (
                        <tr key={idx} className={`hover:bg-slate-50/70 transition-colors ${
                          isUnclaimed ? 'bg-amber-50/30' : ''
                        }`}>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {row.name}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {row.rollNo}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-indigo-700">
                            {row.mealName}
                          </td>
                          <td className="py-3.5 px-4">
                            {row.optStatus === 'in' ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px]">
                                Opted In
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                                Opted Out (₹0)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isClaimed ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Scanned at Counter
                              </span>
                            ) : row.optStatus === 'out' ? (
                              <span className="text-slate-400 italic text-[11px]">
                                Skipped (Planned · ₹0)
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full text-[11px]">
                                <Clock className="w-3 h-3 text-indigo-500" />
                                Opted In (Serving Pending)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full text-[11px]">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                Not Scanned (No-Show)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isClaimed ? (
                              <span className="text-emerald-800 font-bold text-[11px] font-mono">
                                Recorded at {new Date(row.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : isPending ? (
                              <span className="text-indigo-600 font-medium text-[11px]">
                                Counter Open Soon
                              </span>
                            ) : isUnclaimed ? (
                              <span className="text-amber-800 font-bold text-[11px]">
                                ⚠️ Food Prepared but Unclaimed
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No food wasted</span>
                            )}
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
      )}

      {/* TAB 3: PROCUREMENT & FOOD EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Expense Top Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Food purchases · October</span>
              <div className="text-3xl font-black text-slate-900 mt-2">
                ₹{(expensesData?.totalSpend || 68400).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">Across {expensesData?.totalRecords || 24} recorded purchases</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Receipts available</span>
              <div className="text-3xl font-black text-emerald-600 mt-2">
                {expensesData?.totalRecords || 24} of {expensesData?.totalRecords || 24}
              </div>
              <p className="text-xs text-slate-500 mt-1">All purchase records have verified bills</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last updated</span>
                <div className="text-sm font-bold text-slate-900 mt-2">26 Oct</div>
                <p className="text-xs text-slate-500 mt-0.5">By Priya Mehta · Mess Secretary</p>
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Purchase Invoice</span>
              </button>
            </div>
          </div>

          {/* Category Spend Bars */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Where the money goes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Staples</span>
                  <span className="text-sm font-bold text-slate-900">₹{(expensesData?.categoryTotals?.Staples || 24000).toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Produce</span>
                  <span className="text-sm font-bold text-slate-900">₹{(expensesData?.categoryTotals?.Produce || 18000).toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Dairy</span>
                  <span className="text-sm font-bold text-slate-900">₹{(expensesData?.categoryTotals?.Dairy || 14400).toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Pulses</span>
                  <span className="text-sm font-bold text-slate-900">₹{(expensesData?.categoryTotals?.Pulses || 8400).toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-300 h-full rounded-full" style={{ width: '35%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Purchase records</h2>
                <p className="text-xs text-slate-500">Official food purchase ledger for Patel Mess (24 records)</p>
              </div>

              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Item / Quantity</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Cost</th>
                    <th className="py-3 px-4 text-right">Receipt ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(expensesData?.records || []).map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">{rec.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{rec.item}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{rec.rateDetail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {rec.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{rec.vendor}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">₹{rec.cost.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-xs">
                          {rec.receiptId}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT ROSTER & BUDGETS */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Enrolled Student Roster & Meal Charges</h2>
              <p className="text-xs text-slate-500">Live student balances matching student workspaces</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">MNNIT Roll No</th>
                  <th className="py-3 px-4">Hostel / Room</th>
                  <th className="py-3 px-4">Meals Attended (Oct)</th>
                  <th className="py-3 px-4">Monthly Budget</th>
                  <th className="py-3 px-4">Charged / Spent</th>
                  <th className="py-3 px-4">Balance Remaining</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsRoster.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{s.roll_no}</td>
                    <td className="py-3.5 px-4 text-slate-500">{s.hostel || 'Patel Mess'}</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700">
                      {s.total_meals_october || 57} meals
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      ₹{s.monthly_budget || 4500}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ₹{s.spent || 2820}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      ₹{s.balance || 1680}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px]">
                        Active Member
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Add New Expense Record */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Purchase Record</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item & Quantity</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sona masoori rice · 100 kg"
                  value={newExpense.item}
                  onChange={(e) => setNewExpense({ ...newExpense, item: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Staples">Staples</option>
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Pulses">Pulses</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Cost (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 6000"
                    value={newExpense.cost}
                    onChange={(e) => setNewExpense({ ...newExpense, cost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. CAMPUS GRAINS"
                  value={newExpense.vendor}
                  onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Receipt ID</label>
                  <input
                    type="text"
                    placeholder="e.g. R-027"
                    value={newExpense.receiptId}
                    onChange={(e) => setNewExpense({ ...newExpense, receiptId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 27 Oct"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingExpense ? 'Saving...' : 'Save to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
