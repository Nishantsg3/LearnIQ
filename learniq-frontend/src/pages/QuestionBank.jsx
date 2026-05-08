import { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  AlertCircle,
  X,
  Filter
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import BackToDashboard from '../components/admin/BackToDashboard';
import ConfirmModal from '../components/ConfirmModal';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    category: 'TECHNICAL'
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/questions/bank');
      setQuestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to sync question library');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/questions/bank/${editingId}`, formData);
        toast.success('Question updated successfully');
      } else {
        await api.post('/questions/bank', formData);
        toast.success('Question indexed successfully');
      }
      setFormData({ title: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', category: 'JAVA' });
      setShowForm(false);
      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      toast.error(editingId ? 'Update failed' : 'Injection failed');
    } finally {
      setSaving(false);
    }
  };

  const editQuestion = (q) => {
    setFormData({
      title: q.title || q.questionText || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer: q.correctAnswer || 'A',
      category: q.category || q.tag || q.topic || 'JAVA'
    });
    setEditingId(q.id);
    setShowForm(true);
  };

  const deleteQuestion = (id) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await api.delete(`/questions/${pendingDeleteId}`);
      toast.success('Record purged');
      fetchQuestions();
    } catch (err) {
      toast.error('Purge failed');
    }
  };

  // Stable Ordering & Dynamic Category Extraction
  const categoriesList = useMemo(() => {
    const cats = questions.map(q => q.category || q.tag || q.topic || "UNCATEGORIZED");
    return ["ALL", ...new Set(cats)];
  }, [questions]);

  // Deterministic Filtering with Stable Sorting
  const filteredQuestions = useMemo(() => {
    let list = [...questions];
    // Stable Sort by Creation Date
    list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    if (selectedCategory === "ALL") return list;
    return list.filter(q => (q.category || q.tag || q.topic || "UNCATEGORIZED") === selectedCategory);
  }, [questions, selectedCategory]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />
      <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.4em]">Synchronizing Registry...</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500 p-10">
      
      {/* HEADER COMMAND CENTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-[0.3em] italic">Question Library</h1>
          <p className="text-[#9ca3af] text-[10px] font-black uppercase tracking-[0.4em] mt-2">Centralized Assessment Registry</p>
        </div>

        <div className="flex items-center gap-4">
          {!showForm && (
            <div className="relative group animate-in fade-in slide-in-from-right-4 duration-300">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-[#7c3aed] transition-colors" size={14} />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#111118] border border-white/5 rounded-xl pl-12 pr-6 h-10 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-[#7c3aed]/50 transition-all w-full md:w-[220px] cursor-pointer"
              >
                {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}
          <button 
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
                setFormData({ title: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', category: 'JAVA' });
              } else {
                setShowForm(true);
              }
            }}
            className={`flex items-center gap-2 h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${showForm ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-white text-black hover:shadow-lg hover:-translate-y-0.5'}`}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'New Question'}
          </button>
          <BackToDashboard />
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {showForm ? (
          /* EXCLUSIVE INJECTION CONSOLE */
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <Database size={16} className="text-[#7c3aed]" />
                <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
            </div>

            <form onSubmit={handleAdd} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest ml-1">Question Text</label>
                      <textarea 
                        required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                        className="bg-[#0a0a0f] border border-white/5 rounded-xl px-5 py-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#7c3aed]/50 focus:bg-[#7c3aed]/5 transition-all w-full min-h-[100px] resize-none"
                        placeholder="Enter the question..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest ml-1">Category</label>
                      <select 
                        required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        className="bg-[#0a0a0f] border border-white/5 rounded-xl px-5 h-11 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-[#7c3aed]/50 focus:bg-[#7c3aed]/5 transition-all w-full cursor-pointer"
                      >
                        <option value="JAVA">JAVA</option>
                        <option value="PYTHON">PYTHON</option>
                        <option value="DBMS">DBMS</option>
                        <option value="APTITUDE">APTITUDE</option>
                        <option value="CLOUD">CLOUD</option>
                        <option value="ASP.NET">ASP.NET</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className="space-y-1.5">
                          <label className="text-[9px] font-black text-[#9ca3af] uppercase tracking-widest ml-1 flex items-center justify-between">
                            <span>Option {opt}</span>
                            {formData.correctAnswer === opt && <span className="text-[#7c3aed] text-[8px] animate-pulse">✓ CORRECT ANSWER</span>}
                          </label>
                          <input 
                            required value={formData[`option${opt}`]} onChange={e => setFormData({...formData, [`option${opt}`]: e.target.value})}
                            className={`bg-[#0a0a0f] border rounded-xl px-5 h-11 text-[10px] font-black uppercase tracking-widest text-white outline-none transition-all w-full ${formData.correctAnswer === opt ? 'border-[#7c3aed]/50 bg-[#7c3aed]/5 shadow-[0_0_15px_rgba(124,58,237,0.1)]' : 'border-white/5 focus:border-[#7c3aed]/30 focus:bg-white/5'}`}
                            placeholder={`Choice ${opt}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 mt-4 border-t border-white/5 shrink-0">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest">Correct Answer:</span>
                    <div className="flex gap-2">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <button 
                          key={opt} type="button" onClick={() => setFormData({...formData, correctAnswer: opt})}
                          className={`w-10 h-10 rounded-xl font-black text-[11px] transition-all border-2 ${formData.correctAnswer === opt ? 'bg-[#7c3aed] border-[#7c3aed] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'bg-[#0a0a0f] border-white/5 text-slate-500 hover:border-white/20 hover:text-white'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ title: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', category: 'JAVA' });
                    }} className="px-6 h-10 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="px-8 h-10 bg-white text-black rounded-xl font-black uppercase text-[11px] tracking-widest hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all">
                        {saving ? 'Saving...' : (editingId ? 'Update Question' : 'Add Question')}
                    </button>
                  </div>
                </div>
            </form>
          </div>
        ) : (
          /* EXCLUSIVE DATA REGISTRY (LIST) */
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-0">
            <div className="grid grid-cols-1 gap-4">
              {filteredQuestions.map((q, index) => (
                <div key={q.id} className="bg-[#111118] border border-white/5 rounded-2xl px-6 py-5 hover:border-[#7c3aed]/30 transition-all group flex items-start justify-between shadow-lg">
                  <div className="flex-1 pr-10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                        Entry #{String(index + 1).padStart(3, '0')}
                      </span>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-black/20 px-2 py-1 rounded-lg border border-white/5">
                        {q.category || q.tag || q.topic || "UNCATEGORIZED"}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest leading-relaxed line-clamp-2">{q.title || q.questionText}</h4>
                    
                    <div className="flex gap-4 mt-4">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${q.correctAnswer === opt ? 'text-emerald-400' : 'text-slate-600'}`}>
                          <span className={`w-5 h-5 rounded flex items-center justify-center border ${q.correctAnswer === opt ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/20 border-white/5'}`}>{opt}</span>
                          <span className="truncate max-w-[100px] opacity-60">{q[`option${opt}`]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => editQuestion(q)} className="p-2.5 bg-black/40 border border-white/5 text-[#7c3aed] hover:bg-[#7c3aed]/10 rounded-xl transition-all"><Edit3 size={14} /></button>
                    <button onClick={() => deleteQuestion(q.id)} className="p-2.5 bg-black/40 border border-white/5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}

              {filteredQuestions.length === 0 && (
                <div className="bg-[#111118] border border-white/5 rounded-2xl py-32 text-center opacity-30 flex flex-col items-center justify-center gap-6">
                  <AlertCircle size={48} />
                  <p className="text-[12px] font-black uppercase tracking-[0.4em]">Zero records detected for sector: {selectedCategory}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDelete}
        title="Purge Record?"
        message="Are you sure you want to delete this question from the library? This action cannot be undone."
        confirmText="Purge Forever"
      />
    </div>
  );
};

export default QuestionBank;
