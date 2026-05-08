import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Database, 
  CheckCircle2,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';
import api from '../utils/api';
import BackToDashboard from '../components/admin/BackToDashboard';
import ConfirmModal from '../components/ConfirmModal';

const emptyForm = {
  title: '',
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

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

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

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
      closeModal();
      await fetchData();
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setSaving(false);
    }
  };

  const openModal = (q = null) => {
    if (q) {
      setEditingId(q.id);
      setForm({
        title: q.title || '',
        optionA: q.optionA || '',
        optionB: q.optionB || '',
        optionC: q.optionC || '',
        optionD: q.optionD || '',
        correctAnswer: q.correctAnswer || 'A',
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await api.delete(`/questions/${pendingDeleteId}`);
      toast.success('Question removed');
      await fetchData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-white/5 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Synchronizing Payload...</p>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-12 pb-10 animate-in fade-in duration-700 p-10">
      
      {/* HEADER COMMAND CENTER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] italic">Assessment Payload</h1>
          <div className="flex items-center gap-4 mt-2">
              <span className="text-[10px] font-black text-[#7c3aed] uppercase tracking-[0.2em]">{test?.title || 'Unknown Cluster'}</span>
              <div className="h-3 w-[1px] bg-white/10"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{questions.length} Items Indexed</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all hover:shadow-[0_10px_40px_rgba(255,255,255,0.15)] hover:-translate-y-1 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
            Add Question
          </button>
          <BackToDashboard />
        </div>
      </header>

      {/* QUESTION GRID */}
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-4">
            <div className="h-px flex-1 bg-white/5"></div>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic flex items-center gap-3">
                <Database size={12} className="text-[#7c3aed]" /> Current Cluster Data
            </h2>
            <div className="h-px flex-1 bg-white/5"></div>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} className="bg-[#111118] border border-white/5 rounded-[2.5rem] p-10 hover:border-[#7c3aed]/30 transition-all group shadow-2xl animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex justify-between items-start mb-8">
               <div className="flex-1 pr-12">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-lg border border-white/5">Entry #{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-[9px] font-black text-[#7c3aed] uppercase tracking-[0.2em]">ID: {q.id}</span>
                  </div>
                  <h4 className="text-lg font-black text-white leading-relaxed uppercase tracking-tight">{q.title}</h4>
               </div>
               <div className="flex gap-3">
                  <button onClick={() => openModal(q)} className="p-3 bg-black/40 border border-white/5 text-[#7c3aed] hover:bg-[#7c3aed]/10 rounded-xl transition-all" title="Modify entry">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="p-3 bg-black/40 border border-white/5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all" title="Purge entry">
                    <Trash2 size={18} />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {['A', 'B', 'C', 'D'].map(opt => {
                 const isCorrect = q.correctAnswer === opt;
                 return (
                  <div key={opt} className={`px-6 py-5 rounded-2xl border text-[11px] font-black uppercase tracking-widest flex items-center gap-5 transition-all ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-black/20 border-white/5 text-slate-500'}`}>
                     <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black ${isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-500'}`}>
                       {opt}
                     </span>
                     <span className="flex-1 truncate opacity-80">{q[`option${opt}`]}</span>
                     {isCorrect && <CheckCircle2 size={16} className="text-emerald-400" />}
                  </div>
                 )
               })}
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="bg-[#111118] border border-white/5 rounded-[2.5rem] py-32 text-center border-dashed opacity-30 flex flex-col items-center justify-center space-y-6">
             <AlertCircle size={48} />
             <div>
                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-white">Zero Assessment Items Detected</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mt-2">Initialize cluster payload to begin</p>
             </div>
          </div>
        )}
      </div>

      {/* QUESTION EDITOR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal}></div>
          
          <div className="relative bg-[#111118] border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-400">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] italic flex items-center gap-3">
                  <FileText className="text-[#7c3aed]" size={18} />
                  {editingId ? 'Modify Record' : 'Inject New Entry'}
                </h2>
                <p className="text-[#9ca3af] text-[9px] font-black uppercase tracking-[0.3em] mt-1">Configure assessment item parameters</p>
              </div>
              <button onClick={closeModal} className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <FileText size={10} className="text-[#7c3aed]"/> Question Content
                </label>
                <textarea 
                  name="title" value={form.title} onChange={(e) => setForm(c => ({...c, title: e.target.value}))}
                  className="bg-[#0a0a0f] border border-white/5 rounded-2xl px-6 py-5 text-[12px] font-black uppercase tracking-widest text-white outline-none focus:border-[#7c3aed]/50 transition-all w-full min-h-[140px] resize-none leading-relaxed placeholder:text-white/5"
                  placeholder="Define the problem statement..." required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 {['A', 'B', 'C', 'D'].map(opt => (
                  <div key={opt} className="space-y-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Option {opt}</label>
                    <input 
                      value={form[`option${opt}`]} onChange={(e) => setForm(c => ({...c, [`option${opt}`]: e.target.value}))}
                      className={`bg-[#0a0a0f] border rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white outline-none transition-all w-full ${form.correctAnswer === opt ? 'border-[#7c3aed]/50 bg-[#7c3aed]/5' : 'border-white/5 focus:border-[#7c3aed]/30'}`}
                      placeholder={`Choice {opt}...`} required
                    />
                  </div>
                 ))}
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <CheckCircle2 size={10} className="text-[#7c3aed]"/> Correct Key Signature
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt} type="button"
                      onClick={() => setForm(c => ({...c, correctAnswer: opt}))}
                      className={`py-4 rounded-2xl font-black text-[10px] transition-all border-2 ${form.correctAnswer === opt ? 'bg-[#7c3aed] border-[#7c3aed] text-white shadow-[0_10px_20px_rgba(124,58,237,0.3)]' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/10'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 py-5 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] transition-all hover:shadow-[0_15px_40px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:scale-95">
                  {saving ? 'Synchronizing...' : editingId ? 'Update Record' : 'Inject Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDelete}
        title="Purge Entry?"
        message="Are you sure you want to delete this question permanently? This action cannot be undone."
        confirmText="Purge Forever"
      />
    </div>
  );
};

export default QuestionManager;
