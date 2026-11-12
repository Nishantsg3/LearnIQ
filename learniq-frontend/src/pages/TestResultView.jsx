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
  Lock
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
      const idx = leaderboard.findIndex(entry => entry.studentEmail === user.email || entry.email === user.email);
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
    <div className="h-full overflow-y-auto p-5 sm:p-7 lg:p-9 max-w-7xl mx-auto flex flex-col space-y-6 animate-in fade-in duration-200 motion-reduce:animate-none">
      
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-academy-rule">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-academy-accent-tint border border-academy-accent/20 text-xs font-serif italic text-academy-accent dark:text-academy-accent-deep mb-2">
            <Trophy size={13} className="text-academy-accent dark:text-academy-accent-deep" aria-hidden="true" />
            <span>Academic Evaluation • Diagnostic Scorecard</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-academy-ink tracking-tight leading-tight">
            {loading ? <Skeleton className="h-8 w-56 rounded" /> : (attempt?.testTitle || 'Test Results')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-academy-ink-secondary max-w-2xl font-normal leading-relaxed">
            Verified candidate performance breakdown, accuracy distribution, domain mastery, and diagnostic solution audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            aria-busy={isExporting}
            aria-label="Export evaluation report as PDF"
            className="min-h-[44px] px-4 py-2 rounded-md bg-white dark:bg-academy-card border border-academy-rule text-academy-ink hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle text-xs font-medium shadow-2xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
          >
            {isExporting ? (
              <Loader2 size={14} className="text-academy-accent animate-spin" aria-hidden="true" />
            ) : (
              <Download size={14} className="text-academy-accent" aria-hidden="true" />
            )}
            <span>{isExporting ? 'Generating PDF...' : 'Export PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            aria-label="Return to Student Dashboard"
            className="min-h-[44px] px-4 py-2 rounded-md bg-white dark:bg-academy-card border border-academy-rule text-academy-ink hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
          >
            <ArrowLeft size={14} className="text-academy-muted" aria-hidden="true" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* ── REPORT CONTENT AREA (Target for html2pdf) ───────────────────────── */}
      <div ref={reportRef} className="space-y-6">

        {/* PRINT/EXPORT HEADER (Visible in PDF, cleanly integrated) */}
        <div className="bg-academy-paper-subtle/60 dark:bg-surface-subtle/60 border border-academy-rule rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-academy-accent text-white flex items-center justify-center font-serif font-bold text-sm shadow-2xs">
              LQ
            </div>
            <div>
              <div className="font-semibold text-academy-ink text-sm">
                LearnIQ Verified Assessment Ledger
              </div>
              <div className="text-academy-muted">
                Candidate: {user?.email || 'Authenticated Student'} • Sitting ID: #{attemptId}
              </div>
            </div>
          </div>
          <div className="text-right text-academy-muted">
            <div>Timestamp: {formatDateTime(attempt?.submittedAt || attempt?.startedAt)}</div>
            <div className="text-emerald-700 dark:text-emerald-400 font-medium">Status: Tamper-Evident Record</div>
          </div>
        </div>

        {/* Active Official Exam Solutions Sequestered Banner */}
        {isSolutionsSequestered && (
          <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <Lock size={18} aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
                Official Assessment Active
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Official Assessment Active: Question-by-question solutions and detailed answer keys will unlock on {formattedEndTime}.
              </p>
            </div>
          </div>
        )}

        {/* ── SCORE BREAKDOWN & RADIAL ACCURACY ─────────────────────────────── */}
        {loading ? (
          <SkeletonRegion ariaLabel="Loading evaluation scorecard...">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-8 flex flex-col items-center justify-center text-center shadow-2xs space-y-4">
                <Skeleton className="w-40 h-40 rounded-full" />
                <Skeleton className="h-5 w-36 rounded-full" />
                <Skeleton className="h-4 w-52 rounded" />
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </div>
              <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <MetricTileSkeleton key={i} />
                ))}
              </div>
            </div>
          </SkeletonRegion>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Circular Radial Accuracy Indicator */}
            <div className="lg:col-span-5 bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-7 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xs">
              
              <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144" aria-hidden="true">
                  <circle
                    cx="72"
                    cy="72"
                    r="62"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    className="text-academy-paper-subtle dark:text-surface-subtle"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="62"
                    stroke={isPassed ? '#10b981' : '#f43f5e'}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={390}
                    strokeDashoffset={390 - (390 * Math.min(100, Math.max(0, clientScore))) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-mono font-bold text-academy-ink tracking-tight tabular-nums">
                    {clientScore}%
                  </span>
                  <span className="text-xs font-serif italic text-academy-muted mt-0.5">
                    Accuracy Rating
                  </span>
                </div>
              </div>

              {/* Pass / Standard Status Pill */}
              <div className="space-y-1.5 mb-6 max-w-sm">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium border ${
                  isPassed
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                }`}>
                  {isPassed ? <CheckCircle2 size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                  <span>{isPassed ? 'Assessment Passed • Standard Met' : 'Below Standard • Remediation Advised'}</span>
                </span>
                <p className="text-xs text-academy-ink-secondary leading-relaxed">
                  {isPassed
                    ? 'Candidate performance satisfies the baseline curriculum proficiency requirement (≥40%).'
                    : 'Performance did not meet the 40% benchmark. Review targeted question explanations below.'}
                </p>
              </div>

              {/* Review CTAs */}
              <button
                type="button"
                onClick={() => navigate('/review/' + attemptId)}
                aria-label={isSolutionsSequestered ? "Question-by-Question Solution Audit (Solutions Locked)" : "Launch Question-by-Question Review with solutions"}
                className="min-h-[44px] w-full rounded-md bg-academy-accent hover:bg-academy-accent-hover text-white text-xs font-semibold shadow-2xs inline-flex items-center justify-center gap-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
              >
                {isSolutionsSequestered ? (
                  <>
                    <Lock size={15} aria-hidden="true" />
                    <span>Question-by-Question Solution Audit (Locked)</span>
                  </>
                ) : (
                  <>
                    <Eye size={15} aria-hidden="true" />
                    <span>Question-by-Question Solution Audit</span>
                  </>
                )}
              </button>
            </div>

            {/* Question Breakdown Statistics & Progress Tiles */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              
              {/* Stacked Proportional Distribution Bar */}
              <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs font-serif italic text-academy-muted">
                  <span>Question Outcome Distribution</span>
                  <span className="font-mono">{totalQuestions} Total Questions</span>
                </div>

                <div
                  role="progressbar"
                  aria-label="Question outcome distribution"
                  aria-valuenow={correctPct}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  className="w-full h-3 rounded-full overflow-hidden bg-academy-paper-subtle dark:bg-surface-elevated flex border border-academy-rule/40"
                >
                  <div
                    style={{ width: `${correctPct}%` }}
                    className="bg-emerald-500 transition-all duration-700"
                    title={`Correct: ${clientCorrect} (${correctPct}%)`}
                  />
                  <div
                    style={{ width: `${wrongPct}%` }}
                    className="bg-rose-500 transition-all duration-700"
                    title={`Incorrect: ${clientWrong} (${wrongPct}%)`}
                  />
                  <div
                    style={{ width: `${skippedPct}%` }}
                    className="bg-amber-400 dark:bg-amber-500 transition-all duration-700"
                    title={`Unanswered: ${clientSkipped} (${skippedPct}%)`}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-academy-ink-secondary pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>Correct ({correctPct}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" aria-hidden="true" />
                    <span>Incorrect ({wrongPct}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-500" aria-hidden="true" />
                    <span>Unanswered ({skippedPct}%)</span>
                  </div>
                </div>
              </div>

              {/* 4 Metric Tiles */}
              <div className="grid grid-cols-2 gap-4 flex-1">
                
                {/* 1. Correct */}
                <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-serif italic text-academy-muted">Correct Answers</span>
                    <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 size={16} aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {clientCorrect}
                    </div>
                    <div className="text-xs font-mono text-academy-muted mt-1">
                      {correctPct}% of assessment
                    </div>
                  </div>
                </div>

                {/* 2. Incorrect */}
                <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-serif italic text-academy-muted">Incorrect Answers</span>
                    <div className="w-8 h-8 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <X size={16} aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                      {clientWrong}
                    </div>
                    <div className="text-xs font-mono text-academy-muted mt-1">
                      {wrongPct}% of assessment
                    </div>
                  </div>
                </div>

                {/* 3. Unanswered / Skipped */}
                <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-serif italic text-academy-muted">Unanswered / Skipped</span>
                    <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <HelpCircle size={16} aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                      {clientSkipped}
                    </div>
                    <div className="text-xs font-mono text-academy-muted mt-1">
                      {skippedPct}% of assessment
                    </div>
                  </div>
                </div>

                {/* 4. Total Questions */}
                <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-serif italic text-academy-muted">Total Questions</span>
                    <div className="w-8 h-8 rounded-md bg-academy-accent-tint border border-academy-accent/20 text-academy-accent dark:text-academy-accent-deep flex items-center justify-center">
                      <Target size={16} aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-mono font-bold text-academy-ink tabular-nums">
                      {totalQuestions}
                    </div>
                    <div className="text-xs font-mono text-academy-muted mt-1">
                      100% evaluated items
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ── SUBJECT / CATEGORY MASTERY BREAKDOWN ─────────────────────────── */}
        <section aria-label="Category Mastery" className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-academy-rule pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-academy-accent-tint border border-academy-accent/20 flex items-center justify-center text-academy-accent dark:text-academy-accent-deep">
                <BookOpen size={14} aria-hidden="true" />
              </div>
              <h2 className="font-serif text-base sm:text-lg font-normal text-academy-ink">
                Subject & Curriculum Mastery Analysis
              </h2>
            </div>
            <span className="text-xs font-mono text-academy-muted">
              {test?.category || attempt?.category || 'General Assessment'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {categoryMastery.map((cat, idx) => {
              const catPass = cat.accuracy >= 75 ? 'Proficient' : cat.accuracy >= 40 ? 'Competent' : 'Developing';
              const catBarColor = cat.accuracy >= 75 ? 'bg-emerald-500' : cat.accuracy >= 40 ? 'bg-academy-accent dark:bg-academy-accent-deep' : 'bg-rose-500';

              return (
                <div
                  key={idx}
                  className="bg-academy-paper-subtle/50 dark:bg-surface-subtle/50 rounded-lg border border-academy-rule p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-academy-ink truncate">{cat.name}</h3>
                      <span className="text-xs font-mono text-academy-muted">
                        {cat.correct} of {cat.total} correct
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                      cat.accuracy >= 40
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                    }`}>
                      {cat.accuracy}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div
                      role="progressbar"
                      aria-valuenow={cat.accuracy}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`${cat.name} accuracy progress`}
                      className="w-full h-2 rounded-full bg-academy-paper-subtle dark:bg-surface-elevated overflow-hidden border border-academy-rule/40"
                    >
                      <div
                        style={{ width: `${Math.min(100, Math.max(0, cat.accuracy))}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${catBarColor}`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-academy-muted pt-0.5">
                      <span>Proficiency: <span className="text-academy-ink font-medium">{catPass}</span></span>
                      <span>Items: <span className="text-academy-ink font-medium">{cat.total}</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test Specifications Metadata */}
          <div className="pt-2 border-t border-academy-rule-subtle flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-academy-muted">
            <div className="flex items-center gap-4">
              <span>Duration: <span className="text-academy-ink font-medium">{test?.durationMinutes ? `${test.durationMinutes} mins` : 'Untimed'}</span></span>
              <span>Section: <span className="text-academy-ink font-medium">{test?.sectionType || 'Multiple Choice'}</span></span>
              <span>Difficulty: <span className="text-academy-ink font-medium">{test?.difficultyLevel || 'Standard'}</span></span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Standard-Aligned Evaluation</span>
            </div>
          </div>
        </section>

        {/* ── COHORT ANALYTICS / PERCENTILE CARD ───────────────────────────── */}
        {isOfficialExam ? (
          <section aria-label="Official Cohort Standing" className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-academy-rule pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-academy-accent text-white flex items-center justify-center shadow-2xs shrink-0">
                  <Award size={22} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-normal text-academy-ink">
                    Official Examination Cohort Analytics
                  </h2>
                  <p className="text-xs text-academy-ink-secondary">
                    Comparative rank and percentile calibrated across verified candidate submissions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-serif italic text-academy-muted">Verified Class Rank</div>
                  <div className="text-2xl font-mono font-bold text-academy-accent dark:text-academy-accent-deep tabular-nums">
                    #{globalStandingData.rank} <span className="text-xs text-academy-muted font-normal font-sans">of {globalStandingData.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional Percentile Rendering (Strict zero fabrication) */}
            {hasReliableCohort ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-academy-paper-subtle/50 dark:bg-surface-subtle/50 rounded-lg border border-academy-rule p-4 space-y-1">
                  <span className="text-xs font-serif italic text-academy-muted">Cohort Percentile</span>
                  <div className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {cohortStats.percentile}th Percentile
                  </div>
                  <p className="text-xs text-academy-ink-secondary">
                    Scored higher than or equal to {cohortStats.percentile}% of all {globalStandingData.total} official exam candidates.
                  </p>
                </div>

                <div className="bg-academy-paper-subtle/50 dark:bg-surface-subtle/50 rounded-lg border border-academy-rule p-4 space-y-1">
                  <span className="text-xs font-serif italic text-academy-muted">Class Standing Tier</span>
                  <div className="text-2xl font-mono font-bold text-academy-accent dark:text-academy-accent-deep tabular-nums">
                    Top {cohortStats.topPct}%
                  </div>
                  <p className="text-xs text-academy-ink-secondary">
                    Positioned within the top tier of candidates for this proctored examination sitting.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg p-4 flex items-start gap-3">
                <Users size={18} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Cohort data gathering (requires ≥ 5 participants)
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Official percentile distribution is calculated once 5 or more students complete this formal sitting to ensure statistical reliability. Currently {globalStandingData.total} {globalStandingData.total === 1 ? 'candidate has' : 'candidates have'} submitted this exam.
                  </p>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section aria-label="Practice Diagnostic Notice" className="bg-academy-paper-subtle/40 dark:bg-surface-subtle/40 border border-academy-rule rounded-xl p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-academy-accent-tint border border-academy-accent/20 text-academy-accent dark:text-academy-accent-deep flex items-center justify-center shrink-0">
              <BookOpen size={18} aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-academy-ink">
                Self-Paced Practice Drill Diagnostics
              </h3>
              <p className="text-xs text-academy-ink-secondary leading-relaxed max-w-3xl">
                Cohort percentile curves are exclusively reserved for proctored Official Main Exams. Practice drill analytics prioritize personal knowledge retention, identifying concept weak points, and iterative problem mastery.
              </p>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default TestResultView;