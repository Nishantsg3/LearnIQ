import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CodeQuestion from '../components/CodeQuestion';
import { ChevronLeft, ChevronRight, Trophy, X, CheckCircle2, Home, ArrowLeft, ArrowUpRight } from 'lucide-react';
import api from '../utils/api';

/* ─── Single source of truth for correctness ──────────────────────── */
/**
 * Determines if a student's selected option is correct.
 * Handles two data formats from the backend:
 *   1. correctAnswer stored as LABEL  → e.g. "C"
 *   2. correctAnswer stored as TEXT   → e.g. "₹820"
 */
const calcIsCorrect = (q) => {
  if (!q || !q.selectedOption) return false;
  const selected = q.selectedOption; // e.g. "C"
  const correct  = q.correctAnswer;  // e.g. "C" or "₹820"
  if (!correct) return false;

  // Direct label match: "C" === "C"
  if (selected.toUpperCase() === correct.toUpperCase()) return true;

  // Text match: option text of selected label === correct answer text
  const selectedText = q[`option${selected.toUpperCase()}`] || '';
  if (selectedText && selectedText.trim().toLowerCase() === correct.trim().toLowerCase()) return true;

  return false;
};

const calcIsSkipped = (q) => !q?.selectedOption;

/* ─── Normalize answer review items ──────────────────────────────── */
const normalizeQuestion = (q = {}) => ({
  ...q,
  questionText: q.questionText || q.title || '',
  optionA: q.optionA || '',
  optionB: q.optionB || '',
  optionC: q.optionC || '',
  optionD: q.optionD || '',
});

