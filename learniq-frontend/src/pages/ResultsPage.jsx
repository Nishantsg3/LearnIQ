import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  History,
  FileText,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Trash2,
  Zap,
  ArrowLeft,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  BarChart2,
  RotateCcw,
  AlertCircle,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import api from '../utils/api';
import { TableSkeleton, SkeletonRegion, Skeleton } from '../components/common/Skeleton';
import ConfirmModal from '../components/ConfirmModal';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeType, setActiveType] = useState('MAIN');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const attemptsRes = await api.get('/attempts/me');
      setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
    } catch {
      setError('Unable to load assessment history. Please check your connection and try again.');
      toast.error('Failed to load results history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chronologically order attempts to calculate sitting/attempt numbers accurately
  const numberedAttempts = useMemo(() => {
    const sorted = [...attempts].sort((a, b) => {
      const t1 = new Date(a.submittedAt || a.startedAt || 0).getTime();
      const t2 = new Date(b.submittedAt || b.startedAt || 0).getTime();
      return t1 - t2;
    });

    const counts = {};
    return sorted.map(a => {
      counts[a.testId] = (counts[a.testId] || 0) + 1;
      return { ...a, attemptNumber: counts[a.testId] };
    });
  }, [attempts]);

  const officialAttempts = useMemo(() => {
    return numberedAttempts.filter(a => ((a.testType || a.mode || '').toUpperCase() === 'MAIN'));
  }, [numberedAttempts]);

  const practiceAttempts = useMemo(() => {
    return numberedAttempts.filter(a => ((a.testType || a.mode || '').toUpperCase() === 'PRACTICE'));
  }, [numberedAttempts]);

  // Aggregate telemetry strip computed across active segment
  const ledgerMetrics = useMemo(() => {
    const targetAttempts = activeType === 'MAIN' ? officialAttempts : practiceAttempts;
    const submitted = targetAttempts.filter(isSubmitted);
    const totalCount = targetAttempts.length;
    const submittedCount = submitted.length;

    // Overall accuracy
    const avgAccuracy = submittedCount > 0
      ? Math.round(submitted.reduce((sum, a) => sum + (Number(a.scorePercent) || 0), 0) / submittedCount)
      : 0;

    // Total questions attempted
    const totalQuestions = targetAttempts.reduce((sum, a) => {
      const qCount = Number(a.attemptedCount) ||
        ((Number(a.correctCount) || 0) + (Number(a.wrongCount) || 0)) ||
        Number(a.totalQuestions) || 0;
      return sum + qCount;
    }, 0);

    // Completion rate
    const completionRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

    // Historical Performance Score Trend
    const chronoScores = submitted.map(a => ({
      score: Math.round(Number(a.scorePercent) || 0),
      date: a.submittedAt || a.startedAt,
      id: a.id
    }));

    let trendDelta = 0;
    let trendDirection = 'flat';
    if (chronoScores.length >= 2) {
      const mid = Math.floor(chronoScores.length / 2);
      const earlier = chronoScores.slice(0, mid);
      const recent = chronoScores.slice(mid);
      const avgEarlier = earlier.reduce((s, x) => s + x.score, 0) / earlier.length;
      const avgRecent = recent.reduce((s, x) => s + x.score, 0) / recent.length;
      trendDelta = Math.round(avgRecent - avgEarlier);
      if (trendDelta > 1) trendDirection = 'up';
      else if (trendDelta < -1) trendDirection = 'down';
    }

    return {
      totalCount,
      submittedCount,
      avgAccuracy,
      totalQuestions,
      completionRate,
      trendDelta,
      trendDirection,
      recentScores: chronoScores.slice(-6)
    };
  }, [activeType, officialAttempts, practiceAttempts]);

  // Subject/category performance distribution breakdown
  const categoryBreakdown = useMemo(() => {
    const targetAttempts = activeType === 'MAIN' ? officialAttempts : practiceAttempts;
    const submitted = targetAttempts.filter(isSubmitted);
    if (submitted.length === 0) return [];

    const map = {};
    submitted.forEach(a => {
      const rawCat = a.category || (a.test && a.test.category) || 'General';
      const cat = rawCat.trim().charAt(0).toUpperCase() + rawCat.trim().slice(1);
      if (!map[cat]) {
        map[cat] = {
          name: cat,
          attempts: 0,
          totalScore: 0,
          bestScore: 0
        };
      }
      const score = Math.round(Number(a.scorePercent) || 0);
      map[cat].attempts += 1;
      map[cat].totalScore += score;
      if (score > map[cat].bestScore) {
        map[cat].bestScore = score;
      }
    });

    return Object.values(map).map(item => ({
      ...item,
      avgScore: Math.round(item.totalScore / item.attempts)
    })).sort((a, b) => b.attempts - a.attempts);
  }, [activeType, officialAttempts, practiceAttempts]);

  // Ordered list for display in ledger
  const displayedAttempts = useMemo(() => {
    const list = activeType === 'MAIN' ? officialAttempts : practiceAttempts;
    return [...list].reverse();
  }, [activeType, officialAttempts, practiceAttempts]);

  const handleDeleteTrigger = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/attempts/${deletingId}`);
      toast.success('Attempt deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingId(null);
      fetchData();
    } catch {
      toast.error('Failed to delete attempt');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-5 sm:p-7 lg:p-9 max-w-7xl mx-auto flex flex-col space-y-7 animate-in fade-in duration-200 motion-reduce:animate-none">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-academy-rule w-full">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-academy-accent-tint border border-academy-accent/20 text-xs font-serif italic text-academy-accent dark:text-academy-accent-deep mb-2">
            <History size={13} className="text-academy-accent dark:text-academy-accent-deep" aria-hidden="true" />
            <span>Academic Ledger • Formal Assessment History</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-academy-ink tracking-tight leading-tight">
            Assessment Results
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-academy-ink-secondary max-w-2xl font-normal leading-relaxed">
            Review completed evaluations, audit correct answer keys, inspect longitudinal mastery, and export verified scorecards.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Segmented Switch matching Main Examination style */}
          <div
            role="tablist"
            aria-label="Assessment Type Switch"
            className="flex items-center gap-1.5 p-1.5 rounded-xl bg-academy-paper-subtle/80 dark:bg-surface-subtle/70 border-2 border-slate-300 dark:border-white/20 shadow-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeType === 'MAIN'}
              onClick={() => setActiveType('MAIN')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                activeType === 'MAIN'
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white shadow-md shadow-indigo-500/25 border-2 border-[#818CF8] font-bold'
                  : 'text-academy-ink-secondary hover:text-academy-ink border-2 border-transparent hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-academy-card hover:shadow-sm'
              }`}
            >
              <span>MAIN Exams</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                  activeType === 'MAIN'
                    ? 'bg-white/20 text-white'
                    : 'bg-academy-rule/40 text-academy-muted'
                }`}
              >
                {officialAttempts.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeType === 'PRACTICE'}
              onClick={() => setActiveType('PRACTICE')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                activeType === 'PRACTICE'
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white shadow-md shadow-indigo-500/25 border-2 border-[#818CF8] font-bold'
                  : 'text-academy-ink-secondary hover:text-academy-ink border-2 border-transparent hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-academy-card hover:shadow-sm'
              }`}
            >
              <span>Practice Tests</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                  activeType === 'PRACTICE'
                    ? 'bg-white/20 text-white'
                    : 'bg-academy-rule/40 text-academy-muted'
                }`}
              >
                {practiceAttempts.length}
              </span>
            </button>
          </div>

          {/* Dashboard Button positioned on totally right side with matching height */}
          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            aria-label="Return to Student Dashboard"
            className="min-h-[44px] h-[52px] sm:h-[60px] px-4 rounded-xl bg-white dark:bg-academy-card border-2 border-slate-300 dark:border-white/20 hover:border-[#6366F1] dark:hover:border-[#818CF8] text-academy-ink hover:bg-slate-100 dark:hover:bg-[#1c2027] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] sm:ml-2"
          >
            <ArrowLeft size={15} className="text-academy-muted" aria-hidden="true" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* ── ERROR STATE ──────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div
          role="alert"
          className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
              <AlertCircle size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">Unable to load ledger</h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-md bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* ── LOADING SKELETON ─────────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonRegion ariaLabel="Loading academic ledger..." className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-36" />
              </div>
            ))}
          </div>
          <TableSkeleton rows={5} columns={5} />
        </SkeletonRegion>
      ) : (
        <>
          {/* ── AGGREGATE ANALYTICS STRIP ────────────────────────────────────── */}
          <section aria-label="Performance Metrics Strip" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* 1. Overall Accuracy */}
            <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-serif italic text-academy-muted mb-2">
                  <span>Overall Accuracy</span>
                  <Target size={15} className="text-academy-accent dark:text-academy-accent-deep" aria-hidden="true" />
                </div>
                <div className="text-3xl font-mono font-bold text-academy-ink tabular-nums">
                  {ledgerMetrics.avgAccuracy}%
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-academy-rule-subtle flex items-center justify-between text-xs text-academy-ink-secondary">
                <span>Evaluations completed</span>
                <span className="font-mono font-medium text-academy-ink">{ledgerMetrics.submittedCount} of {ledgerMetrics.totalCount}</span>
              </div>
            </div>

            {/* 2. Questions Attempted */}
            <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-serif italic text-academy-muted mb-2">
                  <span>Questions Attempted</span>
                  <FileText size={15} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </div>
                <div className="text-3xl font-mono font-bold text-academy-ink tabular-nums">
                  {ledgerMetrics.totalQuestions}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-academy-rule-subtle flex items-center justify-between text-xs text-academy-ink-secondary">
                <span>Cohort context</span>
                <span className="font-mono font-medium text-academy-ink">Cumulative</span>
              </div>
            </div>

            {/* 3. Completion Rate */}
            <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-serif italic text-academy-muted mb-2">
                  <span>Completion Rate</span>
                  <CheckCircle2 size={15} className="text-academy-accent dark:text-academy-accent-deep" aria-hidden="true" />
                </div>
                <div className="text-3xl font-mono font-bold text-academy-ink tabular-nums">
                  {ledgerMetrics.completionRate}%
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-academy-rule-subtle flex items-center justify-between text-xs text-academy-ink-secondary">
                <span>Submitted vs abandoned</span>
                <span className={`font-mono text-xs font-semibold ${
                  ledgerMetrics.completionRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {ledgerMetrics.completionRate >= 80 ? 'High Discipline' : 'Needs Follow-through'}
                </span>
              </div>
            </div>

            {/* 4. Score Trajectory Trend */}
            <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-serif italic text-academy-muted mb-2">
                  <span>Performance Trend</span>
                  {ledgerMetrics.trendDirection === 'up' && (
                    <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  )}
                  {ledgerMetrics.trendDirection === 'down' && (
                    <TrendingDown size={15} className="text-rose-600 dark:text-rose-400" aria-hidden="true" />
                  )}
                  {ledgerMetrics.trendDirection === 'flat' && (
                    <Minus size={15} className="text-academy-muted" aria-hidden="true" />
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-bold text-academy-ink tabular-nums">
                    {ledgerMetrics.trendDelta > 0 ? `+${ledgerMetrics.trendDelta}%` : `${ledgerMetrics.trendDelta}%`}
                  </span>
                  <span className="text-xs font-serif italic text-academy-muted">
                    {ledgerMetrics.trendDirection === 'up' ? 'Ascending' : ledgerMetrics.trendDirection === 'down' ? 'Declining' : 'Stable'}
                  </span>
                </div>
              </div>

              {/* Sparkline mini-chips */}
              <div className="mt-3 pt-3 border-t border-academy-rule-subtle flex items-center justify-between">
                <span className="text-[11px] text-academy-muted font-mono">Recent sittings:</span>
                <div className="flex items-center gap-1">
                  {ledgerMetrics.recentScores.length === 0 ? (
                    <span className="text-[11px] text-academy-muted font-mono">No data</span>
                  ) : (
                    ledgerMetrics.recentScores.map((s, idx) => (
                      <span
                        key={idx}
                        title={`Attempt score: ${s.score}%`}
                        className={`w-5 h-5 rounded text-[10px] font-mono flex items-center justify-center font-bold ${
                          s.score >= 40
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                        }`}
                      >
                        {s.score >= 40 ? '✓' : '✗'}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

          </section>

          {/* ── SUBJECT / CATEGORY PERFORMANCE DISTRIBUTION ────────────────── */}
          {categoryBreakdown.length > 0 && (
            <section aria-label="Subject Performance Distribution" className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-academy-rule pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-academy-accent-tint border border-academy-accent/20 flex items-center justify-center text-academy-accent dark:text-academy-accent-deep">
                    <Layers size={14} aria-hidden="true" />
                  </div>
                  <h2 className="font-serif text-base sm:text-lg font-normal text-academy-ink">
                    Subject & Category Mastery Breakdown
                  </h2>
                </div>
                <span className="text-xs font-mono text-academy-muted">
                  {categoryBreakdown.length} {categoryBreakdown.length === 1 ? 'Domain Tracked' : 'Domains Tracked'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {categoryBreakdown.map(cat => {
                  const passTier = cat.avgScore >= 75 ? 'Proficient' : cat.avgScore >= 40 ? 'Competent' : 'Developing';
                  const barColor = cat.avgScore >= 75
                    ? 'bg-emerald-500'
                    : cat.avgScore >= 40
                      ? 'bg-academy-accent dark:bg-academy-accent-deep'
                      : 'bg-rose-500';

                  return (
                    <div
                      key={cat.name}
                      className="bg-academy-paper-subtle/50 dark:bg-surface-subtle/50 rounded-lg border border-academy-rule p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-academy-ink truncate">{cat.name}</h3>
                          <span className="text-xs font-mono text-academy-muted">
                            {cat.attempts} {cat.attempts === 1 ? 'sitting' : 'sittings'} evaluated
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                          cat.avgScore >= 40
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                        }`}>
                          {cat.avgScore}% Avg
                        </span>
                      </div>

                      {/* Visual progress bar */}
                      <div className="space-y-1">
                        <div
                          role="progressbar"
                          aria-valuenow={cat.avgScore}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-label={`${cat.name} mastery progress`}
                          className="w-full h-2 rounded-full bg-academy-paper-subtle dark:bg-surface-elevated overflow-hidden border border-academy-rule/40"
                        >
                          <div
                            style={{ width: `${Math.min(100, Math.max(0, cat.avgScore))}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-academy-muted pt-0.5">
                          <span>Mastery: <span className="text-academy-ink font-medium">{passTier}</span></span>
                          <span>Peak: <span className="text-academy-ink font-medium">{cat.bestScore}%</span></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── ACADEMIC LEDGER CARD ─────────────────────────────────────────── */}
          <section
            aria-label="Assessment History Records"
            className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule shadow-2xs overflow-hidden flex flex-col"
          >
            {/* Table Header (Desktop & Tablet) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-academy-paper-subtle/80 dark:bg-surface-subtle border-b border-academy-rule text-xs font-serif italic text-academy-muted">
              <div className="col-span-5">Assessment Title & Sitting</div>
              <div className="col-span-2 text-center">Subject Domain</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-center">Score</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* List Body */}
            {displayedAttempts.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-academy-paper-subtle dark:bg-surface-subtle border border-academy-rule text-academy-accent flex items-center justify-center mx-auto shadow-2xs">
                  <History size={26} aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-normal text-academy-ink">
                    {`No ${activeType === 'MAIN' ? 'MAIN Exam' : 'Practice Test'} records recorded`}
                  </h3>
                  <p className="text-xs text-academy-ink-secondary max-w-md mx-auto leading-relaxed font-normal">
                    {activeType === 'MAIN'
                      ? 'MAIN exams are formal scheduled sittings. View active or upcoming assessments in the exam catalog.'
                      : 'Practice tests provide self-paced mastery exercises with instant feedback.'}
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(activeType === 'MAIN' ? '/student/section2' : '/student/section1')}
                    className="min-h-[44px] px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 bg-academy-accent hover:bg-academy-accent-hover text-white rounded-md shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
                  >
                    <span>{activeType === 'MAIN' ? 'Browse MAIN Exams' : 'Start Practice Tests'}</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-academy-rule-subtle">
                {displayedAttempts.map(attempt => {
                  const submitted = isSubmitted(attempt);
                  const score = Math.round(Number(attempt.scorePercent) || 0);
                  const pass = score >= 40;
                  const categoryTag = attempt.category || (attempt.test && attempt.test.category) || 'General';

                  return (
                    <div
                      key={attempt.id}
                      className="p-4 sm:px-6 sm:py-4 hover:bg-academy-paper-subtle/50 dark:hover:bg-surface-subtle/50 transition-colors"
                    >
                      {/* Desktop & Tablet Row (md+) */}
                      <div className="hidden md:grid grid-cols-12 gap-4 items-center">

                        {/* Title & Attempt metadata */}
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-academy-accent-tint border border-academy-accent/20 flex items-center justify-center text-academy-accent dark:text-academy-accent-deep shrink-0 shadow-2xs">
                            <FileText size={18} aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-academy-ink truncate" title={attempt.testTitle}>
                              {attempt.testTitle}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-academy-muted font-mono">
                              <span className="font-semibold text-academy-accent dark:text-academy-accent-deep">
                                Sitting #{attempt.attemptNumber}
                              </span>
                              <span>•</span>
                              <span>{formatDateTime(attempt.submittedAt || attempt.startedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Subject Domain */}
                        <div className="col-span-2 flex justify-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-academy-paper-subtle dark:bg-surface-subtle border border-academy-rule text-academy-ink truncate max-w-[140px]" title={categoryTag}>
                            {categoryTag}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="col-span-2 flex justify-center">
                          {submitted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                              <CheckCircle2 size={13} aria-hidden="true" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                              <Zap size={13} aria-hidden="true" />
                              <span>In Progress</span>
                            </span>
                          )}
                        </div>

                        {/* Accuracy Score */}
                        <div className="col-span-1 flex justify-center">
                          {submitted ? (
                            <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold border tabular-nums ${
                              pass
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                            }`}>
                              {score}%
                            </span>
                          ) : (
                            <span className="text-academy-muted text-xs font-mono">—</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex justify-end items-center gap-2">
                          {activeType !== 'MAIN' && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTrigger(e, attempt.id)}
                              aria-label={`Delete record for ${attempt.testTitle}`}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-academy-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                              title="Delete Record"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/results/${attempt.id}`)}
                            aria-label={`View Report for ${attempt.testTitle}`}
                            className="min-h-[44px] px-4 py-2 text-xs rounded-xl border border-slate-300/90 dark:border-white/15 bg-white dark:bg-academy-card text-academy-ink hover:bg-slate-100 dark:hover:bg-[#1c2027] hover:border-slate-400 dark:hover:border-white/30 hover:-translate-y-0.5 hover:shadow-sm inline-flex items-center gap-1.5 font-semibold shadow-xs transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
                          >
                            <span>View Report</span>
                            <ChevronRight size={13} aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Mobile Card (below md) */}
                      <div className="md:hidden flex flex-col space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-academy-accent-tint border border-academy-accent/20 flex items-center justify-center text-academy-accent dark:text-academy-accent-deep shrink-0">
                              <FileText size={16} aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-semibold text-academy-ink leading-snug truncate">
                                {attempt.testTitle}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-mono text-academy-muted">
                                <span className="font-semibold text-academy-accent dark:text-academy-accent-deep">
                                  Sitting #{attempt.attemptNumber}
                                </span>
                                <span>•</span>
                                <span className="truncate">{categoryTag}</span>
                              </div>
                            </div>
                          </div>

                          {submitted ? (
                            <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold border shrink-0 ${
                              pass
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                            }`}>
                              {score}%
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40 shrink-0">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-academy-rule-subtle">
                          <span className="text-[11px] font-mono text-academy-muted">
                            {formatDateTime(attempt.submittedAt || attempt.startedAt)}
                          </span>

                          <div className="flex items-center gap-2">
                            {activeType !== 'MAIN' && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTrigger(e, attempt.id)}
                                aria-label={`Delete record for ${attempt.testTitle}`}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-academy-muted hover:text-rose-600 rounded-md"
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => navigate(`/results/${attempt.id}`)}
                              aria-label={`View Report for ${attempt.testTitle}`}
                              className="min-h-[44px] px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 bg-gradient-to-r from-[#6366F1] to-[#818CF8] hover:from-[#4F46E5] hover:to-[#6366F1] hover:-translate-y-0.5 hover:shadow-sm text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                            >
                              <span>Report</span>
                              <ChevronRight size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Ledger Footer */}
            <div className="px-6 py-3.5 bg-academy-paper-subtle/50 dark:bg-surface-subtle/50 border-t border-academy-rule flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-academy-muted font-medium">
              <span>{displayedAttempts.length} of {activeType === 'MAIN' ? officialAttempts.length : practiceAttempts.length} {activeType === 'MAIN' ? 'Official Exam' : 'Practice Drill'} Records</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>Deterministic Verification Hash</span>
              </span>
            </div>
          </section>
        </>
      )}

      {/* ── DELETE MODAL ────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Assessment Record?"
        message="This evaluation attempt will be permanently excised from your academic ledger. This action cannot be reversed."
        confirmText="Yes, Delete Record"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ResultsPage;
