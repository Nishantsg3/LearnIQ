import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Clock,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Filter,
  BookOpen,
  Sparkles,
  Search,
  X,
  SlidersHorizontal,
  Loader2
} from 'lucide-react';
import api from '../utils/api';
import { CardSkeleton } from '../components/common/Skeleton';
import CustomSelect from '../components/common/CustomSelect';

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Most Relevant' },
  { value: 'duration-asc', label: 'Duration: Short to Long' },
  { value: 'duration-desc', label: 'Duration: Long to Short' },
  { value: 'questions-desc', label: 'Question Count' },
  { value: 'most-attempted', label: 'Most Attempted' }
];

const PracticePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingTestId, setStartingTestId] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('search')?.trim() || '');
  const [selectedCategory, setSelectedCategory] = useState(() => (searchParams.get('category') || 'ALL').toUpperCase());
  const [sortBy, setSortBy] = useState('relevant');

  // Sync state if URL search params change
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat.toUpperCase());
    }
    const q = searchParams.get('search');
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
      setDebouncedQuery(q.trim());
    }
  }, [searchParams]);

  // Debounce search input (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const startTest = async (testId) => {
    if (startingTestId) return;
    setStartingTestId(testId);

    try {
      const res = await api.post('/attempts/start', { testId });
      navigate(`/student/test/${testId}?attemptId=${res.data.attemptId}&mode=PRACTICE`);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.attemptId) {
        navigate(`/student/test/${testId}?attemptId=${err.response.data.attemptId}&mode=PRACTICE`);
        return;
      }
      toast.error('Failed to start test');
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
      setTests(Array.isArray(testsRes.data) ? testsRes.data : []);
      setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
    } catch {
      toast.error('Failed to load practice tests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getLatestAttempt = useCallback((testId) => {
    return attempts
      .filter(a => a.testId === testId && a.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0];
  }, [attempts]);

  const getCompletionCount = useCallback((testId) => {
    return attempts.filter(a => a.testId === testId && a.submitted).length;
  }, [attempts]);

  const practiceTests = useMemo(() => {
    return tests.filter(t => {
      const rawType = (t.testType || t.type || t.sectionType || '').toUpperCase();
      // Practice tests must NEVER appear as MAIN tests and vice-versa
      if (rawType === 'MAIN') return false;

      const isPractice = rawType === 'PRACTICE' || (!rawType && (t.sectionType || '').toUpperCase() === 'PRACTICE') || (!rawType && rawType !== 'MAIN');

      const statusUpper = (t.status || '').toUpperCase();
      // Draft / unpublished and archived tests must remain hidden
      if (statusUpper === 'ARCHIVED' || statusUpper === 'DRAFT' || statusUpper === 'UNPUBLISHED' || t.published === false || t.isPublished === false) {
        return false;
      }

      const isActive = statusUpper === 'ACTIVE' || statusUpper === 'LIVE' || statusUpper === 'PUBLISHED' || statusUpper === 'SCHEDULED' || t.active;
      const hasActiveAttempt = !!getLatestAttempt(t.id);
      return isPractice && (isActive || hasActiveAttempt);
    });
  }, [tests, getLatestAttempt]);

  // Discipline/Category pills with counts
  const categoriesWithCounts = useMemo(() => {
    const counts = { ALL: practiceTests.length };
    practiceTests.forEach(t => {
      const cat = (t.category || 'General').toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const uniqueCategories = Object.keys(counts).filter(c => c !== 'ALL');
    uniqueCategories.sort();

    return ['ALL', ...uniqueCategories].map(cat => ({
      name: cat,
      label: cat === 'ALL' ? 'All Disciplines' : cat,
      count: counts[cat] || 0
    }));
  }, [practiceTests]);

  // Filter and Sort Pipeline
  const filteredAndSortedTests = useMemo(() => {
    let list = practiceTests;

    // 1. Discipline Filter
    if (selectedCategory !== 'ALL') {
      list = list.filter(t => (t.category || 'General').toUpperCase() === selectedCategory);
    }

    // 2. Debounced Search (title, category, description)
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(t => {
        const titleMatch = (t.title || '').toLowerCase().includes(q);
        const categoryMatch = (t.category || '').toLowerCase().includes(q);
        const descriptionMatch = (t.description || '').toLowerCase().includes(q);
        return titleMatch || categoryMatch || descriptionMatch;
      });
    }

    // 3. Sorting Logic
    return [...list].sort((a, b) => {
      const attemptA = getLatestAttempt(a.id);
      const attemptB = getLatestAttempt(b.id);
      const completedA = getCompletionCount(a.id);
      const completedB = getCompletionCount(b.id);

      switch (sortBy) {
        case 'duration-asc':
          return (a.durationMinutes || 10) - (b.durationMinutes || 10);
        case 'duration-desc':
          return (b.durationMinutes || 10) - (a.durationMinutes || 10);
        case 'questions-desc':
          return (b.questionCount || 10) - (a.questionCount || 10);
        case 'most-attempted':
          return completedB - completedA;
        case 'relevant':
        default: {
          // Prioritize in-progress attempts, then highest completed, then most recently created/updated
          if (attemptA && !attemptB) return -1;
          if (!attemptA && attemptB) return 1;
          if (completedB !== completedA) return completedB - completedA;
          return (b.id || 0) - (a.id || 0);
        }
      }
    });
  }, [practiceTests, selectedCategory, debouncedQuery, sortBy, getLatestAttempt, getCompletionCount]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSortBy('relevant');
  };

  return (
    <div className="h-full overflow-y-auto p-5 sm:p-7 lg:p-9 max-w-7xl mx-auto flex flex-col space-y-6 animate-in fade-in duration-200 motion-reduce:animate-none">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#262a33]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-medium text-[#6366F1] dark:text-[#A5B4FC] mb-2.5">
            <Sparkles size={13} className="text-[#6366F1] dark:text-[#A5B4FC]" aria-hidden="true" />
            <span>Formative Curriculum • Self-Paced Drills</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Practice Modules
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl font-normal leading-relaxed">
            Diagnostic problem drills with instant derivations, cohort benchmarks, and zero penalty to cumulative standing.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto self-end">
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white dark:bg-[#15181e] hover:bg-slate-100 dark:hover:bg-[#1c2027] border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:-translate-y-0.5 text-slate-700 dark:text-slate-200 active:scale-[0.98] text-xs sm:text-sm font-medium shadow-xs hover:shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015]"
            title="Refresh list"
            aria-label="Refresh practice tests"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#6366F1] dark:text-[#A5B4FC]' : 'text-slate-400'} aria-hidden="true" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white dark:bg-[#15181e] hover:bg-slate-100 dark:hover:bg-[#1c2027] border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:-translate-y-0.5 text-slate-700 dark:text-slate-200 active:scale-[0.98] text-xs sm:text-sm font-medium shadow-xs hover:shadow-sm flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015]"
          >
            <ArrowLeft size={14} className="text-slate-400" aria-hidden="true" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & FILTER ARCHITECTURE ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Debounced Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drills by title, discipline, topic..."
              aria-label="Search practice drills"
              className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#15181e] border-2 border-slate-300 dark:border-white/20 hover:border-[#6366F1] dark:hover:border-[#818CF8] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015] shadow-xs hover:shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] justify-center transition-colors cursor-pointer"
                aria-label="Clear search input"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <CustomSelect
              id="sort-select"
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              icon={SlidersHorizontal}
              ariaLabel="Sort practice tests by"
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Discipline / Category Filter Pills */}
        {categoriesWithCounts.length > 1 && (
          <div
            role="region"
            aria-label="Filter by discipline"
            className="flex items-center gap-2 overflow-x-auto pt-2 pb-2 -my-2 px-1 no-scrollbar scroll-smooth"
          >
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1 shrink-0">
              <Filter size={12} className="text-[#6366F1] dark:text-[#A5B4FC]" aria-hidden="true" />
              <span>Discipline:</span>
            </span>
            {categoriesWithCounts.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 inline-flex items-center gap-2 cursor-pointer active:scale-[0.98] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015] ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white shadow-md shadow-indigo-500/25 border-2 border-[#818CF8] font-bold'
                      : 'bg-white dark:bg-[#15181e] border-2 border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-[#6366F1] dark:hover:border-[#818CF8] hover:shadow-sm'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono tabular-nums ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-[#1c2027] text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CONTENT AREA ────────────────────────────────────────────────────── */}
      <div>
        {loading ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="Loading practice tests"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            <span className="sr-only">Loading practice tests...</span>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : practiceTests.length === 0 ? (
          /* Empty Catalog State (Zero practice tests in database) */
          <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-slate-300/90 dark:border-white/15 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs my-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#1a1d24] border border-slate-300/80 dark:border-white/15 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto">
              <BookOpen size={24} aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl font-normal text-slate-900 dark:text-slate-100">
                No Practice Modules Available
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Formative problem sets and practice drills will appear here once published by curriculum instructors.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#818CF8] hover:from-[#4F46E5] hover:to-[#6366F1] hover:-translate-y-0.5 text-white text-xs sm:text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015]"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : filteredAndSortedTests.length === 0 ? (
          /* Empty Filter/Search Result State */
          <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-slate-300/90 dark:border-white/15 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs my-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-[#6366F1] dark:text-[#A5B4FC] mx-auto">
              <Search size={24} aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl font-normal text-slate-900 dark:text-slate-100">
                No Matching Practice Drills
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                No drills matched {debouncedQuery ? <span>&ldquo;{debouncedQuery}&rdquo;</span> : 'your active filters'}. Try clearing filters or revising your query.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#818CF8] hover:from-[#4F46E5] hover:to-[#6366F1] hover:-translate-y-0.5 text-white text-xs sm:text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015]"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          /* Practice Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredAndSortedTests.map((test, index) => {
              const latestAttempt = getLatestAttempt(test.id);
              const completedCount = getCompletionCount(test.id);

              return (
                <div
                  key={test.id}
                  className={`group relative bg-white dark:bg-[#15181e] hover:dark:bg-[#1c2027] rounded-2xl border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] animate-apple-row-${(index % 5) + 1}`}
                >
                  <div>
                    {/* Top Row: Category Chip & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                        {test.category || 'General Practice'}
                      </span>

                      {latestAttempt ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-xs font-mono font-medium text-amber-700 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                          <span>In Progress</span>
                        </span>
                      ) : completedCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 tabular-nums">
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          <span>{completedCount} completed</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Drill Title */}
                    <h3 className="font-serif text-lg sm:text-xl font-normal text-slate-900 dark:text-slate-100 group-hover:text-[#6366F1] dark:group-hover:text-[#A5B4FC] transition-colors leading-snug mb-2">
                      {test.title}
                    </h3>

                    {/* Drill Description */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {test.description || 'Self-paced diagnostic drill with instant derivations and solution keys.'}
                    </p>

                    {/* Key Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      {/* Duration */}
                      <div className="inline-flex items-center gap-1.5 bg-slate-100/80 dark:bg-[#1a1d24] px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-[#262a33] text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        <Clock size={13} className="text-[#6366F1] dark:text-[#A5B4FC]" aria-hidden="true" />
                        <span>{test.durationMinutes || 10}m</span>
                      </div>

                      {/* Question Count */}
                      <div className="inline-flex items-center gap-1.5 bg-slate-100/80 dark:bg-[#1a1d24] px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-[#262a33] text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        <FileText size={13} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        <span>{test.questionCount || 10} items</span>
                      </div>

                      {/* Untimed Drill Badge */}
                      <div className="inline-flex items-center gap-1.5 bg-slate-100/80 dark:bg-[#1a1d24] px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-[#262a33] text-xs font-mono text-slate-600 dark:text-slate-300">
                        <ShieldCheck size={13} className="text-[#6366F1] dark:text-[#A5B4FC]" aria-hidden="true" />
                        <span>Self-paced drill</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-[#262a33] flex items-center justify-between gap-3">
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {latestAttempt ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Session saved</span>
                      ) : (
                        <span>Self-paced</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (latestAttempt) {
                          navigate(`/student/test/${test.id}?attemptId=${latestAttempt.id}&mode=PRACTICE`);
                        } else {
                          startTest(test.id);
                        }
                      }}
                      disabled={startingTestId === test.id}
                      className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 apple-shimmer-btn active:scale-[0.96] transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015] disabled:opacity-60 disabled:cursor-not-allowed ${
                        latestAttempt
                          ? 'bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500'
                          : 'bg-gradient-to-r from-[#6366F1] to-[#818CF8] hover:from-[#4F46E5] hover:to-[#6366F1] text-white focus-visible:ring-indigo-600'
                      }`}
                    >
                      {startingTestId === test.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-white" aria-hidden="true" />
                          <span>Initializing...</span>
                        </>
                      ) : (
                        <>
                          <span>{latestAttempt ? 'Resume Drill' : completedCount > 0 ? 'Retake Practice Drill' : 'Start Practice Drill'}</span>
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Continuous Mastery Pedagogical Briefing Card */}
            <div className="bg-slate-50/70 dark:bg-[#15181e]/60 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                  <ShieldCheck size={16} className="text-[#6366F1] dark:text-[#A5B4FC]" aria-hidden="true" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300">Pedagogical Framework</span>
                </div>
                <h4 className="font-serif text-lg font-normal text-slate-900 dark:text-slate-100 leading-tight mb-2">
                  Continuous Mastery Drills
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  Practice assessments do not penalize your academic record. Draft answers are automatically saved to your session, allowing you to pause, research references, and resume anytime.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-[#262a33] flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500 dark:text-slate-400">Need diagnostic review?</span>
                <button
                  type="button"
                  onClick={() => navigate('/student/results')}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[#6366F1] dark:text-[#A5B4FC] hover:-translate-y-0.5 shadow-xs transition-all cursor-pointer font-semibold inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                >
                  <span>Open scorecards</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticePage;
