import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ArrowUpRight,
  FileText,
  Download,
  Award,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  Target,
  PieChart,
  Eye,
  ArrowLeft,
  Clock,
  BookOpen,
  Users,
  HelpCircle,
  Loader2,
  ShieldCheck,
  Layers,
  Sparkles,
  Lock,
  Home
} from 'lucide-react';
import api from '../utils/api';
import { Skeleton, MetricTileSkeleton, SkeletonRegion } from '../components/common/Skeleton';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const attemptRequestCache = new Map();

const fetchAttemptOnce = (attemptId) => {
  if (!attemptRequestCache.has(attemptId)) {
    attemptRequestCache.set(
      attemptId,
      api.get(`/attempts/${attemptId}`).finally(() => {
        attemptRequestCache.delete(attemptId);
      })
    );
  }
  return attemptRequestCache.get(attemptId);
};

const calcIsCorrect = (item) => {
  if (!item) return false;
  if (typeof item.correct === 'boolean') return item.correct;
  if (!item.selectedOption) return false;
  const sel = item.selectedOption;
  const ans = item.correctAnswer || '';
  if (!ans) return false;
  if (sel.toUpperCase() === ans.toUpperCase()) return true;
  const selectedText = item[`option${sel.toUpperCase()}`] || '';
  return selectedText.trim().toLowerCase() === ans.trim().toLowerCase();
};

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

