import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  BarChart, 
  FileText,
  Download,
  CheckCircle,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TestResultView = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await api.get(`/attempts/${attemptId}`);
        setAttempt(res.data);
      } catch (err) {
        toast.error('Unable to retrieve records');
        navigate('/student-dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [attemptId, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#1f2937] border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  const isPassed = attempt?.scorePercent >= 60;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <header className="flex justify-between items-center">
         <div>
            <button 
               onClick={() => navigate('/student-dashboard?tab=attempts')}
               className="flex items-center gap-2 text-slate-500 hover:text-slate-200 transition-colors mb-4 text-[10px] uppercase font-black tracking-widest"
            >
               <ArrowLeft size={16} /> Return to Inventory
            </button>
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Assessment Performance Report</h1>
         </div>
         <button onClick={() => window.print()} className="btn-secondary py-2 px-5 text-xs bg-slate-900 border-[#1f2937] hover:border-indigo-500/50">
            <Download size={14} /> Export PDF
         </button>
      </header>

      {/* Hero Stats Card */}
      <div className="card-base p-10 lg:p-14 relative overflow-hidden bg-slate-900/60 flex flex-col items-center text-center">
          <div className={`absolute top-0 left-0 w-full h-1.5 ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          
          <div className="mb-8">
             <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 mx-auto ${isPassed ? 'bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border-2 border-rose-500/30'}`}>
                {isPassed ? <Trophy size={40} /> : <XCircle size={40} />}
             </div>
             <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPassed ? 'Competency Achieved' : 'Criteria Not Met'}
             </p>
             <h2 className="text-5xl font-black text-slate-50 mt-4 tracking-tighter">
                {attempt?.scorePercent}%
             </h2>
             <p className="text-slate-500 text-xs font-bold mt-3 uppercase tracking-widest leading-relaxed">
                {attempt?.testTitle} • Assessment Node {attemptId}
             </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl mt-10 pt-10 border-t border-[#1f2937]">
             <div className="text-center">
                <p className="text-2xl font-bold text-slate-200">{attempt?.correctCount}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Correct</p>
             </div>
             <div className="text-center">
                <p className="text-2xl font-bold text-slate-200">{attempt?.wrongCount}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Incorrect</p>
             </div>
             <div className="text-center">
                <p className="text-2xl font-bold text-slate-200">{attempt?.totalQuestions}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Items</p>
             </div>
             <div className="text-center">
                <p className="text-2xl font-bold text-slate-200">{attempt?.category}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Category</p>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Detailed Insights */}
         <section className="lg:col-span-8 card-base p-10 lg:p-12 space-y-10">
            <div className="flex items-center gap-4 border-b border-[#1f2937] pb-6">
               <Activity size={24} className="text-indigo-500" />
               <div>
                  <h3 className="text-xl font-bold text-slate-50">Technical Meta-Data</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Internal Evaluation Metrics</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-900 border border-[#1f2937] p-5 rounded-xl">
                     <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Date Index</span>
                     <span className="text-sm font-bold text-slate-200">{new Date(attempt?.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900 border border-[#1f2937] p-5 rounded-xl">
                     <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Sync Time</span>
                     <span className="text-sm font-bold text-slate-200">{new Date(attempt?.submittedAt).toLocaleTimeString()}</span>
                  </div>
               </div>
               <div className="space-y-6">
                  <p className="text-sm text-slate-400 font-bold leading-relaxed">
                     This assessment was evaluated using the proprietary LearnIQ engine. Criteria for passing is set at 60% accuracy for {attempt?.category} modules.
                  </p>
                  <p className="text-xs text-slate-600 font-medium italic">
                     Assessment hash: SHA-256_{attemptId?.slice(0, 8)}...
                  </p>
               </div>
            </div>
         </section>

         {/* Suggested Path */}
         <aside className="lg:col-span-4 card-base p-10 space-y-8 bg-[#111827]/30">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
               <Award size={16} className="text-indigo-400" />
               Next Steps
            </h3>
            
            <div className="space-y-5">
               {isPassed ? (
                  <>
                    <p className="text-sm text-slate-400 font-bold leading-relaxed">
                       Congratulations. Your performance indicators suggest readiness for advanced modules.
                    </p>
                    <button onClick={() => navigate('/student-dashboard?tab=live')} className="w-full btn-primary py-3 text-xs uppercase font-black tracking-widest p-1">
                       Explore advanced
                    </button>
                  </>
               ) : (
                  <>
                    <p className="text-sm text-slate-400 font-bold leading-relaxed">
                        Criteria not met. We recommend revisiting the core fundamentals of {attempt?.category}.
                    </p>
                    <button onClick={() => navigate('/student-dashboard?tab=live')} className="w-full btn-secondary bg-slate-900 border-[#1f2937] hover:border-indigo-500/50 py-3 text-xs uppercase font-black tracking-widest">
                       Retry Modules
                    </button>
                  </>
               )}
            </div>

            <div className="pt-8 border-t border-[#1f2937] flex items-center gap-3 text-slate-600">
               <FileText size={14} className="flex-shrink-0" />
               <p className="text-[9px] font-bold leading-relaxed uppercase tracking-widest">
                 Authorized digital credentials pending issuance.
               </p>
            </div>
         </aside>
      </div>
    </div>
  );
};

export default TestResultView;
