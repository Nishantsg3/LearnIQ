import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { History, FileText, TrendingUp, ArrowUpRight, CheckCircle2, ChevronRight, Trash2, Zap, Trophy, Send } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true
  });
};

const isSubmitted = (a) => {
  if (!a) return false;
  return a.submitted === true 
      || a.status === 'SUBMITTED'
      || (a.scorePercent !== undefined && a.scorePercent !== null && a.scorePercent >= 0);
};

const ResultsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeType, setActiveType] = useState('MAIN');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [attemptsRes] = await Promise.all([
        api.get('/attempts/me')
      ]);
      setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
    } catch (err) {
      toast.error('Failed to load results history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAttempts = useMemo(() => {
    const sorted = [...attempts].sort((a, b) => {
        const t1 = new Date(a.submittedAt || a.startedAt).getTime();
        const t2 = new Date(b.submittedAt || b.startedAt).getTime();
        return t1 - t2;
    });

    const counts = {};
    const numbered = sorted.map(a => {
        counts[a.testId] = (counts[a.testId] || 0) + 1;
        return { ...a, attemptNumber: counts[a.testId] };
    });

    // Segment by activeType
    return numbered.reverse().filter(a => (a.testType || a.mode) === activeType);
  }, [attempts, activeType]);

  const handleDeleteTrigger = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
        await api.delete(`/attempts/${deletingId}`);
        toast.success('Attempt deleted');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
    } catch (err) {
        toast.error('Failed to delete attempt');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-white/5 border-t-violet-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Loading Ledger...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 min-h-0 bg-[#0d0d10]">
      <div className="h-full flex flex-col space-y-10 min-h-0">
        {/* HEADER */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div 
              onClick={() => navigate('/student/dashboard')}
              className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 cursor-pointer hover:bg-violet-500/20 transition-all shadow-[0_0_30px_rgba(124,58,237,0.1)]"
            >
              <History size={24} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Performance History</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Analysis Ledger & Performance Records</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
              {/* METALLIC SWITCH */}
              <div className="flex bg-[#0a0a0f] border border-white/5 p-1 rounded-2xl shrink-0 shadow-2xl">
                  <button 
                      onClick={() => setActiveType('PRACTICE')}
                      className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          activeType === 'PRACTICE' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-slate-500 hover:text-white'
                      }`}
                  >
                      Practice Test
                  </button>
                  <button 
                      onClick={() => setActiveType('MAIN')}
                      className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          activeType === 'MAIN' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-slate-500 hover:text-white'
                      }`}
                  >
                      Main Test
                  </button>
              </div>

              <button
                  onClick={() => navigate('/student/dashboard')}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-slate-400 hover:text-white group"
              >
                  <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
              </button>
          </div>
        </div>

        {/* CONTENT AREA - LIST FORMAT */}
        <div className="flex-1 min-h-0 bg-[#0d0d12]/50 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
          {/* LEDGER HEADER */}
          <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-white/[0.02] border-b border-white/5 shrink-0">
              <div className="col-span-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">Assessment Detail</div>
              <div className="col-span-2 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Status</div>
              <div className="col-span-2 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Score</div>
              <div className="col-span-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Actions</div>
          </div>

          {/* LEDGER BODY */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
              {filteredAttempts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                      <History size={40} className="text-white/5" />
                      <p className="text-[11px] text-slate-700 font-black uppercase tracking-widest">No {activeType.toLowerCase()} records found</p>
                  </div>
              ) : (
                  <div className="divide-y divide-white/5">
                      {filteredAttempts.map(attempt => (
                          <div 
                              key={attempt.id}
                              className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-white/[0.02] transition-colors group"
                          >
                              <div className="col-span-5 flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-violet-400 group-hover:border-violet-500/20 transition-all">
                                      <FileText size={18} />
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <h4 className="text-sm font-black text-white/90 uppercase tracking-tight group-hover:text-white transition-colors">
                                              {attempt.testTitle}
                                          </h4>
                                          <span className={`px-2 py-0.5 border text-[7px] font-black uppercase tracking-[0.2em] rounded ${
                                              activeType === 'MAIN' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                          }`}>
                                              {activeType} Assessment
                                          </span>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1">
                                          <span className="text-[8px] font-black text-violet-400/80 uppercase tracking-widest">Attempt #{attempt.attemptNumber}</span>
                                          <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{formatDateTime(attempt.submittedAt || attempt.startedAt)}</span>
                                      </div>
                                  </div>
                              </div>

                               <div className="col-span-2 flex justify-center">
                                  {isSubmitted(attempt) ? (
                                      <div className="flex items-center gap-2 text-emerald-500/80">
                                          <CheckCircle2 size={12} />
                                          <span className="text-[9px] font-black uppercase tracking-widest">Completed</span>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-2 text-amber-500/80 animate-pulse">
                                          <Zap size={12} />
                                          <span className="text-[9px] font-black uppercase tracking-widest">In Progress</span>
                                      </div>
                                  )}
                              </div>

                              <div className="col-span-2 flex justify-center">
                                  {isSubmitted(attempt) ? (
                                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-widest ${
                                          attempt.scorePercent >= 40 
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      }`}>
                                          {Math.round(attempt.scorePercent)}%
                                      </div>
                                  ) : (
                                      <span className="text-slate-700 text-[10px] font-black uppercase tracking-widest">—</span>
                                  )}
                              </div>

                              <div className="col-span-3 flex justify-end items-center gap-3">
                                  <button
                                      onClick={(e) => handleDeleteTrigger(e, attempt.id)}
                                      className="p-2.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 text-rose-500 rounded-xl transition-all"
                                      title="Delete Attempt"
                                  >
                                      <Trash2 size={14} />
                                  </button>
                                  <button
                                      onClick={() => navigate(`/results/${attempt.id}`)}
                                      className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-violet-500 hover:text-white hover:border-violet-400 transition-all group/btn"
                                  >
                                      View Report
                                      <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* LEDGER FOOTER */}
          <div className="px-8 py-4 bg-white/[0.01] border-t border-white/5 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      <div className="w-2 h-2 bg-emerald-500/50 rounded-full"></div>
                      Verified Entries
                  </div>
              </div>
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Total Records: {filteredAttempts.length}</p>
          </div>
        </div>
      </div>

      {/* ── DELETE MODAL ────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-[#1a1a2e]/80 border-2 border-white/10 backdrop-blur-xl rounded-3xl max-w-sm w-full shadow-[0_50px_100px_rgba(0,0,0,0.6)] p-8 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
              <Trash2 size={32} className="text-rose-500"/>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Delete Record?</h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed mb-8">
              This action is permanent and cannot be undone.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmDelete}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-lg shadow-rose-600/20"
              >
                Yes, Delete Record
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all border border-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
