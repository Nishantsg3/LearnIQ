import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import CodeQuestion from '../components/CodeQuestion';
import { Clock, ChevronLeft, ChevronRight, Trophy, RotateCcw, Bookmark, Send, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

/* ─── helpers ─────────────────────────────────────────────────────── */
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
  const { user } = useAuth();
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
  const updateAnswer = (qid, opt) => {
    const next = { ...answers, [qid]: opt };
    setAnswers(next);
    answersRef.current = next;
  };

  const toggleMark = (qid) =>
    setMarked(prev => ({ ...prev, [qid]: !prev[qid] }));

  const markVisited = (idx) =>
    setVisited(prev => { const s = new Set(prev); s.add(idx); return s; });

  const clearAnswer = () => {
    const q = questions[currentIndex];
    if (!q) return;
    const next = { ...answers };
    delete next[q.id];
    setAnswers(next);
    answersRef.current = next;
  };

  /* ── fetch ── */
  const fetchTestData = useCallback(async () => {
    try {
      setLoading(true);
      const [testRes, qRes, timeRes, attemptRes] = await Promise.all([
        api.get(`/tests/${id}`),
        api.get(`/questions/test/${id}/attempt`),
        api.get(`/questions/test/${id}/time`),
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
      navigate('/student-dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, attemptId, navigate]);

  /* ── auto-save ── */
  useEffect(() => {
    if (!attemptId || loading || !test || submitting || isSubmittingRef.current) return;
    const save = async () => {
        if (submitting || isSubmittingRef.current) return;
        try { await api.post(`/attempts/${attemptId}/save-progress`, answers); }
        catch (err) { console.error("Sync failed"); }
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
  }, [timeLeft, autoSubmitted, result, loading, submitting]);

  /* ── countdown ── */
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, result]);

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

  /* ── malpractice detection (Anti-Cheat) ── */
  useEffect(() => {
    if (result || loading || submitting) return;

    const triggerMalpractice = () => {
      // Cooldown: prevent mouseleave + blur from double-counting the same tab switch
      if (malpracticeCooldownRef.current) return;
      malpracticeCooldownRef.current = true;
      setTimeout(() => { malpracticeCooldownRef.current = false; }, 1000);

      setMalpracticeCount(prev => {
        const next = prev + 1;
        if (next === 5) {
          handleAutoSubmit('malpractice');
        } else if (next < 5) {
          setShowMalpractice(true);
        }
        return next;
      });
    };

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) triggerMalpractice();
    };

    const handleBlur = () => triggerMalpractice();

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleBlur);
    };
  }, [result, loading, submitting]);

  /* ── 🔄 TIMER SYNC (Poll server every 30s to prevent drift) ── */
  useEffect(() => {
    if (result || timeLeft === null || timeLeft <= 5) return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await api.get(`/questions/test/${id}/time?attemptId=${new URLSearchParams(window.location.search).get('attemptId')}`);
        const serverTime = parseInt(res.data.remainingTime);
        if (!isNaN(serverTime)) {
          setTimeLeft(serverTime);
          if (serverTime <= 0 && !autoSubmitted) handleAutoSubmit('time');
        }
      } catch (e) {
        if (e.response?.status === 400 || e.response?.status === 404) {
          console.warn("[SYNC] Session inactive or already submitted. Redirecting...");
          navigate('/student-dashboard');
        }
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [id, result, timeLeft === null, autoSubmitted]);

  /* ── submit ── */
  const handleAutoSubmit = async (reason = 'time') => {
    if (isSubmittingRef.current || autoSubmitted || result) return;
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
  };

  const submitTest = async (isAuto = false) => {
    // Block manual submit if auto-submit already fired or result exists
    if (result || autoSubmitted) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    setShowConfirm(false);

    // Hard UI Lock: ensure no background tasks keep running
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      const res = await api.post(`/questions/test/${id}/submit`, { answers: answersRef.current });
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
         setTimeout(() => navigate('/student/dashboard'), 1500);
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
            setTimeout(() => navigate('/student/dashboard'), 2500);
         } else {
            toast.error(msg);
            isSubmittingRef.current = false;
            setSubmitting(false);
            setAutoSubmitted(false);
         }
      }
    }
  };

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
    } catch (err) {
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
  const themeText = isMain ? 'text-rose-400' : 'text-emerald-400';
  const themeBg = isMain ? 'bg-rose-600' : 'bg-emerald-600';
  const themeHover = isMain ? 'hover:bg-rose-500' : 'hover:bg-emerald-500';
  const themeBorder = isMain ? 'border-rose-500' : 'border-emerald-500';
  const themeLightBg = isMain ? 'bg-rose-600/20' : 'bg-emerald-600/20';
  const themeShadow = isMain ? 'shadow-rose-600/30' : 'shadow-emerald-600/30';

  const paletteStyle = (status, isCurrent) => {
    const tBg = isMain ? 'bg-rose-600' : 'bg-emerald-600';
    const tRing = isMain ? 'ring-rose-400' : 'ring-emerald-400';
    const tBorder = isMain ? 'border-rose-900/40' : 'border-emerald-900/40';

    const base = 'w-10 h-10 rounded-lg text-sm font-bold flex items-center justify-center cursor-pointer transition-all relative';
    if (isCurrent) return `${base} ring-2 ${tRing} ring-offset-1 ring-offset-[#1a1a2e] ${tBg} text-white shadow-lg`;
    switch (status) {
      case 'answeredMarked': return `${base} ${tBg} text-white`;
      case 'answered':       return `${base} ${tBg} text-white`;
      case 'marked':         return `${base} bg-orange-500 text-white`;
      case 'visited':        return `${base} bg-slate-900/60 text-slate-300 border border-slate-700/60`;
      default:               return `${base} bg-[#0e0e1a] text-gray-700 border ${tBorder}`;
    }
  };

  /* ═══════════════ LOADING ══════════════════════════════════════════ */
  if (loading) return (
    <div className="h-screen bg-[#0e0e1a] flex flex-col items-center justify-center gap-4">
      <div className={`w-10 h-10 border-4 ${isMain ? 'border-red-600/30 border-t-red-500' : 'border-emerald-600/30 border-t-emerald-500'} rounded-full animate-spin`}/>
      <p className={`${themeText} text-xs font-bold uppercase tracking-widest animate-pulse`}>Loading Assessment...</p>
    </div>
  );

  /* ═══════════════ RESULT ═══════════════════════════════════════════ */
  if (result) return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0a0a12] flex items-center justify-center p-4 z-[100] overflow-y-auto custom-scrollbar">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a1a3a_0%,#0a0a12_70%)] opacity-50" />
      
      <div className="relative w-full max-w-xl animate-in zoom-in duration-700">
        <div className={`relative bg-[#1a1a2e]/95 border-2 ${themeBorder}/30 backdrop-blur-3xl rounded-[40px] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden`}>
           {/* Solid Bold Top Bar */}
           <div className={`absolute top-0 left-0 right-0 h-2 ${isMain ? 'bg-rose-500' : 'bg-emerald-500'} shadow-[0_0_40px_rgba(${isMain ? '244,63,94' : '16,185,129'},0.6)]`} />

           <div className="text-center mb-6">
              <div className={`w-20 h-20 ${themeLightBg} rounded-3xl flex items-center justify-center mx-auto mb-4 border ${themeBorder}/20 shadow-2xl relative`}>
                <Trophy size={40} className={themeText}/>
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">Assessment Complete</h1>
              <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em]">{test?.title}</p>
           </div>

           {/* Score Gauge Section */}
           <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" 
                            strokeDasharray={352} 
                            strokeDashoffset={352 - (352 * (result.scorePercent || 0)) / 100}
                            className={`${themeText} transition-all duration-1000 ease-out`} />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white leading-none">{result.scorePercent}%</span>
                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mt-1">Accuracy</span>
                 </div>
              </div>
           </div>

           {/* Quick Stats Grid */}
           <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Total', value: result.totalQuestions, color: 'text-white' },
                { label: 'Attempted', value: result.attemptedCount || Object.keys(answers).length, color: themeText },
                { label: 'Correct', color: 'text-emerald-400', value: result.correctCount },
                { label: 'Wrong', color: 'text-rose-400', value: result.wrongCount },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
           </div>

           {/* Actions */}
           <div className="flex flex-col gap-2.5">
              <button
                onClick={() => navigate('/results/' + result.id)}
                className={`w-full py-4 ${themeBg} ${themeHover} text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl ${themeShadow} hover:scale-[1.02] active:scale-95`}
              >
                View Detailed Analysis
              </button>
              <button
                onClick={() => navigate('/student-dashboard')}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-white/5"
              >
                Return to Dashboard
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════ EXAM UI ══════════════════════════════════════════ */
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isExpiring = timeLeft !== null && timeLeft < 120;

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1;
      markVisited(next);
      setCurrentIndex(next);
    }
  };
  const goPrev = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      markVisited(prev);
      setCurrentIndex(prev);
    }
  };

  return (
    <div className="h-screen bg-[#0e0e1a] text-white flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3 bg-[#12122a] border-b border-[#2a2a4a] flex-shrink-0 gap-2 z-[60]">
        <div className="flex items-center gap-1.5 md:gap-4 min-w-0">
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group shrink-0"
          >
            <ChevronLeft size={14} className="text-gray-400 group-hover:text-white transition-colors"/>
            <span className="hidden sm:inline text-[10px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest transition-colors">Exit</span>
          </button>
          
          <div className="hidden md:flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">
              <span className="text-white/40">LEARN</span>
              <span className="text-violet-500">IQ</span>
            </span>
            <span className={`${themeText} font-black text-sm tracking-widest uppercase`}>
              EXAM <span className="text-white">CENTER</span>
            </span>
          </div>

          {/* Compact Branding for Mobile */}
          <div className="md:hidden flex items-center bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20">
             <span className="text-[10px] font-black text-violet-500 tracking-tighter">IQ</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
          <button
            onClick={() => setShowReloadConfirm(true)}
            className="hidden sm:flex p-2 md:p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all group"
            title="Sync & Refresh Session"
          >
            <RotateCcw size={14} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
          </button>

          <div className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg border font-black text-xs md:text-sm tabular-nums transition-all ${
            isExpiring
              ? 'bg-red-600/20 border-red-500/40 text-red-400 animate-pulse'
              : 'bg-[#1a1a2e] border-[#2a2a4a] text-white'
          }`}>
            <Clock size={12} className={isExpiring ? 'text-red-400' : themeText}/>
            <span className="text-xs md:text-sm">{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowPalette(prev => !prev)}
            className={`lg:hidden p-2 md:p-2.5 rounded-xl border text-[10px] md:text-xs font-black transition-all bg-white/5 border-white/10 text-white active:scale-95 flex items-center gap-1 md:gap-2`}
          >
            <span className={themeText}>Q{currentIndex + 1}</span>
            <span className="text-white/20">/</span>
            <span>{questions.length}</span>
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className={`px-3 md:px-6 py-2 ${themeBg} ${themeHover} disabled:opacity-50 text-white rounded-lg font-black text-[10px] md:text-sm uppercase tracking-widest transition-all shadow-lg ${themeShadow}`}
          >
            {submitting ? '...' : 'FINISH'}
          </button>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-4 md:pt-6 pb-40 md:pb-12 custom-scrollbar">
            <p className={`text-[10px] font-black ${themeText}/70 uppercase tracking-[0.3em] mb-3`}>
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div className="text-[15px] font-semibold text-gray-100 leading-relaxed mb-6">
              <CodeQuestion text={currentQ?.questionText} category={test?.category || 'Code'}/>
            </div>

            <div className="space-y-3">
              {['A','B','C','D'].map((opt) => {
                const text = currentQ?.[`option${opt}`];
                if (!text) return null;
                const selected = answers[currentQ?.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => updateAnswer(currentQ.id, opt)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all group ${
                      selected
                        ? `${themeLightBg} ${themeBorder} text-white shadow-lg shadow-black/20`
                        : 'bg-[#14142a] border-[#2a2a4a] text-gray-300 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
                      selected
                        ? `${themeBg} text-white`
                        : 'bg-[#252545] text-gray-400 group-hover:bg-slate-700/50 group-hover:text-slate-200'
                    }`}>
                      {opt}
                    </span>
                    <span className="text-sm font-medium">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── BOTTOM ACTION BAR ─────────────────────────────────────── */}
          <div className="fixed md:relative bottom-0 left-0 right-0 z-[70] md:z-auto md:flex-shrink-0 border-t border-[#2a2a4a] bg-[#12122a]/95 backdrop-blur-md md:backdrop-blur-none px-3 md:px-8 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)] md:pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] md:shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between gap-2 md:gap-4 max-w-full">
              
              {/* Left Group: Action Toggles */}
              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  onClick={() => toggleMark(currentQ?.id)}
                  className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl border text-[10px] md:text-xs font-bold transition-all ${
                    marked[currentQ?.id]
                      ? 'bg-orange-500/20 border-orange-500/60 text-orange-400'
                      : 'bg-[#1a1a2e] border-[#2a2a4a] text-gray-400 hover:border-orange-500/40 hover:text-orange-400'
                  }`}
                  title="Mark for Review"
                >
                  <Bookmark size={16} className="shrink-0"/>
                  <span className="hidden md:inline">Mark for Review</span>
                </button>

                <button
                  onClick={clearAnswer}
                  className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-[#2a2a4a] bg-[#1a1a2e] text-rose-400 text-[10px] md:text-xs font-bold hover:border-rose-500/40 hover:bg-rose-900/10 transition-all"
                  title="Clear Response"
                >
                  <RotateCcw size={16} className="shrink-0"/>
                  <span className="hidden md:inline">Clear Response</span>
                </button>
              </div>

              {/* Right Group: Navigation */}
              <div className="flex items-center gap-1.5 md:gap-2 ml-auto">
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className={`flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl border border-[#2a2a4a] bg-[#1a1a2e] text-gray-300 text-[10px] md:text-xs font-bold hover:${themeBorder}/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all`}
                >
                  <ChevronLeft size={18} className="shrink-0"/> 
                  <span className="hidden md:inline">Prev</span>
                </button>

                <button
                  onClick={goNext}
                  disabled={currentIndex === questions.length - 1}
                  className={`flex items-center justify-center gap-2 px-5 md:px-8 py-2.5 md:py-3 rounded-xl ${themeBg} ${themeHover} text-white text-[10px] md:text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg ${themeShadow}`}
                >
                  <span className="hidden md:inline whitespace-nowrap">Save & Next</span>
                  <ChevronRight size={18} className="shrink-0"/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile overlay backdrop */}
        {showPalette && (
          <div
            className="fixed inset-0 bg-black/60 z-[40] lg:hidden"
            onClick={() => setShowPalette(false)}
          />
        )}
        <div className={`
          w-64 flex-shrink-0 border-l border-[#2a2a4a] bg-[#12122a] flex flex-col overflow-hidden
          lg:relative lg:translate-x-0 lg:z-auto
          fixed right-0 top-0 bottom-0 z-50 transition-transform duration-300
          ${showPalette ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-5 pt-5 pb-3 flex-shrink-0">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Question Palette</p>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${themeBg}`}/>
                  <span className="text-gray-400 font-medium">Answered</span>
                </div>
                <span className="text-gray-500 font-bold">{questions.filter(q => answers[q.id] && !marked[q.id]).length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <div className={`relative w-4 h-4 rounded ${themeBg} flex-shrink-0`}>
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500 border border-[#12122a]"/>
                  </div>
                  <span className="text-gray-400 font-medium">Ans + Marked</span>
                </div>
                <span className="text-gray-500 font-bold">{questions.filter(q => answers[q.id] && marked[q.id]).length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500"/>
                  <span className="text-gray-400 font-medium">Marked</span>
                </div>
                <span className="text-gray-500 font-bold">{questions.filter(q => !answers[q.id] && marked[q.id]).length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-900/60 border border-slate-700/60"/>
                  <span className="text-gray-400 font-medium">Visited</span>
                </div>
                <span className="text-gray-500 font-bold">{questions.filter((q,i) => !answers[q.id] && !marked[q.id] && visited.has(i)).length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded bg-[#0e0e1a] border ${themeBorder}/20`}/>
                  <span className="text-gray-400 font-medium">Not Visited</span>
                </div>
                <span className="text-gray-500 font-bold">{questions.filter((q,i) => !answers[q.id] && !marked[q.id] && !visited.has(i)).length}</span>
              </div>
            </div>
            <div className="h-px bg-[#2a2a4a] mb-4"/>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4 pt-2">
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const status = getQStatus(q, idx);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => { markVisited(idx); setCurrentIndex(idx); }}
                    className={paletteStyle(status, isCurrent)}
                    title={`Question ${idx + 1}`}
                  >
                    {idx + 1}
                    {status === 'answeredMarked' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-500 border border-[#12122a]"/>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-[#2a2a4a]">
            <p className="text-[10px] text-gray-500 text-center mb-2 font-medium">
              Answered: <span className={`${themeText} font-bold`}>{answeredCount}</span> / {questions.length}
            </p>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting || currentIndex < questions.length - 1}
              className={`w-full py-3 ${themeBg} ${themeHover} disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/40`}
            >
              <Send size={13}/> Submit Test →
            </button>
          </div>
        </div>
      </div>

      {/* ── CONFIRMATION MODAL ────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
          <div className="relative bg-[#1a1a2e]/80 border-2 border-white/10 backdrop-blur-xl rounded-3xl max-w-sm w-full shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in duration-300">
            <div className={`h-1.5 w-full bg-gradient-to-r ${isMain ? 'from-rose-600 via-pink-400 to-rose-600' : 'from-emerald-600 via-teal-400 to-emerald-600'}`}/>
            <div className="p-8">
              <div className="text-center mb-6">
                <div className={`w-20 h-20 ${themeLightBg} rounded-2xl flex items-center justify-center mx-auto mb-4 border ${themeBorder}/20`}>
                  <Send size={32} className={themeText}/>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Finalize Assessment</h3>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] mt-2 mb-6 text-center">
                  Review your responses before final submission.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className={`${themeLightBg} border ${themeBorder}/20 rounded-xl p-3 text-center`}>
                  <p className={`${themeText} text-xl font-black`}>{answeredCount}</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1 font-black">Answers</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
                  <p className="text-orange-400 text-xl font-black">{Object.keys(marked).filter(k => marked[k]).length}</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1 font-black">Marked</p>
                </div>
                <div className="bg-gray-900/50 border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-gray-300 text-xl font-black">{questions.length - answeredCount}</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1 font-black">Skipped</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => submitTest()}
                  disabled={submitting}
                  className={`w-full py-4 ${themeBg} ${themeHover} disabled:opacity-50 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all`}
                >
                  {submitting ? 'Processing...' : 'Complete Submission'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all border border-white/5"
                >
                  Return to Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RELOAD CONFIRMATION MODAL ──────────────────────────────── */}
      {showReloadConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
          <div className="relative bg-[#1a1a2e]/80 border-2 border-white/10 backdrop-blur-xl rounded-3xl max-w-sm w-full shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in duration-300">
            <div className="h-1.5 w-full bg-amber-500/50 animate-pulse"/>
            <div className="p-8">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                <RotateCcw size={32} className="text-amber-500"/>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 text-center">Sync & Refresh?</h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed mb-8 text-center">
                Your current progress will be saved before the page reloads.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    try {
                      // Proactively remove the native prompt by reference before manual reload
                      if (beforeUnloadRef.current) {
                        window.removeEventListener('beforeunload', beforeUnloadRef.current);
                      }
                      if (!isSubmittingRef.current && !submitting) {
                        await api.post(`/attempts/${attemptId}/save-progress`, answers);
                      }
                      window.location.reload();
                    } catch (err) {
                      window.location.reload();
                    }
                  }}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-lg shadow-amber-600/20"
                >
                  Yes, Sync & Reload
                </button>
                <button
                  onClick={() => setShowReloadConfirm(false)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all border border-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MALPRACTICE WARNING MODAL ──────────────────────────────── */}
      {showMalpractice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 pointer-events-auto">
          <div className="relative bg-[#1a1a2e]/90 border-2 border-amber-500/30 backdrop-blur-2xl rounded-3xl max-w-sm w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in duration-300">
            <div className="h-1.5 w-full bg-amber-600 animate-pulse"/>
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                <AlertTriangle size={32} className="text-amber-500"/>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Security Alert</h3>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] leading-relaxed mb-6">
                Leaving the assessment environment is prohibited. Your session will auto-submit after 5 attempts.
              </p>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl py-4 mb-8">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Current Violation Count</p>
                <p className="text-3xl font-black text-white tracking-tighter">
                  {malpracticeCount} <span className="text-amber-500/30">/ 5</span>
                </p>
              </div>

              <button
                onClick={() => setShowMalpractice(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase text-[11px] tracking-widest transition-all border border-white/10"
              >
                I Understand & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ABANDON MODAL ────────────────────────────────────────── */}
      {showAbandon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
          <div className="relative bg-[#1a1a2e]/80 border-2 border-white/10 backdrop-blur-xl rounded-3xl max-w-sm w-full shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in duration-300">
            <div className="h-1.5 w-full bg-rose-600"/>
            <div className="p-8 text-center">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
              <RotateCcw size={32} className="text-rose-500"/>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Abandon Test?</h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed mb-8">
              Progress will not be saved to history.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={abandonTest}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-lg shadow-rose-600/20"
              >
                Yes, Abandon Test
              </button>
              <button
                onClick={() => setShowAbandon(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all border border-white/5"
              >
                No, Stay in Test
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default StudentTest;
