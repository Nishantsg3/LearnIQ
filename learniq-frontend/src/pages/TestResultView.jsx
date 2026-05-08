import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ArrowUpRight,
  XCircle,
  FileText,
  Download,
  Award,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  X,
  Target,
  Clock,
  PieChart,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import html2pdf from 'html2pdf.js';

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

/** Single source of truth — handles label ("C") and text ("₹820") formats */
const calcIsCorrect = (item) => {
  if (!item || !item.selectedOption) return false;
  const sel = item.selectedOption;
  const ans = item.correctAnswer || '';
  if (sel.toUpperCase() === ans.toUpperCase()) return true;
  const selectedText = item[`option${sel.toUpperCase()}`] || '';
  return selectedText.trim().toLowerCase() === ans.trim().toLowerCase();
};

const TestResultView = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
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
                .then(lbRes => setLeaderboard(lbRes.data))
                .catch(() => console.log("Leaderboard fetch failed."));
            }
          }
        }
      } catch (err) {
        toast.error('Unable to retrieve records');
        navigate('/student/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId, navigate]);

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading('Generating report...');
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `Report_${attempt?.testTitle?.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    setTimeout(() => {
      html2pdf().set(opt).from(element).save().then(() => {
        toast.success('Exported', { id: toastId });
        setIsExporting(false);
      }).catch(() => {
        toast.error('Failed', { id: toastId });
        setIsExporting(false);
      });
    }, 500);
  };

  const reviewList = attempt?.answerReviews || [];

  // ── Client-side recalculation (overrides stale backend values) ──
  const clientCorrect  = reviewList.filter(item => item && calcIsCorrect(item)).length;
  const clientSkipped  = reviewList.filter(item => item && !item.selectedOption).length;
  const clientWrong    = Math.max(0, reviewList.length - clientCorrect - clientSkipped);
  const clientScore    = reviewList.length > 0 ? Math.round((clientCorrect / reviewList.length) * 100) : 0;
  const isPassed       = clientScore >= 40;

  const isExpired = test?.endTime ? new Date() > new Date(test.endTime) : true;
  const isAdmin = user?.role === 'ADMIN';
  
  // Deterministic Rank Calculation — matches by any unique identifier
  const globalStandingData = useMemo(() => {
    const lbArray = Array.isArray(leaderboard) ? leaderboard.filter(Boolean) : [];
    if (!lbArray.length) return { rank: 1, total: 1 };
    
    // 1. Sort full pool by score
    const sorted = [...lbArray].sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // 2. Find student position using multi-key matching
    const myPos = sorted.findIndex(e => 
      e && (
        (e.userId && user?.id && e.userId === user.id) || 
        (e.userEmail && user?.email && e.userEmail === user.email) || 
        (e.userName && user?.name && e.userName === user.name)
      )
    );
    
    return {
        rank: myPos === -1 ? 1 : myPos + 1,
        total: sorted.length
    };
  }, [leaderboard, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-white/5 border-t-violet-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Compiling Analytics...</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] animate-pulse">
            <AlertCircle size={40} className="text-rose-500" />
        </div>
        <div className="text-center space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Record Not Found</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">The requested assessment intelligence is unavailable</p>
        </div>
        <button 
            onClick={() => navigate('/student/dashboard')} 
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
        >
            Return to Command Center
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col animate-in fade-in duration-1000 ${showAnswers ? 'min-h-screen pb-20 overflow-y-auto' : 'h-[calc(100vh-140px)] overflow-hidden'} p-8 space-y-4`}>
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}</style>

      {/* HEADER - TIGHTENED FURTHER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0 no-print">
          <div className="space-y-1">
              <div className="flex items-center gap-3 text-slate-500 text-[8px] font-black uppercase tracking-[0.4em]">
                  <Target size={10} className="text-violet-500" />
                  Performance Intelligence
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                  Assessment <span className="text-violet-500">Report</span>
              </h1>
          </div>

          <div className="flex items-center gap-2">
              <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-white group">
                  <Download size={12} />
                  <span className="text-[8px] font-black uppercase tracking-widest">PDF</span>
              </button>
              <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 rounded-xl hover:bg-violet-700 transition-all text-white group shadow-lg">
                  <ArrowUpRight size={12} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white">Dashboard</span>
              </button>
          </div>
      </div>

      {/* MAIN CONTENT AREA - NO SCROLL IN SUMMARY */}
      <div ref={reportRef} className={`flex-1 flex flex-col gap-6 ${showAnswers ? 'overflow-visible' : 'overflow-hidden'}`}>
          
          {/* SUMMARY GRID - ULTRA COMPACT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0 h-full max-h-fit">
              {/* RADIAL SCORE CARD - COMPACT */}
              <div className="lg:col-span-5 bg-gradient-to-b from-[#161622] to-[#0d0d12] border border-white/5 rounded-[2rem] p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl h-full min-h-[300px]">
                  <div className={`absolute top-0 left-0 w-full h-1 ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'} opacity-30`}></div>
                  
                  <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                          <circle 
                              cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" 
                              className={isPassed ? 'text-emerald-500' : 'text-rose-500'}
                              strokeDasharray={364.4}
                              strokeDashoffset={364.4 - (364.4 * clientScore) / 100}
                              strokeLinecap="round"
                          />
                      </svg>
                      <div className="text-center relative z-10">
                          <span className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">
                              {clientScore}
                          </span>
                          <span className="text-base text-slate-500 font-bold">%</span>
                      </div>
                  </div>

                  <div className="text-center space-y-4">
                      <div className="space-y-0.5">
                        <p className={`text-[8px] font-black uppercase tracking-[0.4em] ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPassed ? 'Authorized' : 'Denied'}
                        </p>
                        <h3 className="text-base font-black text-white/90 uppercase tracking-tight">
                            {isPassed ? 'Passed' : 'Failed'}
                        </h3>
                      </div>

                      <button
                        onClick={() => navigate('/review/' + attemptId)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all no-print mx-auto bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/20`}
                      >
                        <Eye size={12} />
                        Deep Analysis
                      </button>
                  </div>
              </div>

              {/* KPI TILES - COMPACT */}
              <div className="lg:col-span-7 grid grid-cols-2 gap-3 h-full">
                  <KPICard label="Correct" value={clientCorrect} color="#10b981" icon={<CheckCircle2 size={16} />} />
                  <KPICard label="Incorrect" value={clientWrong} color="#f43f5e" icon={<X size={16} />} />
                  <KPICard label="Items" value={reviewList.length || attempt?.totalQuestions} color="#6366f1" icon={<FileText size={16} />} />
                  {test?.testType === 'MAIN' ? (
                      <KPICard 
                        label="Global Standing" 
                        value={loading ? '...' : `#${globalStandingData.rank}`} 
                        color="#fbbf24" 
                        icon={<Award size={16} />} 
                      />
                  ) : (
                    <KPICard label="Accuracy" value={clientScore + '%'} color="#a78bfa" icon={<PieChart size={16} />} />
                  )}
              </div>
          </div>

          {/* DEEP ANALYSIS LIST (Only if showAnswers is TRUE) */}
          {showAnswers && (
            <div className="space-y-8 animate-in slide-in-from-top-10 duration-700">
                <div className="flex items-center gap-6 px-4 shrink-0">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">Question-Level Analytics</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {reviewList.map((item, i) => item && (
                        <AnalysisRow key={i} item={item} index={i} />
                    ))}
                </div>

                {/* PERSONAL STANDING HIGHLIGHT (REPLACED FULL TABLE) */}
                {test?.testType === 'MAIN' && leaderboard.length > 0 && (
                  <div className="mt-12 mb-20 p-8 bg-violet-600/5 border border-violet-500/20 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400 border border-violet-500/20">
                        <Award size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Your Global Standing</h3>
                        <p className="text-violet-400/60 text-[10px] font-black uppercase tracking-[0.3em]">Positioned relative to all candidates</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Rank</p>
                      <p className="text-4xl font-black text-white tracking-tighter italic">
                        #{globalStandingData.rank}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}
      </div>
    </div>
  );
};

