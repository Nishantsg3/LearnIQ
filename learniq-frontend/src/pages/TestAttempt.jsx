import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Activity,
  Award
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

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Attempt Details (Includes questions and time)
      const res = await api.get(`/attempts/${attemptId}`);
      const data = res.data;
      
      if (!data) throw new Error('Attempt not found');

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

  // Timer Logic
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0) return;
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(null, true); // Auto-submit on time out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingTime]);

  const handleSubmit = async (e, isAuto = false) => {
    if (e) e.preventDefault();
    if (submitting) return;

    // Reject manually if timer expired
    if (!isAuto && remainingTime <= 0) {
      toast.error('Submission rejected: Time limit exceeded');
      navigate('/student-dashboard');
      return;
    }

    if (!isAuto && !window.confirm('Final submission? You will not be able to modify your responses after this.')) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/attempts/${attemptId}/submit`, answers);
      toast.success('Assessment completed');
      navigate(`/results/${res.data.id}`); 
    } catch (err) {
      const msg = err.response?.data?.message || 'Transmission failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('already')) {
        navigate('/student-dashboard');
      }
    } finally {
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
      {/* Precision Header */}
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
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{questions.length} Items Indexed</p>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border-2 font-black tabular-nums transition-all ${remainingTime < 300 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' : 'bg-slate-900 border-[#1f2937] text-slate-200'}`}>
               <Clock size={16} className={remainingTime < 300 ? 'text-rose-400' : 'text-indigo-400'}/>
               <span className="text-sm tracking-widest">{formatTime(remainingTime)}</span>
            </div>
            
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="btn-primary py-2.5 px-8 text-sm"
            >
              {submitting ? 'Finalizing...' : 'Final Submission'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Experience Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Navigation Grid */}
        <aside className="lg:col-span-3 card-base p-8 space-y-8 bg-[#111827]/50">
           <div className="flex items-center gap-3">
              <Activity size={16} className="text-indigo-400" />
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Item Matrix</h4>
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
           
           <div className="pt-8 border-t border-[#1f2937] space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                 <AlertCircle size={14} className="flex-shrink-0" />
                 <p className="text-[9px] font-bold leading-relaxed uppercase tracking-widest">
                   Integrity check active. Activity is logged.
                 </p>
              </div>
           </div>
        </aside>

        {/* Workspace */}
        <main className="lg:col-span-9 space-y-8">
           <div className="card-base p-12 lg:p-16 min-h-[600px] flex flex-col justify-between relative bg-slate-900/40">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                 <div 
                   className="h-full bg-indigo-600 transition-all duration-500" 
                   style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                 ></div>
              </div>

              <div>
                <div className="mb-12">
                  <span className="badge badge-primary">Segment {currentIndex + 1} / {questions.length}</span>
                </div>

                <h3 className="text-3xl font-bold text-slate-50 leading-[1.4] mb-16 tracking-tight">
                  {currentQ?.questionText}
                </h3>

                <div className="grid grid-cols-1 gap-5">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const optionText = currentQ[`option${opt}`];
                    const isSelected = answers[currentQ.id] === opt;
                    return (
                      <button 
                        key={opt}
                        onClick={() => setAnswers(c => ({...c, [currentQ.id]: opt}))}
                        className={`w-full flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left group relative overflow-hidden
                          ${isSelected 
                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-50 shadow-md' 
                            : 'bg-slate-900 border-[#1f2937] text-slate-400 hover:border-slate-700'
                          }
                        `}
                      >
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all
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
                  className="btn-secondary py-3 px-8 text-xs disabled:opacity-20 translate-all"
                >
                  <ChevronLeft size={16} /> Previous Page
                </button>
                
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                   Iterative Evaluation Mode
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button 
                    onClick={() => setCurrentIndex(c => c + 1)}
                    className="btn-primary py-3 px-10 text-xs"
                  >
                    Next Question <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit} disabled={submitting}
                    className="btn-primary bg-emerald-600 hover:bg-emerald-700 py-3 px-10 text-xs shadow-lg shadow-emerald-600/20 border-none"
                  >
                    {submitting ? 'Transmitting...' : 'Final Submission'}
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
