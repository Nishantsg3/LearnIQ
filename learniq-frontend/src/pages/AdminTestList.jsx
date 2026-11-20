import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Clock,
  Database,
  Trash2,
  Trophy,
  BarChart3,
  Zap,
  FileText,
  Edit2,
  Archive,
  ArrowLeft,
  Search,
  RotateCcw,
  Shield,
  Calendar,
  X,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { CardSkeleton } from '../components/common/Skeleton';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import BackToDashboard from '../components/admin/BackToDashboard';

const AdminTestList = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState('main');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    type: null, // 'DELETE', 'ARCHIVE', or 'REACTIVATE'
    testId: null,
    title: '',
    message: ''
  });

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tests');
      const rawData = Array.isArray(res.data) ? res.data : [];

      const normalizedData = rawData.map(t => {
        const rawType = (t.testType || t.type || 'practice').toUpperCase();
        return {
          ...t,
          type: rawType === 'MAIN' ? 'main' : 'practice'
        };
      });

      setTests(normalizedData);
    } catch {
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  useEffect(() => {
    const type = searchParams.get('type')?.toLowerCase();
    if (type === 'practice') {
      setFilterType('practice');
    } else {
      setFilterType('main');
    }
  }, [searchParams]);

  const handleTabChange = (type) => {
    const nextType = type === 'practice' ? 'practice' : 'main';
    setFilterType(nextType);
    setSearchParams({ type: nextType });
  };

  const handleArchiveClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'ARCHIVE',
      testId: id,
      title: 'Archive Assessment?',
      message: 'This will move the assessment module to history and hide it from candidates. You can reactivate it later.'
    });
  };

  const handleReactivateClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'REACTIVATE',
      testId: id,
      title: 'Reactivate Assessment?',
      message: 'This will restore the assessment to the active roster so candidates can participate.'
    });
  };

  const handleDeleteClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'DELETE',
      testId: id,
      title: 'Permanent Deletion',
      message: 'PERMANENT DELETION: This will delete the assessment and all student attempt data permanently. Assessments with student attempts cannot be deleted and must be archived instead.'
    });
  };

  const executeConfirm = async () => {
    const { type, testId } = confirmConfig;
    if (!testId) return;

    try {
      if (type === 'ARCHIVE') {
        await api.put(`/admin/tests/${testId}/status`, { status: 'ARCHIVED' });
        toast.success('Assessment archived successfully');
      } else if (type === 'REACTIVATE') {
        await api.put(`/admin/tests/${testId}/status`, { status: 'ACTIVE' });
        toast.success('Assessment reactivated successfully');
      } else if (type === 'DELETE') {
        try {
          await api.delete(`/admin/tests/${testId}`);
        } catch (err) {
          if (err.response?.status === 404) {
            await api.delete(`/tests/${testId}`);
          } else {
            throw err;
          }
        }
        toast.success('Assessment deleted');
      }
      fetchTests();
    } catch (err) {
      const msg = err.response?.data?.message || `${type === 'ARCHIVE' ? 'Archiving' : type === 'REACTIVATE' ? 'Reactivation' : 'Deletion'} failed`;
      toast.error(msg);
    }
  };

  const getStatusInfo = useCallback((test) => {
    if (test.status === 'ARCHIVED') {
      return {
        key: 'ARCHIVED',
        label: 'Archived',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 font-semibold',
        dotClass: 'bg-slate-400'
      };
    }

    if (test.type === 'main') {
      if (test.startTime) {
        const now = new Date();
        const start = new Date(test.startTime);
        const duration = test.durationMinutes || test.duration || 60;
        const end = test.endTime ? new Date(test.endTime) : new Date(start.getTime() + duration * 60000);

        if (now < start) {
          return {
            key: 'SCHEDULED',
            label: 'Scheduled',
            badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-800 font-semibold',
            dotClass: 'bg-sky-500'
          };
        } else if (now >= start && now <= end) {
          return {
            key: 'LIVE',
            label: 'Live Exam',
            badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 font-bold',
            dotClass: 'bg-emerald-500 animate-pulse'
          };
        } else {
          return {
            key: 'CONCLUDED',
            label: 'Concluded Window',
            badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-semibold',
            dotClass: 'bg-amber-500'
          };
        }
      }
      return {
        key: 'ACTIVE',
        label: 'Active Proctored',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-semibold',
        dotClass: 'bg-emerald-500'
      };
    }

    return {
      key: 'ACTIVE',
      label: 'Active Practice',
      badgeClass: 'bg-violet-50 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-800 font-semibold',
      dotClass: 'bg-violet-500'
    };
  }, []);

  // Active assessments only - archived tests are strictly excluded from Active Tests view
  const activeTests = useMemo(() => {
    return tests.filter(t => t.status !== 'ARCHIVED');
  }, [tests]);

  const counts = useMemo(() => {
    return {
      main: activeTests.filter(t => t.type === 'main').length,
      practice: activeTests.filter(t => t.type === 'practice').length,
    };
  }, [activeTests]);

  // Filtered List based on category tab (main vs practice) and search query
  const filteredTests = useMemo(() => {
    const targetType = filterType === 'practice' ? 'practice' : 'main';
    const query = searchQuery.trim().toLowerCase();

    return activeTests.filter(test => {
      const matchesType = test.type === targetType;
      const matchesSearch =
        !query ||
        (test.title || '').toLowerCase().includes(query) ||
        (test.category || '').toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [activeTests, filterType, searchQuery]);

  const practiceTests = useMemo(() => (filterType === 'practice' ? filteredTests : []), [filterType, filteredTests]);
  const mainTests = useMemo(() => (filterType === 'main' ? filteredTests : []), [filterType, filteredTests]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-300 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto flex flex-col space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#e6e6df] dark:border-[#262a33]">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-900/50 text-violet-700 dark:text-violet-300 flex items-center justify-center shadow-xs">
            <Database size={20} />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400 block mb-0.5">
              Assessment Management
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Test Management Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage practice assessments, official exams, question links, and proctored schedules
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto self-end">
          <button
            onClick={() => navigate('/admin/tests/create')}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 apple-shimmer-btn active:scale-[0.96] text-white text-xs font-semibold shadow-md shadow-violet-500/25 border border-violet-400/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Test</span>
          </button>
          <BackToDashboard />
        </div>
      </div>

      {/* SEGMENTED TABS (Official Exams vs Practice Tests - strictly 2 categories) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex bg-[#f0f0ea] dark:bg-[#15181e] p-1.5 rounded-2xl border-2 border-slate-300 dark:border-white/20 gap-1.5 overflow-x-auto no-scrollbar shadow-xs">
          <button
            type="button"
            onClick={() => handleTabChange('main')}
            className={`px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 active:scale-[0.98] hover:-translate-y-0.5 ${
              filterType === 'main'
                ? 'bg-white dark:bg-[#1f2430] text-violet-700 dark:text-violet-300 shadow-sm border-2 border-violet-500 dark:border-violet-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-[#1a202c]'
            }`}
          >
            <Shield size={14} className="text-violet-600 dark:text-violet-400" />
            <span>Official Exams (MAIN)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold">
              {counts.main}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('practice')}
            className={`px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 active:scale-[0.98] hover:-translate-y-0.5 ${
              filterType === 'practice'
                ? 'bg-white dark:bg-[#1f2430] text-violet-700 dark:text-violet-300 shadow-sm border-2 border-violet-500 dark:border-violet-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-[#1a202c]'
            }`}
          >
            <Zap size={14} className="text-violet-600 dark:text-violet-400" />
            <span>Practice Tests (PRACTICE)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold">
              {counts.practice}
            </span>
          </button>
        </div>

        {/* SEARCH BAR (Filtering by Title & Category) */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${filterType === 'main' ? 'official exams' : 'practice drills'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#15181e] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500/80 dark:hover:border-violet-400/80 hover:shadow-md text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015] shadow-xs transition-all"
            aria-label="Filter tests by title or category"
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

      {/* ACTIVE CATEGORY SUMMARY (Status filter pill row removed per platform spec) */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono px-1">
        <span>
          Category: <strong className="text-slate-800 dark:text-slate-200 uppercase">{filterType === 'main' ? 'Official Proctored Examinations' : 'Self-Paced Practice Drills'}</strong>
        </span>
        <span>Showing <strong className="text-slate-800 dark:text-slate-200">{filteredTests.length}</strong> active assessments</span>
      </div>

      {/* INVENTORY GRIDS */}
      <div className="space-y-8">
        {(filterType === 'all' || filterType === 'practice') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Practice Assessments ({practiceTests.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Self-paced, unlimited attempts, no proctoring
              </span>
            </div>
            {loading ? (
              <div role="status" aria-busy="true" aria-label="Loading practice assessments" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <span className="sr-only">Loading practice assessments...</span>
                {[1, 2, 3].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : practiceTests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {practiceTests.map((test, index) => (
                  <AssessmentCard
                    key={test.id}
                    test={test}
                    index={index}
                    statusInfo={getStatusInfo(test)}
                    navigate={navigate}
                    deleteTest={handleDeleteClick}
                    archiveTest={handleArchiveClick}
                    reactivateTest={handleReactivateClick}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#15181e] border border-dashed border-slate-300 dark:border-[#2b303c] rounded-2xl py-12 text-center text-slate-500 dark:text-slate-400">
                <p className="text-xs font-semibold">No practice assessments match your current filters.</p>
              </div>
            )}
          </div>
        )}

        {(filterType === 'all' || filterType === 'main') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Main Examinations ({mainTests.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Proctored examination window with competitive leaderboards
              </span>
            </div>
            {loading ? (
              <div role="status" aria-busy="true" aria-label="Loading main examinations" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <span className="sr-only">Loading main examinations...</span>
                {[1, 2, 3].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : mainTests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {mainTests.map((test, index) => (
                  <AssessmentCard
                    key={test.id}
                    test={test}
                    index={index}
                    statusInfo={getStatusInfo(test)}
                    navigate={navigate}
                    deleteTest={handleDeleteClick}
                    archiveTest={handleArchiveClick}
                    reactivateTest={handleReactivateClick}
                    isMain
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#15181e] border border-dashed border-slate-300 dark:border-[#2b303c] rounded-2xl py-12 text-center text-slate-500 dark:text-slate-400">
                <p className="text-xs font-semibold">No main examinations match your current filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={executeConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={
          confirmConfig.type === 'DELETE'
            ? 'Delete Test'
            : confirmConfig.type === 'REACTIVATE'
              ? 'Reactivate Test'
              : 'Archive Test'
        }
      />
    </div>
  );
};

const AssessmentCard = ({
  test,
  statusInfo,
  navigate,
  deleteTest,
  archiveTest,
  reactivateTest,
  isMain = false,
  index = 0
}) => {
  const isArchived = test.status === 'ARCHIVED';

  // Compute timing indicator string for scheduling window
  const scheduleDetail = useMemo(() => {
    if (isArchived) {
      return 'Archived module — inactive';
    }

    if (isMain && test.startTime) {
      const start = new Date(test.startTime);
      const duration = test.durationMinutes || test.duration || 60;
      const end = test.endTime ? new Date(test.endTime) : new Date(start.getTime() + duration * 60000);
      const now = new Date();

      if (now < start) {
        return `Window: ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (now >= start && now <= end) {
        return `Live Now (Closes at ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      } else {
        return `Window ended on ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      }
    }

    if (isMain) {
      return 'Official Exam • Unscheduled Window';
    }

    return 'Self-paced • Always available';
  }, [isArchived, isMain, test.startTime, test.endTime, test.durationMinutes, test.duration]);

  const qCount = test.questionCount || test.totalQuestions || 0;
  const duration = test.durationMinutes || test.duration || 60;
  const isMainCompliant = !isMain || (qCount === 50 && duration === 60);

  return (
    <div className={`bg-white dark:bg-[#15181e] border rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between min-h-[220px] sm:min-h-[240px] animate-apple-row-${(index % 5) + 1} ${
      isArchived
        ? 'border-slate-200/60 dark:border-[#222630] opacity-80'
        : !isMainCompliant
          ? 'border-rose-400 dark:border-rose-900/70 ring-1 ring-rose-500/20'
          : 'border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30'
    }`}>
      <div className="space-y-3">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide ${
              isMain
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            }`}>
              {isMain ? 'Official Exam' : 'Practice Drill'}
            </span>

            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
              <span>{statusInfo.label}</span>
            </span>

            {/* Non-compliant Warning Badge */}
            {!isMainCompliant && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                <AlertTriangle size={12} className="text-rose-600 dark:text-rose-400" />
                <span>Non-Compliant: {qCount}/50 Qs</span>
              </span>
            )}
          </div>

          <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1c2027] px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-[#2a2f3a]">
            {test.category || 'General'}
          </span>
        </div>

        {/* Title & Metadata */}
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
            {test.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            <Calendar size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">{scheduleDetail}</span>
          </div>
        </div>

        {/* Invariant Warning if Official Exam violates 50 questions / 60 minutes */}
        {!isMainCompliant && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Platform Invariant Violation</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                Official Exams require exactly 50 questions and 60 minutes (currently {qCount} Qs, {duration} mins). Candidate sitting is blocked until 50 questions are linked.
              </p>
            </div>
          </div>
        )}

        {/* Metrics Row */}
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
          <span className="flex items-center gap-1 font-mono text-xs">
            <Clock size={13} className="text-slate-400 dark:text-slate-500" />
            {duration} mins
          </span>
          <span className={`flex items-center gap-1 font-mono text-xs ${!isMainCompliant ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
            <Database size={13} className={!isMainCompliant ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'} />
            {qCount} Qs
          </span>
          {isMain && (
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
              Proctored
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#20242c] flex flex-wrap items-center justify-between gap-2">
        {/* Core Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/tests/${test.id}/questions`)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/50 hover:border-violet-300 dark:hover:border-violet-700 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Manage Questions"
            aria-label={`Manage questions for ${test.title}`}
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Questions</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/admin/tests/edit/${test.id}`)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#15181e] hover:bg-slate-100 dark:hover:bg-[#1c2027] text-slate-700 dark:text-slate-300 border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Edit Test Details"
            aria-label={`Edit details for ${test.title}`}
          >
            <Edit2 size={14} />
            <span className="hidden sm:inline">Edit</span>
          </button>

          {isMain && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/admin/tests/${test.id}/leaderboard`)}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white dark:bg-[#15181e] hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-slate-300/90 dark:border-white/15 hover:border-amber-300 dark:hover:border-amber-700/60 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] flex items-center justify-center transition-all cursor-pointer"
                title="View Leaderboard"
                aria-label={`View leaderboard for ${test.title}`}
              >
                <Trophy size={14} />
              </button>
              <button
                type="button"
                onClick={() => navigate(`/admin/tests/${test.id}/analytics`)}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white dark:bg-[#15181e] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-slate-300/90 dark:border-white/15 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] flex items-center justify-center transition-all cursor-pointer"
                title="View Analytics"
                aria-label={`View analytics for ${test.title}`}
              >
                <BarChart3 size={14} />
              </button>
            </>
          )}
        </div>

        {/* Lifecycle Actions */}
        <div className="flex items-center gap-1.5">
          {isArchived ? (
            <button
              type="button"
              onClick={() => reactivateTest(test.id)}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-700/60 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
              title="Reactivate Assessment"
              aria-label={`Reactivate assessment ${test.title}`}
            >
              <RotateCcw size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => archiveTest(test.id)}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-700/60 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
              title="Archive Assessment"
              aria-label={`Archive assessment ${test.title}`}
            >
              <Archive size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={() => deleteTest(test.id)}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-700/60 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
            title="Delete Assessment"
            aria-label={`Delete assessment ${test.title}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTestList;