const KPICard = ({ label, value, color, icon }) => (
  <div className="bg-[#0d0d12] border border-white/5 rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center shadow-lg hover:border-white/10 transition-all group h-full">
    <div 
        className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center border transition-all"
        style={{ background: `${color}10`, borderColor: `${color}20`, color: color }}
    >
        {icon}
    </div>
    <p className="text-xl font-black tabular-nums tracking-tighter text-white">
      {value}
    </p>
    <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-1">{label}</p>
  </div>
);

const AnalysisRow = ({ item, index }) => {
  const isCorrect = calcIsCorrect(item);
  return (
    <div className={`bg-[#0d0d12]/60 backdrop-blur-xl border ${isCorrect ? 'border-emerald-500/10' : 'border-rose-500/10'} rounded-[2.5rem] p-10 relative overflow-hidden transition-all group hover:bg-[#0d0d12]`}>
       <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
          <div className="flex-1 space-y-4">
             <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">Question {index + 1}</span>
                <div className={`w-2 h-2 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_10px_currentColor]`}></div>
             </div>
             <h4 className="text-xl font-black text-white uppercase tracking-tight leading-tight max-w-3xl">{item.questionText}</h4>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${isCorrect ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
             {isCorrect ? <CheckCircle2 size={28} /> : <X size={28} />}
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 relative z-10">
          {[
            { id: 'A', text: item.optionA },
            { id: 'B', text: item.optionB },
            { id: 'C', text: item.optionC },
            { id: 'D', text: item.optionD }
          ].map(opt => {
             // Supports both label match (e.g. "C") or text match (e.g. "Option Content")
             const isCorrectAns = opt.id === item.correctAnswer || opt.text === item.correctAnswer;
             const isSelected = opt.id === item.selectedOption;

             return (
                <div 
                  key={opt.id}
                  className={`p-5 rounded-2xl border flex items-center gap-5 transition-all ${
                    isCorrectAns ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                    isSelected ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 
                    'bg-white/[0.02] border-white/5 text-slate-500'
                  }`}
                >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black border ${
                        isCorrectAns ? 'bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
                        isSelected ? 'bg-rose-500/20 border-rose-500/30' : 
                        'bg-white/5 border-white/10'
                   }`}>
                      {opt.id}
                   </div>
                   <p className="text-xs font-black uppercase tracking-tight leading-tight flex-1">{opt.text}</p>
                   {isSelected && (
                     <div className={`px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-[0.2em] ${isCorrectAns ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>Selected</div>
                   )}
                </div>
             );
          })}
       </div>

       {!isCorrect && item.selectedOption && (
         <div className="mt-8 p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center gap-5">
            <AlertCircle size={20} className="text-rose-400 shrink-0" />
            <div>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Incorrect Answer</p>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    The correct answer is <span className="text-emerald-400 underline decoration-2 underline-offset-4">{item.correctAnswer}</span>
                </p>
            </div>
         </div>
       )}
    </div>
  );
};

export default TestResultView;