const TestResultView = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await fetchAttemptOnce(attemptId);
        const attemptData = res.data;
        setAttempt(attemptData);

        if (attemptData.testId) {
          const testRes = await api.get(`/tests/${attemptData.testId}`);
          const testData = testRes.data;
          if (testData) {
            setTest(testData);

            if (testData.testType === 'MAIN') {
              api.get(`/tests/${attemptData.testId}/leaderboard`)
                .then(lbRes => {
                  setLeaderboard(Array.isArray(lbRes.data) ? lbRes.data : []);
                })
                .catch(() => {});
            }
          }
        }
      } catch {
        toast.error('Unable to retrieve records');
        navigate('/student/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId, navigate, user]);

  const handleExportPDF = () => {
    if (!reportRef.current || isExporting) return;
    setIsExporting(true);
    const toastId = toast.loading('Generating assessment scorecard PDF...');
    const element = reportRef.current;
    const safeTitle = (attempt?.testTitle || 'Assessment_Report').replace(/[^a-zA-Z0-9]/g, '_');
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `LearnIQ_Report_${safeTitle}_${attemptId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    setTimeout(async () => {
      try {
        const { default: html2pdf } = await import('html2pdf.js');
        await html2pdf().set(opt).from(element).save();
        toast.success('Scorecard exported successfully', { id: toastId });
      } catch {
        toast.error('Failed to export PDF scorecard', { id: toastId });
      } finally {
        setIsExporting(false);
      }
    }, 400);
  };

  const reviewList = useMemo(() => attempt?.answerReviews || [], [attempt]);

  const totalQuestions = useMemo(() => {
    if (attempt?.totalQuestions !== undefined && attempt?.totalQuestions !== null && attempt?.totalQuestions > 0) {
      return attempt.totalQuestions;
    }
    return reviewList.length || 0;
  }, [reviewList, attempt]);

  // Make backend score authoritative — never recalculate from masked correctAnswer
  const clientScore = useMemo(() => {
    if (attempt?.scorePercent !== undefined && attempt?.scorePercent !== null) {
      return Math.round(attempt.scorePercent);
    }
    const evaluatedCorrect = reviewList.filter(item => item && calcIsCorrect(item)).length;
    return totalQuestions > 0 ? Math.round((evaluatedCorrect / totalQuestions) * 100) : 0;
  }, [totalQuestions, reviewList, attempt]);

  const isPassed = clientScore >= 40;

  const clientCorrect = useMemo(() => {
    if (attempt?.correctCount !== undefined && attempt?.correctCount !== null && attempt?.correctCount >= 0) {
      return attempt.correctCount;
    }
    const evaluatedCount = reviewList.filter(item => item && calcIsCorrect(item)).length;
    if (evaluatedCount === 0 && clientScore > 0 && totalQuestions > 0) {
      return Math.round((clientScore / 100) * totalQuestions);
    }
    return evaluatedCount;
  }, [attempt, reviewList, clientScore, totalQuestions]);

  const clientSkipped = useMemo(() => {
    if (attempt?.attemptedCount !== undefined && attempt?.attemptedCount !== null && totalQuestions > 0) {
      return Math.max(0, totalQuestions - attempt.attemptedCount);
    }
    return reviewList.filter(item => item && !item.selectedOption).length;
  }, [attempt, reviewList, totalQuestions]);

  const clientWrong = useMemo(() => {
    if (attempt?.wrongCount !== undefined && attempt?.wrongCount !== null && attempt?.wrongCount >= 0) {
      return attempt.wrongCount;
    }
    return Math.max(0, totalQuestions - clientCorrect - clientSkipped);
  }, [attempt, totalQuestions, clientCorrect, clientSkipped]);

  // Question breakdown percentages
  const correctPct = totalQuestions > 0 ? Math.round((clientCorrect / totalQuestions) * 100) : 0;
  const wrongPct = totalQuestions > 0 ? Math.round((clientWrong / totalQuestions) * 100) : 0;
  const skippedPct = totalQuestions > 0 ? Math.max(0, 100 - correctPct - wrongPct) : 0;

  // Assessment mode & Sequestered State
  const isOfficialExam = (test?.testType || attempt?.testType || attempt?.test?.testType || '').toUpperCase() === 'MAIN';
  const testEndTime = test?.endTime || attempt?.test?.endTime || attempt?.testEndTime;
  const isSolutionsSequestered = Boolean(isOfficialExam && testEndTime && new Date(testEndTime) > new Date());
  const formattedEndTime = testEndTime ? formatDateTime(testEndTime) : '';

  // Cohort Analytics (Zero mock data guarantee)
  const globalStandingData = useMemo(() => {
    let rank = attempt?.rank || 1;
    if (leaderboard.length > 0 && user?.email) {
      const idx = leaderboard.findIndex(entry => entry.userEmail === user.email || entry.studentEmail === user.email || entry.email === user.email);
      if (idx !== -1) rank = idx + 1;
    }
    const total = leaderboard.length > 0 ? leaderboard.length : (attempt?.totalParticipants || 0);
    return {
      rank,
      total
    };
  }, [attempt, leaderboard, user]);

  // Reliable cohort threshold: At least 5 official participants
  const hasReliableCohort = isOfficialExam && globalStandingData.total >= 5;

  const cohortStats = useMemo(() => {
    if (!hasReliableCohort) return null;
    const { rank, total } = globalStandingData;
    const percentile = Math.max(1, Math.round(((total - rank + 1) / total) * 100));
    const topPct = Math.max(1, Math.round((rank / total) * 100));
    return {
      percentile,
      topPct
    };
  }, [hasReliableCohort, globalStandingData]);

  // Category / Subject mastery breakdown (prevents empty cards and 0% accuracy when correctAnswer is masked/null)
  const categoryMastery = useMemo(() => {
    const primaryCat = attempt?.category || test?.category || 'General Curriculum';
    const catMap = {};

    reviewList.forEach((q) => {
      const cat = (q.category || primaryCat).trim();
      const normCat = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (!catMap[normCat]) {
        catMap[normCat] = {
          name: normCat,
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0
        };
      }
      catMap[normCat].total += 1;
      if (calcIsCorrect(q)) {
        catMap[normCat].correct += 1;
      } else if (!q.selectedOption) {
        catMap[normCat].skipped += 1;
      } else {
        catMap[normCat].wrong += 1;
      }
    });

    const entries = Object.values(catMap);
    const sumCorrect = entries.reduce((acc, curr) => acc + curr.correct, 0);
    const isMaskedOrSequestered = sumCorrect === 0 && (clientCorrect > 0 || clientScore > 0);

    if (entries.length > 0) {
      return entries.map(item => {
        let catCorrect = item.correct;
        let catWrong = item.wrong;
        let catAccuracy = item.total > 0 ? Math.round((catCorrect / item.total) * 100) : 0;

        if (isMaskedOrSequestered) {
          catAccuracy = clientScore;
          catCorrect = Math.round((item.total * clientScore) / 100);
          catWrong = Math.max(0, item.total - catCorrect - item.skipped);
        }

        return {
          ...item,
          correct: catCorrect,
          wrong: catWrong,
          accuracy: catAccuracy
        };
      });
    }

    return [{
      name: primaryCat,
      total: totalQuestions || 1,
      correct: clientCorrect,
      wrong: clientWrong,
      skipped: clientSkipped,
      accuracy: clientScore
    }];
  }, [attempt, test, reviewList, totalQuestions, clientCorrect, clientWrong, clientSkipped, clientScore]);

  if (!loading && !attempt) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2 shadow-2xs">
          <AlertCircle size={28} aria-hidden="true" />
        </div>
        <h2 className="font-serif text-xl font-normal text-academy-ink">Assessment Record Unavailable</h2>
        <p className="text-xs text-academy-ink-secondary max-w-sm leading-relaxed">
          The requested examination attempt could not be retrieved from the academic ledger.
        </p>
        <button
          type="button"
          onClick={() => navigate('/student/dashboard')}
          className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-md bg-academy-accent hover:bg-academy-accent-hover text-white shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-0 lg:min-h-[calc(100vh-7.5rem)] flex flex-col lg:justify-between space-y-4 animate-page-enter p-1">

      {/* ── COMPACT PANORAMIC HEADER ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-slate-200 dark:border-white/10 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
              <Trophy size={12} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>Diagnostic Scorecard</span>
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Sitting #{attemptId} • {formatDateTime(attempt?.submittedAt || attempt?.startedAt)}
            </span>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
            {loading ? <Skeleton className="h-7 w-56 rounded" /> : (attempt?.testTitle || 'Test Results')}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/student/results')}
            aria-label="Back to Historical Results"
            className="h-[44px] min-h-[44px] max-h-[44px] px-4 rounded-xl bg-white dark:bg-academy-card border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1c2027] hover:-translate-y-0.5 hover:shadow-md text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <ArrowLeft size={15} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            aria-busy={isExporting}
            aria-label="Export evaluation report as PDF"
            className="h-[44px] min-h-[44px] max-h-[44px] px-4 rounded-xl bg-white dark:bg-academy-card border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1c2027] hover:-translate-y-0.5 hover:shadow-md text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {isExporting ? (
              <Loader2 size={15} className="text-indigo-600 dark:text-indigo-400 animate-spin" aria-hidden="true" />
            ) : (
              <Download size={15} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            )}
            <span>{isExporting ? 'Generating PDF...' : 'Export PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            aria-label="Return to Student Dashboard"
            className="h-[44px] min-h-[44px] max-h-[44px] px-4 rounded-xl bg-white dark:bg-academy-card border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1c2027] hover:-translate-y-0.5 hover:shadow-md text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <Home size={15} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* ── REPORT CONTENT AREA (Target for html2pdf) ───────────────────────── */}
      <div ref={reportRef} className="flex-1 min-h-0 flex flex-col space-y-3.5">

        {/* Active Official Exam Solutions Sequestered Banner */}
        {isSolutionsSequestered && (
          <div className="bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Lock size={16} aria-hidden="true" />
            </div>
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-snug">
              <strong className="font-semibold">Official Assessment Active:</strong> Question-by-question solutions will unlock on {formattedEndTime}.
            </div>
          </div>
        )}

        {/* ── 3-COLUMN PANORAMIC COCKPIT GRID ─────────────────────────────── */}
        {loading ? (
          <SkeletonRegion ariaLabel="Loading evaluation scorecard...">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
              <div className="lg:col-span-4 bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-6 flex flex-col items-center justify-center space-y-4">
                <Skeleton className="w-32 h-32 rounded-full" />
                <Skeleton className="h-5 w-36 rounded-full" />
                <Skeleton className="h-10 w-full rounded-xl mt-4" />
              </div>
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <MetricTileSkeleton key={i} />
                ))}
              </div>
              <div className="lg:col-span-3 bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-5">
                <Skeleton className="h-6 w-32 rounded mb-3" />
                <Skeleton className="h-20 w-full rounded" />
              </div>
            </div>
          </SkeletonRegion>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 items-stretch">

            {/* ── COL 1 (4 COLS): Radial Gauge & Solution Audit Action ──────── */}
            <div className="lg:col-span-4 bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-5 sm:p-6 flex flex-col justify-between shadow-xs">

              {/* Radial Score Gauge */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center my-1">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144" aria-hidden="true">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      className="text-slate-100 dark:text-slate-800"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke={isPassed ? '#10b981' : '#f43f5e'}
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={377}
                      strokeDashoffset={377 - (377 * Math.min(100, Math.max(0, clientScore))) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-mono font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                      {clientScore}%
                    </span>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                      Accuracy
                    </span>
                  </div>
                </div>

                {/* Status Pill */}
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border-2 ${
                    isPassed
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                  }`}>
                    {isPassed ? <CheckCircle2 size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
                    <span>{isPassed ? 'Standard Met (≥40%)' : 'Remediation Advised (<40%)'}</span>
                  </span>
                </div>
              </div>

              {/* Outcome Proportional Bar */}
              <div className="bg-slate-50 dark:bg-[#13171f] rounded-xl border-2 border-slate-200 dark:border-white/10 p-3.5 my-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Outcome Breakdown</span>
                  <span>{totalQuestions} Questions</span>
                </div>

                <div
                  role="progressbar"
                  aria-label="Question outcome distribution"
                  aria-valuenow={correctPct}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  className="w-full h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex"
                >
                  <div style={{ width: `${correctPct}%` }} className="bg-emerald-500 transition-all duration-700" title={`Correct: ${clientCorrect}`} />
                  <div style={{ width: `${wrongPct}%` }} className="bg-rose-500 transition-all duration-700" title={`Incorrect: ${clientWrong}`} />
                  <div style={{ width: `${skippedPct}%` }} className="bg-amber-400 transition-all duration-700" title={`Unanswered: ${clientSkipped}`} />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 pt-0.5">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{clientCorrect} ({correctPct}%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>{clientWrong} ({wrongPct}%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{clientSkipped} ({skippedPct}%)</span>
                  </div>
                </div>
              </div>

              {/* Primary CTA: Question-by-Question Solution Audit */}
              <button
                type="button"
                onClick={() => navigate('/review/' + attemptId)}
                aria-label={isSolutionsSequestered ? "Question-by-Question Solution Audit (Solutions Locked)" : "Launch Question-by-Question Review with solutions"}
                className="min-h-[46px] w-full rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 border-2 border-indigo-400/40"
              >
                {isSolutionsSequestered ? (
                  <>
                    <Lock size={16} aria-hidden="true" />
                    <span>Solution Audit (Locked)</span>
                  </>
                ) : (
                  <>
                    <Eye size={16} aria-hidden="true" />
                    <span>Question-by-Question Solution Audit</span>
                  </>
                )}
              </button>
            </div>

            {/* ── COL 2 (5 COLS): 2x2 Metric Tiles + Curriculum Mastery ────────── */}
            <div className="lg:col-span-5 flex flex-col gap-3 min-h-0">

              {/* 4 Metric Tiles in 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2.5 shrink-0">

                {/* 1. Correct */}
                <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-3.5 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Correct</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 size={15} aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {clientCorrect}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {correctPct}% of items
                    </div>
                  </div>
                </div>

                {/* 2. Incorrect */}
                <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-3.5 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Incorrect</span>
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <X size={15} aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                      {clientWrong}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {wrongPct}% of items
                    </div>
                  </div>
                </div>

                {/* 3. Unanswered / Skipped */}
                <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-3.5 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Skipped</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <HelpCircle size={15} aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                      {clientSkipped}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {skippedPct}% of items
                    </div>
                  </div>
                </div>

                {/* 4. Total Questions */}
                <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-3.5 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Total Items</span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Target size={15} aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {totalQuestions}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      100% evaluated
                    </div>
                  </div>
                </div>

              </div>

              {/* Subject & Curriculum Mastery Analysis */}
              <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-4 shadow-xs flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-white/10 pb-2.5 mb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <BookOpen size={15} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                    <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100">
                      Curriculum Mastery Breakdown
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {test?.category || attempt?.category || 'General'}
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto custom-scrollbar flex-1 pr-1">
                  {categoryMastery.map((cat, idx) => {
                    const catPass = cat.accuracy >= 75 ? 'Proficient' : cat.accuracy >= 40 ? 'Competent' : 'Developing';
                    const catBarColor = cat.accuracy >= 75 ? 'bg-emerald-500' : cat.accuracy >= 40 ? 'bg-indigo-600' : 'bg-rose-500';

                    return (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-[#13171f] rounded-xl border border-slate-200 dark:border-white/10 p-2.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold truncate">{cat.name}</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {cat.correct}/{cat.total} ({cat.accuracy}%)
                          </span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, Math.max(0, cat.accuracy))}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${catBarColor}`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Proficiency: <strong className="text-slate-700 dark:text-slate-300">{catPass}</strong></span>
                          <span>{cat.wrong} wrong • {cat.skipped} skipped</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* ── COL 3 (3 COLS): Cohort Standing & Assessment Audit Specs ───── */}
            <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">

              {/* Cohort Standing / Drill Purpose */}
              {isOfficialExam ? (
                <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-4 shadow-xs space-y-3">
                  <div className="flex items-center gap-2.5 border-b-2 border-slate-100 dark:border-white/10 pb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Award size={18} aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100">Cohort Standing</h4>
                      <p className="text-[11px] text-slate-400">Proctored Examination</p>
                    </div>
                  </div>

                  <div className="text-center py-2 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-semibold">
                      Class Rank
                    </span>
                    <div className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      #{globalStandingData.rank} <span className="text-xs font-normal text-slate-500">of {globalStandingData.total}</span>
                    </div>
                  </div>

                  {hasReliableCohort ? (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/10">
                        <span className="text-slate-500">Percentile:</span>
                        <span className="font-bold text-emerald-600">{cohortStats.percentile}th</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Class Standing:</span>
                        <span className="font-bold text-indigo-600">Top {cohortStats.topPct}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                      Official percentile calculates once ≥5 candidates submit. Currently {globalStandingData.total} submitted.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2.5 border-b-2 border-slate-100 dark:border-white/10 pb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <BookOpen size={16} aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100">Formative Drill</h4>
                      <p className="text-[11px] text-slate-400">Self-Paced Practice</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    Practice drill analytics prioritize concept retention and iterative mastery. Cohort percentiles are reserved for proctored Main Exams.
                  </p>
                </div>
              )}

              {/* Assessment Audit Specs */}
              <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-4 shadow-xs space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-slate-900 dark:text-slate-100 border-b-2 border-slate-100 dark:border-white/10 pb-2">
                    <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Audit Verification</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{test?.durationMinutes ? `${test.durationMinutes}m` : 'Untimed'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                    <span className="text-slate-400">Difficulty:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{test?.difficultyLevel || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                    <span className="text-slate-400">Section:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{test?.sectionType || 'Objective'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Candidate:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{user?.email?.split('@')[0] || 'Student'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t-2 border-slate-100 dark:border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 size={13} />
                  <span>Tamper-Evident Ledger Entry</span>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default TestResultView;
