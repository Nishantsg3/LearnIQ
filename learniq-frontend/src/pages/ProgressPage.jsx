import React, { useEffect, useState, useMemo } from 'react';
import {
  Filter,
  ArrowUpRight,
  ChevronDown,
  Activity,
  TrendingUp,
  Award,
  ArrowLeft,
  CheckCircle2,
  Target,
  BarChart2,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Skeleton, MetricTileSkeleton, ChartSkeleton } from '../components/common/Skeleton';

const ProgressPage = () => {
  const navigate = useNavigate();
  const [allAttempts, setAllAttempts] = useState([]);
  const [availablePracticeTests, setAvailablePracticeTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attemptsRes, testsRes] = await Promise.all([
          api.get('/attempts/me'),
          api.get('/tests').catch(() => ({ data: [] }))
        ]);
        const rawData = Array.isArray(attemptsRes.data) ? attemptsRes.data : [];
        const rawTests = Array.isArray(testsRes.data) ? testsRes.data : [];
        const practiceOnly = rawTests.filter(t => (t.testType || t.type || '').toUpperCase() !== 'MAIN');
        setAvailablePracticeTests(practiceOnly);

        const submitted = rawData.filter(a =>
          a && (a.submitted === true || a.status === 'SUBMITTED')
        );
        const sorted = submitted
          .filter(a => a && typeof a.scorePercent === 'number' && !isNaN(a.scorePercent))
          .sort((a, b) => {
            const timeA = new Date(a.submittedAt || 0).getTime();
            const timeB = new Date(b.submittedAt || 0).getTime();
            return timeA - timeB;
          });
        setAllAttempts(sorted);
        if (sorted.length > 0) {
          setSelectedTest(String(sorted[0].testId));
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const uniqueTests = useMemo(() => {
    const map = new Map();
    allAttempts.forEach(a => {
      if (a && a.testId && !map.has(a.testId)) map.set(a.testId, a.testTitle || 'Untitled Assessment');
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [allAttempts]);

  const displayedAttempts = useMemo(() => {
    if (!selectedTest) return [];
    return allAttempts.filter(a => a && String(a.testId) === String(selectedTest));
  }, [allAttempts, selectedTest]);

  const recentAttempts = useMemo(() => {
    return displayedAttempts.slice(-5);
  }, [displayedAttempts]);

  const stats = useMemo(() => {
    if (displayedAttempts.length === 0) return { best: 0, latest: 0, count: 0, avg: 0 };
    const scores = displayedAttempts.map(a => Math.round(a.scorePercent || 0));
    const best = Math.max(...scores);
    const latest = scores[scores.length - 1];
    const avg = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    return { best, latest, count: scores.length, avg };
  }, [displayedAttempts]);

  const domainMastery = useMemo(() => {
    const map = {};
    allAttempts.forEach(a => {
      const cat = (a.category || 'General').toUpperCase();
      if (!map[cat]) map[cat] = { count: 0, sum: 0, best: 0 };
      map[cat].count += 1;
      const score = Math.round(a.scorePercent || 0);
      map[cat].sum += score;
      if (score > map[cat].best) map[cat].best = score;
    });
    return Object.entries(map).map(([name, item]) => ({
      name,
      attempts: item.count,
      avg: Math.round(item.sum / item.count),
      best: item.best
    })).sort((a, b) => b.attempts - a.attempts);
  }, [allAttempts]);

  // Compute lowest scoring subject with available drill tests (or lowest overall)
  const recommendedTarget = useMemo(() => {
    if (!domainMastery || domainMastery.length === 0) {
      return { name: 'JAVA', avg: 50, hasDrill: true };
    }

    // Sort ascending by average accuracy: lowest scores first
    const sortedByLowest = [...domainMastery].sort((a, b) => a.avg - b.avg);

    // Find the first lowest-scoring discipline that has an available practice test
    const candidateWithDrill = sortedByLowest.find(d =>
      availablePracticeTests.some(t => {
        const cat = (t.category || '').toUpperCase();
        return cat === d.name.toUpperCase() || cat.includes(d.name.toUpperCase());
      })
    );

    // If one has an available drill, recommend it; otherwise fallback to the lowest overall
    const target = candidateWithDrill || sortedByLowest[0];
    const hasDrill = availablePracticeTests.some(t => {
      const cat = (t.category || '').toUpperCase();
      return cat === target.name.toUpperCase() || cat.includes(target.name.toUpperCase());
    });

    return {
      name: target.name,
      avg: target.avg,
      hasDrill
    };
  }, [domainMastery, availablePracticeTests]);

  const selectedTestTitle = useMemo(() => {
    return uniqueTests.find(t => String(t.id) === String(selectedTest))?.title || 'Select Assessment';
  }, [uniqueTests, selectedTest]);

  useEffect(() => {
    const handleGlobalClick = () => setIsDropdownOpen(false);
    if (isDropdownOpen) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [isDropdownOpen]);


  return (
    <div className="h-full max-h-full overflow-hidden p-3.5 sm:p-4 lg:p-5 max-w-7xl mx-auto flex flex-col justify-between space-y-3 animate-in fade-in duration-200 motion-reduce:animate-none">

      {/* ── HEADER & TEST SELECTOR ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-academy-rule shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-academy-accent-tint border border-academy-accent/20 text-[10px] font-mono uppercase font-bold text-academy-accent dark:text-academy-accent-deep mb-0.5">
            <TrendingUp size={11} className="text-academy-accent dark:text-academy-accent-deep" aria-hidden="true" />
            <span>Longitudinal Mastery Analytics</span>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-academy-ink tracking-tight leading-tight">
            Progress Analytics
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2.5 w-full sm:w-auto">
          {/* Assessment Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="h-[44px] min-h-[44px] max-h-[44px] px-4 bg-white dark:bg-[#161a24] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500/80 dark:hover:border-violet-400/80 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#1c212e] hover:-translate-y-0.5 hover:shadow-md shadow-xs flex items-center gap-2.5 transition-all cursor-pointer w-full sm:w-auto min-w-0 sm:min-w-[200px] justify-between active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Filter size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{selectedTestTitle}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 dark:text-slate-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 sm:left-auto sm:right-0 mt-1.5 w-auto sm:w-72 bg-white dark:bg-[#161a24] border-2 border-slate-300 dark:border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#11141c]">
                  <p className="text-xs font-mono font-semibold uppercase text-slate-500 dark:text-slate-400 px-2">Filter by assessment</p>
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 custom-scrollbar">
                  {uniqueTests.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 dark:text-slate-400 text-center">No assessments found</div>
                  ) : (
                    uniqueTests.map(test => (
                      <button
                        key={test.id}
                        type="button"
                        onClick={() => {
                          setSelectedTest(String(test.id));
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          String(test.id) === String(selectedTest)
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c212e]'
                        }`}
                      >
                        <span className="truncate">{test.title}</span>
                        {String(test.id) === String(selectedTest) && <CheckCircle2 size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="h-[44px] min-h-[44px] max-h-[44px] px-4 rounded-xl bg-white dark:bg-[#161a24] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500/80 dark:hover:border-violet-400/80 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1c212e] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <ArrowLeft size={14} className="text-slate-500 dark:text-slate-400" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* ── STATS OVERVIEW CARDS ────────────────────────────────────────────── */}
      <div
        role={loading ? 'status' : undefined}
        aria-busy={loading ? 'true' : undefined}
        aria-label={loading ? 'Loading progress metrics' : undefined}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 tabular-nums"
      >
        {loading && <span className="sr-only">Loading progress metrics...</span>}
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <MetricTileSkeleton key={i} />
          ))
        ) : (
          <>
            <div className="bg-white/85 dark:bg-[#121520]/85 backdrop-blur-xl rounded-xl border border-slate-200/90 dark:border-white/10 p-3 shadow-2xs flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Latest Score</div>
              <div className="text-2xl font-mono font-extrabold text-academy-ink my-0.5">{stats.latest}%</div>
              <div className="text-[10px] text-slate-400 font-mono">Most recent attempt</div>
            </div>
            <div className="bg-white/85 dark:bg-[#121520]/85 backdrop-blur-xl rounded-xl border border-slate-200/90 dark:border-white/10 p-3 shadow-2xs flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Peak Score</div>
              <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 my-0.5">{stats.best}%</div>
              <div className="text-[10px] text-slate-400 font-mono">Historical apex</div>
            </div>
            <div className="bg-white/85 dark:bg-[#121520]/85 backdrop-blur-xl rounded-xl border border-slate-200/90 dark:border-white/10 p-3 shadow-2xs flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Average Accuracy</div>
              <div className="text-2xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400 my-0.5">{stats.avg}%</div>
              <div className="text-[10px] text-slate-400 font-mono">Mean across sittings</div>
            </div>
            <div className="bg-white/85 dark:bg-[#121520]/85 backdrop-blur-xl rounded-xl border border-slate-200/90 dark:border-white/10 p-3 shadow-2xs flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Recorded Sittings</div>
              <div className="text-2xl font-mono font-extrabold text-academy-ink my-0.5">{stats.count}</div>
              <div className="text-[10px] text-slate-400 font-mono">Verified evaluations</div>
            </div>
          </>
        )}
      </div>

      {/* ── TRAJECTORY SVG GRAPH CARD & DOMAIN MASTERY (STRICT 100VH BOUNDS) ─────────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch overflow-hidden">

        {/* Left Column: Visual Progression Curve (8 cols) */}
        <div className="lg:col-span-8 bg-white/85 dark:bg-[#121520]/85 backdrop-blur-xl rounded-2xl border border-slate-200/90 dark:border-white/10 p-4 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div>
              <h3 className="font-serif text-base font-bold text-academy-ink">Score Trajectory</h3>
              <p className="text-[11px] text-academy-ink-secondary leading-tight">Accuracy progression for {selectedTestTitle}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-mono font-semibold">
              <Activity size={12} />
              <span>Verified Trajectory</span>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col justify-center space-y-4 py-4 min-h-0">
              <div className="flex items-end justify-between gap-3 h-full px-4">
                {[30, 50, 45, 80, 65, 90, 75, 85].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <Skeleton className="w-full rounded-t-md" style={{ height: `${h}%` }} />
                    <Skeleton className="h-2 w-6 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : !selectedTest || allAttempts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2 min-h-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                <TrendingUp size={18} />
              </div>
              <h4 className="font-serif text-base font-bold text-academy-ink">No Assessment Records Yet</h4>
              <p className="text-xs text-academy-ink-secondary max-w-sm mx-auto font-normal leading-relaxed">
                Complete practice assessments to populate your score trajectory and diagnostic curves.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 1600 680"
                className="w-full h-full max-h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="barGradientViolet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                  <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                  <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#8b5cf6" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Grid Lines */}
                {[100, 75, 50, 25, 0].map((tick) => {
                  const y = 580 - (tick / 100) * 480;
                  return (
                    <g key={tick}>
                      <line x1="120" y1={y} x2="1520" y2={y} stroke="currentColor" className="text-academy-rule" strokeWidth="1" />
                      <text
                        x="90" y={y + 5}
                        fill="currentColor"
                        className="text-academy-muted font-mono"
                        fontSize="18" fontWeight="500"
                        textAnchor="end"
                      >
                        {tick}%
                      </text>
                    </g>
                  );
                })}

                {/* Data Points and Rounded Bars with interactive hover animations */}
                {recentAttempts.map((a, i) => {
                  const isHovered = hoveredBarIndex === i;
                  const barCount = recentAttempts.length;
                  const spacing = 1350 / (barCount + 1);
                  const x = 120 + spacing * (i + 1);
                  const barWidth = Math.min(140, spacing * 0.45);
                  const score = Math.round(a.scorePercent || 0);
                  const barHeight = Math.max(8, (score / 100) * 480);
                  const y = 580 - barHeight;

                  return (
                    <g
                      key={a.id || i}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredBarIndex(i)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Bar Background Track */}
                      <rect
                        x={x - barWidth / 2}
                        y={100}
                        width={barWidth}
                        height={480}
                        fill="currentColor"
                        className="text-slate-100/40 dark:text-white/[0.02]"
                        rx="8"
                      />

                      {/* Bar Fill */}
                      <rect
                        x={x - barWidth / 2}
                        y={isHovered ? y - 6 : y}
                        width={barWidth}
                        height={isHovered ? barHeight + 6 : barHeight}
                        fill={isHovered ? "url(#barGradientHover)" : "url(#barGradientViolet)"}
                        filter={isHovered ? "url(#barGlow)" : undefined}
                        rx="8"
                        className="transition-all duration-200"
                      />

                      {/* Score Value Above Bar */}
                      <text
                        x={x}
                        y={isHovered ? y - 20 : y - 14}
                        fill="currentColor"
                        className={`font-mono font-bold transition-all duration-200 ${
                          isHovered
                            ? 'text-indigo-600 dark:text-indigo-300'
                            : 'text-academy-ink'
                        }`}
                        fontSize={isHovered ? "26" : "22"}
                        textAnchor="middle"
                      >
                        {score}%
                      </text>

                      {/* Attempt Date / Label Below Bar */}
                      <text
                        x={x}
                        y={615}
                        fill="currentColor"
                        className={`font-mono transition-colors duration-200 ${
                          isHovered
                            ? 'text-indigo-600 dark:text-indigo-300 font-bold'
                            : 'text-academy-muted'
                        }`}
                        fontSize="15"
                        textAnchor="middle"
                      >
                        #{i + 1} • {new Date(a.submittedAt || a.startedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Right Column: Longitudinal Domain Mastery (4 cols) */}
        <div className="lg:col-span-4 bg-white/85 dark:bg-[#121520]/85 backdrop-blur-xl rounded-2xl border-2 border-slate-300 dark:border-white/20 p-4 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden justify-between">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#202532] shrink-0">
            <Target size={15} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-serif text-sm font-bold text-academy-ink">
              Subject Mastery Distribution
            </h3>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 my-1.5 pr-1">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20 rounded" />
                      <Skeleton className="h-3 w-12 rounded" />
                    </div>
                    <Skeleton className="h-4 w-10 rounded" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : domainMastery.length > 0 ? (
              domainMastery.map((item) => (
                <div key={item.name} className="p-2 rounded-xl bg-slate-50/70 dark:bg-[#181d28]/70 border border-slate-300/80 dark:border-white/10 space-y-1 tabular-nums">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {item.attempts} {item.attempts === 1 ? 'test' : 'tests'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Average accuracy</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.avg}%</span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.avg >= 70 ? 'bg-emerald-500' : item.avg >= 40 ? 'bg-indigo-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(item.avg, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Complete tests across different topics to generate mastery breakdowns.</p>
            )}
          </div>

          {/* Adaptive Focus Milestone Card dynamically recommending the lowest accuracy discipline */}
          <div className="my-1.5 p-3 rounded-xl bg-gradient-to-br from-indigo-50/70 via-violet-50/50 to-white dark:from-[#181d28] dark:via-[#1c2230] dark:to-[#141822] border-2 border-indigo-200/80 dark:border-indigo-900/50 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>Next Milestone Target</span>
              </span>
              <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                Apex Score: 100%
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Based on your accuracy trajectory ({recommendedTarget.avg}% avg), complete <strong className="text-indigo-700 dark:text-indigo-300 font-semibold">{recommendedTarget.name}</strong> drills to elevate your cumulative mastery quotient above 80%.
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono text-slate-400">Curriculum Recommendation</span>
              <button
                type="button"
                onClick={() => navigate(`/student/section1?category=${encodeURIComponent(recommendedTarget.name)}`)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[11px] font-semibold transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-xs border border-indigo-400/30"
              >
                Launch Drill →
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#202532] shrink-0">
            <button
              type="button"
              onClick={() => navigate('/student/results')}
              className="min-h-[44px] w-full py-2.5 px-4 rounded-xl border-2 border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 bg-white dark:bg-[#181d28] hover:bg-slate-100 dark:hover:bg-[#202634] hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] text-academy-ink text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>View All Results</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProgressPage;
