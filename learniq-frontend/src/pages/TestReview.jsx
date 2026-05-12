import { useEffect, useState, useCallback } from 'react';
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
  const themeBg      = 'bg-violet-600';
  const themeHover   = 'hover:bg-violet-500';
  const themeBorder  = 'border-violet-500';
  const themeLightBg = 'bg-violet-600/20';

  /* Palette colour — uses calcIsCorrect so it matches option highlights */
  const paletteStyle = (q, idx, isCurrent) => {
    const correct  = calcIsCorrect(q);
    const skipped  = calcIsSkipped(q);
    const base = 'w-10 h-10 rounded-lg text-sm font-bold flex items-center justify-center cursor-pointer transition-all relative';

    const bgColour = correct ? 'bg-emerald-600' : skipped ? 'bg-slate-700' : 'bg-red-600';
    if (isCurrent) return `${base} ring-2 ring-white ring-offset-2 ring-offset-[#0e0e1a] ${bgColour} text-white shadow-lg z-10`;

    if (skipped) return `${base} bg-slate-900 text-slate-500 border border-slate-800`;
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
    <div className="h-screen bg-[#0e0e1a] text-white flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2 md:py-3 bg-[#12122a] border-b border-[#2a2a4a] flex-shrink-0 z-50 relative gap-2">
        <div className="flex items-center gap-1.5 md:gap-4 min-w-0">
          <button 
            onClick={() => { setExitPath(-1); setShowExitConfirm(true); }} 
            className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group shrink-0"
          >
            <ArrowLeft size={14} className="text-gray-400 group-hover:text-white transition-colors"/>
            <span className="hidden sm:inline text-[10px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest transition-colors">Exit</span>
          </button>
          
          <div className="hidden md:flex flex-col shrink-0">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">
              <span className="text-white/40">LEARN</span>
              <span className="text-violet-500">IQ</span>
            </span>
            <span className={`${themeText} font-black text-xs tracking-widest uppercase truncate`}>
              REVIEW <span className="text-white">MODE</span>
            </span>
          </div>

          {/* Compact Branding for Mobile */}
          <div className="md:hidden flex items-center bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20">
             <span className="text-[10px] font-black text-violet-500 tracking-tighter">IQ</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"/>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{clientCorrectCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"/>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{clientWrongCount}</span>
            </div>
          </div>

          <div className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg border border-[#2a2a4a] bg-[#1a1a2e] font-black text-xs md:text-sm tabular-nums transition-all shrink-0`}>
             <Trophy size={12} className={themeText}/>
             <span className="text-xs md:text-sm text-white">{questions.length > 0 ? Math.round((clientCorrectCount / questions.length) * 100) : 0}%</span>
          </div>

          <button 
            onClick={() => setShowPalette(prev => !prev)}
            className="lg:hidden p-2 md:p-2.5 rounded-xl border text-[10px] md:text-xs font-black transition-all bg-white/5 border-white/10 text-white active:scale-95 flex items-center gap-1 md:gap-2"
          >
            <span className={themeText}>Q{currentIndex + 1}</span>
            <span className="text-white/20">/</span>
            <span>{questions.length}</span>
          </button>

          <button 
            onClick={() => { setExitPath('/student/dashboard'); setShowExitConfirm(true); }} 
            className="flex items-center gap-2 px-3 md:px-4 h-8 md:h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group shrink-0"
          >
            <ArrowUpRight size={14} className="text-gray-400 group-hover:text-white transition-colors group-hover:rotate-45 transition-transform"/>
            <span className="hidden sm:inline text-[10px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest transition-colors whitespace-nowrap">Dashboard</span>
          </button>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 md:pt-8 pb-4">

            {/* ── STATUS BADGE ── uses qIsCorrect / qIsSkipped */}
            <div className="flex items-center justify-between mb-4">
              <p className={`text-[10px] font-black ${themeText}/70 uppercase tracking-[0.3em]`}>
                Question {currentIndex + 1} of {questions.length}
              </p>
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                qIsCorrect  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                qIsSkipped  ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                               'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {qIsCorrect ? '✓ Correct' : qIsSkipped ? '○ Skipped' : '✕ Incorrect'}
              </div>
            </div>

            <div className="text-lg font-semibold text-gray-100 leading-relaxed mb-8">
              <CodeQuestion text={currentQ?.questionText}/>
            </div>

            {/* ── OPTIONS ── uses same logic as calcIsCorrect */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A','B','C','D'].map((opt) => {
                const text = currentQ?.[`option${opt}`];
                if (!text) return null;

                const isSelected = currentQ?.selectedOption === opt;
                // An option is "the correct one" if selecting it would yield a correct answer
                const isTheCorrectOption =
                  opt.toUpperCase() === (currentQ?.correctAnswer || '').toUpperCase() ||
                  text.trim().toLowerCase() === (currentQ?.correctAnswer || '').trim().toLowerCase();

                let borderClass = 'border-[#2a2a4a] bg-[#14142a] text-gray-400';
                if (isTheCorrectOption)             borderClass = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]';
                else if (isSelected)                borderClass = 'border-red-500/50 bg-red-500/10 text-red-400';

                return (
                  <div key={opt} className={`flex items-center gap-4 px-6 py-5 rounded-2xl border transition-all ${borderClass}`}>
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 border ${
                      isTheCorrectOption ? 'bg-emerald-500 text-white border-emerald-400' :
                      isSelected         ? 'bg-red-500 text-white border-red-400' :
                                           'bg-[#252545] text-gray-400 border-white/5'
                    }`}>
                      {opt}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-snug">{text}</p>
                    </div>
                    {isSelected && (
                      <div className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest ${isTheCorrectOption ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                        Your Choice
                      </div>
                    )}
                    {isTheCorrectOption && !isSelected && (
                      <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-[7px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Correct Answer
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── ANSWER FEEDBACK ── only show when actually wrong (not correct!) */}
            {!qIsCorrect && !qIsSkipped && (
              <div className="mt-8 p-6 bg-[#1a1a2e] border border-white/5 rounded-2xl flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/10">
                  <X size={24}/>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Answer Feedback</p>
                  <p className="text-sm font-bold text-gray-300">
                    The correct answer is{' '}
                    <span className="text-emerald-400 underline decoration-2 underline-offset-4">{currentQ?.correctAnswer}</span>
                  </p>
                </div>
              </div>
            )}

            {/* ── CORRECT CELEBRATION ── subtle green note for correct answers */}
            {qIsCorrect && (
              <div className="mt-8 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10">
                  <CheckCircle2 size={24}/>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest mb-1">Well Done</p>
                  <p className="text-sm font-bold text-gray-300">You answered this question correctly.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── BOTTOM NAV BAR ────────────────────────────────────────── */}
          <div className="flex-shrink-0 border-t border-[#2a2a4a] bg-[#12122a] px-4 sm:px-8 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] flex items-center justify-between z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <button onClick={goPrev} disabled={currentIndex === 0}
              className="flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-[#2a2a4a] bg-[#1a1a2e] text-gray-400 text-[10px] sm:text-xs font-bold hover:text-white disabled:opacity-20 transition-all">
              <ChevronLeft size={14}/> <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <div className="flex flex-col items-center">
              <p className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Progress</p>
              <p className="text-[10px] sm:text-xs font-black text-white">{currentIndex + 1} / {questions.length}</p>
            </div>

            <button onClick={goNext} disabled={currentIndex === questions.length - 1}
              className={`flex items-center gap-2 px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl ${themeBg} ${themeHover} text-white text-[10px] sm:text-xs font-black uppercase tracking-widest disabled:opacity-20 transition-all shadow-lg shadow-violet-600/10`}>
              <span className="hidden sm:inline">Next Question</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight size={14}/>
            </button>
          </div>
        </div>

        {/* Mobile overlay backdrop */}
        {showPalette && (
          <div
            className="fixed inset-0 bg-black/60 z-[40] lg:hidden"
            onClick={() => setShowPalette(false)}
          />
        )}

        {/* ── PALETTE ────────────────────────────────────────────────── */}
        <div className={`
          w-64 flex-shrink-0 border-l border-[#2a2a4a] bg-[#12122a] flex flex-col overflow-hidden
          lg:relative lg:translate-x-0 lg:z-auto
          fixed right-0 top-0 bottom-0 z-50 transition-transform duration-300
          ${showPalette ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-5 pt-5 pb-3 border-b border-white/5 flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Result Board</p>
              <button onClick={() => setShowPalette(false)} className="lg:hidden p-1 text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#0e0e1a] border border-white/5 rounded-xl p-3 text-center">
                <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-1">Accuracy</p>
                <p className="text-sm font-black text-white">
                  {questions.length > 0 ? Math.round((clientCorrectCount / questions.length) * 100) : 0}%
                </p>
              </div>
              <div className="bg-[#0e0e1a] border border-white/5 rounded-xl p-3 text-center">
                <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-1">Items</p>
                <p className="text-sm font-black text-white">{questions.length}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => (
                <button 
                  key={idx} 
                  onClick={() => {
                    setCurrentIndex(idx);
                    if (window.innerWidth < 1024) setShowPalette(false);
                  }} 
                  className={paletteStyle(q, idx, idx === currentIndex)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 border-t border-white/5 bg-[#0e0e1a]/50 shrink-0">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded bg-emerald-500"/>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Correct</span>
                </div>
                <span className="text-[10px] font-black text-emerald-400">{clientCorrectCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded bg-red-500"/>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Incorrect</span>
                </div>
                <span className="text-[10px] font-black text-red-400">{clientWrongCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded bg-slate-700"/>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Skipped</span>
                </div>
                <span className="text-[10px] font-black text-gray-400">{clientSkipCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXIT CONFIRMATION MODAL ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a15]/95 p-6 animate-in fade-in duration-300">
          <div className="relative bg-[#1a1a2e] border border-white/10 rounded-3xl max-w-sm w-full shadow-[0_30px_100px_rgba(0,0,0,0.8)] p-8 text-center transform animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-500/30">
              <Home size={28} className="text-violet-400"/>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              {exitPath === '/student/dashboard' ? 'Go to Dashboard?' : 'Exit Review?'}
            </h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">
              {exitPath === '/student/dashboard' 
                ? 'Are you sure you want to return to the main dashboard?' 
                : 'Are you sure you want to leave the review mode?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 bg-[#252545] hover:bg-[#2d2d55] text-gray-300 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate(exitPath)}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-violet-600/20 transition-all"
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