const TestReview = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt]       = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitPath, setExitPath] = useState(null);
  const [showPalette, setShowPalette] = useState(false);

  const exitModalRef = useRef(null);
  const cancelExitBtnRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Focus trap, Escape listener, and focus restoration for exit modal
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

  const goNext = () => { if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  const isMain       = attempt?.testType === 'MAIN';
  // Standardizing Review Mode to LearnIQ Purple theme
  const themeText    = 'text-violet-400';

  /* Palette colour — uses calcIsCorrect so it matches option highlights */
  const paletteStyle = (q, idx, isCurrent) => {
    const correct  = calcIsCorrect(q);
    const skipped  = calcIsSkipped(q);
    const base = 'w-10 h-10 rounded-lg text-sm font-bold flex items-center justify-center cursor-pointer transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12122a]';

    const bgColour = correct ? 'bg-emerald-600' : skipped ? 'bg-slate-700' : 'bg-red-600';
    if (isCurrent) return `${base} ring-2 ring-white ring-offset-2 ring-offset-[#0e0e1a] ${bgColour} text-white shadow-lg z-10`;

    if (skipped) return `${base} bg-slate-900 text-slate-400 border border-slate-800`;
    if (correct) return `${base} bg-emerald-600/20 text-emerald-400 border border-emerald-500/30`;
    return          `${base} bg-red-600/20 text-red-400 border border-red-500/30`;
  };

  if (loading) return (
    <div className="h-screen bg-[#0e0e1a] flex flex-col items-center justify-center gap-4">
      <div className={`w-10 h-10 border-4 ${isMain ? 'border-red-600/30 border-t-red-500' : 'border-emerald-600/30 border-t-emerald-500'} rounded-full animate-spin`}/>
      <p className={`${themeText} text-xs font-bold uppercase tracking-widest animate-pulse`}>Loading Analytics...</p>
    </div>
  );

  /* Per-question derived state — computed once, used everywhere below */
  const currentQ           = questions[currentIndex];
  const qIsCorrect         = calcIsCorrect(currentQ);
  const qIsSkipped         = calcIsSkipped(currentQ);

  /* Re-compute client-side tallies so the top bar matches visual state */
  const clientCorrectCount = questions.filter(calcIsCorrect).length;
  const clientSkipCount    = questions.filter(calcIsSkipped).length;
  const clientWrongCount   = questions.length - clientCorrectCount - clientSkipCount;

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden">
      {/* ── TOP BAR (APPLE GLASS) ─────────────────────────────────────────────────── */}
      <header className="apple-glass flex items-center justify-between px-3 sm:px-6 py-2.5 md:py-3.5 border-b border-white/[0.08] flex-shrink-0 z-50 relative gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => { setExitPath(-1); setShowExitConfirm(true); }}
            aria-label="Exit Review"
            className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all group shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <ArrowLeft size={14} className="text-slate-400 group-hover:text-white transition-colors"/>
            <span className="hidden sm:inline text-xs font-semibold text-slate-300 group-hover:text-white tracking-wide transition-colors">Exit</span>
          </button>

          <div className="hidden md:flex flex-col shrink-0">
            <span className="text-[10px] font-semibold text-white/50 tracking-wider uppercase mb-0.5">
              <span>LEARN</span>
              <span className="text-violet-400 font-bold">IQ</span>
            </span>
            <span className="text-white font-bold text-xs tracking-tight">
              Assessment Review
            </span>
          </div>

          {/* Compact Branding for Mobile */}
          <div className="md:hidden flex items-center bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20">
             <span className="text-[10px] font-bold text-violet-400">IQ</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400"/>
              <span className="text-xs font-semibold text-emerald-400 tabular-nums">{clientCorrectCount}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-red-400"/>
              <span className="text-xs font-semibold text-red-400 tabular-nums">{clientWrongCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] font-semibold text-xs md:text-sm tabular-nums transition-all shrink-0">
             <Trophy size={13} className="text-amber-400"/>
             <span className="text-white font-bold">{questions.length > 0 ? Math.round((clientCorrectCount / questions.length) * 100) : 0}%</span>
          </div>

          <button
            type="button"
            onClick={() => setShowPalette(prev => !prev)}
            className="lg:hidden p-2 rounded-xl border text-xs font-semibold transition-all bg-white/[0.04] border-white/[0.08] text-white active:scale-95 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            aria-label="Toggle Question Palette"
          >
            <span className="text-violet-400">Q{currentIndex + 1}</span>
            <span className="text-white/40">/</span>
            <span className="tabular-nums">{questions.length}</span>
          </button>

          <button
            type="button"
            onClick={() => { setExitPath('/student/dashboard'); setShowExitConfirm(true); }}
            aria-label="Return to Dashboard"
            className="flex items-center gap-1.5 px-3.5 h-8 md:h-9 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-full transition-all group shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <ArrowUpRight size={13} className="text-slate-400 group-hover:text-white transition-colors group-hover:rotate-45 transition-transform duration-200"/>
            <span className="hidden sm:inline text-xs font-semibold text-slate-300 group-hover:text-white tracking-wide transition-colors whitespace-nowrap">Dashboard</span>
          </button>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto px-4 md:px-10 pt-6 md:pt-8 pb-4 custom-scrollbar">

            {/* ── STATUS BADGE ── uses qIsCorrect / qIsSkipped */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-white/50 tracking-wide">
                Question <span className="text-white font-semibold tabular-nums">{currentIndex + 1}</span> of <span className="tabular-nums">{questions.length}</span>
              </p>
              <div className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                qIsCorrect  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                qIsSkipped  ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                               'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {qIsCorrect ? '✓ Correct' : qIsSkipped ? '○ Skipped' : '✕ Incorrect'}
              </div>
            </div>

            <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed mb-8">
              <CodeQuestion text={currentQ?.questionText}/>
            </div>

            {/* ── OPTIONS ── uses same logic as calcIsCorrect */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A','B','C','D'].map((opt) => {
                const text = currentQ?.[`option${opt}`];
                if (!text) return null;

                const isSelected = (currentQ?.selectedOption || '').toUpperCase() === opt.toUpperCase();
                const isTheCorrectOption =
                  opt.toUpperCase() === (currentQ?.correctAnswer || '').toUpperCase() ||
                  text.trim().toLowerCase() === (currentQ?.correctAnswer || '').trim().toLowerCase();

                let borderClass = 'border-white/[0.08] bg-white/[0.03] text-slate-300';
                if (isTheCorrectOption)             borderClass = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.08)]';
                else if (isSelected)                borderClass = 'border-rose-500/50 bg-rose-500/10 text-rose-300';

                return (
                  <div key={opt} className={`apple-card flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${borderClass}`}>
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                      isTheCorrectOption ? 'bg-emerald-500 text-white border-emerald-400' :
                      isSelected         ? 'bg-rose-500 text-white border-rose-400' :
                                           'bg-white/[0.06] text-slate-400 border-white/[0.08]'
                    }`}>
                      {opt}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{text}</p>
                    </div>
                    {isSelected && (
                      <div className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider ${isTheCorrectOption ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        Your Choice
                      </div>
                    )}
                    {isTheCorrectOption && !isSelected && (
                      <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md text-[9px] font-semibold uppercase tracking-wider border border-emerald-500/30">
                        Correct Answer
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── ANSWER FEEDBACK ── only show when actually wrong */}
            {!qIsCorrect && !qIsSkipped && (
              <div className="mt-8 p-5 rounded-2xl flex items-center gap-4 bg-rose-500/[0.06] border border-rose-500/20">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30 shrink-0">
                  <X size={20}/>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-rose-400/80 uppercase tracking-wider mb-0.5">Answer Review</p>
                  <p className="text-sm font-medium text-slate-200">
                    The correct answer is{' '}
                    <span className="text-emerald-400 font-semibold underline decoration-2 underline-offset-4">{currentQ?.correctAnswer}</span>
                  </p>
                </div>
              </div>
            )}

            {/* ── CORRECT CELEBRATION ── */}
            {qIsCorrect && (
              <div className="mt-8 p-5 rounded-2xl flex items-center gap-4 bg-emerald-500/[0.06] border border-emerald-500/20">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0">
                  <CheckCircle2 size={20}/>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-wider mb-0.5">Verified Correct</p>
                  <p className="text-sm font-medium text-slate-200">You selected the correct solution.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── BOTTOM NAV BAR (APPLE GLASS) ────────────────────────────────────────── */}
          <div className="apple-glass flex-shrink-0 border-t border-white/[0.08] px-4 sm:px-8 py-3.5 pb-[calc(env(safe-area-inset-bottom)+14px)] flex items-center justify-between z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <button onClick={goPrev} disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 text-xs font-semibold hover:text-white hover:bg-white/[0.08] active:scale-95 disabled:opacity-20 transition-all">
              <ChevronLeft size={15}/> <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <div className="flex flex-col items-center">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Question Progress</p>
              <p className="text-xs font-semibold text-white tabular-nums">{currentIndex + 1} / {questions.length}</p>
            </div>

            <button onClick={goNext} disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-semibold tracking-wide disabled:opacity-20 transition-all shadow-md shadow-violet-600/20">
              <span className="hidden sm:inline">Next Question</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight size={15}/>
            </button>
          </div>
        </div>

        {/* Mobile overlay backdrop */}
        {showPalette && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[40] lg:hidden"
            onClick={() => setShowPalette(false)}
          />
        )}

        {/* ── PALETTE ────────────────────────────────────────────────── */}
        <div className={`
          w-72 flex-shrink-0 border-l border-white/[0.08] bg-[#0d0d14] flex flex-col overflow-hidden
          lg:relative lg:translate-x-0 lg:z-auto
          fixed right-0 top-0 bottom-0 z-50 transition-transform duration-300
          ${showPalette ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Palette Overview</p>
              <button onClick={() => setShowPalette(false)} className="lg:hidden p-1 text-slate-400 hover:text-white transition-colors" aria-label="Close palette">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Accuracy</p>
                <p className="text-base font-bold text-white tabular-nums">
                  {questions.length > 0 ? Math.round((clientCorrectCount / questions.length) * 100) : 0}%
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Total</p>
                <p className="text-base font-bold text-white tabular-nums">{questions.length}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const correct = calcIsCorrect(q);
                const skipped = calcIsSkipped(q);
                const statusLabel = correct ? 'Correct' : skipped ? 'Skipped' : 'Incorrect';
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      if (window.innerWidth < 1024) setShowPalette(false);
                    }}
                    className={paletteStyle(q, idx, isCurrent)}
                    aria-label={`Question ${idx + 1}: ${statusLabel}`}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-white/[0.06] bg-white/[0.02] shrink-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>
                  <span className="text-slate-300">Correct</span>
                </div>
                <span className="font-semibold text-emerald-400 tabular-nums">{clientCorrectCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                  <span className="text-slate-300">Incorrect</span>
                </div>
                <span className="font-semibold text-red-400 tabular-nums">{clientWrongCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"/>
                  <span className="text-slate-300">Skipped</span>
                </div>
                <span className="font-semibold text-slate-400 tabular-nums">{clientSkipCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXIT CONFIRMATION MODAL (APPLE DIALOG) ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setShowExitConfirm(false)}
            aria-hidden="true"
          />
          <div
            ref={exitModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
            aria-describedby="exit-modal-description"
            className="apple-dialog relative rounded-3xl max-w-sm w-full p-7 text-center animate-in zoom-in-95 duration-150 shadow-2xl"
          >
            <div className="w-14 h-14 bg-violet-600/20 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-violet-500/30">
              <Home size={26} className="text-violet-400"/>
            </div>
            <h3 id="exit-modal-title" className="text-lg font-bold text-white tracking-tight mb-1.5">
              {exitPath === '/student/dashboard' ? 'Return to Dashboard?' : 'Exit Review?'}
            </h3>
            <p id="exit-modal-description" className="text-white/60 text-xs font-normal leading-relaxed mb-6">
              {exitPath === '/student/dashboard'
                ? 'Are you sure you want to return to your student dashboard?'
                : 'Are you sure you want to exit the review mode?'}
            </p>
            <div className="flex gap-3">
              <button
                ref={cancelExitBtnRef}
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl font-semibold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => navigate(exitPath)}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-xs shadow-md shadow-violet-600/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestReview;
