import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Skeleton, MetricTileSkeleton } from '../components/common/Skeleton';
import {
  Users,
  TrendingUp,
  Award,
  Activity,
  Clock,
  Target,
  Percent,
  Zap,
  ArrowLeft,
  Trophy,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackToDashboard from '../components/admin/BackToDashboard';

export default function AdminAnalytics() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isPracticeNotice, setIsPracticeNotice] = useState(false);

  const fetchAnalytics = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
      }
      setIsPracticeNotice(false);

      const res = await api.get(`/admin/tests/${testId}/analytics`);
      if (res.data) {
        setData(res.data);
      } else {
        throw new Error("Empty dataset received from analytics service");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      const isUnsupportedPractice =
        err.response?.status === 400 &&
        (typeof errorMsg === 'string' && (errorMsg.includes('only available for MAIN') || errorMsg.includes('MAIN tests')));

      if (isUnsupportedPractice) {
        setIsPracticeNotice(true);
      } else {
        setError(errorMsg || 'Failed to fetch examination telemetry');
        if (!isSilent) toast.error(errorMsg || 'Failed to fetch examination telemetry');
      }
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ── PRACTICE NOTICE (PEDAGOGICAL BANNER) ──────────────────────────────────
  if (!loading && isPracticeNotice) {
    return (
      <div className="h-full overflow-y-auto p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto flex flex-col justify-center items-center animate-in fade-in duration-200">
        <div className="w-full p-8 text-center space-y-6 bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200/90 dark:border-[#262a33] shadow-xs">
          <div className="w-14 h-14 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Zap size={26} />
          </div>

          <div className="space-y-3 max-w-lg mx-auto">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800/40">
              Formative Practice Module
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-extrabold text-[#090d16] dark:text-slate-100 tracking-tight">
              Cohort Telemetry Reserved for Proctored Main Exams
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Standardized pass-rate benchmarks (threshold ≥50%), class standing distributions, and longitudinal cohort participation metrics apply exclusively to scheduled proctored examinations. Practice assessments are self-paced formative exercises intended for open-ended study.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/admin/tests/active')}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-[#262a33] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1d24] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Layers size={14} />
              <span>Browse Active Tests</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ERROR RECOVERY STATE ──────────────────────────────────────────────────
  if (!loading && (error || !data)) {
    return (
      <div className="h-full overflow-y-auto p-6 sm:p-8 max-w-lg mx-auto flex flex-col justify-center items-center">
        <div className="w-full p-8 text-center space-y-5 bg-white dark:bg-[#15181e] rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm animate-in fade-in duration-200">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Telemetry Data Unavailable</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {error || "The requested examination telemetry dataset could not be computed."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              onClick={() => fetchAnalytics()}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Retry Sync</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-[#262a33] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1d24] text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── COMPUTED REAL FIGURES ─────────────────────────────────────────────────
  const totalAttempts = data?.totalAttempts ?? 0;
  const averageScore = Number(data?.averageScore ?? 0);
  const highestScore = Number(data?.highestScore ?? 0);
  const lowestScore = Number(data?.lowestScore ?? 0);
  const studentsAttempted = Number(data?.studentsAttempted ?? 0);
  const passPercentage = Number(data?.passPercentage ?? 0);
  const participationRate = Number(data?.participationRate ?? 0);

  const belowStandardPercentage = Math.max(0, +(100 - passPercentage).toFixed(2));
  const passingAttemptsCount = Math.round((passPercentage / 100) * totalAttempts);
  const belowStandardAttemptsCount = Math.max(0, totalAttempts - passingAttemptsCount);
  const scoreSpread = totalAttempts > 0 ? Math.max(0, +(highestScore - lowestScore).toFixed(1)) : 0;

  const stats = [
    {
      label: 'Total Submissions',
      value: totalAttempts.toLocaleString(),
      icon: Activity,
      color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/40',
      desc: 'Validated attempt submissions'
    },
    {
      label: 'Unique Candidates',
      value: studentsAttempted.toLocaleString(),
      icon: Users,
      color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
      desc: 'Distinct student examinees'
    },
    {
      label: 'Mean Class Score',
      value: `${averageScore}%`,
      icon: TrendingUp,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
      desc: 'Cohort average performance'
    },
    {
      label: 'Pass Percentage',
      value: `${passPercentage}%`,
      icon: Award,
      color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
      desc: 'Institutional threshold (≥50%)'
    },
    {
      label: 'Score Extremes',
      value: totalAttempts > 0 ? `${lowestScore}% - ${highestScore}%` : '0% - 0%',
      icon: Target,
      color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
      desc: `Min: ${lowestScore}% • Max: ${highestScore}%`
    },
    {
      label: 'Cohort Turnout',
      value: `${participationRate}%`,
      icon: Percent,
      color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/40',
      desc: 'Participation of student registry'
    }
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-300 p-5 sm:p-7 lg:p-9 max-w-7xl mx-auto flex flex-col space-y-6">

      {/* ── HEADER & NAVIGATION ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#262a33]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-800/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-xs shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-md border border-violet-200 dark:border-violet-800/40 uppercase tracking-wider">
                Proctored Telemetry
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                • {data?.category || 'General'}
              </span>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                • Exam #{testId}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-extrabold text-[#090d16] dark:text-slate-100 tracking-tight">
              {loading ? <Skeleton className="h-7 w-56 rounded-md" /> : (data?.title || 'Examination Performance')}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full sm:w-auto self-end">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#262a33] px-3 py-2 rounded-xl shadow-xs font-mono">
            <Clock size={13} className="text-violet-600 dark:text-violet-400" />
            <span className="tabular-nums">{data?.durationMinutes ?? 60}m window</span>
          </div>

          <button
            onClick={() => fetchAnalytics(true)}
            disabled={loading || refreshing}
            className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-[#262a33] hover:bg-slate-50 dark:hover:bg-[#1f232b] active:scale-[0.95] text-slate-600 dark:text-slate-300 transition-all shadow-xs cursor-pointer disabled:opacity-60 flex items-center justify-center"
            title="Refresh telemetry"
            aria-label="Refresh telemetry"
          >
            <RefreshCw size={15} className={loading || refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => navigate(`/admin/tests/${testId}/leaderboard`)}
            className="px-3.5 py-2 min-h-[44px] rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View class leaderboard"
          >
            <Trophy size={14} className="text-amber-500" />
            <span>Leaderboard</span>
          </button>

          <BackToDashboard />
        </div>
      </div>

      {/* ── METRIC TILES ────────────────────────────────────────────────────── */}
      <section aria-labelledby="telemetry-metrics-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="telemetry-metrics-heading" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cohort Performance Metrics
          </h2>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            Computed by grading engine
          </span>
        </div>

        <div
          role={loading ? 'status' : undefined}
          aria-busy={loading ? 'true' : undefined}
          aria-label={loading ? 'Loading performance analytics metrics' : undefined}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {loading && <span className="sr-only">Loading performance analytics metrics...</span>}
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <MetricTileSkeleton key={i} />
            ))
          ) : (
            stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-[#15181e] rounded-xl border border-slate-200/90 dark:border-[#262a33] p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[150px] transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Verified
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      {s.label}
                    </p>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#090d16] dark:text-slate-100 tracking-tight leading-none mb-1 tabular-nums">
                      {s.value}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── VISUAL DISTRIBUTION & SCORE RANGE INDICATORS ────────────────────── */}
      {!loading && totalAttempts > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Visual Distribution: Passing vs Below Standard */}
          <div className="bg-white dark:bg-[#15181e] rounded-xl border border-slate-200/90 dark:border-[#262a33] p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262a33]">
              <div>
                <h3 className="text-sm font-bold text-[#090d16] dark:text-slate-100">
                  Cohort Proficiency Distribution
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Proportion meeting the institutional 50% pass benchmark
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                {passPercentage}% PASS
              </span>
            </div>

            {/* Segmented Distribution Bar */}
            <div className="space-y-2">
              <div
                role="progressbar"
                aria-valuenow={passPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Passing vs Below Standard distribution"
                className="w-full h-4 rounded-full bg-slate-100 dark:bg-[#202530] overflow-hidden flex shadow-inner"
              >
                <div
                  style={{ width: `${passPercentage}%` }}
                  className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-500 relative group"
                  title={`Passing (≥50%): ${passPercentage}% (${passingAttemptsCount} sittings)`}
                />
                <div
                  style={{ width: `${belowStandardPercentage}%` }}
                  className="bg-rose-400 dark:bg-rose-500 h-full transition-all duration-500 relative group"
                  title={`Below Standard (<50%): ${belowStandardPercentage}% (${belowStandardAttemptsCount} sittings)`}
                />
              </div>

              {/* Legend & Breakdown */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Passing (≥50%):</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {passPercentage}%
                  </span>
                  <span className="text-slate-400 font-mono">
                    ({passingAttemptsCount} {passingAttemptsCount === 1 ? 'sitting' : 'sittings'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <XCircle size={14} className="text-rose-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Below Standard:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    {belowStandardPercentage}%
                  </span>
                  <span className="text-slate-400 font-mono">
                    ({belowStandardAttemptsCount} {belowStandardAttemptsCount === 1 ? 'sitting' : 'sittings'})
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1e26] border border-slate-200/90 dark:border-[#262a33] flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <HelpCircle size={15} className="text-slate-400 shrink-0 mt-0.5" />
              <span>
                Examinations apply a calibrated 50% score threshold as determined by the backend grading evaluation pipeline. Attempts scoring below 50% are categorized as requiring remediation.
              </span>
            </div>
          </div>

          {/* Visual Score Spread & Extremes Indicator */}
          <div className="bg-white dark:bg-[#15181e] rounded-xl border border-slate-200/90 dark:border-[#262a33] p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262a33]">
              <div>
                <h3 className="text-sm font-bold text-[#090d16] dark:text-slate-100">
                  Score Dispersion & Range
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High vs low range bracket with cohort mean indicator
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-1 rounded-lg border border-violet-200 dark:border-violet-800/40">
                Δ {scoreSpread}% SPREAD
              </span>
            </div>

            {/* Score Range Spectrum Bar */}
            <div className="space-y-3 pt-2">
              <div className="relative w-full h-4 rounded-full bg-slate-100 dark:bg-[#202530] overflow-hidden">
                {/* 50% passing threshold dashed benchmark line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10 opacity-70"
                  style={{ left: '50%' }}
                  title="50% Standard Pass Threshold"
                />

                {/* Score Range Bracket (Min to Max) */}
                <div
                  className="absolute top-0 bottom-0 bg-violet-500/80 dark:bg-violet-400/80 rounded-full"
                  style={{
                    left: `${Math.max(0, lowestScore)}%`,
                    width: `${Math.max(2, highestScore - lowestScore)}%`
                  }}
                  title={`Cohort Range: ${lowestScore}% to ${highestScore}%`}
                />

                {/* Mean Class Score Marker Pin */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-amber-400 border border-slate-900 rounded-sm z-20 shadow-xs"
                  style={{ left: `${Math.min(99, Math.max(1, averageScore))}%` }}
                  title={`Class Mean: ${averageScore}%`}
                />
              </div>

              {/* Range Scale Markers */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 px-0.5">
                <span>0%</span>
                <span className="text-slate-500 dark:text-slate-400 font-semibold">50% Benchmark</span>
                <span>100%</span>
              </div>

              {/* Three-Point Dispersion Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-700 dark:text-rose-400 block font-semibold">
                    Minimum
                  </span>
                  <span className="text-base font-extrabold font-mono text-rose-900 dark:text-rose-100 tabular-nums">
                    {lowestScore}%
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/40">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-violet-700 dark:text-violet-400 block font-semibold">
                    Class Mean
                  </span>
                  <span className="text-base font-extrabold font-mono text-violet-900 dark:text-violet-100 tabular-nums">
                    {averageScore}%
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block font-semibold">
                    Maximum
                  </span>
                  <span className="text-base font-extrabold font-mono text-emerald-900 dark:text-emerald-100 tabular-nums">
                    {highestScore}%
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── ZERO SUBMISSIONS BANNER ─────────────────────────────────────────── */}
      {!loading && totalAttempts === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-7 text-center space-y-3">
          <Activity size={28} className="mx-auto text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
            No Student Attempts Submitted Yet
          </h3>
          <p className="text-xs text-amber-800 dark:text-amber-300 max-w-md mx-auto leading-relaxed">
            Examination metrics, pass distributions, and high/low score indicators will populate dynamically as soon as the first candidate completes and submits this assessment.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/admin/tests/active')}
              className="px-4 py-2 min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Back to Active Tests
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
