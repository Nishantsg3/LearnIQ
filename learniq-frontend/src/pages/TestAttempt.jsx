import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Activity
} from 'lucide-react';
import api from '../utils/api';

const TestAttempt = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [remainingTime, setRemainingTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use ref to avoid stale closure in timer
  const answersRef = useRef({});
  const submittingRef = useRef(false);

  const updateAnswers = (newAnswers) => {
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/attempts/${attemptId}`);
      const data = res.data;
      
      if (!data) throw new Error('Attempt not found');

      // If already submitted, redirect to results
      if (data.status === 'SUBMITTED') {
        toast('This assessment is already completed.', { icon: 'ℹ️' });
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

  // ─── Timer Auto-Submit (fixed: uses ref to avoid stale closure) ───────────
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
  }, [remainingTime, attemptId, navigate]);

  const handleSubmit = async (e, isAuto = false) => {
    if (e) e.preventDefault();
    if (submittingRef.current) return;

    if (!isAuto && remainingTime <= 0) {
      toast.error('Submission rejected: Time limit exceeded');
      navigate('/student-dashboard');
      return;
    }

    if (!isAuto && !window.confirm('Final submission? You will not be able to modify your responses after this.')) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.post(`/attempts/${attemptId}/submit`, answersRef.current);
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

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#1f2937] border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#020617] border-b border-[#1f2937] px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/student-dashboard')}
              className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
              title="Exit Assessment"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-8 w-[1px] bg-[#1f2937]"></div>
            <div>
               <h2 className="text-lg font-bold text-slate-50 tracking-tight">Technical Assessment</h2>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{questions.length} Questions</p>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border-2 font-black tabular-nums transition-all ${remainingTime < 300 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' : 'bg-slate-900 border-[#1f2937] text-slate-200'}`}>
               <Clock size={16} className={remainingTime < 300 ? 'text-rose-400' : 'text-indigo-400'}/>
               <span className="text-sm tracking-widest">{formatTime(remainingTime ?? 0)}</span>
            </div>
            
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="btn-primary py-2.5 px-8 text-sm"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Question Navigator */}
        <aside className="lg:col-span-3 card-base p-8 space-y-8 bg-[#111827]/50">
           <div className="flex items-center gap-3">
              <Activity size={16} className="text-indigo-400" />
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Question Grid</h4>
           </div>
           
           <div className="grid grid-cols-5 gap-3">
              {questions.map((_, i) => {
                const isCurrent = currentIndex === i;
                const isAnswered = !!answers[questions[i].id];
                return (
                  <button 
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-11 rounded-lg text-xs font-black transition-all border-2
                      ${isCurrent ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 -translate-y-0.5' : 
                        isAnswered ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-500' : 
                        'bg-slate-900/50 border-[#1f2937] text-slate-500 hover:border-slate-700'}
                    `}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </button>
                )
              })}
           </div>
           
           <div className="pt-8 border-t border-[#1f2937] space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <span className="w-3 h-3 rounded bg-emerald-500/30 inline-block"></span> Answered
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <span className="w-3 h-3 rounded bg-slate-800 inline-block"></span> Not answered
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span> Current
              </div>
           </div>
        </aside>

        {/* Workspace */}
        <main className="lg:col-span-9 space-y-8">
           <div className="card-base p-12 lg:p-16 min-h-[600px] flex flex-col justify-between relative bg-slate-900/40">
              {/* Progress bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                 <div 
                   className="h-full bg-indigo-600 transition-all duration-500" 
                   style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                 ></div>
              </div>

              <div>
                <div className="mb-12">
                  <span className="badge badge-primary">Question {currentIndex + 1} / {questions.length}</span>
                </div>

                <h3 className="text-3xl font-bold text-slate-50 leading-[1.4] mb-16 tracking-tight">
                  {currentQ?.questionText}
                </h3>

                <div className="grid grid-cols-1 gap-5">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const optionText = currentQ?.[`option${opt}`];
                    if (!optionText) return null;
                    const isSelected = answers[currentQ.id] === opt;
                    return (
                      <button 
                        key={opt}
                        onClick={() => updateAnswers({...answersRef.current, [currentQ.id]: opt})}
                        className={`w-full flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left group relative overflow-hidden
                          ${isSelected 
                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-50 shadow-md' 
                            : 'bg-slate-900 border-[#1f2937] text-slate-400 hover:border-slate-700'
                          }
                        `}
                      >
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all flex-shrink-0
                          ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'}
                        `}>
                          {opt}
                        </span>
                        <span className="text-lg font-bold flex-1">{optionText}</span>
                        {isSelected && (
                          <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            <CheckCircle2 size={24} className="text-indigo-500" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-20 pt-10 border-t border-[#1f2937] flex justify-between items-center">
                <button 
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(c => c - 1)}
                  className="btn-secondary py-3 px-8 text-xs disabled:opacity-20"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                  {Object.keys(answers).length} / {questions.length} answered
                </span>

                {currentIndex < questions.length - 1 ? (
                  <button 
                    onClick={() => setCurrentIndex(c => c + 1)}
                    className="btn-primary py-3 px-10 text-xs"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit} disabled={submitting}
                    className="btn-primary bg-emerald-600 hover:bg-emerald-700 py-3 px-10 text-xs shadow-lg shadow-emerald-600/20 border-none"
                  >
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </button>
                )}
              </div>
           </div>
        </main>

      </div>
    </div>
  );
};

export default TestAttempt;
