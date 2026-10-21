import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { History, FileText, TrendingUp, ArrowUpRight, CheckCircle2, ChevronRight, Trash2, Zap, Trophy, Send } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

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
    console.log(`[DIAGNOSTIC] History fetch: userEmail=${user?.email || 'anonymous'}, timestamp=${new Date().toISOString()}`);
    try {
      const [attemptsRes] = await Promise.all([
        api.get('/attempts/me')
      ]);
      setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
    } catch {
      toast.error('Failed to load results history');
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    return numbered.reverse().filter(a => ((a.testType || a.mode || '').toUpperCase() === (activeType || '').toUpperCase()));
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
    } catch {
        toast.error('Failed to delete attempt');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-white/5 border-t-violet-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em]">Loading Ledger...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 min-h-0 bg-[#0d0d10]">
      <div className="h-full flex flex-col space-y-4 sm:space-y-8 min-h-0">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-4 sm:gap-5">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              aria-label="Return to Dashboard"
              className="w-12 h-12 sm:w-13 sm:h-13 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 cursor-pointer hover:bg-violet-500/20 active:scale-95 transition-all shadow-[0_0_30px_rgba(124,58,237,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 shrink-0"
            >
              <History size={22} />
            </button>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Performance History</h1>
              <p className="text-slate-400 text-xs font-normal tracking-normal">Historical attempts, scores, and performance analytics</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* APPLE-STYLE SEGMENTED SWITCH */}
              <div className="flex w-full sm:w-auto bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl shrink-0 shadow-sm gap-1">
                  <button
                      type="button"
                      onClick={() => setActiveType('PRACTICE')}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
                          activeType === 'PRACTICE' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                  >
                      Practice
                  </button>
                  <button
                      type="button"
                      onClick={() => setActiveType('MAIN')}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
                          activeType === 'MAIN' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                  >
                      Main
                  </button>
              </div>

              <div className="flex items-center gap-3">
                  <button
                      type="button"
                      onClick={() => navigate('/student/dashboard')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-full hover:bg-white/[0.08] active:scale-95 transition-all text-slate-300 hover:text-white group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                  >
                      <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform duration-200" />
                      <span className="text-xs font-semibold tracking-wide">Dashboard</span>
                  </button>
              </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div
          className="apple-card flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
          style={{
            background: 'rgba(16, 16, 23, 0.75)',
            boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.08), 0 24px 64px -12px rgba(0,0,0,0.6)'
          }}
        >
          {/* LEDGER HEADER - hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-white/[0.02] border-b border-white/[0.06] shrink-0">
              <div className="col-span-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assessment Detail</div>
              <div className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Status</div>
              <div className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Score</div>
              <div className="col-span-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</div>
          </div>

          {/* LEDGER BODY */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredAttempts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/30">
                        <History size={28} />
                      </div>
                      <p className="text-sm font-medium text-slate-400">No {activeType.toLowerCase()} assessment records found</p>
                  </div>
              ) : (
                  <div className="divide-y divide-white/[0.04]">
                      {filteredAttempts.map(attempt => (
                          <React.Fragment key={attempt.id}>
                          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-white/[0.02] transition-colors group">
                              <div className="col-span-5 flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-all shrink-0">
                                      <FileText size={18} />
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <h4 className="text-sm font-semibold text-white/90 tracking-tight group-hover:text-white transition-colors">
                                              {attempt.testTitle}
                                          </h4>
                                          <span className={`px-2 py-0.5 border text-[9px] font-semibold uppercase tracking-wider rounded-md ${
                                              activeType === 'MAIN' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                          }`}>
                                              {activeType}
                                          </span>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1">
                                          <span className="text-[11px] font-medium text-violet-400/90">Attempt #{attempt.attemptNumber}</span>
                                          <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                          <span className="text-[11px] font-normal text-slate-400 tabular-nums">{formatDateTime(attempt.submittedAt || attempt.startedAt)}</span>
                                      </div>
                                  </div>
                              </div>
                               <div className="col-span-2 flex justify-center">
                                  {isSubmitted(attempt) ? (
                                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
                                          <CheckCircle2 size={13} />
                                          <span>Completed</span>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-1.5 text-amber-400 font-medium text-xs">
                                          <Zap size={13} />
                                          <span>In Progress</span>
                                      </div>
                                  )}
                              </div>
                              <div className="col-span-2 flex justify-center">
                                  {isSubmitted(attempt) ? (
                                      <div className={`px-3 py-1 rounded-full text-xs font-semibold border tabular-nums ${
                                          attempt.scorePercent >= 40
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      }`}>
                                          {Math.round(attempt.scorePercent)}%
                                      </div>
                                  ) : (
                                      <span className="text-slate-500 text-xs font-semibold">—</span>
                                  )}
                              </div>
                              <div className="col-span-3 flex justify-end items-center gap-3">
                                   {activeType !== 'MAIN' && (
                                       <button
                                           type="button"
                                           onClick={(e) => handleDeleteTrigger(e, attempt.id)}
                                           className="p-2.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/25 text-rose-400 rounded-full transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                                           title="Delete Attempt"
                                           aria-label="Delete Attempt"
                                       >
                                           <Trash2 size={14} />
                                       </button>
                                   )}
                                  <button
                                      type="button"
                                      onClick={() => navigate(`/results/${attempt.id}`)}
                                      className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-full text-xs font-semibold text-slate-200 hover:bg-violet-600 hover:text-white hover:border-violet-500 transition-all group/btn active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                                  >
                                      View Report
                                      <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform duration-150" />
                                  </button>
                              </div>
                          </div>

                          {/* Mobile card layout */}
                          <div className="md:hidden px-4 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 shrink-0">
                                          <FileText size={14} />
                                      </div>
                                      <div className="min-w-0">
                                          <h4 className="text-xs font-semibold text-white/90 truncate">{attempt.testTitle}</h4>
                                          <span className="text-[10px] font-medium text-violet-400">Attempt #{attempt.attemptNumber}</span>
                                      </div>
                                  </div>
                                  {isSubmitted(attempt) ? (
                                      <div className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tabular-nums ${
                                          attempt.scorePercent >= 40
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      }`}>{Math.round(attempt.scorePercent)}%</div>
                                  ) : (
                                      <div className="shrink-0 flex items-center gap-1 text-amber-400">
                                          <Zap size={11} />
                                          <span className="text-[10px] font-semibold uppercase">Live</span>
                                      </div>
                                  )}
                              </div>
                              <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-normal text-slate-400 tabular-nums">{formatDateTime(attempt.submittedAt || attempt.startedAt)}</span>
                                  <div className="flex items-center gap-2">
                                      {activeType !== 'MAIN' && (
                                          <button
                                              type="button"
                                              onClick={(e) => handleDeleteTrigger(e, attempt.id)}
                                              className="p-1.5 bg-rose-500/5 border border-rose-500/10 text-rose-400 rounded-lg transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                                              title="Delete Attempt"
                                              aria-label="Delete Attempt"
                                          >
                                              <Trash2 size={13} />
                                          </button>
                                      )}
                                      <button
                                          type="button"
                                          onClick={() => navigate(`/results/${attempt.id}`)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                                      >
                                          Report <ChevronRight size={11} />
                                      </button>
                                  </div>
                              </div>
                          </div>
                          </React.Fragment>
                      ))}
                  </div>
              )}
          </div>

          {/* LEDGER FOOTER */}
          <div className="px-8 py-4 bg-white/[0.01] border-t border-white/5 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="w-2 h-2 bg-emerald-500/50 rounded-full"></div>
                      Verified Entries
                  </div>
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Records: {filteredAttempts.length}</p>
          </div>
        </div>
      </div>

      {/* ── DELETE MODAL ────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Record?"
        message="This action is permanent and cannot be undone."
        confirmText="Yes, Delete Record"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ResultsPage;
