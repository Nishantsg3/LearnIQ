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
        setTests(mainTests);
      } catch (err) {
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
    <div className="h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar p-10">
      <div className="animate-in fade-in duration-700 space-y-12">
        
        {/* HEADER CLUSTER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 border-b border-white/5 pb-10">
          <div className="flex items-center gap-6">
              <div className={`p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 shadow-2xl ${mode === 'ANALYTICS' ? 'text-indigo-400' : 'text-amber-400'}`}>
                  {mode === 'ANALYTICS' ? <BarChart2 size={28} /> : <Award size={28} />}
              </div>
              <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tight italic leading-none">
                      {mode === 'ANALYTICS' ? 'Performance Analytics' : 'Merit Rankings'}
                  </h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">
                      Audit assessment {mode === 'ANALYTICS' ? 'telemetry' : 'rankings'} • Select cluster to proceed
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-6">
              <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                  <input 
                      type="text" 
                      placeholder="SEARCH CLUSTERS..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-[#0d0d12] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-indigo-500/50 transition-all w-full md:w-80 placeholder:text-white/10 shadow-2xl"
                  />
              </div>
              <BackToDashboard />
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-20">
          {filteredTests.map(test => (
            <div 
              key={test.id} 
              className="bg-[#0d0d12] border border-white/[0.03] rounded-[3rem] p-10 flex flex-col hover:border-white/10 hover:bg-[#12121a] group transition-all duration-500 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500/[0.03] blur-[80px] group-hover:bg-indigo-500/[0.06] transition-all duration-700"></div>

              <div className="flex justify-between items-start mb-10 relative z-10">
                 <div className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">
                    {test?.category || "General"}
                 </div>
                 {test?.archived && (
                   <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-lg">
                     ARCHIVED
                   </span>
                 )}
              </div>

              <div className="flex-1 relative z-10 mb-10">
                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-indigo-400 transition-all duration-300 italic">{test?.title || "Untitled Assessment"}</h3>
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.02] rounded-lg">
                    <Clock size={12} className="text-indigo-500/40" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{test?.durationMinutes ?? 0}M</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.02] rounded-lg">
                    <FileText size={12} className="text-indigo-500/40" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{test?.questionCount ?? 0}Q</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 relative z-10">
                 {mode === 'ANALYTICS' ? (
                   <button 
                     onClick={() => navigate(`/admin/tests/${test.id}/analytics`)}
                     className="w-full py-5 bg-white/5 hover:bg-indigo-600 text-white/40 hover:text-white border border-white/5 hover:border-indigo-500/50 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-4 group/btn"
                   >
                     <BarChart2 size={16} className="text-white/10 group-hover/btn:text-white transition-colors" />
                     Audit Reports
                   </button>
                 ) : (
                   <button 
                     onClick={() => navigate(`/admin/tests/${test.id}/leaderboard`)}
                     className="w-full py-5 bg-white/5 hover:bg-amber-600 text-white/40 hover:text-white border border-white/5 hover:border-amber-500/50 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-4 group/btn"
                   >
                     <Award size={16} className="text-white/10 group-hover/btn:text-white transition-colors" />
                     Merit Rankings
                   </button>
                 )}
              </div>
            </div>
          ))}

          {filteredTests.length === 0 && (
            <div className="col-span-full py-40 bg-[#0d0d12] border border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center text-center space-y-8 animate-pulse">
                <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] flex items-center justify-center border border-white/5 shadow-2xl">
                  <AlertCircle size={32} className="text-slate-800" />
                </div>
                <div className="space-y-4">
                  <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em]">Zero matches detected</p>
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">Refine search parameters or classification sectors</p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReportList;
