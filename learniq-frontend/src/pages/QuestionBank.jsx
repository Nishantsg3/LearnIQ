import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Database, 
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  ListFilter,
  FileText,
  Activity
} from 'lucide-react';
import api from '../utils/api';

const emptyForm = {
  questionText: '',
  category: 'Java',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
};

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/questions/bank');
      setQuestions(res.data);
    } catch (err) {
      toast.error('Failed to load question bank');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || q.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/questions/bank/${editingId}`, form);
        toast.success('Question updated');
      } else {
        await api.post('/questions/bank', form);
        toast.success('Question added to bank');
      }
      setForm(emptyForm);
      setEditingId(null);
      await fetchData();
    } catch (err) {
      toast.error('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setForm({
      questionText: q.questionText || '',
      category: q.category || 'Java',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer: q.correctAnswer || 'A',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove from global collection?')) return;
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question removed');
      await fetchData();
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#1f2937] border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Question Library</h1>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Central Repository Management</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        
        {/* Creation Form */}
        <section className="xl:col-span-5 card-base space-y-8 sticky top-28 bg-[#111827]/50 border-indigo-500/10">
          <div className="p-8 border-b border-[#1f2937] flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-50 flex items-center gap-3">
              <Plus className="text-indigo-500" size={20} />
              {editingId ? 'Edit Entry' : 'New Library Entry'}
            </h2>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Configuration</span>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Problem Statement</label>
              <textarea 
                name="questionText" value={form.questionText} onChange={(e) => setForm(c => ({...c, questionText: e.target.value}))}
                className="input-base min-h-[140px] text-base leading-relaxed resize-none"
                placeholder="Declare the question content..." required
              />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classification Tag</label>
               <select 
                  name="category" value={form.category} onChange={(e) => setForm(c => ({...c, category: e.target.value}))}
                  className="input-base pr-8 appearance-none cursor-pointer"
               >
                  {['Java', 'Python', '.NET', 'Aptitude', 'Frontend', 'SQL', 'General'].map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {['A', 'B', 'C', 'D'].map(opt => (
                <div key={opt} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Definition {opt}</label>
                  <input 
                    value={form[`option${opt}`]} onChange={(e) => setForm(c => ({...c, [`option${opt}`]: e.target.value}))}
                    className={`input-base font-bold ${form.correctAnswer === opt ? 'border-indigo-500/50 bg-indigo-500/5' : ''}`}
                    placeholder={`Choice ${opt}`} required
                  />
                </div>
               ))}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Answer Key Index</label>
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

            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={saving} className="flex-1 btn-primary py-3.5">
                {saving ? 'Processing...' : editingId ? 'Update Record' : 'Commit to Bank'}
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

        {/* List Section */}
        <section className="xl:col-span-7 space-y-8">
           <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex-1 w-full relative">
                 <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" />
                 <input 
                    type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#020617] border border-[#1f2937] rounded-xl pl-14 pr-6 py-4 text-sm font-bold text-slate-50 outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                    placeholder="Filter by question text..."
                 />
              </div>
              <div className="flex items-center gap-4 px-6 py-4 bg-[#020617] border border-[#1f2937] rounded-xl shrink-0">
                 <Filter size={16} className="text-indigo-400" />
                 <select 
                    value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none cursor-pointer pr-4"
                 >
                    <option value="All">All Categories</option>
                    {['Java', 'Python', '.NET', 'Aptitude', 'Frontend', 'SQL', 'General'].map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-8">
              {filteredQuestions.map((q) => (
                <div key={q.id} className="card-base p-8 hover:border-indigo-500/30 transition-all flex flex-col gap-8 group relative bg-slate-900/30">
                   <div className="flex justify-between items-start">
                      <div className="flex-1 pr-12">
                         <div className="flex items-center gap-4 mb-4">
                            <span className="badge badge-primary">{q.category}</span>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{q.id}</span>
                         </div>
                         <h3 className="text-xl font-bold text-slate-50 leading-relaxed">{q.questionText}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(q)} className="p-2.5 bg-slate-950 border border-[#1f2937] text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all" title="Edit entry">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="p-2.5 bg-slate-950 border border-[#1f2937] text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all" title="Purge entry">
                          <Trash2 size={16} />
                        </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-[#1f2937]">
                     {['A', 'B', 'C', 'D'].map(opt => {
                        const isCorrect = q.correctAnswer === opt;
                        return (
                          <div key={opt} className={`px-5 py-4 rounded-xl border text-sm flex items-center gap-4 transition-all ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-slate-950 border-[#1f2937] text-slate-500'}`}>
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

              {filteredQuestions.length === 0 && (
                <div className="empty-state-card py-32 bg-transparent">
                   <Database className="text-[#1f2937] mx-auto mb-6" size={56} />
                   <p className="text-slate-500 font-black uppercase tracking-widest">Library Search: No Matches Found</p>
                </div>
              )}
           </div>
        </section>

      </div>
    </div>
  );
};

export default QuestionBank;
