import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BarChart2, Award, Clock, FileText, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { TableSkeleton } from '../components/common/Skeleton';
import toast from 'react-hot-toast';
import BackToDashboard from '../components/admin/BackToDashboard';

const AdminReportList = ({ mode = 'ANALYTICS' }) => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/tests');
        const data = Array.isArray(res.data) ? res.data : [];
        const mainTests = data.filter(t => t.testType?.toUpperCase() === 'MAIN');

        mainTests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const testsWithStats = await Promise.all(
          mainTests.map(async (test) => {
            try {
              const statsRes = await api.get(`/admin/tests/${test.id}/analytics`);
              return {
                ...test,
                attemptsCount: statsRes.data.totalAttempts ?? 0,
                highestScore: statsRes.data.highestScore ?? 0,
              };
            } catch {
              return {
                ...test,
                attemptsCount: 0,
                highestScore: 0,
              };
            }
          })
        );

        const eligibleTests = mode === 'LEADERBOARD'
          ? testsWithStats.filter(t => (t.attemptsCount || 0) > 0)
          : testsWithStats;

        setTests(eligibleTests);
      } catch {
        toast.error('Failed to load assessment data');
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, [mode]);

  const filteredTests = tests
    .filter(t => mode !== 'LEADERBOARD' || (t.attemptsCount || 0) > 0)
    .filter(t =>
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(search.toLowerCase())
    );


  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto flex flex-col space-y-6 animate-in fade-in duration-300 pb-16">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#262a33]">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-800/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-xs">
            {mode === 'ANALYTICS' ? <BarChart2 size={20} /> : <Award size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-md border border-violet-200 dark:border-violet-800/40 uppercase tracking-wider">
                Reports
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{mode === 'ANALYTICS' ? 'Analytics' : 'Rankings'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              {mode === 'ANALYTICS' ? 'Performance Analytics' : 'Leaderboards'}
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#151921] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500/80 dark:hover:border-violet-400/80 hover:shadow-md rounded-xl pl-9 pr-4 h-[44px] min-h-[44px] text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 shadow-xs transition-all duration-200"
            />
          </div>

          <BackToDashboard />
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : filteredTests.length === 0 ? (
        <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-12 text-center shadow-sm">
          <AlertCircle size={32} className="mx-auto mb-2 text-slate-400" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {search ? `No tests match "${search}"` : 'No main examinations registered.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] shadow-sm overflow-hidden flex flex-col">
          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[650px] text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-[#111317] border-b border-slate-200 dark:border-[#262a33] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Assessment Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-center">Top Score</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#262a33]">
                {filteredTests.map(test => (
                  <tr key={test.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1a1e26] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {test?.title || "Untitled Assessment"}
                        </span>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400 dark:text-slate-500" />
                            {test?.durationMinutes ?? 0} mins
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FileText size={12} className="text-slate-400 dark:text-slate-500" />
                            {test?.questionCount ?? 0} questions
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 dark:bg-[#1f232b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2f3542]">
                        {test?.category || "General"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 tabular-nums">
                        {test?.highestScore != null ? `${test.highestScore}%` : '0%'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {test?.createdAt ? new Date(test.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {mode === 'ANALYTICS' ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/tests/${test.id}/analytics`)}
                          className="px-3.5 py-1.5 min-h-[38px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 border border-violet-400/30 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <BarChart2 size={13} />
                          <span>Audit Telemetry</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/tests/${test.id}/leaderboard`)}
                          className="px-3.5 py-1.5 min-h-[38px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 border border-violet-400/30 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Award size={13} />
                          <span>View Leaderboard</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< md) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-[#262a33]">
            {filteredTests.map(test => (
              <div key={test.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                      {test?.title || "Untitled Assessment"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>{test?.durationMinutes ?? 0}m</span>
                      <span>•</span>
                      <span>{test?.questionCount ?? 0} questions</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 dark:bg-[#1f232b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2f3542] shrink-0">
                    {test?.category || "General"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Top Score: </span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                      {test?.highestScore != null ? `${test.highestScore}%` : '0%'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {test?.createdAt ? new Date(test.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-[#262a33]">
                  {mode === 'ANALYTICS' ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/tests/${test.id}/analytics`)}
                      className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 border border-violet-400/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <BarChart2 size={14} />
                      <span>Audit Telemetry</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/tests/${test.id}/leaderboard`)}
                      className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 border border-violet-400/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Award size={14} />
                      <span>View Leaderboard</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportList;
