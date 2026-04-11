import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  ArrowLeft, 
  XCircle, 
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Activity,
  Award,
  CheckCircle,
  MinusCircle
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

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
  const reviews = attempt?.answerReviews || [];

  const getOptionText = (review, opt) => review[`option${opt}`];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="flex justify-between items-center">
         <div>
            <button 
               onClick={() => navigate('/student-dashboard?tab=attempts')}
               className="flex items-center gap-2 text-slate-500 hover:text-slate-200 transition-colors mb-4 text-[10px] uppercase font-black tracking-widest"
            >
               <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Assessment Report</h1>
         </div>
         <button onClick={() => window.print()} className="btn-secondary py-2 px-5 text-xs bg-slate-900 border-[#1f2937] hover:border-indigo-500/50 flex items-center gap-2">
            <Download size={14} /> Export PDF
         </button>
      </header>

      {/* Hero Score Card */}
      <div className="card-base p-10 lg:p-14 relative overflow-hidden bg-slate-900/60 flex flex-col items-center text-center">
          <div className={`absolute top-0 left-0 w-full h-1.5 ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          
          <div className="mb-8">
             <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 mx-auto ${isPassed ? 'bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border-2 border-rose-500/30'}`}>
               {isPassed ? <Trophy size={40} /> : <XCircle size={40} />}
             </div>
             <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPassed ? 'Passed' : 'Failed — Criteria Not Met'}
             </p>
             <h2 className="text-5xl font-black text-slate-50 mt-4 tracking-tighter">
                {attempt?.scorePercent}%
             </h2>
             <p className="text-slate-500 text-xs font-bold mt-3 uppercase tracking-widest leading-relaxed">
                {attempt?.testTitle}
             </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl mt-10 pt-10 border-t border-[#1f2937]">
             <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{attempt?.correctCount}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Correct</p>
             </div>
             <div className="text-center">
                <p className="text-2xl font-bold text-rose-400">{attempt?.wrongCount}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Wrong</p>
             </div>
             <div className="text-center">
                <p className="text-2xl font-bold text-slate-200">{attempt?.totalQuestions || reviews.length}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total</p>
             </div>
             <div className="text-center">
                <p className="text-2xl font-bold text-indigo-400">{attempt?.category}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Category</p>
             </div>
          </div>
      </div>

      {/* Next Steps */}
      <div className="card-base p-8 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <Award size={20} className="text-indigo-400 flex-shrink-0" />
          <p className="text-sm text-slate-400 font-bold leading-relaxed">
            {isPassed
              ? 'Great work! Check your full performance history in Dashboard.'
              : `Criteria not met. Review the answers below to improve for your next attempt.`
            }
          </p>
        </div>
        <button
          onClick={() => navigate('/student-dashboard?tab=attempts')}
          className="btn-secondary bg-slate-900 border-[#1f2937] hover:border-indigo-500/50 py-2.5 px-6 text-xs uppercase font-black tracking-widest whitespace-nowrap"
        >
          Go to Dashboard
        </button>
      </div>

      {/* ─── Question Review ─────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-50">Question Review</h2>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-[#1f2937]">
              {reviews.length} questions
            </span>
          </div>

          <div className="space-y-6">
            {reviews.map((review, idx) => {
              const isCorrect = review.correct;
              const isSkipped = !review.selectedOption;

              return (
                <div
                  key={review.questionId}
                  className={`card-base p-8 space-y-6 border-l-4 ${
                    isSkipped
                      ? 'border-l-slate-600'
                      : isCorrect
                        ? 'border-l-emerald-500'
                        : 'border-l-rose-500'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-2.5 py-1 rounded-lg border border-[#1f2937] flex-shrink-0 mt-1">
                        Q{idx + 1}
                      </span>
                      <p className="text-slate-100 font-bold text-base leading-relaxed">
                        {review.questionText}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isSkipped ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 border border-[#1f2937] px-3 py-1.5 rounded-full">
                          <MinusCircle size={12} /> Skipped
                        </span>
                      ) : isCorrect ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                          <CheckCircle size={12} /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full">
                          <XCircle size={12} /> Wrong
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-3">
                    {OPTION_LABELS.map(opt => {
                      const text = getOptionText(review, opt);
                      if (!text) return null;

                      const isSelected = review.selectedOption === opt;
                      const isCorrectOpt = review.correctAnswer === opt;

                      let style = 'bg-slate-900/50 border-[#1f2937] text-slate-500';
                      if (isCorrectOpt) style = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300';
                      else if (isSelected && !isCorrectOpt) style = 'bg-rose-500/10 border-rose-500/40 text-rose-300';

                      return (
                        <div
                          key={opt}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${style}`}
                        >
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                            isCorrectOpt
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isSelected && !isCorrectOpt
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-slate-800 text-slate-500'
                          }`}>
                            {opt}
                          </span>
                          <span className="font-bold text-sm flex-1">{text}</span>
                          {isCorrectOpt && (
                            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                          )}
                          {isSelected && !isCorrectOpt && (
                            <XCircle size={18} className="text-rose-400 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary line */}
                  {!isSkipped && !isCorrect && (
                    <p className="text-xs text-slate-500 font-bold">
                      Your answer: <span className="text-rose-400">{review.selectedOption}</span>
                      {' · '}
                      Correct answer: <span className="text-emerald-400">{review.correctAnswer}</span>
                    </p>
                  )}
                  {isSkipped && (
                    <p className="text-xs text-slate-600 font-bold">
                      You did not select an answer. Correct: <span className="text-emerald-400">{review.correctAnswer}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {reviews.length === 0 && (
        <div className="card-base p-10 text-center">
          <FileText className="mx-auto text-slate-700 mb-4" size={40} />
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
            Detailed review not available for this attempt
          </p>
        </div>
      )}
    </div>
  );
};

export default TestResultView;
