import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  Database, 
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ListFilter,
  Save,
  FileText,
  Activity
} from 'lucide-react';
import api from '../utils/api';

const emptyForm = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
};

const QuestionManager = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [testRes, qRes] = await Promise.all([
        api.get(`/tests/${testId}`),
        api.get(`/questions/test/${testId}`)
      ]);
      setTest(testRes.data);
      setQuestions(qRes.data);
    } catch (err) {
      toast.error('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/questions/${editingId}`, form);
        toast.success('Question updated');
      } else {
        await api.post(`/questions/test/${testId}`, form);
        toast.success('Question added');
      }
      setForm(emptyForm);
      setEditingId(null);
      await fetchData();
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setForm({
      questionText: q.questionText || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer: q.correctAnswer || 'A',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question removed');
      if (editingId === id) { setEditingId(null); setForm(emptyForm); }
      await fetchData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#1f2937] border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors text-[10px] uppercase font-black tracking-widest"
          >
            <ArrowLeft size={14} /> Back to Payload
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Question Manager</h1>
            <div className="flex items-center gap-4 mt-2">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{test?.title}</span>
               <div className="h-4 w-[1px] bg-[#1f2937]"></div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{questions.length} Items Indexed</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        
        {/* Editor Form */}
        <section className="xl:col-span-5 card-base space-y-8 sticky top-28 bg-[#111827]/50 border-indigo-500/10">
          <div className="p-8 border-b border-[#1f2937] flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-50 flex items-center gap-3">
              <Plus className="text-indigo-500" size={20} />
              {editingId ? 'Edit Question' : 'Add New Item'}
            </h2>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Editor Panel</span>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Question Content</label>
              <textarea 
                name="questionText" value={form.questionText} onChange={(e) => setForm(c => ({...c, questionText: e.target.value}))}
                className="input-base min-h-[160px] text-base leading-relaxed resize-none"
                placeholder="Declare the problem statement here..." required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {['A', 'B', 'C', 'D'].map(opt => (
                <div key={opt} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Choice {opt}</label>
                  <input 
                    value={form[`option${opt}`]} onChange={(e) => setForm(c => ({...c, [`option${opt}`]: e.target.value}))}
                    className={`input-base font-bold ${form.correctAnswer === opt ? 'border-indigo-500/50 bg-indigo-500/5' : ''}`}
                    placeholder={`Definition ${opt}`} required
                  />
                </div>
               ))}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Answer Key</label>
              <div className="grid grid-cols-4 gap-3">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <button
                    key={opt} type="button"
                    onClick={() => setForm(c => ({...c, correctAnswer: opt}))}
                    className={`py-3.5 rounded-xl font-black text-xs transition-all border-2 ${form.correctAnswer === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 border-[#1f2937] text-slate-500 hover:border-slate-700'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button 
                type="submit" disabled={saving}
                className="flex-1 btn-primary py-3.5"
              >
                {saving ? 'Processing...' : editingId ? 'Update Record' : 'Inject Question'}
              </button>
              {editingId && (
                <button 
                  type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}
                  className="btn-secondary px-8"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Question List */}
        <section className="xl:col-span-7 space-y-8">
           <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-50 flex items-center gap-3 uppercase tracking-tight">
               <Database className="text-indigo-400" size={18} /> Assessment Payload
            </h2>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-[#1f2937]">Sync State: Regular</span>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {questions.map((q, idx) => (
              <div key={q.id} className="card-base p-8 hover:border-indigo-500/30 transition-all flex flex-col gap-8 group">
                <div className="flex justify-between items-start">
                   <div className="flex-1 pr-12">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-[#1f2937]">Item {String(idx + 1).padStart(2, '0')}</span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{q.id}</span>
                      </div>
                      <h4 className="text-xl font-bold text-slate-50 leading-relaxed">{q.questionText}</h4>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(q)}
                        className="p-2.5 bg-slate-900 border border-[#1f2937] text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                        title="Edit entry"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(q.id)}
                        className="p-2.5 bg-slate-900 border border-[#1f2937] text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Purge entry"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {['A', 'B', 'C', 'D'].map(opt => {
                     const isCorrect = q.correctAnswer === opt;
                     return (
                      <div key={opt} className={`px-5 py-4 rounded-xl border text-sm flex items-center gap-4 transition-all ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-slate-900/50 border-[#1f2937] text-slate-500'}`}>
                         <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                           {opt}
                         </span>
                         <span className="font-bold truncate opacity-90">{q[`option${opt}`]}</span>
                         {isCorrect && <CheckCircle2 size={14} className="ml-auto text-emerald-400" />}
                      </div>
                     )
                   })}
                </div>
              </div>
            ))}

            {questions.length === 0 && (
              <div className="empty-state-card py-24">
                 <AlertCircle className="mx-auto text-[#1f2937] mb-6" size={56} />
                 <p className="text-slate-500 font-bold uppercase tracking-widest mb-2">Zero assessment items configured</p>
                 <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Initialize payload using the configuration panel</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default QuestionManager;
