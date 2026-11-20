import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CodeQuestion from '../components/CodeQuestion';
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ArrowLeft,
  Activity,
  Bookmark,
  RotateCcw,
  Send,
  X
} from 'lucide-react';
import api from '../utils/api';
import { storage } from '../utils/storage';
import ConfirmModal from '../components/ConfirmModal';
import ThemeToggle from '../components/ThemeToggle';
import { ExamCockpitSkeleton } from '../components/common/Skeleton';

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

const TestAttempt = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState(() => {
    try {
      const saved = storage.getItem(`test_marked_${attemptId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [visited, setVisited] = useState(new Set([0]));
  const [showPalette, setShowPalette] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testId, setTestId] = useState(null);
  const [testTitle, setTestTitle] = useState('Candidate Evaluation Session');
  const [testCategory, setTestCategory] = useState('Technical Assessment');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Use ref to avoid stale closure in timer
  const answersRef = useRef({});
  const submittingRef = useRef(false);

  const updateAnswers = useCallback((newAnswers) => {
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
    // Persist answers
    if (testId) {
      storage.setItem(`test_answers_${testId}`, JSON.stringify(newAnswers));
    }
  }, [testId]);

  const toggleMark = useCallback((qid) => {
    if (!qid) return;
    setMarked(prev => {
      const next = { ...prev, [qid]: !prev[qid] };
      storage.setItem(`test_marked_${attemptId}`, JSON.stringify(next));
      return next;
    });
  }, [attemptId]);

  const markVisited = useCallback((idx) => {
    setVisited(prev => {
      const s = new Set(prev);
      s.add(idx);
      return s;
    });
  }, []);

  const clearAnswer = useCallback(() => {
    const q = questions[currentIndex];
    if (!q) return;
    const next = { ...answersRef.current };
    delete next[q.id];
    updateAnswers(next);
  }, [questions, currentIndex, updateAnswers]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      const next = currentIndex - 1;
      markVisited(next);
      setCurrentIndex(next);
    }
  }, [currentIndex, markVisited]);

  const goNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1;
      markVisited(next);
      setCurrentIndex(next);
    }
  }, [currentIndex, questions.length, markVisited]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchAttemptOnce(attemptId);
      const data = res.data;

      if (!data) throw new Error('Attempt not found');

      // If already submitted, redirect to results
      if (data.status === 'SUBMITTED') {
        toast('This assessment is already completed.', { icon: 'ℹ️' });
        storage.removeItem(`test_answers_${data.testId}`);
        storage.removeItem(`test_marked_${attemptId}`);
        navigate(`/results/${attemptId}`);
        return;
      }

      if (data.status !== 'IN_PROGRESS') {
        toast.error('This assessment session is no longer active.');
        navigate('/student-dashboard');
        return;
      }

      setQuestions(data.questions || []);
      setRemainingTime(data.remainingTime);
      setTestId(data.testId);
      if (data.testTitle || data.title || data.test?.title) {
        setTestTitle(data.testTitle || data.title || data.test?.title);
      }
      if (data.category || data.subject || data.test?.category) {
        setTestCategory(data.category || data.subject || data.test?.category);
      }

      // Restore answers
      const saved = storage.getItem(`test_answers_${data.testId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        answersRef.current = parsed;
        setAnswers(parsed);
        const v = new Set([0]);
        (data.questions || []).forEach((q, i) => {
          if (parsed[q.id]) v.add(i);
        });
        setVisited(v);
      }

      if (data.remainingTime <= 0) {
        toast.error('This assessment session has expired.');
        navigate('/student-dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Assessment session inactive';
      toast.error(msg);
      navigate('/student-dashboard');
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Timer Auto-Submit (uses ref to avoid stale closure) ───────────
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-submit using ref values (not stale state)
          if (!submittingRef.current) {
            submittingRef.current = true;
            api.post(`/attempts/${attemptId}/submit`, answersRef.current)
              .then(res => {
                toast.success('Time up — assessment auto-submitted');
                storage.removeItem(`test_answers_${testId}`);
                storage.removeItem(`test_marked_${attemptId}`);
                navigate(`/results/${res.data.id}`);
              })
              .catch(() => {
                toast.error('Auto-submit failed. Returning to dashboard.');
                navigate('/student-dashboard');
              });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime, attemptId, navigate, testId]);

  // ─── Keyboard Navigation & Choice Selection ──────────────────────────
  useEffect(() => {
    if (loading || submitting || showSubmitConfirm) return;

    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') return;

      const target = e.target;
      const isInput = target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (isInput) return;

      const q = questions[currentIndex];
      if (!q) return;

      const key = e.key;
      if (key === '1' || key === 'a' || key === 'A') {
        if (q.optionA) {
          e.preventDefault();
          updateAnswers({ ...answersRef.current, [q.id]: 'A' });
        }
      } else if (key === '2' || key === 'b' || key === 'B') {
        if (q.optionB) {
          e.preventDefault();
          updateAnswers({ ...answersRef.current, [q.id]: 'B' });
        }
      } else if (key === '3' || key === 'c' || key === 'C') {
        if (q.optionC) {
          e.preventDefault();
          updateAnswers({ ...answersRef.current, [q.id]: 'C' });
        }
      } else if (key === '4' || key === 'd' || key === 'D') {
        if (q.optionD) {
          e.preventDefault();
          updateAnswers({ ...answersRef.current, [q.id]: 'D' });
        }
      } else if (key === 'ArrowLeft' || key === 'p' || key === 'P') {
        e.preventDefault();
        goPrev();
      } else if (key === 'ArrowRight' || key === 'n' || key === 'N') {
        e.preventDefault();
        goNext();
      } else if (key === 'm' || key === 'M') {
        e.preventDefault();
        toggleMark(q.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, submitting, showSubmitConfirm, questions, currentIndex, goPrev, goNext, toggleMark, updateAnswers]);

  const handleSubmit = async (e, isAuto = false) => {
    if (e) e.preventDefault();
    if (submittingRef.current) return;

    if (!isAuto && !showSubmitConfirm) {
      setShowSubmitConfirm(true);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.post(`/attempts/${attemptId}/submit`, answersRef.current);
      storage.removeItem(`test_answers_${testId}`);
      storage.removeItem(`test_marked_${attemptId}`);
      toast.success('Assessment completed');
      navigate(`/results/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Transmission failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('already')) {
        navigate('/student-dashboard');
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
      : `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getQStatus = (q, idx) => {
    const isAnswered = !!answers[q.id];
    const isMarked = !!marked[q.id];
    const wasVisited = visited.has(idx);
    if (isAnswered && isMarked) return 'answeredMarked';
    if (isAnswered) return 'answered';
    if (isMarked) return 'marked';
    if (wasVisited) return 'visited';
    return 'notVisited';
  };

  const paletteStyle = (status, isCurrent) => {
    const base = 'h-9 w-full rounded-lg text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all relative border min-w-0';

    if (isCurrent) {
      return `${base} ring-2 ring-violet-600 dark:ring-violet-400 ring-offset-2 ring-offset-white dark:ring-offset-[#15181e] border-2 border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 shadow-sm z-10 scale-105 font-black`;
    }

    switch (status) {
      case 'answeredMarked':
        return `${base} bg-emerald-600 dark:bg-emerald-500 text-white border-2 border-amber-400 dark:border-amber-400 shadow-2xs font-bold`;
      case 'answered':
        return `${base} bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500 font-bold shadow-2xs`;
      case 'marked':
        return `${base} bg-white dark:bg-academy-card text-amber-700 dark:text-amber-300 border-2 border-amber-500 dark:border-amber-500 font-bold shadow-2xs`;
      case 'visited':
        return `${base} bg-slate-100 dark:bg-[#1a202c] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-violet-400`;
      default:
        return `${base} bg-slate-100 dark:bg-[#15181e] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-violet-400 hover:text-slate-900 dark:hover:text-slate-100`;
    }
  };

  if (loading) return <ExamCockpitSkeleton />;

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.keys(marked).filter(k => marked[k]).length;
  const isUrgent = remainingTime !== null && remainingTime > 0 && remainingTime < 60;
  const isWarning = remainingTime !== null && remainingTime >= 60 && remainingTime < 300;

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-[#f9f9f7] dark:bg-[#0e1015] text-[#090d16] dark:text-slate-100 transition-colors duration-200" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── 1. FIXED, COMPACT EXAMINATION TOPBAR ─────────────────────── */}
      <header className="h-14 flex-shrink-0 bg-white dark:bg-academy-card border-b border-academy-rule px-4 sm:px-6 flex items-center justify-between gap-3 z-30 shadow-2xs">
        {/* Left: Exit & Test Details */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="min-h-[38px] px-3 py-1.5 text-xs rounded-lg border border-academy-rule bg-white dark:bg-academy-card text-academy-ink hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle flex items-center gap-1.5 cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0 transition-colors"
            title="Exit Assessment"
          >
            <ArrowLeft size={15} className="text-academy-muted" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <div className="h-5 w-px bg-academy-rule hidden sm:block shrink-0" />

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="font-serif text-sm sm:text-base font-bold text-academy-ink tracking-tight truncate max-w-[170px] sm:max-w-xs md:max-w-sm" title={testTitle}>
              {testTitle}
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/50 shrink-0">
              {testCategory}
            </span>
          </div>
        </div>

        {/* Center: Question Progress Meter */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold mb-1">
              <span>Question <strong className="text-slate-900 dark:text-slate-100">{currentIndex + 1}</strong> of {questions.length}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{answeredCount} answered</span>
            </div>
            <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-violet-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / (questions.length || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Auto-save status, Theme & Urgency Timer HUD */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Synchronized status badge */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold tracking-wide">Sync Active</span>
          </div>

          <ThemeToggle size="sm" />

          {/* ── 4. TIMER URGENCY SYSTEM ── */}
          <div
            role="timer"
            aria-label={`Time remaining: ${formatTime(remainingTime ?? 0)}`}
            aria-live="polite"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs sm:text-sm tabular-nums transition-all duration-200 shadow-2xs ${
              isUrgent
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/40 animate-pulse'
                : isWarning
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400/30 animate-pulse'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            <Clock
              size={14}
              className={`shrink-0 ${
                isUrgent
                  ? 'text-rose-600 dark:text-rose-400'
                  : isWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            />
            <span className="tracking-tight">{formatTime(remainingTime ?? 0)}</span>
            {isUrgent && (
              <span className="hidden sm:inline text-[9px] uppercase font-sans font-extrabold tracking-wider text-rose-600 dark:text-rose-400">
                &lt;1m
              </span>
            )}
            {isWarning && (
              <span className="hidden sm:inline text-[9px] uppercase font-sans font-bold tracking-wider text-amber-600 dark:text-amber-400">
                &lt;5m
              </span>
            )}
          </div>

          {/* Mobile Drawer Palette Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPalette(prev => !prev)}
            aria-label={`Toggle question palette. Question ${currentIndex + 1} of ${questions.length}`}
            aria-expanded={showPalette}
            aria-controls="question-palette-drawer"
            className="lg:hidden min-h-[38px] px-2.5 py-1.5 text-xs rounded-lg border border-academy-rule bg-white dark:bg-academy-card text-academy-ink flex items-center gap-1.5 font-mono font-medium active:scale-[0.98] shadow-2xs hover:bg-slate-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <Activity size={14} className="text-violet-600 dark:text-violet-400" />
            <span className="text-violet-600 dark:text-violet-400 font-bold">Q{currentIndex + 1}</span>
            <span className="text-academy-muted">/</span>
            <span>{questions.length}</span>
          </button>

          {/* Quick Submit CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="min-h-[38px] px-3.5 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-lg font-semibold text-xs transition-all shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send size={13} />
            <span className="hidden sm:inline">{submitting ? 'Submitting...' : 'Finish Test'}</span>
            <span className="sm:hidden">{submitting ? '...' : 'Finish'}</span>
          </button>
        </div>
      </header>

      {/* ── 2. TWO-COLUMN SPLIT LAYOUT (100VH FIT) ───────────────────── */}
      <div className="flex-1 min-h-0 flex overflow-hidden w-full relative">

        {/* ── LEFT COLUMN (70%): Question & Options Area ─────────────── */}
        <div className="w-full lg:w-[70%] flex flex-col h-full min-h-0 overflow-hidden border-r border-academy-rule">
          {/* Subtle Top Linear Progress Bar */}
          <div className="w-full h-1 bg-slate-100 dark:bg-surface-subtle flex-shrink-0">
            <div
              className="h-full bg-violet-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / (questions.length || 1)) * 100}%` }}
            />
          </div>

          {/* Independently Scrollable Question Pane */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-8 lg:px-12 py-5 sm:py-6 space-y-5 sm:space-y-6 focus:outline-none">

            {/* Question Meta Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-academy-rule/60">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-900/60 text-xs font-mono font-bold text-violet-700 dark:text-violet-300">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-serif italic text-academy-muted hidden sm:inline">
                  {testCategory}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {marked[currentQ?.id] && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                    <Bookmark size={11} className="fill-amber-500 text-amber-500" />
                    <span>Review Marked</span>
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                  answers[currentQ?.id]
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {answers[currentQ?.id] ? '● Answered' : '○ Not Answered'}
                </span>
              </div>
            </div>

            {/* Question Statement Card */}
            <div className="bg-white dark:bg-academy-card rounded-2xl border border-academy-rule p-6 sm:p-8 shadow-2xs">
              <div className="text-base sm:text-lg md:text-xl font-serif font-normal text-academy-ink leading-relaxed">
                <CodeQuestion text={currentQ?.title || currentQ?.questionText} category={testCategory} />
              </div>
            </div>

            {/* Options Radiogroup Stack */}
            <div
              className="space-y-3.5"
              role="radiogroup"
              aria-label={`Options for Question ${currentIndex + 1}`}
            >
              {['A', 'B', 'C', 'D'].map(opt => {
                const optionText = currentQ?.[`option${opt}`];
                if (!optionText) return null;
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => updateAnswers({ ...answersRef.current, [currentQ.id]: opt })}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all duration-150 group cursor-pointer min-h-[58px] select-none active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015] ${
                      isSelected
                        ? 'border-2 border-violet-600 dark:border-violet-500 bg-violet-50/90 dark:bg-violet-950/60 text-slate-900 dark:text-white shadow-sm ring-1 ring-violet-500/30 font-medium'
                        : 'border border-slate-200 dark:border-academy-rule bg-white dark:bg-academy-card text-academy-ink hover:border-violet-400/80 hover:bg-slate-50/80 dark:hover:bg-surface-subtle shadow-2xs'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-sm ring-2 ring-violet-400/40'
                        : 'bg-slate-100 dark:bg-surface-subtle text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-academy-rule group-hover:border-violet-400 group-hover:text-violet-600 dark:group-hover:text-violet-400'
                    }`}>
                      {opt}
                    </span>
                    <span className="text-sm sm:text-base font-normal leading-relaxed text-academy-ink flex-1">
                      {optionText}
                    </span>
                    {isSelected ? (
                      <div className="shrink-0 flex items-center gap-2 text-violet-600 dark:text-violet-400">
                        <span className="hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 rounded border border-violet-300 dark:border-violet-700 bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-semibold">
                          Selected
                        </span>
                        <CheckCircle2 size={18} aria-hidden="true" />
                      </div>
                    ) : (
                      <span className="hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Key {opt}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Keyboard Shortcut Guidance Strip */}
            <div className="pt-4 border-t border-academy-rule/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-academy-muted font-mono">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">1-4</kbd>
                  <span>or</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">A-D</kbd>
                  <span className="text-slate-600 dark:text-slate-400">Select</span>
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
                <span className="hidden sm:flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">←</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">→</kbd>
                  <span className="text-slate-600 dark:text-slate-400">Navigate</span>
                </span>
                <span className="hidden md:inline text-slate-300 dark:text-slate-700">·</span>
                <span className="hidden md:flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">M</kbd>
                  <span className="text-slate-600 dark:text-slate-400">Review</span>
                </span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synchronized with cloud</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (30%): Question Navigation Palette Sidebar ── */}
        <aside
          aria-label="Question Directory"
          className="hidden lg:flex lg:w-[30%] flex-col h-full overflow-hidden bg-white dark:bg-academy-card"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-academy-rule flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-violet-600 dark:text-violet-400" />
              <h2 className="font-serif text-sm font-semibold text-academy-ink">Question Directory</h2>
            </div>
            <span className="text-xs font-mono text-academy-muted font-bold">
              {answeredCount}/{questions.length} answered
            </span>
          </div>

          {/* High-Contrast Status Legend */}
          <div className="p-3.5 border-b border-academy-rule/70 bg-slate-50/70 dark:bg-[#15181e]/60 text-xs flex-shrink-0">
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px]">
              {/* Current */}
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border-2 border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-[9px] scale-105">●</div>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Current</span>
              </div>

              {/* Answered */}
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px] shadow-2xs">✓</div>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Answered ({questions.filter(q => answers[q.id] && !marked[q.id]).length})</span>
              </div>

              {/* Marked */}
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border-2 border-amber-500 bg-white dark:bg-academy-card text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[9px]">!</div>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Marked ({questions.filter(q => !answers[q.id] && marked[q.id]).length})</span>
              </div>

              {/* Ans & Marked */}
              <div className="flex items-center gap-1.5">
                <div className="relative w-4 h-4 rounded bg-emerald-600 dark:bg-emerald-500 text-white border-2 border-amber-400 flex items-center justify-center font-bold text-[9px]">
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                </div>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Ans+Mark ({questions.filter(q => answers[q.id] && marked[q.id]).length})</span>
              </div>

              {/* Unvisited */}
              <div className="flex items-center gap-1.5 col-span-2">
                <div className="w-4 h-4 rounded bg-slate-100 dark:bg-[#1a202c] border border-slate-300 dark:border-slate-700 text-slate-500" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Unvisited ({questions.filter(q => !answers[q.id] && !marked[q.id]).length})</span>
              </div>
            </div>
          </div>

          {/* Independently Scrollable Palette Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const status = getQStatus(q, idx);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => {
                      markVisited(idx);
                      setCurrentIndex(idx);
                    }}
                    className={paletteStyle(status, isCurrent)}
                    title={`Question ${idx + 1}`}
                    aria-label={`Question ${idx + 1}, status: ${status}`}
                  >
                    {idx + 1}
                    {status === 'answeredMarked' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white dark:border-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer / Exam Summary */}
          <div className="p-4 border-t border-academy-rule bg-slate-50/60 dark:bg-[#15181e]/60 flex-shrink-0 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
              <span>Remaining:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{questions.length - answeredCount}</span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full min-h-[40px] py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
            >
              <Send size={14} />
              <span>Submit Assessment</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ── 3. RESPONSIVE MOBILE DRAWER PALETTE (SHOWN < LG) ────────── */}
      {showPalette && (
        <div
          className="fixed inset-0 !m-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setShowPalette(false)}
          aria-hidden="true"
        />
      )}
      <aside
        id="question-palette-drawer"
        aria-label="Mobile Question Navigator"
        className={`
          lg:hidden fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-academy-card shadow-2xl flex flex-col overflow-hidden border-l border-academy-rule transition-transform duration-200 ease-out
          ${showPalette ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
        `}
      >
        <div className="p-4 border-b border-academy-rule flex-shrink-0 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-sm font-semibold text-academy-ink">Question Directory</h2>
            <p className="text-[11px] font-mono text-academy-muted mt-0.5">
              {answeredCount} of {questions.length} answered
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPalette(false)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-academy-rule bg-slate-50 dark:bg-surface-subtle text-academy-muted hover:text-academy-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label="Close question palette"
          >
            <X size={18} />
          </button>
        </div>

        {/* Legend for Mobile */}
        <div className="p-3 border-b border-academy-rule/70 bg-slate-50/70 dark:bg-[#15181e]/60 text-xs flex-shrink-0">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded border-2 border-violet-600 bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-[9px]">●</div>
              <span className="text-slate-600 dark:text-slate-300">Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">✓</div>
              <span className="text-slate-600 dark:text-slate-300">Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded border-2 border-amber-500 bg-white dark:bg-academy-card text-amber-600 flex items-center justify-center font-bold text-[9px]">!</div>
              <span className="text-slate-600 dark:text-slate-300">Marked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative w-3.5 h-3.5 rounded bg-emerald-600 text-white border-2 border-amber-400 flex items-center justify-center font-bold text-[9px]">
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
              </div>
              <span className="text-slate-600 dark:text-slate-300">Ans+Mark</span>
            </div>
          </div>
        </div>

        {/* Scrollable Palette Grid for Mobile */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const status = getQStatus(q, idx);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => {
                    markVisited(idx);
                    setCurrentIndex(idx);
                    setShowPalette(false);
                  }}
                  className={paletteStyle(status, isCurrent)}
                  title={`Question ${idx + 1}`}
                  aria-label={`Go to Question ${idx + 1}, status: ${status}`}
                >
                  {idx + 1}
                  {status === 'answeredMarked' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white dark:border-slate-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-academy-rule bg-slate-50/60 dark:bg-[#15181e]/60 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowPalette(false);
              handleSubmit();
            }}
            disabled={submitting}
            className="w-full min-h-[44px] py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Send size={14} />
            <span>Submit Exam</span>
          </button>
        </div>
      </aside>

      {/* ── 5. FIXED BOTTOM ACTION BAR WITH TACTILE BUTTONS ───────────── */}
      <footer className="h-14 md:h-16 flex-shrink-0 border-t border-academy-rule bg-white dark:bg-academy-card px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 z-30 shadow-md md:shadow-none">

        {/* Left Action Buttons: Clear & Mark for Review */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleMark(currentQ?.id)}
            className={`min-h-[40px] px-3 sm:px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-[0.98] ${
              marked[currentQ?.id]
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/40'
                : 'border-slate-200 dark:border-academy-rule bg-white dark:bg-academy-card text-slate-700 dark:text-slate-300 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50/50'
            }`}
            title="Mark question for review (Shortcut: M)"
          >
            <Bookmark size={15} className={`shrink-0 ${marked[currentQ?.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden sm:inline">Mark for Review</span>
            <span className="sm:hidden">Mark</span>
          </button>

          <button
            type="button"
            onClick={clearAnswer}
            disabled={!answers[currentQ?.id]}
            className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl border border-slate-200 dark:border-academy-rule bg-white dark:bg-academy-card text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98]"
            title="Clear selected option"
          >
            <RotateCcw size={14} className="shrink-0" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        {/* Center: Live Status Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Question {currentIndex + 1}</span>
          <span>of</span>
          <span>{questions.length}</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{answeredCount} answered</span>
          {markedCount > 0 && (
            <>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{markedCount} marked</span>
            </>
          )}
        </div>

        {/* Right Action Buttons: Prev, Next & Finish */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl border border-slate-200 dark:border-academy-rule bg-white dark:bg-academy-card text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-subtle text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 active:scale-[0.98]"
          >
            <ChevronLeft size={16} className="shrink-0" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <span>Next</span>
            <ChevronRight size={16} className="shrink-0" />
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="min-h-[40px] px-4 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
          >
            <Send size={14} className="shrink-0" />
            <span className="hidden sm:inline">Finish Test</span>
            <span className="sm:hidden">Finish</span>
          </button>
        </div>
      </footer>

      {/* ── 6. ACCESSIBLE PRE-SUBMISSION CONFIRMATION MODAL ───────────── */}
      <ConfirmModal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => handleSubmit(null, true)}
        title="Finalize & Submit Assessment?"
        message="Review your responses before concluding your evaluation session. Responses will be finalized and graded."
        confirmText={submitting ? "Submitting..." : "Confirm & Submit"}
        cancelText="Return to Questions"
        confirmVariant="primary"
        stats={{
          answered: answeredCount,
          marked: markedCount,
          unanswered: Math.max(0, questions.length - answeredCount),
          total: questions.length
        }}
      />
    </div>
  );
};

export default TestAttempt;
