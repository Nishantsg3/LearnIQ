import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CodeQuestion from '../components/CodeQuestion';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';
import QuestionCardFlip from '../components/QuestionCardFlip';
import {
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  Home,
  ArrowRight,
  Check,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Lock,
  Tag,
  BookOpen,
  Lightbulb,
  ShieldCheck,
  Trophy,
  Activity,
  Layers
} from 'lucide-react';
import api from '../utils/api';
import { ExamCockpitSkeleton } from '../components/common/Skeleton';

/* ─── Single source of truth for correctness ──────────────────────── */
const calcIsCorrect = (q) => {
  if (!q) return false;
  if (typeof q.correct === 'boolean' && q.selectedOption) {
    return q.correct;
  }
  if (!q.selectedOption) return false;
  const selected = q.selectedOption.trim();
  const correct = (q.correctAnswer || '').trim();
  if (!correct) return false;

  if (selected.toUpperCase() === correct.toUpperCase()) return true;

  const selectedText = q[`option${selected.toUpperCase()}`] || '';
  if (selectedText && selectedText.trim().toLowerCase() === correct.toLowerCase()) return true;

  return false;
};

const calcIsSkipped = (q) => !q?.selectedOption || q.selectedOption.trim() === '';

const getCorrectOptionLetter = (q) => {
  if (!q || !q.correctAnswer) return '';
  const ans = q.correctAnswer.trim();
  if (['A', 'B', 'C', 'D'].includes(ans.toUpperCase())) {
    return ans.toUpperCase();
  }
  for (const opt of ['A', 'B', 'C', 'D']) {
    if (q[`option${opt}`] && q[`option${opt}`].trim().toLowerCase() === ans.toLowerCase()) {
      return opt;
    }
  }
  return ans;
};

const getQuestionDifficulty = (q, index = 0) => {
  if (q?.difficultyLevel) return q.difficultyLevel.toUpperCase();
  if (q?.difficulty) return q.difficulty.toUpperCase();
  const textLen = (q?.questionText || '').length;
  if (textLen > 240 || q?.questionText?.includes('```')) return 'HARD';
  if (textLen > 110 || index % 3 === 1) return 'MEDIUM';
  if (index % 3 === 2) return 'HARD';
  return 'EASY';
};

const getDifficultyBadge = (difficulty) => {
  const d = (difficulty || 'MEDIUM').toUpperCase();
  if (d === 'EASY') {
    return {
      label: 'Easy',
      classes: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500'
    };
  }
  if (d === 'HARD') {
    return {
      label: 'Hard',
      classes: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500'
    };
  }
  return {
    label: 'Medium',
    classes: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500'
  };
};

const normalizeQuestion = (q = {}, idx = 0) => ({
  ...q,
  questionText: q.questionText || q.title || '',
  optionA: q.optionA || '',
  optionB: q.optionB || '',
  optionC: q.optionC || '',
  optionD: q.optionD || '',
  category: q.category || '',
  difficultyLevel: q.difficultyLevel || q.difficulty || '',
  explanation: q.explanation || '',
  index: idx,
});

const formatDateTime = (value) => {
  if (!value) return 'the scheduled window closure';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: true
  });
};

const renderOptionText = (text, category) => {
  if (!text) return null;
  if (text.includes('`')) {
    return <CodeQuestion text={text} category={category} textClassName="text-sm sm:text-base font-normal leading-relaxed text-academy-ink" />;
  }
  return (
    <span className="text-sm sm:text-base font-normal leading-relaxed text-academy-ink font-sans">
      {text}
    </span>
  );
};

