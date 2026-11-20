import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import CodeQuestion from '../components/CodeQuestion';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';
import ConfirmModal from '../components/ConfirmModal';
import QuestionCardFlip from '../components/QuestionCardFlip';
import { Clock, ChevronLeft, ChevronRight, Trophy, RotateCcw, Bookmark, Send, AlertTriangle, X, Lock, CheckCircle2, Activity } from 'lucide-react';
import api from '../utils/api';
import { ExamCockpitSkeleton } from '../components/common/Skeleton';

/* ─── helpers ─────────────────────────────────────────────────────── */
const formatDateTime = (value) => {
  if (!value) return 'exam completion';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: true
  });
};
const getOptionValue = (o) => {
  if (typeof o === 'string') return o;
  if (!o || typeof o !== 'object') return '';
  return o.text || o.optionText || o.value || o.label || o.content || '';
};

const DUMMY = { A: 'option a', B: 'option b', C: 'option c', D: 'option d' };
const isDummy = (v, k) => (v || '').trim().toLowerCase() === DUMMY[k];

const normalizeQuestion = (q = {}) => {
  const opts = Array.isArray(q.options) ? q.options : [];
  const direct = { A: q.optionA||'', B: q.optionB||'', C: q.optionC||'', D: q.optionD||'' };
  const mapped = opts.length > 0
    ? { A: getOptionValue(opts[0]), B: getOptionValue(opts[1]), C: getOptionValue(opts[2]), D: getOptionValue(opts[3]) }
    : {};
  return {
    ...q,
    questionText: q.title || q.questionText || q.text || q.question || '',
    optionA: direct.A && !isDummy(direct.A,'A') ? direct.A : mapped.A || direct.A,
    optionB: direct.B && !isDummy(direct.B,'B') ? direct.B : mapped.B || direct.B,
    optionC: direct.C && !isDummy(direct.C,'C') ? direct.C : mapped.C || direct.C,
    optionD: direct.D && !isDummy(direct.D,'D') ? direct.D : mapped.D || direct.D,
  };
};

/* ─── question status colours ─────────────────────────────────────── */
// answered          → purple bg
// markedForReview   → orange bg
// answeredAndMarked → purple bg + orange dot
// current           → purple border
// not visited       → dark bg

