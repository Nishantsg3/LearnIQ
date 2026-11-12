import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import CodeQuestion from '../components/CodeQuestion';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';
import { Clock, ChevronLeft, ChevronRight, Trophy, RotateCcw, Bookmark, Send, AlertTriangle, X, Lock } from 'lucide-react';
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
    const tBg = 'bg-brand-700 dark:bg-brand-600';
    const tRing = 'ring-brand-700 dark:ring-brand-400';

    const base = 'w-9 h-9 rounded-md text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all relative border';
    if (isCurrent) return `${base} ring-2 ${tRing} ring-offset-2 ring-offset-white dark:ring-offset-academy-card ${tBg} text-white shadow-2xs z-10 scale-105 border-transparent`;
    switch (status) {
      case 'answeredMarked': return `${base} ${tBg} text-white border-transparent`;
      case 'answered':       return `${base} ${tBg} text-white border-transparent`;
      case 'marked':         return `${base} bg-amber-500 text-white border-transparent`;
      case 'visited':        return `${base} bg-academy-paper-subtle dark:bg-surface-subtle text-academy-ink border-academy-rule hover:bg-academy-rule-subtle`;
      default:               return `${base} bg-white dark:bg-academy-card text-academy-muted border-academy-rule hover:border-academy-accent/50`;
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
      <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto custom-scrollbar">
        <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-[#15181e] rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200 dark:border-[#262a33] relative overflow-hidden">
             <div className={`absolute top-0 left-0 right-0 h-1.5 ${isMain ? 'bg-rose-500' : 'bg-violet-600'}`} />

             <div className="text-center mb-6">
                <div className="w-16 h-16 bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-600 dark:text-violet-400 shadow-sm">
                  <Trophy size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">Assessment Complete</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{test?.title || result.testTitle || 'Diagnostic Assessment'}</p>
             </div>

             {/* Score Gauge Section */}
             <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                   <svg className="w-full h-full -rotate-90">
                      <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-[#1e222b]" />
                      <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" 
                              strokeDasharray={340} 
                              strokeDashoffset={340 - (340 * Math.min(100, Math.max(0, displayScore))) / 100}
                              className={`${themeText} transition-all duration-700 ease-out`} />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-none tabular-nums">{displayScore}%</span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">Accuracy</span>
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
                  <div key={stat.label} className="bg-slate-50 dark:bg-[#1a1d24] border border-slate-200/80 dark:border-[#262a33] rounded-xl p-2.5">
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className={`text-base font-extrabold ${stat.color} tabular-nums`}>{stat.value}</p>
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
             <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (targetAttemptId) {
                      navigate('/results/' + targetAttemptId);
                    } else {
                      navigate('/student/dashboard');
                    }
                  }}
                  className={`w-full py-3 ${themeBg} ${themeHover} text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer`}
                >
                  View Detailed Scorecard
                </button>
                <button
                  onClick={() => navigate('/student/dashboard')}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
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
  const isUrgent = timeLeft !== null && timeLeft > 0 && timeLeft < 60;
  const isWarning = timeLeft !== null && timeLeft >= 60 && timeLeft < 300;

  return (
    <div className="h-screen bg-[#f9f9f7] dark:bg-[#0e1015] text-[#090d16] dark:text-slate-100 flex flex-col overflow-hidden transition-colors duration-200" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-3 md:px-6 py-2.5 md:py-3 bg-white dark:bg-academy-card border-b border-academy-rule flex-shrink-0 gap-2 z-[60] shadow-2xs">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button
            type="button"
            onClick={handleExit}
            className="min-h-[40px] px-3 py-1.5 text-xs rounded-lg border border-academy-rule bg-white dark:bg-academy-card text-academy-ink hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle flex items-center gap-1.5 cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <ChevronLeft size={14} className="text-academy-muted" />
            <span className="hidden sm:inline">Exit</span>
          </button>
          
          <div className="hidden md:flex items-center gap-3">
            <BrandLogo size="sm" variant="wordmark" subtitle="Examination session" />
          </div>

          {/* Compact Branding for Mobile */}
          <div className="md:hidden flex items-center">
            <BrandLogo size="sm" variant="mark" />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Live Proctoring & Security Status Badge */}
          <div
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 shadow-2xs"
            title="Active Proctoring & Realtime Sync Active. Focus is monitored."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wide flex items-center gap-1">
              <span>Proctored</span>
              <span className="hidden lg:inline text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                {malpracticeCount === 0 ? '· Secure' : `· ${malpracticeCount}/5 warnings`}
              </span>
            </span>
          </div>

          <ThemeToggle size="sm" />

          <button
            type="button"
            onClick={() => setShowReloadConfirm(true)}
            className="hidden sm:flex min-h-[40px] min-w-[40px] items-center justify-center p-2 bg-academy-paper-subtle dark:bg-surface-subtle border border-academy-rule rounded-lg text-academy-muted hover:text-academy-accent hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle active:scale-[0.95] transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            title="Sync & Refresh Session"
          >
            <RotateCcw size={14} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
          </button>

          {/* High-visibility Timer HUD */}
          <div
            role="timer"
            aria-label={`Time remaining: ${formatTime(timeLeft)}`}
            aria-live="polite"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs md:text-sm tabular-nums transition-all duration-200 shadow-2xs ${
              isUrgent
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse ring-1 ring-rose-400/40'
                : isWarning
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400/30'
                : 'bg-slate-50 dark:bg-academy-card border-slate-200 dark:border-academy-rule text-slate-800 dark:text-slate-100'
            }`}
          >
            <Clock
              size={14}
              className={`shrink-0 ${
                isUrgent
                  ? 'text-rose-600 dark:text-rose-400'
                  : isWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-violet-600 dark:text-violet-400'
              }`}
            />
            <span className="tracking-tight">{formatTime(timeLeft)}</span>
            {isUrgent && (
              <span className="hidden xl:inline text-[9px] uppercase font-sans font-bold tracking-wider text-rose-600 dark:text-rose-400">
                &lt; 1m
              </span>
            )}
            {isWarning && (
              <span className="hidden xl:inline text-[9px] uppercase font-sans font-bold tracking-wider text-amber-600 dark:text-amber-400">
                &lt; 5m
              </span>
            )}
          </div>

          {/* Responsive Question Palette / Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowPalette(prev => !prev)}
            aria-label={`Toggle question palette. Question ${currentIndex + 1} of ${questions.length}`}
            aria-expanded={showPalette}
            aria-controls="question-palette-drawer"
            className="lg:hidden min-h-[44px] px-3 py-2 text-xs rounded-lg border border-academy-rule bg-white dark:bg-academy-card text-academy-ink flex items-center gap-1.5 font-mono font-medium active:scale-[0.98] shadow-2xs hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <span className="text-violet-600 dark:text-violet-400 font-bold">Q{currentIndex + 1}</span>
            <span className="text-academy-muted">/</span>
            <span>{questions.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="min-h-[40px] px-4 py-1.5 bg-academy-accent hover:bg-academy-accent-hover disabled:opacity-50 text-white rounded-lg font-semibold text-xs active:scale-[0.98] transition-all shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academy-accent"
          >
            {submitting ? 'Submitting...' : 'Finish Test'}
          </button>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 pb-32 md:pb-8 custom-scrollbar max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-medium text-academy-accent dark:text-academy-accent-deep">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-serif italic text-academy-muted">
                {test?.category || 'General Aptitude'}
              </span>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-6 md:p-8 shadow-2xs mb-6">
              <div className="text-base sm:text-lg font-serif font-normal text-academy-ink leading-relaxed">
                <CodeQuestion text={currentQ?.questionText} category={test?.category || 'Code'}/>
              </div>
            </div>

            {/* Options */}
            <div
              className="space-y-3"
              role="radiogroup"
              aria-label={`Options for Question ${currentIndex + 1}`}
            >
              {['A','B','C','D'].map((opt) => {
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
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left active:scale-[0.99] transition-all duration-150 group cursor-pointer min-h-[58px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e1015] select-none ${
                      selected
                        ? 'border-2 border-violet-600 bg-violet-50/80 dark:bg-violet-950/50 text-slate-900 dark:text-white shadow-sm ring-1 ring-violet-500/20 font-medium'
                        : 'bg-white dark:bg-academy-card border-academy-rule text-academy-ink-secondary hover:border-violet-400/60 hover:bg-slate-50 dark:hover:bg-surface-subtle'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-all ${
                      selected
                        ? 'bg-violet-600 text-white shadow-sm ring-2 ring-violet-400/30'
                        : 'bg-academy-paper-subtle dark:bg-surface-subtle text-academy-muted border border-academy-rule group-hover:text-academy-ink group-hover:border-violet-300 dark:group-hover:border-violet-700'
                    }`}>
                      {opt}
                    </span>
                    <span className="text-sm sm:text-base font-normal leading-relaxed text-academy-ink flex-1">{text}</span>
                    <span
                      className={`hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 rounded border transition-all ${
                        selected
                          ? 'bg-violet-100 dark:bg-violet-900/60 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      Key {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Keyboard shortcut hint strip */}
            <div className="mt-5 pt-3 border-t border-academy-rule/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-academy-muted font-mono">
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
              <div className="text-[10px] text-academy-muted italic font-serif">
                Auto-saved continuously
              </div>
            </div>
          </div>

          {/* ── BOTTOM ACTION BAR ─────────────────────────────────────── */}
          <div className="fixed md:relative bottom-0 left-0 right-0 z-30 md:flex-shrink-0 border-t border-academy-rule bg-white dark:bg-academy-card px-4 md:px-8 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:pb-3 shadow-md md:shadow-none">
            <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto w-full">
              
              {/* Left Group */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleMark(currentQ?.id)}
                  className={`min-h-[44px] flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    marked[currentQ?.id]
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold'
                      : 'bg-white dark:bg-academy-card border-academy-rule text-academy-muted hover:text-amber-700 hover:bg-amber-50/50'
                  }`}
                  title="Mark for Review (Shortcut: M)"
                >
                  <Bookmark size={15} className="shrink-0"/>
                  <span className="hidden sm:inline">Mark for review</span>
                  <span className="sm:hidden">Mark</span>
                </button>

                <button
                  type="button"
                  onClick={clearAnswer}
                  className="min-h-[44px] flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg border border-academy-rule bg-white dark:bg-academy-card text-academy-muted hover:text-rose-600 hover:bg-rose-50/50 text-xs font-medium active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  title="Clear response"
                >
                  <RotateCcw size={14} className="shrink-0"/>
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>

              {/* Right Group: Navigation */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-lg border border-academy-rule bg-white dark:bg-academy-card text-academy-ink hover:bg-academy-paper-subtle dark:hover:bg-surface-subtle text-xs font-medium flex items-center gap-1.5 disabled:opacity-30 cursor-pointer transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <ChevronLeft size={16} className="shrink-0"/> 
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={currentIndex === questions.length - 1}
                  className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 cursor-pointer bg-academy-accent hover:bg-academy-accent-hover text-white transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <span>Save & Next</span>
                  <ChevronRight size={16} className="shrink-0"/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile overlay backdrop */}
        {showPalette && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowPalette(false)}
            aria-hidden="true"
          />
        )}
        <aside
          id="question-palette-drawer"
          aria-label="Question Navigator"
          className={`
            w-72 sm:w-80 flex-shrink-0 border-l border-academy-rule bg-white dark:bg-academy-card flex flex-col overflow-hidden
            lg:relative lg:translate-x-0 lg:z-auto
            fixed right-0 top-0 bottom-0 z-50 transition-transform duration-200 ease-out shadow-xl lg:shadow-none
            ${showPalette ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="p-4 sm:p-5 border-b border-academy-rule flex-shrink-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-serif italic text-academy-muted uppercase tracking-wider">Question overview</p>
              <p className="text-xs font-semibold text-academy-ink mt-0.5">
                {answeredCount} of {questions.length} answered
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPalette(false)}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-academy-rule bg-slate-50 dark:bg-surface-subtle text-academy-muted hover:text-academy-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              aria-label="Close question palette"
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-4 sm:px-5 py-3 border-b border-academy-rule/60 flex-shrink-0 bg-slate-50/50 dark:bg-[#15181e]/50">
            <div className="space-y-1.5 text-xs font-sans">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-sm ${themeBg}`}/>
                  <span className="text-academy-muted">Answered</span>
                </div>
                <span className="font-mono text-academy-ink font-bold">{questions.filter(q => answers[q.id] && !marked[q.id]).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`relative w-3.5 h-3.5 rounded-sm ${themeBg} flex-shrink-0`}>
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 border border-white dark:border-slate-900"/>
                  </div>
                  <span className="text-academy-muted">Ans + Marked</span>
                </div>
                <span className="font-mono text-academy-ink font-bold">{questions.filter(q => answers[q.id] && marked[q.id]).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm bg-amber-500"/>
                  <span className="text-academy-muted">Marked</span>
                </div>
                <span className="font-mono text-academy-ink font-bold">{questions.filter(q => !answers[q.id] && marked[q.id]).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"/>
                  <span className="text-slate-600 dark:text-slate-400">Visited</span>
                </div>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{questions.filter((q,i) => !answers[q.id] && !marked[q.id] && visited.has(i)).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#262a33]"/>
                  <span className="text-slate-600 dark:text-slate-400">Not Visited</span>
                </div>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{questions.filter((q,i) => !answers[q.id] && !marked[q.id] && !visited.has(i)).length}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const status = getQStatus(q, idx);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
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
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white dark:border-slate-900"/>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-[#262a33] bg-slate-50 dark:bg-[#1a1d24]">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mb-2 font-semibold">
              Answered: <strong className="text-violet-600 dark:text-violet-400">{answeredCount}</strong> / {questions.length}
            </p>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className={`w-full min-h-[44px] py-2.5 ${themeBg} ${themeHover} disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
            >
              <Send size={14}/> <span>Finish Test</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ── CONFIRMATION MODAL ────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-slate-200 dark:border-[#262a33] p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-600 dark:text-violet-400">
              <Send size={24} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-1">Finalize Exam?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Review your responses carefully before finalizing your submission.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-900/50 rounded-xl p-2.5">
                <p className="text-lg font-extrabold text-violet-700 dark:text-violet-300">{answeredCount}</p>
                <p className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase">Answered</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/50 rounded-xl p-2.5">
                <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300">{Object.keys(marked).filter(k => marked[k]).length}</p>
                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">Marked</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                <p className="text-lg font-extrabold text-slate-700 dark:text-slate-300">{questions.length - answeredCount}</p>
                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Skipped</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => submitTest()}
                disabled={submitting}
                className="btn-primary w-full py-2.5 text-xs"
              >
                {submitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary w-full py-2.5 text-xs"
              >
                Return to Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RELOAD CONFIRMATION MODAL ──────────────────────────────── */}
      {showReloadConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
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
        </div>
      )}

      {/* ── MALPRACTICE WARNING MODAL ──────────────────────────────── */}
      {showMalpractice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
        </div>
      )}

      {/* ── ABANDON MODAL ────────────────────────────────────────── */}
      {showAbandon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
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
        </div>
      )}
    </div>
  );
};

export default StudentTest;
