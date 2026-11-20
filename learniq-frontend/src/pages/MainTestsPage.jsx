import { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Clock,
  FileText,
  Shield,
  ArrowUpRight,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Lock,
  Zap,
  Search,
  X,
  BookOpen,
  Sparkles
} from 'lucide-react';
import api from '../utils/api';
import { CardSkeleton } from '../components/common/Skeleton';

const isSubmitted = (a) => {
  if (!a) return false;
  return (
    a.submitted === true ||
    a.status === 'SUBMITTED' ||
    (a.scorePercent !== undefined && a.scorePercent !== null && a.scorePercent >= 0)
  );
};

const formatDate = (dateObj) => {
  if (!dateObj) return '—';
  const d = new Date(dateObj);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (dateObj) => {
  if (!dateObj) return '—';
  const d = new Date(dateObj);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (dateObj) => {
  if (!dateObj) return '—';
  const d = new Date(dateObj);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeNotice = (startTime, endTime) => {
  if (!startTime) return 'Schedule Pending';
  const now = new Date();
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : null;

  if (end && now >= start && now <= end) {
    const diffMs = end - now;
    const diffMins = Math.max(1, Math.round(diffMs / 60000));
    if (diffMins < 60) {
      return `Window closes in ${diffMins}m`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `Window closes in ${hours}h ${mins}m`;
  }

  if (now < start) {
    const diffMs = start - now;
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) {
      return `Starts in ${diffMins}m`;
    }
    const diffHours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (diffHours < 24) {
      return `Starts in ${diffHours}h ${mins}m`;
    }
    const days = Math.round(diffHours / 24);
    return `Starts in ${days}d`;
  }

  return 'Sitting concluded';
};

const TABS = [
  { id: 'ALL', label: 'All Active' },
  { id: 'LIVE', label: 'Live Now', hasBeacon: true },
  { id: 'UPCOMING', label: 'Upcoming Schedule' },
];

const MainTestsPage = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingTestId, setStartingTestId] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingTest, setInspectingTest] = useState(null);

  const startTest = async (testId) => {
    if (startingTestId) return;
    const targetTest = tests.find((t) => t.id === testId);
    if (targetTest) {
      const qCount = targetTest.questionCount || targetTest.totalQuestions || 0;
      const duration = targetTest.durationMinutes || targetTest.duration || 60;
      if (qCount !== 50 || duration !== 60) {
        toast.error('Official examinations require exactly 50 questions and 60 minutes.');
        return;
      }
    }
    setStartingTestId(testId);

    try {
      const res = await api.post('/attempts/start', { testId });
      navigate(`/student/test/${testId}?attemptId=${res.data.attemptId}&mode=MAIN`);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.attemptId) {
        navigate(`/student/test/${testId}?attemptId=${err.response.data.attemptId}&mode=MAIN`);
        return;
      }
      const errorMsg = err.response?.data?.message || 'Failed to initialize assessment';
      toast.error(errorMsg);
    } finally {
      setStartingTestId(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        api.get('/tests'),
        api.get('/attempts/me'),
      ]);

      const validMainTests = (testsRes.data || []).filter((t) => {
        const rawType = (t.testType || t.type || '').toUpperCase();
        // MAIN test requirement: Only official MAIN tests; practice tests must NEVER appear as MAIN tests
        if (rawType !== 'MAIN') return false;

        const rawStatus = (t.status || '').toUpperCase();
        // Draft / unpublished tests must remain strictly hidden from students
        if (rawStatus === 'DRAFT' || rawStatus === 'UNPUBLISHED' || t.published === false || t.isPublished === false) {
          return false;
        }

        // Archived tests are hidden from active candidate registration
        if (rawStatus === 'ARCHIVED') return false;

        // Platform Invariant Enforcement: Official MAIN exam must have exactly 50 questions and 60 minutes
        const qCount = t.questionCount || t.totalQuestions || 0;
        const duration = t.durationMinutes || t.duration || 60;
        if (qCount !== 50 || duration !== 60) {
          return false;
        }

        return true;
      });

      setTests(validMainTests);
      setAttempts(attemptsRes.data || []);
    } catch {
      toast.error('Failed to load scheduled examinations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close syllabus modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setInspectingTest(null);
      }
    };
    if (inspectingTest) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectingTest]);

  const processedTests = useMemo(() => {
    const now = new Date();
    return tests.map((test) => {
      const userAttempts = attempts.filter((a) => a.testId === test.id);
      const inProgressAttempt = userAttempts
        .filter((a) => a.status === 'IN_PROGRESS' && !a.submitted)
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0];

      const completedAttempt = userAttempts
        .filter((a) => isSubmitted(a))
        .sort(
          (a, b) =>
            new Date(b.submittedAt || b.startedAt) -
            new Date(a.submittedAt || a.startedAt)
        )[0];

      const durationMinutes = test.durationMinutes || test.duration || 60;
      const startTime = test.startTime
        ? new Date(test.startTime)
        : test.scheduledAt
        ? new Date(test.scheduledAt)
        : null;
      const endTime = test.endTime
        ? new Date(test.endTime)
        : startTime
        ? new Date(startTime.getTime() + durationMinutes * 60000)
        : null;

      let statusGroup = 'UPCOMING';
      if (completedAttempt) {
        statusGroup = 'COMPLETED';
      } else if (startTime && now >= startTime && (!endTime || now <= endTime)) {
        statusGroup = 'LIVE';
      } else if (startTime && now < startTime) {
        statusGroup = 'UPCOMING';
      } else {
        statusGroup = 'CONCLUDED';
      }

      return {
        ...test,
        durationMinutes,
        startTime,
        endTime,
        inProgressAttempt,
        completedAttempt,
        statusGroup,
      };
    }).filter((t) => !t.completedAttempt && t.statusGroup !== 'COMPLETED' && t.statusGroup !== 'CONCLUDED');
  }, [tests, attempts]);

  const tabCounts = useMemo(() => {
    let live = 0;
    let upcoming = 0;

    processedTests.forEach((t) => {
      if (t.statusGroup === 'LIVE') live += 1;
      else if (t.statusGroup === 'UPCOMING') upcoming += 1;
    });

    return {
      all: processedTests.length,
      live,
      upcoming,
    };
  }, [processedTests]);

  const filteredTests = useMemo(() => {
    return processedTests.filter((test) => {
      // Tab filter
      if (activeTab === 'LIVE' && test.statusGroup !== 'LIVE') return false;
      if (activeTab === 'UPCOMING' && test.statusGroup !== 'UPCOMING') return false;
      if (
        activeTab === 'CONCLUDED' &&
        test.statusGroup !== 'COMPLETED' &&
        test.statusGroup !== 'CONCLUDED'
      ) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (test.title || '').toLowerCase().includes(query);
        const categoryMatch = (test.category || '').toLowerCase().includes(query);
        const descMatch = (test.description || '').toLowerCase().includes(query);
        if (!titleMatch && !categoryMatch && !descMatch) return false;
      }

      return true;
    });
  }, [processedTests, activeTab, searchQuery]);

  return (
    <div className="h-full overflow-y-auto p-5 sm:p-7 lg:p-9 max-w-7xl mx-auto flex flex-col space-y-6 animate-in fade-in duration-200 motion-reduce:animate-none">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b border-academy-rule">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-academy-accent-tint border border-academy-accent/20 text-xs font-serif italic text-academy-accent dark:text-academy-accent-deep mb-2">
            <Shield size={13} className="text-academy-accent dark:text-academy-accent-deep" aria-hidden="true" />
            <span>Proctored Examination Hall • Synchronized Sittings</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-academy-ink tracking-tight leading-tight">
            MAIN Exams
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-academy-ink-secondary max-w-2xl font-normal leading-relaxed">
            Standardized 50-question 60-minute proctored evaluations with automated timekeeping and verified grade derivation.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto self-end">
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-academy-card border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 text-academy-ink hover:bg-slate-100 dark:hover:bg-[#1c2027] hover:-translate-y-0.5 active:scale-[0.98] text-xs font-medium shadow-xs hover:shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2"
            title="Refresh list"
            aria-label="Refresh examination list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#6366F1]' : 'text-academy-muted'} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-academy-card border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 text-academy-ink hover:bg-slate-100 dark:hover:bg-[#1c2027] hover:-translate-y-0.5 active:scale-[0.98] text-xs font-medium shadow-xs hover:shadow-sm flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={14} className="text-academy-muted" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* ── DISCOVERY CONTROLS: TABS & SEARCH ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div
          role="tablist"
          aria-label="Examination status filters"
          className="flex items-center gap-1.5 p-1.5 rounded-xl bg-academy-paper-subtle/80 dark:bg-surface-subtle/70 border-2 border-slate-300 dark:border-white/20 shadow-xs overflow-x-auto no-scrollbar shrink-0 max-w-full"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count =
              tab.id === 'ALL'
                ? tabCounts.all
                : tab.id === 'LIVE'
                ? tabCounts.live
                : tab.id === 'UPCOMING'
                ? tabCounts.upcoming
                : tabCounts.concluded;

            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id.toLowerCase()}`}
                aria-selected={isActive}
                aria-controls="examinations-grid"
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98] hover:-translate-y-0.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white shadow-md shadow-indigo-500/25 border-2 border-[#818CF8] font-bold'
                    : 'text-academy-ink-secondary hover:text-academy-ink border-2 border-transparent hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-academy-card hover:shadow-sm'
                }`}
              >
                {tab.hasBeacon && tabCounts.live > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
                <span>
                  {tab.id === 'UPCOMING' ? (
                    <>
                      <span>Upcoming</span>
                      <span className="hidden sm:inline">&nbsp;Schedule</span>
                    </>
                  ) : (
                    tab.label
                  )}
                </span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-academy-rule/40 text-academy-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-0 sm:min-w-[220px] max-w-md w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-academy-muted">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search examinations by title or subject..."
            className="w-full min-h-[44px] pl-10 pr-10 rounded-xl bg-white dark:bg-academy-card border-2 border-slate-300 dark:border-white/20 hover:border-[#6366F1] dark:hover:border-[#818CF8] text-xs sm:text-sm text-academy-ink placeholder:text-academy-muted shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 transition-all duration-200"
            aria-label="Search examinations by title or category"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-academy-muted hover:text-academy-ink transition-colors cursor-pointer min-h-[44px] min-w-[44px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 rounded-lg"
              aria-label="Clear search query"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── CONTENT AREA ────────────────────────────────────────────────────── */}
      <div id="examinations-grid">
        {loading ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="Loading official exams"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            <span className="sr-only">Loading official exams...</span>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : tests.length === 0 ? (
          /* PURPOSEFUL PROCTORING STANDBY & DEVICE READINESS (No exams in system) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Standby Banner Card (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-7 sm:p-8 shadow-2xs space-y-6">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#EEF2FF] dark:bg-[#1E1B4B] border border-[#E8DEC8] dark:border-[#592515] text-[#6366F1] dark:text-[#818CF8] text-xs font-mono font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] animate-pulse" />
                <span>Proctoring Standby • No In-Flight Exam</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-academy-ink tracking-tight leading-tight">
                  No Proctored Exams Scheduled Today
                </h2>
                <p className="text-xs sm:text-sm text-academy-ink-secondary leading-relaxed font-normal">
                  Official examination windows are published in advance by your institution's examination board. When active, synchronized entry locks, live proctoring telemetry, and automated timekeepers will engage here.
                </p>
              </div>

              <div className="pt-5 border-t border-academy-rule-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="block text-xs font-serif italic text-academy-ink">Recommended Preparation</span>
                  <span className="text-xs text-academy-ink-secondary font-normal">
                    Complete self-paced formative practice drills to sharpen accuracy.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/section1')}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#818CF8] hover:from-[#4F46E5] hover:to-[#6366F1] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2"
                >
                  <Zap size={15} />
                  <span>Open Practice Sets</span>
                </button>
              </div>
            </div>

            {/* Protocol & Device Readiness (5 cols) */}
            <div className="lg:col-span-5 bg-academy-paper-subtle/60 dark:bg-surface-subtle/50 rounded-xl border border-slate-300/90 dark:border-white/15 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <Shield size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-serif italic text-academy-ink">Proctoring Protocol Readiness</h3>
              </div>

              <div className="space-y-3 text-xs text-academy-ink-secondary">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-academy-ink">Full-screen monitoring:</strong> Navigation outside the test tab is logged and recorded with your attempt.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-academy-ink">Deterministic clock:</strong> Official timers run server-side and automatically submit when the window ends.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-academy-ink">Automatic draft saving:</strong> Every selected response is persisted to your session immediately.
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-academy-rule-subtle text-xs flex items-center justify-between">
                <span className="text-academy-muted">View past official scores</span>
                <button
                  type="button"
                  onClick={() => navigate('/student/results')}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[#6366F1] dark:text-[#A5B4FC] hover:-translate-y-0.5 hover:shadow-sm shadow-xs transition-all cursor-pointer font-semibold inline-flex items-center gap-1.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2"
                >
                  <span>Assessment results</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        ) : filteredTests.length === 0 ? (
          /* EMPTY FILTER STATE */
          <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-8 sm:p-12 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] dark:bg-[#1E1B4B] text-[#6366F1] dark:text-[#818CF8] flex items-center justify-center mx-auto">
              <Search size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-normal text-academy-ink">No examinations found</h3>
              <p className="text-xs sm:text-sm text-academy-ink-secondary max-w-md mx-auto leading-relaxed">
                {searchQuery
                  ? `No assessments match "${searchQuery}". Try searching by another subject or clear the search filter.`
                  : activeTab === 'LIVE'
                  ? 'There are currently no active live examination halls open. Check the Upcoming Schedule tab for scheduled sittings.'
                  : 'No examinations match this status filter.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-academy-paper-subtle dark:bg-surface-subtle border border-academy-rule text-academy-ink hover:bg-academy-paper text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2"
                >
                  Clear Search Filter
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ALL');
                  setSearchQuery('');
                }}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#818CF8] hover:from-[#4F46E5] hover:to-[#6366F1] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2"
              >
                View All Examinations
              </button>
            </div>
          </div>
        ) : (
          /* RESPONSIVE CARD GRID: 1 col mobile, 2 cols tablet, 3 cols desktop */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredTests.map((test, index) => {
              const isLive = test.statusGroup === 'LIVE';
              const isUpcoming = test.statusGroup === 'UPCOMING';
              const isCompleted = test.statusGroup === 'COMPLETED';
              const isConcluded = test.statusGroup === 'CONCLUDED';

              return (
                <div
                  key={test.id}
                  className={`bg-white dark:bg-academy-card rounded-2xl border p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group animate-apple-row-${(index % 5) + 1} ${
                    isLive
                      ? 'border-rose-400 dark:border-rose-800/80 shadow-rose-500/5'
                      : isCompleted
                      ? 'border-emerald-300 dark:border-emerald-800/60'
                      : 'border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30'
                  }`}
                >
                  <div>
                    {/* Header category and status pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-serif italic text-academy-accent dark:text-academy-accent-deep bg-academy-accent-tint px-2.5 py-0.5 rounded-md border border-academy-accent/20">
                        {test.category || 'Examination'}
                      </span>

                      {isLive && (
                        <span className="text-xs font-mono font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                          <span>Live Window</span>
                        </span>
                      )}

                      {isUpcoming && (
                        <span className="text-xs font-mono text-academy-muted bg-academy-paper-subtle dark:bg-surface-subtle px-2.5 py-1 rounded-md border border-academy-rule flex items-center gap-1.5">
                          <Lock size={12} className="text-academy-muted" />
                          <span>Scheduled</span>
                        </span>
                      )}

                      {isCompleted && (
                        <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                          <span>
                            {test.completedAttempt?.scorePercent !== undefined &&
                            test.completedAttempt?.scorePercent !== null
                              ? `Score: ${Math.round(test.completedAttempt.scorePercent)}%`
                              : 'Completed'}
                          </span>
                        </span>
                      )}

                      {isConcluded && (
                        <span className="text-xs font-mono text-academy-muted bg-academy-paper-subtle dark:bg-surface-subtle px-2.5 py-1 rounded-md border border-academy-rule">
                          Concluded
                        </span>
                      )}
                    </div>

                    {/* Standardized Rule Badge: Fixed 50 Questions • 60 Mins */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/60 text-[10px] font-mono font-semibold text-brand-700 dark:text-brand-300 mb-2">
                      <Sparkles size={11} aria-hidden="true" />
                      <span>Standard Rule: 50 Questions • 60 Mins Fixed</span>
                    </div>

                    {/* Examination Title */}
                    <h3 className="font-serif text-lg sm:text-xl font-normal text-academy-ink group-hover:text-[#6366F1] dark:group-hover:text-[#818CF8] transition-colors leading-snug mb-2.5">
                      {test.title}
                    </h3>

                    {/* Examination Description or Syllabus Snippet */}
                    {test.description && (
                      <p className="line-clamp-2 text-xs text-academy-ink-secondary mb-3.5 leading-relaxed">
                        {test.description}
                      </p>
                    )}

                    {/* Metrics Specs */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-mono text-academy-muted tabular-nums">
                      <div className="flex items-center gap-1.5 bg-academy-paper-subtle dark:bg-surface-subtle px-2.5 py-1 rounded-md border border-academy-rule">
                        <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />
                        <span>{test.durationMinutes}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-academy-paper-subtle dark:bg-surface-subtle px-2.5 py-1 rounded-md border border-academy-rule">
                        <FileText size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{test.questionCount || 50} questions</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-academy-paper-subtle dark:bg-surface-subtle px-2.5 py-1 rounded-md border border-academy-rule">
                        <Shield size={13} className="text-academy-accent" />
                        <span>Proctored</span>
                      </div>
                    </div>

                    {/* STATE-SPECIFIC INFORMATIONAL BANNERS */}
                    {isLive && (
                      <div className="bg-rose-500/10 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 rounded-lg p-3 mb-4 space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-rose-800 dark:text-rose-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                            Live Hall Open • Proctoring Enforced
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-rose-700 dark:text-rose-400">
                          {formatRelativeNotice(test.startTime, test.endTime)} • Closes at {formatTime(test.endTime)}
                        </p>
                      </div>
                    )}

                    {isUpcoming && (
                      <div className="bg-academy-paper-subtle/80 dark:bg-surface-subtle/70 rounded-lg p-3 border border-academy-rule mb-4 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-academy-ink">
                          <Calendar size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>{formatDate(test.startTime)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-academy-ink-secondary">
                          <span className="font-mono text-[11px] text-academy-muted">
                            Opens {formatTime(test.startTime)}
                          </span>
                          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 font-mono">
                            {formatRelativeNotice(test.startTime, test.endTime)}
                          </span>
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-lg p-3 mb-4 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-800 dark:text-emerald-300 font-medium">Evaluation Complete</span>
                          <span className="font-mono text-[11px] text-academy-muted">
                            {formatDateTime(test.completedAttempt?.submittedAt || test.completedAttempt?.startedAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-academy-ink-secondary">
                          Official score submitted. Anti-cheat audit logged and verified.
                        </p>
                      </div>
                    )}

                    {isConcluded && (
                      <div className="bg-academy-paper-subtle/60 dark:bg-surface-subtle/40 border border-academy-rule rounded-lg p-3 mb-4 space-y-1">
                        <span className="block text-xs font-medium text-academy-ink">Examination Sitting Concluded</span>
                        <p className="text-[11px] font-mono text-academy-muted">
                          Window closed on {formatDate(test.endTime)} at {formatTime(test.endTime)}.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CARD FOOTER & ACTIONS */}
                  <div className="pt-3.5 border-t border-academy-rule-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-xs font-mono text-academy-muted tabular-nums">
                      {isLive
                        ? 'Proctoring gate ready'
                        : isUpcoming
                        ? `Opens ${formatTime(test.startTime)}`
                        : isCompleted
                        ? 'Grade recorded'
                        : 'Window ended'}
                    </span>

                    {/* Action button corresponding to state */}
                    {isLive && (
                      <button
                        type="button"
                        onClick={() => {
                          if (test.inProgressAttempt) {
                            navigate(
                              `/student/test/${test.id}?attemptId=${test.inProgressAttempt.id}&mode=MAIN`
                            );
                          } else {
                            startTest(test.id);
                          }
                        }}
                        disabled={startingTestId === test.id}
                        className="min-h-[44px] px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 apple-shimmer-btn active:scale-[0.96] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 disabled:opacity-60"
                        aria-label={
                          test.inProgressAttempt
                            ? `Resume examination for ${test.title}`
                            : `Enter examination hall for ${test.title}`
                        }
                      >
                        <span>
                          {startingTestId === test.id
                            ? 'Preparing Hall...'
                            : test.inProgressAttempt
                            ? 'Resume Exam'
                            : 'Enter Examination Hall'}
                        </span>
                        <ArrowUpRight size={14} />
                      </button>
                    )}

                    {isUpcoming && (
                      <button
                        type="button"
                        onClick={() => setInspectingTest(test)}
                        className="min-h-[44px] px-4 py-2.5 rounded-lg border border-academy-rule bg-white dark:bg-academy-card hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle text-academy-ink text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 active:scale-[0.98]"
                        aria-label={`Inspect syllabus for ${test.title}`}
                      >
                        <BookOpen size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Inspect Syllabus</span>
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          if (test.completedAttempt?.id) {
                            navigate(`/results/${test.completedAttempt.id}`);
                          } else {
                            navigate('/student/results');
                          }
                        }}
                        className="min-h-[44px] px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2"
                        aria-label={`Inspect scorecard for ${test.title}`}
                      >
                        <span>Inspect Scorecard</span>
                        <ArrowUpRight size={14} />
                      </button>
                    )}

                    {isConcluded && (
                      <button
                        type="button"
                        onClick={() => setInspectingTest(test)}
                        className="min-h-[44px] px-4 py-2.5 rounded-lg border border-academy-rule bg-white dark:bg-academy-card hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle text-academy-ink text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 active:scale-[0.98]"
                        aria-label={`Inspect syllabus for concluded exam ${test.title}`}
                      >
                        <BookOpen size={14} className="text-academy-muted" />
                        <span>Inspect Syllabus</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SYLLABUS & PROTOCOL INSPECTION MODAL ─────────────────────────────── */}
      {inspectingTest && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="syllabus-modal-title"
          className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setInspectingTest(null)}
        >
          <div
            className="bg-white dark:bg-academy-card w-full max-w-2xl rounded-2xl border border-academy-rule shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-academy-rule">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                  <BookOpen size={12} />
                  <span>Syllabus & Hall Directives</span>
                </div>
                <h2 id="syllabus-modal-title" className="font-serif text-2xl font-normal text-academy-ink">
                  {inspectingTest.title}
                </h2>
                <p className="text-xs text-academy-ink-secondary mt-1">
                  Subject Category: <span className="font-medium text-academy-ink">{inspectingTest.category || 'Core Subject'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTest(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle text-academy-muted hover:text-academy-ink transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2"
                aria-label="Close syllabus details"
              >
                <X size={18} />
              </button>
            </div>

            {/* Standard Fixed Rule Protocol Callout */}
            <div className="p-3.5 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/60 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 shrink-0">
                  <Sparkles size={14} aria-hidden="true" />
                </div>
                <div>
                  <span className="font-bold text-brand-900 dark:text-brand-200 block">Standardized Main Examination Protocol</span>
                  <span className="text-brand-700/90 dark:text-brand-300 text-[11px]">Strict 50 questions administered over exactly 60 minutes. Single synchronized attempt per candidate.</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-200/60 dark:bg-brand-900/80 text-brand-800 dark:text-brand-200 shrink-0">Fixed Rule</span>
            </div>

            {/* Key Examination Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-academy-paper-subtle dark:bg-surface-subtle border border-academy-rule">
                <span className="block text-[11px] font-mono text-academy-muted uppercase tracking-wider">Duration</span>
                <span className="font-semibold text-sm text-academy-ink">{inspectingTest.durationMinutes || 60} Mins</span>
              </div>
              <div className="p-3 rounded-lg bg-academy-paper-subtle dark:bg-surface-subtle border border-academy-rule">
                <span className="block text-[11px] font-mono text-academy-muted uppercase tracking-wider">Questions</span>
                <span className="font-semibold text-sm text-academy-ink">{inspectingTest.questionCount || 50} Items</span>
              </div>
              <div className="p-3 rounded-lg bg-academy-paper-subtle dark:bg-surface-subtle border border-academy-rule">
                <span className="block text-[11px] font-mono text-academy-muted uppercase tracking-wider">Difficulty</span>
                <span className="font-semibold text-sm text-academy-ink">{inspectingTest.difficultyLevel || 'Medium'}</span>
              </div>
              <div className="p-3 rounded-lg bg-academy-paper-subtle dark:bg-surface-subtle border border-academy-rule">
                <span className="block text-[11px] font-mono text-academy-muted uppercase tracking-wider">Proctoring</span>
                <span className="font-semibold text-sm text-academy-ink">Enforced</span>
              </div>
            </div>

            {/* Sitting Window Dates */}
            <div className="p-3.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-indigo-950 dark:text-indigo-200 block">Scheduled Sitting Window</span>
                <span className="text-indigo-700/80 dark:text-indigo-300">
                  {formatDate(inspectingTest.startTime)} • {formatTime(inspectingTest.startTime)} to {formatTime(inspectingTest.endTime)}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-academy-card px-2.5 py-1 rounded border border-violet-200 dark:border-violet-800 shrink-0">
                {formatRelativeNotice(inspectingTest.startTime, inspectingTest.endTime)}
              </span>
            </div>

            {/* Syllabus / Description Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-serif italic text-academy-ink uppercase tracking-wider">Curriculum & Scope Description</h3>
              <div className="p-4 rounded-lg bg-academy-paper-subtle/50 dark:bg-surface-subtle/30 border border-academy-rule text-xs sm:text-sm text-academy-ink leading-relaxed">
                {inspectingTest.description ? (
                  <p className="whitespace-pre-line">{inspectingTest.description}</p>
                ) : (
                  <div className="space-y-2 text-academy-ink-secondary">
                    <p>
                      This proctored evaluation assesses foundational and applied competencies in <strong className="text-academy-ink">{inspectingTest.category || 'the syllabus domain'}</strong>.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Core theoretical concepts and standard nomenclature</li>
                      <li>Analytical problem solving and scenario evaluation</li>
                      <li>Synthesis and application under timed examination constraints</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Candidate Directives & Integrity Standards */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-serif italic text-academy-ink uppercase tracking-wider">Candidate Directives & Integrity Standards</h3>
              <div className="space-y-2 text-xs text-academy-ink-secondary">
                <div className="flex items-start gap-2.5">
                  <Shield size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Full-screen proctoring is mandated. Exiting fullscreen or navigating to other tabs registers an infraction audit.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Server-synchronized countdown. Assessment automatically locks and submits when the window closes.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Draft responses are saved to the server in real-time on every question interaction.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-academy-rule flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setInspectingTest(null)}
                className="min-h-[44px] px-5 py-2.5 rounded-lg border border-academy-rule bg-academy-paper-subtle dark:bg-surface-subtle hover:bg-white dark:hover:bg-academy-card text-academy-ink text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2"
              >
                Close Details
              </button>
              {inspectingTest.statusGroup === 'LIVE' && (
                <button
                  type="button"
                  onClick={() => {
                    const testId = inspectingTest.id;
                    const attempt = inspectingTest.inProgressAttempt;
                    setInspectingTest(null);
                    if (attempt) {
                      navigate(`/student/test/${testId}?attemptId=${attempt.id}&mode=MAIN`);
                    } else {
                      startTest(testId);
                    }
                  }}
                  className="min-h-[44px] px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                >
                  <span>{inspectingTest.inProgressAttempt ? 'Resume Exam' : 'Enter Examination Hall'}</span>
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MainTestsPage;
