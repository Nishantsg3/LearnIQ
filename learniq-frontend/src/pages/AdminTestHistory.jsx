import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Loader2,
  Trash2,
  Info,
  X,
  FileText,
  Zap,
  Database,
  Clock,
  Calendar,
  Search,
  RefreshCcw,
  ArrowLeft,
  Archive,
  Shield
} from 'lucide-react';
import api from '../utils/api';
import { TableSkeleton } from '../components/common/Skeleton';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import BackToDashboard from '../components/admin/BackToDashboard';

const AdminTestHistory = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    type: null, // 'RESTORE' or 'DELETE'
    testId: null,
    title: '',
    message: '',
    confirmText: ''
  });

  const summaryModalRef = useRef(null);
  const summaryCloseBtnRef = useRef(null);
  const previousSummaryFocusRef = useRef(null);

  useEffect(() => {
    if (selectedTest) {
      previousSummaryFocusRef.current = document.activeElement;
      const timer = setTimeout(() => {
        summaryCloseBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (previousSummaryFocusRef.current) {
      previousSummaryFocusRef.current.focus?.();
    }
  }, [selectedTest]);

  useEffect(() => {
    if (!selectedTest || confirmConfig.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedTest(null);
        return;
      }

      if (e.key === 'Tab' && summaryModalRef.current) {
        const focusable = summaryModalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTest, confirmConfig.isOpen]);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tests');
      const normalizedData = (Array.isArray(res.data) ? res.data : []).map(t => ({
        ...t,
        type: (t.testType || t.type || '').toLowerCase()
      }));
      setTests(normalizedData);
    } catch {
      toast.error('Failed to sync test history');
    } finally {
      setLoading(false);
    }
  };

  const archivedTests = useMemo(() => {
    const now = new Date();
    return tests.filter(t => {
      if (t.status === 'ARCHIVED') return true;

      if (t.type === 'main') {
        const startTime = t.startTime ? new Date(t.startTime) : null;
        const duration = t.durationMinutes || t.duration || 60;
        const endTime = startTime ? new Date(startTime.getTime() + duration * 60000) : (t.endTime ? new Date(t.endTime) : null);
        if (endTime && now > endTime) return true;
      }

      return false;
    });
  }, [tests]);

  const counts = useMemo(() => {
    return {
      all: archivedTests.length,
      practice: archivedTests.filter(t => t.type === 'practice').length,
      main: archivedTests.filter(t => t.type === 'main').length
    };
  }, [archivedTests]);

  const filteredTests = useMemo(() => {
    return archivedTests.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query ||
        t.title.toLowerCase().includes(query) ||
        (t.category || '').toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [archivedTests, filterType, searchQuery]);

  const sortedTests = useMemo(() => {
    return [...filteredTests].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.startTime || 0).getTime();
      const timeB = new Date(b.createdAt || b.startTime || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || 0) - (a.id || 0);
    });
  }, [filteredTests]);

  const handleRestoreClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'RESTORE',
      testId: id,
      title: 'Restore Assessment?',
      message: 'Restore this assessment to active inventory? It will become visible to candidates again.',
      confirmText: 'Restore Assessment'
    });
  };

  const handleDeleteClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'DELETE',
      testId: id,
      title: 'Purge Record?',
      message: 'PERMANENT DELETION: This will delete this archived assessment forever. This action cannot be undone.',
      confirmText: 'Purge Forever'
    });
  };

  const executeConfirm = async () => {
    const { type, testId } = confirmConfig;
    if (!testId) return;

    try {
      if (type === 'RESTORE') {
        await api.put(`/admin/tests/${testId}/status`, { status: 'ACTIVE' });
        toast.success('Assessment restored successfully');
      } else if (type === 'DELETE') {
        await api.delete(`/tests/${testId}`);
        toast.success('Record purged');
      }
      fetchTests();
    } catch {
      toast.error(`${type === 'RESTORE' ? 'Restoration' : 'Purge'} failed`);
    }
  };


  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto flex flex-col space-y-6 animate-in fade-in duration-300 pb-16">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#262a33]">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Archive size={20} />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-0.5">
              Historical Archives
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Test History
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review archived examinations, question loads, and previous assessment records
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end w-full sm:w-auto self-end">
          <BackToDashboard />
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Segmented Type Toggle with Counts */}
        <div className="flex bg-slate-100 dark:bg-[#15181e] p-1.5 rounded-2xl border-2 border-slate-300 dark:border-white/20 gap-1.5 overflow-x-auto no-scrollbar shadow-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 min-h-[38px] rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 active:scale-[0.98] hover:-translate-y-0.5 ${
              filterType === 'all'
                ? 'bg-white dark:bg-[#1f2430] text-violet-700 dark:text-violet-300 shadow-sm border-2 border-violet-500 dark:border-violet-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-[#1a202c]'
            }`}
          >
            <span>All Archives</span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold">
              {counts.all}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('practice')}
            className={`px-3.5 py-1.5 min-h-[38px] rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 active:scale-[0.98] hover:-translate-y-0.5 ${
              filterType === 'practice'
                ? 'bg-white dark:bg-[#1f2430] text-violet-700 dark:text-violet-300 shadow-sm border-2 border-violet-500 dark:border-violet-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-[#1a202c]'
            }`}
          >
            <Zap size={13} className="text-violet-600 dark:text-violet-400" />
            <span>Practice Tests</span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold">
              {counts.practice}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('main')}
            className={`px-3.5 py-1.5 min-h-[38px] rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 active:scale-[0.98] hover:-translate-y-0.5 ${
              filterType === 'main'
                ? 'bg-white dark:bg-[#1f2430] text-violet-700 dark:text-violet-300 shadow-sm border-2 border-violet-500 dark:border-violet-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-[#1a202c]'
            }`}
          >
            <Shield size={13} className="text-violet-600 dark:text-violet-400" />
            <span>Main Exams</span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold">
              {counts.main}
            </span>
          </button>
        </div>

        {/* Search Input with Clear Button */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search archived tests by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#15181e] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500/80 dark:hover:border-violet-400/80 hover:shadow-md text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015] shadow-xs transition-all"
            aria-label="Filter archived tests"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
              aria-label="Clear search input"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* RESULT METADATA BAR */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono px-1">
        <span>Archived Repository Catalog</span>
        <span>Showing <strong className="text-slate-800 dark:text-slate-200">{sortedTests.length}</strong> archived records</span>
      </div>

      {/* CONTENT: DESKTOP TABLE & MOBILE CARDS */}
      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : sortedTests.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/75 dark:bg-[#111317] border-b border-slate-200 dark:border-[#262a33] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Assessment Module</th>
                    <th className="px-6 py-3.5">Mode</th>
                    <th className="px-6 py-3.5">Scope & Timing</th>
                    <th className="px-6 py-3.5 text-right">Archived Date</th>
                    <th className="px-6 py-3.5 text-center">Summary</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#20242c]">
                  {sortedTests.map((test, index) => {
                    const isMain = test.type === 'main';
                    return (
                      <tr key={test.id} className={`hover:bg-slate-50/70 dark:hover:bg-[#1a1d24]/60 transition-colors animate-apple-row-${(index % 5) + 1}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">
                              {test.category || 'General'}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-slate-400 font-mono text-[11px]">#{test.id}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {test.title}
                          </h4>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            {isMain ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300">
                                <Shield size={11} />
                                Main Exam
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                <Zap size={11} />
                                Practice Test
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <Archive size={9} />
                              Archived Record
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              <span>{test.durationMinutes || test.duration || 60}m</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Database size={12} className="text-slate-400" />
                              <span>{test.questionCount || test.totalQuestions || 0} Qs</span>
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-mono">
                          {new Date(test.createdAt || Date.now()).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedTest(test)}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1c2027] border border-slate-300/90 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-700 dark:hover:text-violet-300 hover:border-violet-300 dark:hover:border-violet-700 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                            title="View Summary"
                            aria-label={`View summary for ${test.title}`}
                          >
                            <Info size={13} />
                            <span>Details</span>
                          </button>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRestoreClick(test.id)}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              title="Restore to Active Roster"
                              aria-label={`Restore ${test.title} to Active`}
                            >
                              <RefreshCcw size={13} />
                              <span className="hidden xl:inline">Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(test.id)}
                              className="min-h-[38px] min-w-[38px] p-2 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                              title="Purge Record"
                              aria-label={`Purge record ${test.title}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sortedTests.map((test, index) => {
              const isMain = test.type === 'main';
              return (
                <div
                  key={test.id}
                  className={`bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-5 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] space-y-3 animate-apple-row-${(index % 5) + 1}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isMain
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {isMain ? <Shield size={11} /> : <Zap size={11} />}
                      {isMain ? 'Official Exam' : 'Practice Drill'}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1c2027] px-2 py-0.5 rounded-md">
                      {test.category || 'General'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {test.title}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {test.durationMinutes || test.duration || 60}m
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Database size={12} />
                      {test.questionCount || test.totalQuestions || 0} Qs
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(test.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#20242c] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTest(test)}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1c2027] text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Info size={14} />
                      <span>Details</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRestoreClick(test.id)}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Restore to Active"
                        aria-label={`Restore ${test.title} to Active`}
                      >
                        <RefreshCcw size={14} />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(test.id)}
                        className="min-h-[44px] min-w-[44px] p-2 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition cursor-pointer flex items-center justify-center shadow-2xs"
                        title="Purge Record"
                        aria-label={`Purge record ${test.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-dashed border-slate-300 dark:border-[#2b303c] p-12 text-center text-slate-500 dark:text-slate-400 shadow-xs space-y-3">
          <Archive size={36} className="mx-auto text-slate-400 dark:text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Archived Records Found</h3>
          <p className="text-xs max-w-sm mx-auto">
            {searchQuery
              ? `No archived assessments match your query "${searchQuery}".`
              : filterType === 'all'
                ? 'No assessments have been archived in the repository yet.'
                : `No archived ${filterType === 'main' ? 'official exams' : 'practice drills'} found.`}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-3.5 py-1.5 min-h-[40px] rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Clear Search Query</span>
            </button>
          )}
        </div>
      )}

      {/* SUMMARY MODAL */}
      {selectedTest && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div
            ref={summaryModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-modal-title"
            className="relative w-full max-w-md bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#262a33] text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-apple-modal"
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#262a33] flex items-center justify-between">
              <div>
                <h2 id="history-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Archived Assessment Detail
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTest.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTest(null)}
                aria-label="Close summary"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1c2027] transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111317] border border-slate-200 dark:border-[#262a33] space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Zap size={13}/> Assessment Mode:</span>
                  <span className={`font-semibold uppercase ${selectedTest.type === 'main' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {selectedTest.type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Database size={13}/> Category:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTest.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><FileText size={13}/> Questions:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{selectedTest.questionCount || selectedTest.totalQuestions || 0} Questions</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock size={13}/> Duration:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{selectedTest.durationMinutes || selectedTest.duration} Minutes</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-[#262a33]">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Calendar size={13}/> Registered:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {new Date(selectedTest.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <button
                ref={summaryCloseBtnRef}
                type="button"
                onClick={() => setSelectedTest(null)}
                className="w-full py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={executeConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
      />
    </div>
  );
};

export default AdminTestHistory;