/* ═══════════════════════════════════════════════════════════════════ */
const StudentTest = () => {
  const [showPalette, setShowPalette] = useState(false);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const attemptId = searchParams.get('attemptId');

  /* state */
  const [test, setTest]               = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]         = useState({});
  const [marked, setMarked]           = useState({}); // markedForReview
  const [visited, setVisited]         = useState(new Set([0]));

  const [timeLeft, setTimeLeft]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult]           = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [showAbandon, setShowAbandon] = useState(false);
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);
  const [malpracticeCount, setMalpracticeCount] = useState(() => {
    return parseInt(sessionStorage.getItem(`malpractice_${attemptId}`) || '0');
  });
  const [showMalpractice, setShowMalpractice] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  useEffect(() => {
    setIsCardFlipped(false);
  }, [currentIndex]);

  const answersRef = useRef({});
  const timerRef   = useRef(null);
  const beforeUnloadRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const malpracticeCooldownRef = useRef(false); // Prevents double-counting from mouseleave+blur

  /* ── helpers ── */
  const updateAnswer = useCallback((qid, opt) => {
    setAnswers(prev => {
      const next = { ...prev, [qid]: opt };
      answersRef.current = next;
      return next;
    });
  }, []);

  const toggleMark = useCallback((qid) => {
    if (!qid) return;
    setMarked(prev => ({ ...prev, [qid]: !prev[qid] }));
  }, []);

  const markVisited = useCallback((idx) => {
    setVisited(prev => { const s = new Set(prev); s.add(idx); return s; });
  }, []);

  const clearAnswer = useCallback(() => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers(prev => {
      const next = { ...prev };
      delete next[q.id];
      answersRef.current = next;
      return next;
    });
  }, [questions, currentIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev < questions.length - 1) {
        const next = prev + 1;
        setVisited(v => { const s = new Set(v); s.add(next); return s; });
        return next;
      }
      return prev;
    });
  }, [questions.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev > 0) {
        const next = prev - 1;
        setVisited(v => { const s = new Set(v); s.add(next); return s; });
        return next;
      }
      return prev;
    });
  }, []);

  /* ── fetch ── */
  const fetchTestData = useCallback(async () => {
    try {
      setLoading(true);
      const [testRes, qRes, timeRes, attemptRes] = await Promise.all([
        api.get(`/tests/${id}`),
        api.get(`/questions/test/${id}/attempt${attemptId ? `?attemptId=${attemptId}` : ''}`),
        api.get(`/questions/test/${id}/time${attemptId ? `?attemptId=${attemptId}` : ''}`),
        attemptId ? api.get(`/attempts/${attemptId}`) : Promise.resolve(null),
      ]);

      const nq = Array.isArray(qRes.data) ? qRes.data.map(normalizeQuestion) : [];
      setTest(testRes.data);
      setQuestions(nq);
      setTimeLeft(timeRes.data.remainingTime);

      if (attemptRes?.data?.status === 'SUBMITTED' || attemptRes?.data?.submitted) {
        setResult(attemptRes.data);
        return;
      }

      if (attemptRes?.data?.answerReviews) {
        const restored = {};
        attemptRes.data.answerReviews.forEach(r => {
          if (r.selectedOption) restored[r.questionId] = r.selectedOption;
        });
        setAnswers(restored);
        answersRef.current = restored;
        const first = nq.findIndex(q => !restored[q.id]);
        setCurrentIndex(first !== -1 ? first : 0);

        const v = new Set([0]);
        nq.forEach((q, i) => { if (restored[q.id]) v.add(i); });
        setVisited(v);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load test');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, attemptId, navigate]);

  /* ── submit ── */
  const submitTest = useCallback(async (isAuto = false) => {
    // Block manual submit if auto-submit already fired or result exists
    if (result) return;
    if (!isAuto && autoSubmitted) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    setShowConfirm(false);

    // Hard UI Lock: ensure no background tasks keep running
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await api.post(`/questions/test/${id}/submit${attemptId ? `?attemptId=${attemptId}` : ''}`, { answers: answersRef.current });
      setResult(res.data);
      toast.success('Assessment submitted!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Try again.';
      // If already submitted, treat as success — try to show summary screen
      if (msg.toLowerCase().includes('already submitted')) {
         toast.success('Assessment was already submitted.');
         try {
           const attemptRes = await api.get(`/attempts/me`);
           const myAttempt = attemptRes.data.find(a => a.testId === parseInt(id));
           if (myAttempt && myAttempt.status === 'SUBMITTED') {
             setResult(myAttempt);
             return;
           }
         } catch (e) {
           console.error("Failed to fetch details", e);
         }
      } else {
         if (isAuto) {
            toast.success('Assessment session closed. Syncing results...');
            try {
              await new Promise(r => setTimeout(r, 1500));
              const attemptRes = await api.get(`/attempts/me`);
              const myAttempt = attemptRes.data.find(a => a.testId === parseInt(id));
              if (myAttempt && myAttempt.status === 'SUBMITTED') {
                setResult(myAttempt);
                return;
              }
            } catch (e) {
              console.error("Failed to fetch details", e);
            }
         } else {
            toast.error(msg);
            isSubmittingRef.current = false;
            setSubmitting(false);
            setAutoSubmitted(false);
         }
      }
    }
  }, [id, attemptId, result, autoSubmitted]);

  const handleAutoSubmit = useCallback(async (reason = 'time') => {
    if (isSubmittingRef.current || autoSubmitted || result) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    setAutoSubmitted(true);

    if (reason === 'malpractice') {
      toast.error("SECURITY VIOLATION! TERMINATING SESSION...", {
        duration: 5000,
        id: 'malpractice-toast',
        style: { fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }
      });
    } else {
      toast.error("TIME'S UP! AUTO-SUBMITTING ASSESSMENT...", {
        duration: 5000,
        id: 'time-toast',
        style: { fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }
      });
    }

    await submitTest(true);
  }, [autoSubmitted, result, submitTest]);

  /* ── auto-save ── */
  useEffect(() => {
    if (!attemptId || loading || !test || submitting || isSubmittingRef.current) return;
    const save = async () => {
        if (submitting || isSubmittingRef.current) return;
        try { await api.post(`/attempts/${attemptId}/save-progress`, answers); }
        catch { console.error("Sync failed"); }
    };
    const timer = setTimeout(save, 1500);
    return () => clearTimeout(timer);
  }, [answers, attemptId, loading, test, submitting]);

  useEffect(() => {
    if (attemptId) sessionStorage.setItem(`malpractice_${attemptId}`, malpracticeCount.toString());
  }, [malpracticeCount, attemptId]);

  useEffect(() => { fetchTestData(); }, [fetchTestData]);

  /* ── prevent unload (Ref-based for silent reload) ── */
  useEffect(() => {
    if (result) return;
    const handler = (e) => { e.returnValue = 'Leave test?'; return e.returnValue; };
    beforeUnloadRef.current = handler;
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [result]);

  /* ── auto-submit watcher ── */
  useEffect(() => {
    // If time is up, but we haven't submitted yet
    if (timeLeft !== null && timeLeft <= 0 && !autoSubmitted && !result && !loading && !submitting) {
      handleAutoSubmit('time');
    }
  }, [timeLeft, autoSubmitted, result, loading, submitting, handleAutoSubmit]);

  const isTimerRunning = timeLeft !== null && timeLeft > 0 && !result;

  /* ── countdown (smooth single interval) ── */
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  /* ── keyboard reload guard ── */
  useEffect(() => {
    if (result) return;
    const handleKeydown = (e) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
        e.preventDefault();
        setShowReloadConfirm(true);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [result]);

  /* ── keyboard navigation & choice selection ── */
  useEffect(() => {
    if (result || loading || submitting) return;

    const handleKeyDown = (e) => {
      // Safety: Ignore if modifier keys are held (Cmd/Ctrl/Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // ABSOLUTE SAFETY: NEVER submit the exam on Enter or any single keypress.
      if (e.key === 'Enter') return;

      // Safety: Ignore when any modal dialog is open
      if (showConfirm || showReloadConfirm || showMalpractice || showAbandon) return;

      // CRUCIAL SAFETY: Ignore if focused on input, textarea, select, or contentEditable
      const target = e.target;
      const isInputFocused =
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (isInputFocused) return;

      const q = questions[currentIndex];
      if (!q) return;

      const key = e.key;

      // Option selection: 1-4 or a-d / A-D
      if (key === '1' || key === 'a' || key === 'A') {
        if (q.optionA) {
          e.preventDefault();
          updateAnswer(q.id, 'A');
        }
      } else if (key === '2' || key === 'b' || key === 'B') {
        if (q.optionB) {
          e.preventDefault();
          updateAnswer(q.id, 'B');
        }
      } else if (key === '3' || key === 'c' || key === 'C') {
        if (q.optionC) {
          e.preventDefault();
          updateAnswer(q.id, 'C');
        }
      } else if (key === '4' || key === 'd' || key === 'D') {
        if (q.optionD) {
          e.preventDefault();
          updateAnswer(q.id, 'D');
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
  }, [
    result,
    loading,
    submitting,
    showConfirm,
    showReloadConfirm,
    showMalpractice,
    showAbandon,
    questions,
    currentIndex,
    updateAnswer,
    goPrev,
    goNext,
    toggleMark,
  ]);

  /* ── malpractice detection (Anti-Cheat) ── */
  useEffect(() => {
    if (result || loading || submitting) return;

    const triggerMalpractice = () => {
      if (malpracticeCooldownRef.current) return;
      malpracticeCooldownRef.current = true;
      setTimeout(() => { malpracticeCooldownRef.current = false; }, 1500);

      setMalpracticeCount(prev => {
        const next = prev + 1;
        if (next >= 5) {
          handleAutoSubmit('malpractice');
        } else {
          setShowMalpractice(true);
        }
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerMalpractice();
      }
    };

    const handleBlur = () => {
      if (!document.hasFocus() || document.visibilityState === 'hidden') {
        triggerMalpractice();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [result, loading, submitting, handleAutoSubmit]);

  const canSyncTime = timeLeft !== null && timeLeft > 5 && !result && !submitting;

  /* ── 🔄 TIMER SYNC (Poll server every 30s to prevent drift) ── */
  useEffect(() => {
    if (!canSyncTime || isSubmittingRef.current) return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await api.get(`/questions/test/${id}/time${attemptId ? `?attemptId=${attemptId}` : ''}`);
        const serverTime = parseInt(res.data.remainingTime);
        if (!isNaN(serverTime)) {
          setTimeLeft(serverTime);
          if (serverTime <= 0 && !autoSubmitted) handleAutoSubmit('time');
        }
      } catch (e) {
        if (e.response?.status === 400 || e.response?.status === 404) {
          if (!result && !submitting && !isSubmittingRef.current) {
            console.warn("[SYNC] Session inactive or already submitted. Redirecting...");
            navigate('/student/dashboard');
          }
        }
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [id, attemptId, canSyncTime, autoSubmitted, handleAutoSubmit, navigate, result, submitting]);

  const formatTime = (s) => {
    if (s == null) return '--:--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleExit = () => {
    if (result) {
      navigate('/student/dashboard');
      return;
    }
    setShowAbandon(true);
  };

  const abandonTest = async () => {
    try {
      await api.post(`/questions/test/${id}/abandon`);
      navigate('/student/dashboard');
    } catch {
      navigate('/student/dashboard');
    }
  };

  /* ── status helpers ── */
  const getQStatus = (q, idx) => {
    const isAnswered = !!answers[q.id];
    const isMarked   = !!marked[q.id];
    const wasVisited = visited.has(idx);
    if (isAnswered && isMarked) return 'answeredMarked';
    if (isAnswered)  return 'answered';
    if (isMarked)    return 'marked';
    if (wasVisited)  return 'visited';
    return 'notVisited';
  };

  const isMain = test?.testType?.toUpperCase() === 'MAIN';
  const themeText = 'text-brand-700 dark:text-brand-400';
  const themeBg = 'bg-brand-700 hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500';
  const themeHover = '';

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

  /* ═══════════════ LOADING ══════════════════════════════════════════ */
  if (loading) {
    return <ExamCockpitSkeleton />;
  }


  /* ═══════════════ RESULT ═══════════════════════════════════════════ */
  if (result) {
    const isOfficialExam = (test?.testType || result.testType || '').toUpperCase() === 'MAIN';
    const testEndTime = test?.endTime || result.endTime;
    const isSolutionsSequestered = Boolean(isOfficialExam && testEndTime && new Date(testEndTime) > new Date());
    const formattedEnd = testEndTime ? formatDateTime(testEndTime) : '';

    const displayTotal = result.totalQuestions ?? (Array.isArray(result.analysis) ? result.analysis.length : questions.length);
    const displayAttempted = result.attemptedCount ?? (Array.isArray(result.analysis) ? result.analysis.filter(a => a.selectedAnswer).length : Object.keys(answers).length);

    // Authoritative score computation
    const displayScore = (result.scorePercent !== undefined && result.scorePercent !== null)
      ? Math.round(result.scorePercent)
      : (displayTotal > 0 && result.correctCount !== undefined && result.correctCount !== null
          ? Math.round((result.correctCount / displayTotal) * 100)
          : (Array.isArray(result.analysis) && displayTotal > 0
              ? Math.round((result.analysis.filter(a => a.correct).length / displayTotal) * 100)
              : 0));

    const displayCorrect = (result.correctCount !== undefined && result.correctCount !== null)
      ? result.correctCount
      : (Array.isArray(result.analysis)
          ? result.analysis.filter(a => a.correct).length
          : Math.round((displayScore / 100) * displayTotal));

    const displayWrong = (result.wrongCount !== undefined && result.wrongCount !== null)
      ? result.wrongCount
      : Math.max(0, displayAttempted - displayCorrect);

    const targetAttemptId = result.id || attemptId;

    return (
      <div className="fixed inset-0 w-screen h-screen h-[100dvh] max-h-[100dvh] bg-[#FBF9F5] dark:bg-[#090C15] flex flex-col items-center justify-center p-3 sm:p-6 z-[100] overflow-y-auto custom-scrollbar">
        {/* Ambient Backlight Aura */}
        <div className={`absolute w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-20 dark:opacity-30 ${isMain ? 'bg-rose-500' : 'bg-indigo-600'}`} />

        <div className="relative w-full max-w-xl animate-in zoom-in-95 duration-200 z-10 max-h-[94dvh] flex flex-col">
          <div className="bg-white dark:bg-[#151A28] rounded-3xl p-5 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-slate-200/90 dark:border-white/10 relative overflow-y-auto custom-scrollbar backdrop-blur-2xl">
             <div className={`absolute top-0 left-0 right-0 h-1.5 ${isMain ? 'bg-rose-500' : 'bg-indigo-600'}`} />

             <div className="text-center mb-4 sm:mb-6">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border shadow-sm ${
                  isMain
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                }`}>
                  <Trophy size={24} className="sm:w-8 sm:h-8" />
                </div>
                <h1 className="text-xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">Assessment Complete</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{test?.title || result.testTitle || 'Diagnostic Assessment'}</p>
             </div>

             {/* Score Gauge Section */}
             <div className="flex justify-center mb-4 sm:mb-6">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
                   <svg className="w-full h-full -rotate-90">
                      <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="9" fill="transparent" className="text-slate-100 dark:text-[#1E2433]" />
                      <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="9" fill="transparent"
                              strokeDasharray={377}
                              strokeDashoffset={377 - (377 * Math.min(100, Math.max(0, displayScore))) / 100}
                              strokeLinecap="round"
                              className={`${themeText} transition-all duration-700 ease-out`} />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 leading-none tabular-nums font-mono">{displayScore}%</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 sm:mt-1">Accuracy</span>
                   </div>
                </div>
             </div>

             {/* Quick Stats Grid */}
             <div className="grid grid-cols-4 gap-2.5 mb-6 text-center">
                {[
                  { label: 'Total', value: displayTotal, color: 'text-slate-900 dark:text-slate-100' },
                  { label: 'Attempted', value: displayAttempted, color: themeText },
                  { label: 'Correct', color: 'text-emerald-600 dark:text-emerald-400', value: displayCorrect },
                  { label: 'Wrong', color: 'text-rose-600 dark:text-rose-400', value: displayWrong },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-50 dark:bg-[#101420] border border-slate-200/80 dark:border-white/5 rounded-xl p-3">
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className={`text-lg font-extrabold ${stat.color} tabular-nums font-mono`}>{stat.value}</p>
                  </div>
                ))}
             </div>

             {/* Sequestered Notice for Active Official Exams */}
             {isSolutionsSequestered && (
                <div className="mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left flex items-start gap-2.5">
                  <Lock size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Official assessment active: Detailed answer keys and solutions will unlock on {formattedEnd}.
                  </p>
                </div>
             )}

             {/* Actions */}
             <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (targetAttemptId) {
                      navigate('/results/' + targetAttemptId);
                    } else {
                      navigate('/student/dashboard');
                    }
                  }}
                  className={`w-full py-3.5 ${themeBg} ${themeHover} text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer`}
                >
                  View Detailed Scorecard
                </button>
                <button
                  onClick={() => navigate('/student/dashboard')}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
                >
                  Return to Dashboard
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════ EXAM UI ══════════════════════════════════════════ */
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.keys(marked).filter(k => marked[k]).length;
  const isUrgent = timeLeft !== null && timeLeft > 0 && timeLeft < 60;
  const isWarning = timeLeft !== null && timeLeft >= 60 && timeLeft < 300;

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-[#f9f9f7] dark:bg-[#0e1015] text-[#090d16] dark:text-slate-100 transition-colors duration-200" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── 1. FIXED, COMPACT EXAMINATION TOPBAR ─────────────────────── */}
      <header className="h-14 flex-shrink-0 bg-white dark:bg-academy-card border-b border-academy-rule px-4 sm:px-6 flex items-center justify-between gap-3 z-30 shadow-2xs">
        {/* Left: Exit & Test Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleExit}
            className="min-h-[38px] px-3 py-1.5 text-xs rounded-lg border border-academy-rule bg-white dark:bg-academy-card text-academy-ink hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle flex items-center gap-1.5 cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0 transition-colors"
            title="Exit Assessment"
          >
            <ChevronLeft size={15} className="text-academy-muted" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <div className="h-5 w-px bg-academy-rule hidden sm:block shrink-0" />

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="font-serif text-sm sm:text-base font-bold text-academy-ink tracking-tight truncate max-w-[170px] sm:max-w-xs md:max-w-sm" title={test?.title || 'Examination Session'}>
              {test?.title || 'Examination Session'}
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/50 shrink-0">
              {test?.category || 'Assessment'}
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

        {/* Right: Actions, Proctoring & Urgency Timer HUD */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Proctoring Status Badge */}
          <div
            className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 shadow-2xs"
            title="Real-time exam telemetry active. Focus is proctored."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wide">
              Proctored
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] ml-1">
                {malpracticeCount === 0 ? '· Secure' : `· ${malpracticeCount}/5 warnings`}
              </span>
            </span>
          </div>

          <ThemeToggle size="sm" />

          <button
            type="button"
            onClick={() => setShowReloadConfirm(true)}
            className="hidden sm:flex min-h-[38px] min-w-[38px] items-center justify-center p-2 bg-slate-50 dark:bg-surface-subtle border border-academy-rule rounded-lg text-slate-500 dark:text-slate-400 hover:text-violet-600 active:scale-[0.95] transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            title="Sync & Save Progress"
          >
            <RotateCcw size={14} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
          </button>

          {/* ── 4. TIMER URGENCY SYSTEM ── */}
          <div
            role="timer"
            aria-label={`Time remaining: ${formatTime(timeLeft)}`}
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
            <span className="tracking-tight">{formatTime(timeLeft)}</span>
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

          {/* Responsive Mobile Drawer Palette Toggle Button */}
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
            onClick={() => setShowConfirm(true)}
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
                  {test?.category || 'General Assessment'}
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

            {/* Question Statement Card with 3D Flip */}
            <QuestionCardFlip
              isFlipped={isCardFlipped}
              onFlip={setIsCardFlipped}
              canFlip={!isMain && Boolean(currentQ?.explanation || currentQ?.correctAnswer)}
              flipButtonLabel="Show Solution Key"
              backButtonLabel="Return to Question"
              frontContent={
                <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-slate-300 dark:border-white/20 p-5 sm:p-6 shadow-sm">
                  <div className="text-base sm:text-lg md:text-xl font-serif font-normal text-academy-ink leading-relaxed">
                    <CodeQuestion text={currentQ?.questionText} category={test?.category || 'Code'} />
                  </div>
                </div>
              }
              backContent={
                <div className="bg-white dark:bg-academy-card rounded-2xl border-2 border-violet-400 dark:border-violet-700 p-5 sm:p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-academy-rule">
                    <span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                      Pedagogical Solution Key & Diagnostic
                    </span>
                    {currentQ?.correctAnswer && (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Option {currentQ.correctAnswer}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-academy-ink leading-relaxed font-normal">
                    {currentQ?.explanation || "No extended explanation provided for this practice item."}
                  </p>
                </div>
              }
            />

            {/* Options Radiogroup Stack */}
            <div
              className="space-y-3"
              role="radiogroup"
              aria-label={`Options for Question ${currentIndex + 1}`}
            >
              {['A', 'B', 'C', 'D'].map((opt) => {
                const text = currentQ?.[`option${opt}`];
                if (!text) return null;
                const selected = answers[currentQ?.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onClick={() => updateAnswer(currentQ.id, opt)}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-left transition-all duration-150 group cursor-pointer min-h-[54px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015] select-none active:scale-[0.995] ${
                      selected
                        ? 'border-2 border-violet-600 dark:border-violet-500 bg-violet-50/90 dark:bg-violet-950/60 text-slate-900 dark:text-white shadow-sm ring-1 ring-violet-500/30 font-medium'
                        : 'border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-academy-card text-academy-ink hover:border-violet-400 hover:bg-slate-50/80 dark:hover:bg-surface-subtle shadow-xs'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-all ${
                      selected
                        ? 'bg-violet-600 text-white shadow-sm ring-2 ring-violet-400/40'
                        : 'bg-slate-100 dark:bg-surface-subtle text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-academy-rule group-hover:border-violet-400 group-hover:text-violet-600 dark:group-hover:text-violet-400'
                    }`}>
                      {opt}
                    </span>
                    <span className="text-sm sm:text-base font-normal leading-relaxed text-academy-ink flex-1">
                      {text}
                    </span>
                    {selected ? (
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
          className="hidden lg:flex lg:w-[30%] flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-academy-card"
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
                    key={q.id}
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
              onClick={() => setShowConfirm(true)}
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
                  key={q.id}
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
              setShowConfirm(true);
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

        {/* Mobile Question Palette Drawer Trigger */}
        <button
          type="button"
          onClick={() => setShowPalette(true)}
          className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-300 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
          aria-label="Open Question Palette Directory"
          title="Open Question Palette"
        >
          <Activity size={12} className="text-violet-600 dark:text-violet-400" />
          <span>{currentIndex + 1}/{questions.length}</span>
        </button>

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
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="min-h-[40px] px-4 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
          >
            <Send size={14} className="shrink-0" />
            <span className="hidden sm:inline">Finish Test</span>
            <span className="sm:hidden">Finish</span>
          </button>
        </div>
      </footer>

      {/* ── ACCESSIBLE CONFIRMATION MODAL ────────────────────────── */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => submitTest()}
        title="Finalize & Submit Examination?"
        message="Review your responses before concluding your examination session. Once submitted, your answers will be securely vaulted and scored."
        confirmText={submitting ? "Submitting..." : "Confirm & Submit"}
        cancelText="Return to Examination"
        confirmVariant="primary"
        stats={{
          answered: answeredCount,
          marked: Object.keys(marked).filter(k => marked[k]).length,
          unanswered: Math.max(0, questions.length - answeredCount),
          total: questions.length
        }}
      />

      {/* ── RELOAD CONFIRMATION MODAL ──────────────────────────────── */}
      {showReloadConfirm && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200 dark:border-[#262a33] p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
              <RotateCcw size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">Sync & Reload?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Your current progress will be safely autosaved to the server before reloading.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  try {
                    if (beforeUnloadRef.current) {
                      window.removeEventListener('beforeunload', beforeUnloadRef.current);
                    }
                    if (!isSubmittingRef.current && !submitting) {
                      await api.post(`/attempts/${attemptId}/save-progress`, answers);
                    }
                    window.location.reload();
                  } catch {
                    window.location.reload();
                  }
                }}
                className="btn-primary w-full py-2.5 text-xs"
              >
                Yes, Save & Reload
              </button>
              <button
                onClick={() => setShowReloadConfirm(false)}
                className="btn-secondary w-full py-2.5 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MALPRACTICE WARNING MODAL ──────────────────────────────── */}
      {showMalpractice && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#15181e] rounded-2xl border-2 border-rose-400 dark:border-rose-500/80 p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={26} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">Proctoring Warning</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Navigating away or blurring the exam window is monitored. Your assessment will automatically submit after 5 infractions.
            </p>

            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl py-3 mb-6">
              <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider mb-0.5">Recorded Infractions</p>
              <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 tabular-nums">
                {malpracticeCount} <span className="text-xs font-normal text-rose-500 dark:text-rose-400">/ 5</span>
              </p>
            </div>

            <button
              onClick={() => setShowMalpractice(false)}
              className="btn-primary w-full py-2.5 text-xs"
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ── ABANDON MODAL ────────────────────────────────────────── */}
      {showAbandon && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] !m-0 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200 dark:border-[#262a33] p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
              <RotateCcw size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">Abandon Examination?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Exiting will terminate this session. Any unsaved progress will be permanently lost.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={abandonTest}
                className="btn-danger w-full py-2.5 text-xs"
              >
                Yes, Abandon Session
              </button>
              <button
                onClick={() => setShowAbandon(false)}
                className="btn-secondary w-full py-2.5 text-xs"
              >
                No, Continue Exam
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StudentTest;
