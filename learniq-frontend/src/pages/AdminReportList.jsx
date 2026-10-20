import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BarChart2, Award, Clock, FileText, AlertCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';
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
        
        // Sort tests by creation date descending
        mainTests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        
        // Fetch stats (totalAttempts & maxScore) for each test in parallel
        const testsWithStats = await Promise.all(
          mainTests.map(async (test) => {
            try {
              const statsRes = await api.get(`/admin/tests/${test.id}/analytics`);
              return {
                ...test,
                attemptsCount: statsRes.data.totalAttempts ?? 0,
                highestScore: statsRes.data.highestScore ?? 0,
              };
            } catch (err) {
              console.error(`Failed to load stats for test ${test.id}`, err);
              return {
                ...test,
                attemptsCount: 0,
                highestScore: 0,
              };
            }
          })
        );
        
        setTests(testsWithStats);
      } catch {
        toast.error('Failed to load assessment data');
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const filteredTests = tests.filter(t => 
    (t.title || "").toLowerCase().includes(search.toLowerCase()) || 
    (t.category || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />
      <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.4em]">Aggregating Infrastructure...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10">
      <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-12">
        
        {/* HEADER CLUSTER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-10 border-b border-white/5 pb-6 sm:pb-10">
          <div className="flex items-center gap-4 sm:gap-6">
              <div className={`p-3 sm:p-5 rounded-2xl sm:rounded-[1.5rem] bg-white/[0.03] border border-white/5 shadow-2xl ${mode === 'ANALYTICS' ? 'text-indigo-400' : 'text-amber-400'}`}>
                  {mode === 'ANALYTICS' ? <BarChart2 size={24} className="sm:w-7 sm:h-7" /> : <Award size={24} className="sm:w-7 sm:h-7" />}
              </div>
              <div>
                  <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight italic leading-none">
                      {mode === 'ANALYTICS' ? 'Performance Analytics' : 'Merit Rankings'}
                  </h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 sm:mt-3">
                      Audit assessment {mode === 'ANALYTICS' ? 'telemetry' : 'rankings'} • Select cluster to proceed
                  </p>
              </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 min-w-0 w-full md:w-auto">
              <div className="relative group w-full sm:w-[240px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={14} />
                  <input 
                      type="text" 
                      placeholder="Search..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-[#0d0d12] border border-white/5 rounded-full h-10 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-indigo-500/50 transition-all w-full placeholder:text-white/50 shadow-2xl"
                  />
              </div>
              <div className="flex items-center gap-2 min-w-0 shrink-0 self-end sm:self-auto">
                <BackToDashboard />
              </div>
          </div>
        </div>

        {/* LIST / TABLE VIEW */}
        {filteredTests.length === 0 ? (
          <div className="py-20 sm:py-40 bg-[#0d0d12] border border-dashed border-white/5 rounded-3xl sm:rounded-[4rem] flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 animate-pulse">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-white/[0.02] flex items-center justify-center border border-white/5 shadow-2xl">
                <AlertCircle size={32} className="text-slate-600" />
              </div>
              <div className="space-y-4">
                <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.5em]">Zero matches detected</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Refine search parameters or classification sectors</p>
              </div>
          </div>
        ) : (
          <div className="bg-[#0d0d12] border border-white/[0.03] rounded-[2rem] overflow-hidden shadow-2xl pb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assessment Name</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Highest Score</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Created Date</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {filteredTests.map(test => (
                    <tr 
                      key={test.id} 
                      className="hover:bg-white/[0.02] group transition-all duration-300"
                    >
                      {/* Assessment Name */}
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors duration-300 italic">
                            {test?.title || "Untitled Assessment"}
                          </span>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                              <Clock size={10} className="text-slate-400" />
                              {test?.durationMinutes ?? 0} M
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                              <FileText size={10} className="text-slate-400" />
                              {test?.questionCount ?? 0} Q
                            </span>
                            {test?.archived && (
                              <>
                                <span className="text-slate-500">•</span>
                                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-black uppercase tracking-widest rounded">
                                  ARCHIVED
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Category */}
                      <td className="px-8 py-6">
                        <span className="px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] group-hover:border-white/10 transition-colors">
                          {test?.category || "General"}
                        </span>
                      </td>
                      

                      
                      {/* Highest Score */}
                      <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400">
                          {test?.highestScore != null ? `${test.highestScore}%` : '0%'}
                        </span>
                      </td>
                      
                      {/* Created Date */}
                      <td className="px-8 py-6">
                        <span className="text-xs font-semibold text-slate-400">
                          {test?.createdAt ? new Date(test.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </span>
                      </td>
                      
                      {/* Action */}
                      <td className="px-8 py-6 text-right">
                        {mode === 'ANALYTICS' ? (
                          <button 
                            type="button"
                            onClick={() => navigate(`/admin/tests/${test.id}/analytics`)}
                            aria-label={`Audit reports for ${test?.title || 'assessment'}`}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                          >
                            <BarChart2 size={12} />
                            Audit Reports
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => navigate(`/admin/tests/${test.id}/leaderboard`)}
                            aria-label={`Merit rankings for ${test?.title || 'assessment'}`}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                          >
                            <Award size={12} />
                            Merit Rankings
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportList;