const renderExplanationContent = (q, isCorrect, isSkipped, correctLetter, category, index) => {
  const correctText = correctLetter ? (q[`option${correctLetter}`] || `Option ${correctLetter}`) : (q.correctAnswer || 'Verified key');
  const diffBadge = getDifficultyBadge(getQuestionDifficulty(q, index));

  return (
    <div className="flex flex-col justify-between h-full min-h-[380px] space-y-4 text-xs sm:text-sm leading-relaxed text-academy-ink">
      {q.explanation && q.explanation.trim().length > 0 ? (
        <div className="p-4 rounded-xl bg-academy-paper-subtle dark:bg-surface-subtle border-2 border-slate-200 dark:border-white/10 space-y-2">
          <span className="text-[11px] font-mono font-semibold text-academy-accent dark:text-academy-accent-deep uppercase tracking-wider block">
            Author Explanation
          </span>
          <p className="text-academy-ink-secondary leading-relaxed">
            {q.explanation}
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-academy-paper-subtle dark:bg-surface-subtle border-2 border-slate-200 dark:border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-academy-accent dark:text-academy-accent-deep uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Core Concept & Rationale</span>
          </div>
          <p className="text-academy-ink-secondary leading-relaxed">
            This question assesses core proficiency in <strong className="text-academy-ink">{category}</strong>. The problem evaluates logical precision, language invariants, and standard computational mechanisms.
          </p>
        </div>
      )}

      {/* Step-by-step breakdown */}
      <div className="flex-1 space-y-3 flex flex-col justify-center my-1">
        <span className="text-[11px] font-mono font-semibold text-academy-muted uppercase tracking-wider block">
          Step-by-Step Solution Breakdown
        </span>

        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 shadow-2xs">
              1
            </span>
            <div className="text-academy-ink leading-relaxed">
              <strong className="text-emerald-800 dark:text-emerald-300">
                {correctLetter ? `Why Option ${correctLetter} is valid: ` : 'Key Rationale: '}
              </strong>
              <span>
                &ldquo;{correctText}&rdquo; represents the logically sound and verified outcome under standard rules of {category}. It conforms strictly to the problem constraints without violating runtime preconditions or type semantics.
              </span>
            </div>
          </div>
        </div>

        {!isCorrect && !isSkipped && q.selectedOption && (
          <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border-2 border-rose-200/90 dark:border-rose-800/60 shadow-2xs">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 shadow-2xs">
                2
              </span>
              <div className="text-academy-ink leading-relaxed">
                <strong className="text-rose-800 dark:text-rose-300">Analysis of Selection (Option {q.selectedOption}): </strong>
                <span>
                  Choosing &ldquo;{q[`option${q.selectedOption}`] || q.selectedOption}&rdquo; is a common pitfall under timed pressure. In {category}, this formulation overlooks subtle edge conditions or operator precedence rules that differentiate it from the verified key.
                </span>
              </div>
            </div>
          </div>
        )}

        {isSkipped && (
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border-2 border-amber-200/90 dark:border-amber-800/60 shadow-2xs">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 shadow-2xs">
                2
              </span>
              <div className="text-academy-ink leading-relaxed">
                <strong className="text-amber-800 dark:text-amber-300">Omission Diagnostic: </strong>
                <span>
                  This item was left unanswered during the assessment session. For questions categorized as <strong>{diffBadge.label}</strong>, reviewing the underlying theorems or API specifications will ensure confidence in similar evaluation scenarios.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-academy-rule-subtle flex items-center justify-between text-xs text-academy-muted font-mono shrink-0">
        <span className="flex items-center gap-1.5">
          <Lightbulb size={13} className="text-amber-500" />
          <span>Pedagogical Review Framework</span>
        </span>
        <span>LearnIQ Academic Verification</span>
      </div>
    </div>
  );
};

const TestReview = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt]                         = useState(null);
  const [test, setTest]                               = useState(null);
  const [questions, setQuestions]                     = useState([]);
  const [currentIndex, setCurrentIndex]               = useState(0);
  const [loading, setLoading]                         = useState(true);
  const [showExitConfirm, setShowExitConfirm]         = useState(false);
  const [exitPath, setExitPath]                       = useState(null);
  const [showMobileDirectory, setShowMobileDirectory] = useState(false);
  const [filterType, setFilterType]                   = useState('all'); // 'all' | 'incorrect' | 'correct' | 'skipped'
  const [isCardFlipped, setIsCardFlipped]             = useState(false);

  const exitModalRef = useRef(null);
  const cancelExitBtnRef = useRef(null);
  const previousFocusRef = useRef(null);
  const questionBtnRefs = useRef({});

  // Reset card flip to question side when user navigates to another question
  useEffect(() => {
    setIsCardFlipped(false);
  }, [currentIndex]);

  // Auto-scroll active question in directory into view
  useEffect(() => {
    if (questionBtnRefs.current[currentIndex]) {
      questionBtnRefs.current[currentIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [currentIndex]);

  // Arrow key navigation (Left/Right)
  useEffect(() => {
    const handleKeyNav = (e) => {
      if (showExitConfirm || showMobileDirectory) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
      }
    };
    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [currentIndex, questions.length, showExitConfirm, showMobileDirectory]);

  // Exit Modal focus trap & ESC handler
  useEffect(() => {
    if (!showExitConfirm) return;
    previousFocusRef.current = document.activeElement;
    const timer = setTimeout(() => {
      cancelExitBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowExitConfirm(false);
        return;
      }
      if (e.key === 'Tab') {
        if (!exitModalRef.current) return;
        const focusable = exitModalRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [showExitConfirm]);

  const fetchAttemptData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attempts/${attemptId}`);
      const data = res.data;
      setAttempt(data);
      if (data.testId) {
        try {
          const testRes = await api.get(`/tests/${data.testId}`);
          if (testRes.data) {
            setTest(testRes.data);
          }
        } catch {
          // Non-blocking if test details fail
        }
      }
      const nq = Array.isArray(data.answerReviews) ? data.answerReviews.map(normalizeQuestion) : [];
      setQuestions(nq);
    } catch {
      toast.error('Failed to load review data');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => { fetchAttemptData(); }, [fetchAttemptData]);

  const isOfficialExam = (test?.testType || attempt?.testType || attempt?.test?.testType || '').toUpperCase() === 'MAIN';
  const testEndTime = test?.endTime || attempt?.test?.endTime || attempt?.testEndTime;
  const isSolutionsSequestered = Boolean(isOfficialExam && testEndTime && new Date(testEndTime) > new Date());

  const goNext = () => { if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  const currentQ           = questions[currentIndex];
  const qIsCorrect         = calcIsCorrect(currentQ);
  const qIsSkipped         = calcIsSkipped(currentQ);
  const correctOptionLetter = getCorrectOptionLetter(currentQ);

  const currentCategory    = currentQ?.category || attempt?.category || 'Objective Assessment';
  const currentDiffBadge   = getDifficultyBadge(getQuestionDifficulty(currentQ, currentIndex));

  // Authoritative metric calculations to prevent false 0% accuracy
  const clientCorrectCount = useMemo(() => {
    if (attempt?.correctCount !== undefined && attempt?.correctCount !== null && attempt?.correctCount >= 0) {
      return attempt.correctCount;
    }
    const evaluatedCount = questions.filter(calcIsCorrect).length;
    if (evaluatedCount === 0 && attempt?.scorePercent && questions.length > 0) {
      return Math.round((attempt.scorePercent / 100) * questions.length);
    }
    return evaluatedCount;
  }, [attempt, questions]);

  const clientSkipCount = useMemo(() => {
    if (attempt?.attemptedCount !== undefined && attempt?.attemptedCount !== null && questions.length > 0) {
      return Math.max(0, questions.length - attempt.attemptedCount);
    }
    return questions.filter(calcIsSkipped).length;
  }, [attempt, questions]);

  const clientWrongCount = useMemo(() => {
    if (attempt?.wrongCount !== undefined && attempt?.wrongCount !== null && attempt?.wrongCount >= 0) {
      return attempt.wrongCount;
    }
    return Math.max(0, questions.length - clientCorrectCount - clientSkipCount);
  }, [attempt, questions, clientCorrectCount, clientSkipCount]);

  const accuracyPercentage = useMemo(() => {
    if (attempt?.scorePercent !== undefined && attempt?.scorePercent !== null) {
      return Math.round(attempt.scorePercent);
    }
    return questions.length > 0 ? Math.round((clientCorrectCount / questions.length) * 100) : 0;
  }, [attempt, questions, clientCorrectCount]);

  // Jump to next mistake
  const jumpToNextMistake = () => {
    const nextMistakeIndex = questions.findIndex((q, idx) => idx > currentIndex && !calcIsCorrect(q) && !calcIsSkipped(q));
    if (nextMistakeIndex !== -1) {
      setCurrentIndex(nextMistakeIndex);
    } else {
      const firstMistake = questions.findIndex(q => !calcIsCorrect(q) && !calcIsSkipped(q));
      if (firstMistake !== -1) setCurrentIndex(firstMistake);
    }
  };

  const hasMistakes = clientWrongCount > 0;

  // Security gate: Verify test is submitted
  const isTestSubmitted = attempt && (attempt.submitted === true || attempt.status === 'SUBMITTED');

  if (loading) {
    return <ExamCockpitSkeleton />;
  }

  // Academic Integrity Sequester Guard for Active Official MAIN Exams
  if (isSolutionsSequestered) {
    const formattedEnd = formatDateTime(testEndTime);
    return (
      <div className="h-screen bg-[#f9f9f7] dark:bg-[#0e1015] text-[#090d16] dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-academy-card rounded-2xl border border-academy-rule p-8 shadow-sm space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-2xs">
            <Lock size={26} aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-mono font-medium border border-amber-200 dark:border-amber-800">
              <ShieldCheck size={13} aria-hidden="true" />
              <span>Academic Integrity Sequester</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-academy-ink">
              Solutions Sequestered: Active Examination
            </h2>
            <p className="text-xs sm:text-sm text-academy-ink-secondary leading-relaxed">
              Official Assessment Active: Question-by-question solutions and detailed answer keys will unlock on <strong className="text-academy-ink font-semibold">{formattedEnd}</strong>.
            </p>
            <p className="text-xs text-academy-muted leading-relaxed">
              To preserve fair evaluation standards across all participating candidates, verified answers and explanations remain sealed until the examination window formally concludes. Your submitted responses and provisional scorecard have been safely recorded.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate('/results/' + attemptId)}
              className="min-h-[44px] flex-1 px-4 py-2.5 rounded-lg bg-academy-accent hover:bg-academy-accent-hover text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
            >
              <Trophy size={15} aria-hidden="true" />
              <span>View Scorecard</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="min-h-[44px] flex-1 px-4 py-2.5 rounded-lg border border-academy-rule bg-white dark:bg-academy-card hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle text-academy-ink text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
            >
              <Home size={15} className="text-academy-muted" aria-hidden="true" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Privacy & Security guard for in-progress tests
  if (attempt && !isTestSubmitted) {
    return (
      <div className="h-screen bg-[#f9f9f7] dark:bg-[#0e1015] text-[#090d16] dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-academy-card rounded-2xl border border-academy-rule p-8 shadow-sm space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-2xs">
            <Lock size={26} />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-normal text-academy-ink">
              Review Locked: Assessment In Progress
            </h2>
            <p className="text-xs sm:text-sm text-academy-ink-secondary leading-relaxed">
              Review available after assessment submission. To maintain academic evaluation integrity, answer keys, correctness indicators, and step-by-step solutions are strictly restricted until the assessment is officially submitted.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate(`/student/test/${attempt.testId || attempt.test?.id}`)}
              className="min-h-[44px] flex-1 px-4 py-2.5 rounded-lg bg-academy-accent hover:bg-academy-accent-hover text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
            >
              <RotateCcw size={15} />
              <span>Resume Assessment</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="min-h-[44px] flex-1 px-4 py-2.5 rounded-lg border border-academy-rule bg-white dark:bg-academy-card hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle text-academy-ink text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
            >
              <Home size={15} className="text-academy-muted" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-screen bg-[#f9f9f7] dark:bg-[#0e1015] text-[#090d16] dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-academy-card rounded-2xl border border-academy-rule p-8 shadow-sm space-y-4">
          <HelpCircle size={32} className="text-academy-muted mx-auto" />
          <h2 className="font-serif text-lg text-academy-ink">No Question Review Records Available</h2>
          <p className="text-xs text-academy-muted">There are no answer review records available for this assessment attempt.</p>
          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="min-h-[44px] px-5 py-2.5 rounded-lg bg-academy-accent text-white text-xs font-semibold cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] bg-[#f9f9f7] dark:bg-[#0e1015] text-[#090d16] dark:text-slate-100 flex flex-col overflow-hidden selection:bg-violet-100 dark:selection:bg-violet-900 selection:text-violet-900 dark:selection:text-violet-100 transition-colors duration-200">

      {/* ──────────────────────────────────────────────────────────────────────────
          1. COMPACT BRANDED TOP BAR
      ────────────────────────────────────────────────────────────────────────── */}
      <header className="h-16 bg-white dark:bg-academy-card border-b border-academy-rule px-2.5 sm:px-8 flex items-center justify-between shrink-0 z-30 shadow-2xs gap-1.5 sm:gap-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <BrandLogo size="xs" variant="mark" linkTo="/student/dashboard" className="sm:hidden shrink-0" />
          <BrandLogo size="sm" variant="wordmark" subtitle="Diagnostic review" linkTo="/student/dashboard" className="hidden sm:inline-flex" />
          <div className="h-4 w-px bg-academy-rule hidden sm:block" />
          <p className="font-serif text-sm text-academy-ink-secondary truncate hidden sm:block max-w-xs md:max-w-md">
            {attempt?.testTitle || 'Diagnostic Assessment'}
          </p>
        </div>

        {/* Right: Actions and Navigation Controls */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowMobileDirectory(true)}
            className="lg:hidden min-h-[36px] sm:min-h-[44px] px-1.5 sm:px-3 py-1 sm:py-2 text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1 sm:gap-1.5 rounded-xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-academy-card text-academy-ink cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all shadow-xs"
            aria-label="Open Question Directory"
            title="Open Question Directory Palette"
          >
            <Activity size={12} className="text-violet-600 dark:text-violet-400 shrink-0" />
            <span>Q{currentIndex + 1}</span>
            <span className="text-academy-muted">/</span>
            <span>{questions.length}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/results/${attemptId}`)}
            className="h-[36px] sm:h-[44px] min-h-[36px] sm:min-h-[44px] px-2 sm:px-4 text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 rounded-xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-academy-card hover:bg-slate-100 dark:hover:bg-[#1c2027] hover:border-violet-500 dark:hover:border-violet-400 hover:-translate-y-0.5 hover:shadow-md cursor-pointer text-academy-ink shadow-xs transition-all active:scale-[0.98]"
            aria-label="Back to Scorecard"
          >
            <ChevronLeft size={13} className="text-academy-muted shrink-0" />
            <span>Back</span>
          </button>

          <ThemeToggle size="sm" className="sm:hidden h-[36px] min-h-[36px] w-[36px] min-w-[36px]" />
          <ThemeToggle size="lg" className="hidden sm:inline-flex h-[44px] min-h-[44px]" />

          <button
            type="button"
            onClick={() => { setExitPath('/student/dashboard'); setShowExitConfirm(true); }}
            className="h-[36px] sm:h-[44px] min-h-[36px] sm:min-h-[44px] px-2 sm:px-4 text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 rounded-xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-academy-card hover:bg-slate-100 dark:hover:bg-[#1c2027] hover:border-violet-500 dark:hover:border-violet-400 hover:-translate-y-0.5 hover:shadow-md cursor-pointer text-academy-ink shadow-xs transition-all active:scale-[0.98]"
            aria-label="Exit to Dashboard"
          >
            <Home size={13} className="text-academy-muted shrink-0" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. RESULT SUMMARY & FILTER BANNER
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-academy-card border-b border-academy-rule px-4 sm:px-8 py-2 shrink-0 shadow-2xs">
        <div className="w-full max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">

          {/* Key Scorecard Metrics */}
          <div className="flex items-center flex-wrap gap-4 sm:gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-academy-ink tabular-nums">
                {accuracyPercentage}%
              </span>
              <span className="text-xs font-serif italic text-academy-muted">Accuracy</span>
            </div>

            <div className="h-5 w-px bg-academy-rule hidden sm:block" />

            <div className="flex items-center gap-3 sm:gap-5 text-xs font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-academy-muted">Correct:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{clientCorrectCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-academy-muted">Incorrect:</span>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums">{clientWrongCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-academy-rule shrink-0" />
                <span className="text-academy-muted">Skipped:</span>
                <span className="font-mono font-bold text-academy-ink tabular-nums">{clientSkipCount}</span>
              </div>
            </div>
          </div>

          {/* Directory Filter Chips */}
          <div className="flex items-center gap-1.5 bg-academy-paper-subtle dark:bg-surface-subtle p-1 rounded-lg border-2 border-slate-300 dark:border-white/20 overflow-x-auto no-scrollbar shrink-0 self-start md:self-auto max-w-full">
            {[
              { key: 'all', label: 'All', count: questions.length },
              { key: 'incorrect', label: 'Mistakes', count: clientWrongCount },
              { key: 'correct', label: 'Correct', count: clientCorrectCount },
              { key: 'skipped', label: 'Skipped', count: clientSkipCount },
            ].map(f => {
              const isActive = filterType === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterType(f.key)}
                  className={`min-h-[32px] px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-academy-accent text-white shadow-xs font-semibold'
                      : 'text-academy-muted hover:text-academy-ink hover:bg-white dark:hover:bg-academy-card'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="ml-1 opacity-80 tabular-nums">({f.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. MAIN EDITORIAL WORKSPACE (2-COLUMN BALANCED SPLIT - 100VH BOUNDED)
      ────────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ── LEFT COLUMN: QUESTION & DIAGNOSTIC WORKSPACE (8 COLS) ──────────── */}
          <div className="lg:col-span-8 space-y-4">
            <QuestionCardFlip
              isFlipped={isCardFlipped}
              onFlip={setIsCardFlipped}
              canFlip={!isSolutionsSequestered}
              flipButtonLabel={isSolutionsSequestered ? "Solutions Locked" : "Show Solution & Explanation"}
              backButtonLabel="Back to Question"
              frontContent={
                <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-4 sm:p-6 shadow-xs min-h-[460px] flex flex-col justify-between">

              {/* Question Meta Header */}
              <div className="flex items-center justify-between border-b border-academy-rule-subtle pb-3 mb-4 flex-wrap gap-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-serif text-xl sm:text-2xl font-normal text-academy-ink tracking-tight tabular-nums">
                    Question {currentIndex + 1}
                  </span>
                  <span className="text-academy-rule font-light">•</span>

                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border shadow-2xs ${
                    qIsCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : qIsSkipped
                        ? 'bg-academy-paper-subtle dark:bg-surface-subtle text-academy-muted border-academy-rule'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}>
                    {qIsCorrect ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-700 dark:text-emerald-400" />
                        <span>Correct</span>
                      </>
                    ) : qIsSkipped ? (
                      <>
                        <HelpCircle size={13} className="text-academy-muted" />
                        <span>Unanswered</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} className="text-rose-700 dark:text-rose-400" />
                        <span>Incorrect</span>
                      </>
                    )}
                  </div>

                  {/* Difficulty Level Tag */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border shadow-2xs ${currentDiffBadge.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentDiffBadge.dot}`} />
                    <span>{currentDiffBadge.label}</span>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border bg-academy-paper-subtle dark:bg-surface-subtle border-academy-rule text-academy-ink">
                  <Tag size={12} className="text-academy-muted" />
                  <span>{currentCategory}</span>
                </div>
              </div>

              {/* Prominent Question Text with Code Syntax Highlighting */}
              <div className="mb-4">
                <CodeQuestion
                  text={currentQ?.questionText}
                  category={currentCategory}
                  textClassName="font-serif text-base sm:text-lg font-normal text-academy-ink leading-relaxed tracking-tight"
                />
              </div>

              {/* Answer Choices: Vertical Linear Stack */}
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const text = currentQ?.[`option${opt}`];
                  if (!text) return null;

                  const isSelected = (currentQ?.selectedOption || '').toUpperCase() === opt.toUpperCase();
                  const hasAnswerKey = Boolean(correctOptionLetter || (currentQ?.correctAnswer && currentQ.correctAnswer.trim()));
                  const isTheCorrectOption = hasAnswerKey && (
                    (correctOptionLetter && opt.toUpperCase() === correctOptionLetter.toUpperCase()) ||
                    (currentQ?.correctAnswer && text.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase())
                  );

                  let cardStyle = 'border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-academy-card text-academy-ink hover:border-violet-500';
                  let letterStyle = 'bg-slate-100 dark:bg-slate-800 text-academy-ink border-2 border-slate-300 dark:border-white/20';
                  let badge = null;

                  if (isTheCorrectOption && isSelected) {
                    cardStyle = 'border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 shadow-2xs';
                    letterStyle = 'bg-emerald-600 text-white border-2 border-emerald-600 shadow-2xs';
                    badge = (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-md text-xs font-mono font-medium">
                        <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Your choice • Correct</span>
                      </div>
                    );
                  } else if (isTheCorrectOption && !isSelected) {
                    cardStyle = 'border-2 border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 shadow-2xs';
                    letterStyle = 'bg-emerald-600 text-white border-2 border-emerald-600 shadow-2xs';
                    badge = (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-md text-xs font-mono font-medium">
                        <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Correct answer key</span>
                      </div>
                    );
                  } else if (isSelected && !isTheCorrectOption) {
                    if (hasAnswerKey) {
                      cardStyle = 'border-2 border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 shadow-2xs';
                      letterStyle = 'bg-rose-600 text-white border-2 border-rose-600 shadow-2xs';
                      badge = (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-100/90 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 rounded-md text-xs font-mono font-medium">
                          <XCircle size={13} className="text-rose-600 dark:text-rose-400" />
                          <span>Your choice • Incorrect</span>
                        </div>
                      );
                    } else {
                      cardStyle = 'border-2 border-academy-accent bg-academy-paper-subtle dark:bg-surface-subtle text-academy-ink shadow-2xs';
                      letterStyle = 'bg-academy-accent text-white border-2 border-academy-accent shadow-2xs';
                      badge = (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-academy-paper-subtle dark:bg-surface-subtle text-academy-ink border border-academy-rule rounded-md text-xs font-mono font-medium">
                          <CheckCircle2 size={13} className="text-academy-accent" />
                          <span>Your choice</span>
                        </div>
                      );
                    }
                  }

                  return (
                    <div
                      key={opt}
                      className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2 px-3 sm:px-4 rounded-xl transition-all ${cardStyle}`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 border ${letterStyle}`}>
                          {opt}
                        </span>
                        <div className="flex-1 min-w-0">
                          {renderOptionText(text, currentCategory)}
                        </div>
                      </div>
                      {badge && <div className="self-end sm:self-auto shrink-0">{badge}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          }
          backContent={
            <div className="space-y-6">

              {/* Diagnostic Verification Header */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-academy-rule-subtle">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs ${
                    qIsCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : qIsSkipped
                        ? 'bg-academy-paper-subtle dark:bg-surface-subtle text-academy-muted border-academy-rule'
                        : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                  }`}>
                    {qIsCorrect ? <CheckCircle2 size={18} /> : qIsSkipped ? <HelpCircle size={18} /> : <XCircle size={18} />}
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-normal text-academy-ink">
                      {qIsCorrect ? 'Key Verification: Correct Answer' : qIsSkipped ? 'Diagnostic: Question Unanswered' : 'Diagnostic: Discrepancy Analysis'}
                    </h4>
                    <p className="text-xs text-academy-muted font-normal">
                      {qIsCorrect
                        ? 'Candidate selection matched the verified examination key.'
                        : qIsSkipped
                          ? 'This question was skipped during your test session. Review the verified answer below.'
                          : 'Review the discrepancy between your selection and the intended answer key.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-academy-muted">Credit:</span>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                    qIsCorrect
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                  }`}>
                    {qIsCorrect ? '+1.0 / 1.0' : '0.0 / 1.0'}
                  </span>
                </div>
              </div>

              {/* Side-by-Side Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Candidate Selection Card */}
                <div className={`rounded-xl p-4 sm:p-5 border shadow-2xs ${
                  qIsCorrect
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                    : qIsSkipped
                      ? 'bg-academy-paper-subtle dark:bg-surface-subtle border-academy-rule'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-academy-muted">
                      Your Response
                    </span>
                    <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                      qIsCorrect
                        ? 'bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200'
                        : qIsSkipped
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          : (correctOptionLetter || currentQ?.correctAnswer)
                            ? 'bg-rose-200/70 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {qIsCorrect ? 'Correct' : qIsSkipped ? 'Skipped' : (correctOptionLetter || currentQ?.correctAnswer) ? 'Incorrect' : 'Recorded'}
                    </span>
                  </div>

                  {currentQ?.selectedOption ? (
                    <div className="flex items-start gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-white shrink-0 mt-0.5 ${
                        qIsCorrect ? 'bg-emerald-600' : (correctOptionLetter || currentQ?.correctAnswer) ? 'bg-rose-600' : 'bg-academy-accent'
                      }`}>
                        {currentQ.selectedOption}
                      </span>
                      <div className="text-xs sm:text-sm text-academy-ink flex-1 min-w-0">
                        {renderOptionText(currentQ[`option${currentQ.selectedOption}`] || `Option ${currentQ.selectedOption}`, currentCategory)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2 text-xs text-academy-muted italic font-mono">
                      <HelpCircle size={15} />
                      <span>No response recorded (Omitted by candidate)</span>
                    </div>
                  )}
                </div>

                {/* Verified Answer Key Card */}
                <div className="rounded-xl p-4 sm:p-5 border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Verified Answer Key
                    </span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200">
                      Official Key
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-white bg-emerald-600 shrink-0 mt-0.5">
                      {correctOptionLetter || currentQ?.correctAnswer || '—'}
                    </span>
                    <div className="text-xs sm:text-sm text-academy-ink flex-1 min-w-0">
                      {renderOptionText(
                        (correctOptionLetter && currentQ[`option${correctOptionLetter}`]) ||
                        currentQ?.correctAnswer ||
                        (correctOptionLetter ? `Option ${correctOptionLetter}` : 'Solutions sequestered until exam ends'),
                        currentCategory
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Pedagogical Explanation & Solutions */}
              <div className="pt-4 border-t border-academy-rule-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-academy-ink uppercase tracking-wider">
                    <BookOpen size={14} className="text-academy-accent" />
                    <span>Pedagogical Explanation & Solution</span>
                  </div>
                  <span className="text-[11px] font-mono text-academy-muted">
                    Reference: Q{currentIndex + 1}
                  </span>
                </div>

                {renderExplanationContent(currentQ, qIsCorrect, qIsSkipped, correctOptionLetter, currentCategory, currentIndex)}
              </div>
            </div>
          }
        />
      </div>

          {/* ── RIGHT COLUMN: SECONDARY QUESTION DIRECTORY (4 COLS) ─────────────── */}
          <aside className="hidden lg:block lg:col-span-4 space-y-5 sticky top-24">

            <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-serif text-base font-normal text-academy-ink">Question Directory</h4>
                  <p className="text-xs text-academy-muted font-normal">Click any item to inspect directly</p>
                </div>

                {hasMistakes && (
                  <button
                    type="button"
                    onClick={jumpToNextMistake}
                    className="min-h-[36px] px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Jump to next incorrect answer"
                  >
                    <span>Next mistake</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>

              {/* 5-Column Matrix Grid */}
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-1">
                <div className="grid grid-cols-5 gap-2.5">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const correct = calcIsCorrect(q);
                    const skipped = calcIsSkipped(q);

                    // Filter condition
                    const isDimmed =
                      (filterType === 'incorrect' && (correct || skipped)) ||
                      (filterType === 'correct' && !correct) ||
                      (filterType === 'skipped' && !skipped);

                    let btnStyle = 'w-full h-10 min-h-[40px] max-h-[40px] rounded-xl text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all border-2 shadow-2xs hover:-translate-y-0.5 active:scale-95';

                    if (isCurrent) {
                      btnStyle += ` ring-2 ring-violet-500 dark:ring-violet-400 ring-offset-2 ring-offset-white dark:ring-offset-[#121520] shadow-md z-10 ${
                        correct
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25'
                          : skipped
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-rose-600 text-white border-rose-600 shadow-rose-500/25'
                      }`;
                    } else if (correct) {
                      btnStyle += ' bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 hover:border-emerald-500';
                    } else if (skipped) {
                      btnStyle += ' bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700';
                    } else {
                      btnStyle += ' bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-400 dark:border-rose-700 hover:bg-rose-200 dark:hover:bg-rose-900/80 hover:border-rose-500';
                    }

                    if (isDimmed) {
                      btnStyle += ' opacity-30 hover:opacity-100';
                    }

                    return (
                      <button
                        key={idx}
                        ref={el => { questionBtnRefs.current[idx] = el; }}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={btnStyle}
                        aria-label={`Question ${idx + 1}: ${correct ? 'Correct' : skipped ? 'Skipped' : 'Incorrect'}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Directory Legend Footer */}
              <div className="mt-5 pt-4 border-t border-academy-rule-subtle flex items-center justify-between text-xs font-mono text-academy-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>{clientCorrectCount} Correct</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>{clientWrongCount} Mistakes</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-academy-rule" />
                  <span>{clientSkipCount} Skipped</span>
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. DOCKED COMFORTABLE BOTTOM NAVIGATION BAR
      ────────────────────────────────────────────────────────────────────────── */}
      <footer className="shrink-0 bg-white dark:bg-academy-card border-t border-academy-rule px-4 sm:px-8 py-3.5 shadow-md z-20">
        <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-4">

          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="min-h-[44px] py-2 px-4 sm:px-5 text-xs font-medium flex items-center gap-2 rounded-lg disabled:opacity-30 cursor-pointer text-academy-ink border border-academy-rule bg-white dark:bg-academy-card hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle shadow-2xs transition-all"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous Question</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {/* Position & Progress Tracker (Opens Mobile Palette on Tap) */}
          <button
            type="button"
            onClick={() => setShowMobileDirectory(true)}
            className="flex flex-col items-center cursor-pointer group min-h-[44px] justify-center px-3 py-1 rounded-xl transition-all border border-transparent hover:border-slate-300 dark:hover:border-white/10 active:scale-95"
            title="Open question directory palette"
            aria-label="Open question directory palette"
          >
            <div className="flex items-center gap-1.5 text-xs font-mono text-academy-muted tabular-nums group-hover:text-academy-accent transition-colors">
              <Layers size={13} className="text-violet-600 dark:text-violet-400 lg:hidden" />
              <span>
                Question <span className="text-academy-ink font-bold group-hover:text-academy-accent">{currentIndex + 1}</span> of {questions.length}
              </span>
            </div>
            <div className="w-28 xs:w-36 sm:w-44 h-1.5 bg-academy-paper-subtle dark:bg-surface-subtle rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-academy-accent transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </button>

          <button
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            className="min-h-[44px] py-2 px-5 sm:px-6 text-xs font-semibold flex items-center gap-2 rounded-lg disabled:opacity-30 cursor-pointer shadow-2xs bg-academy-accent hover:bg-academy-accent-hover text-white transition-all"
          >
            <span className="hidden sm:inline">Next Question</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. MOBILE QUESTION DIRECTORY DRAWER
      ────────────────────────────────────────────────────────────────────────── */}
      {showMobileDirectory && (
        <div className="fixed inset-0 z-50 !m-0 flex flex-col justify-end lg:hidden">
          <div
            className="fixed inset-0 !m-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowMobileDirectory(false)}
          />
          <div className="relative bg-white dark:bg-academy-card rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl z-10 border-t border-academy-rule animate-in slide-in-from-bottom duration-200">
            <div className="p-5 border-b border-academy-rule flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-academy-ink font-serif">Question Directory</h3>
                <span className="text-xs text-academy-muted">Tap any question to jump</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileDirectory(false)}
                className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-academy-muted hover:text-academy-ink hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle flex items-center justify-center cursor-pointer"
                aria-label="Close directory"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Filter Tabs */}
            <div className="px-5 py-2.5 border-b border-academy-rule-subtle bg-academy-paper-subtle/50 dark:bg-surface-subtle/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { key: 'all', label: 'All', count: questions.length },
                { key: 'incorrect', label: 'Mistakes', count: clientWrongCount },
                { key: 'correct', label: 'Correct', count: clientCorrectCount },
                { key: 'skipped', label: 'Skipped', count: clientSkipCount },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterType(f.key)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                    filterType === f.key
                      ? 'bg-academy-accent text-white font-semibold shadow-2xs'
                      : 'text-academy-muted bg-white dark:bg-academy-card border border-academy-rule'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const correct = calcIsCorrect(q);
                  const skipped = calcIsSkipped(q);

                  const isDimmed =
                    (filterType === 'incorrect' && (correct || skipped)) ||
                    (filterType === 'correct' && !correct) ||
                    (filterType === 'skipped' && !skipped);

                  let btnStyle = 'w-full h-10 min-h-[40px] max-h-[40px] rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all border-2 shadow-2xs active:scale-95';
                  if (isCurrent) {
                    btnStyle += ` ring-2 ring-violet-500 dark:ring-violet-400 ring-offset-2 ring-offset-white dark:ring-offset-[#121520] shadow-md z-10 ${
                      correct ? 'bg-emerald-600 text-white border-emerald-600' : skipped ? 'bg-slate-700 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-600'
                    }`;
                  } else if (correct) {
                    btnStyle += ' bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700';
                  } else if (skipped) {
                    btnStyle += ' bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
                  } else {
                    btnStyle += ' bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-400 dark:border-rose-700';
                  }

                  if (isDimmed) {
                    btnStyle += ' opacity-30';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowMobileDirectory(false);
                      }}
                      className={btnStyle}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-academy-rule bg-academy-paper-subtle dark:bg-surface-subtle flex items-center justify-between text-xs font-mono text-academy-ink">
              <span>✓ {clientCorrectCount} Correct</span>
              <span>✕ {clientWrongCount} Mistakes</span>
              <span>○ {clientSkipCount} Skipped</span>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          6. EXIT REVIEW CONFIRMATION MODAL
      ────────────────────────────────────────────────────────────────────────── */}
      {showExitConfirm && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md">
          <div
            ref={exitModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
            aria-describedby="exit-modal-desc"
            className="bg-white dark:bg-academy-card rounded-2xl border border-academy-rule p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 bg-academy-paper-subtle dark:bg-surface-subtle border border-academy-rule rounded-xl flex items-center justify-center text-academy-accent dark:text-academy-accent-deep mx-auto mb-4">
              <Home size={22} />
            </div>
            <h3 id="exit-modal-title" className="text-base font-bold text-academy-ink font-serif mb-1.5">
              Exit Review Session?
            </h3>
            <p id="exit-modal-desc" className="text-xs text-academy-ink-secondary mb-6 leading-relaxed">
              Your assessment record is permanently stored in your Performance Ledger. You can revisit your full diagnostic review anytime.
            </p>
            <div className="flex gap-2.5">
              <button
                ref={cancelExitBtnRef}
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="min-h-[44px] flex-1 py-2.5 text-xs font-semibold rounded-lg border border-academy-rule bg-white dark:bg-academy-card hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle text-academy-ink cursor-pointer transition-all"
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                onClick={() => navigate(exitPath || '/student/dashboard')}
                className="min-h-[44px] flex-1 py-2.5 text-xs font-semibold rounded-lg bg-academy-accent hover:bg-academy-accent-hover text-white cursor-pointer transition-all shadow-2xs"
              >
                Confirm Exit
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TestReview;
