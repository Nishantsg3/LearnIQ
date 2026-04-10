import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Database, 
  Users, 
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  BarChart3,
  Play,
  LayoutDashboard
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  title: '',
  category: 'Java',
  sectionType: 'MAIN',
  difficultyLevel: 'Medium',
  scheduledAt: '',
  description: '',
  status: 'DRAFT',
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const adminName = user?.name;
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('live');

  const [dashboardStats, setDashboardStats] = useState({
    totalTests: 0, totalQuestions: 0, liveTests: 0, totalStudents: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const [testsRes, statsRes] = await Promise.all([
        api.get('/tests'),
        api.get('/admin/stats'),
      ]);
      setTests(testsRes.data);
      setDashboardStats(statsRes.data);
    } catch (err) {
      toast.error('Session expired or access restricted');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredTests = useMemo(() => {
    if (activeTab === 'live') return tests.filter(t => t.status === 'LIVE');
    if (activeTab === 'scheduled') return tests.filter(t => t.status === 'SCHEDULED' || t.status === 'DRAFT');
    if (activeTab === 'completed') return tests.filter(t => t.status === 'COMPLETED');
    return tests;
  }, [tests, activeTab]);

  const stats = useMemo(() => [
    { label: 'Assessments', value: dashboardStats.totalTests, icon: <FileText size={20} className="text-indigo-400" /> },
    { label: 'Bank Size', value: dashboardStats.totalQuestions, icon: <Database size={20} className="text-emerald-400" /> },
    { label: 'Live Now', value: dashboardStats.liveTests, icon: <Play size={20} className="text-amber-400" /> },
    { label: 'Total Students', value: dashboardStats.totalStudents, icon: <Users size={20} className="text-violet-400" /> },
  ], [dashboardStats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, scheduledAt: form.scheduledAt || null };
      if (editingId) {
        await api.put(`/tests/${editingId}`, payload);
        toast.success('Test updated successfully');
      } else {
        await api.post('/tests', payload);
        toast.success('Test created successfully');
      }
      setForm(emptyForm);
      setEditingId(null);
      await fetchData();
    } catch (err) {
      toast.error('Failed to save test configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanent delete? This cannot be undone.')) return;
    try {
      await api.delete(`/tests/${id}`);
      toast.success('Test removed');
      if (editingId === id) { setEditingId(null); setForm(emptyForm); }
      await fetchData();
    } catch (err) {
      toast.error('Failed to delete test');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#1f2937] border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* Tab Navigation */}
      <div className="tab-container">
        {[
          { id: 'live', label: 'Live' },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'completed', label: 'Completed' },
        ].map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-item ${activeTab === tab.id ? 'tab-item-active' : ''}`}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="dashboard-grid">
        {stats.map(s => (
          <div key={s.label} className="card-base p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-[#1f2937] flex items-center justify-center">
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-bold text-slate-50 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        
        {/* Creation Interface */}
        <section className="xl:col-span-5 card-base p-8 lg:p-10 space-y-8 sticky top-28 bg-[#111827]/50">
          <div>
            <h2 className="text-xl font-bold text-slate-50 flex items-center gap-3">
              <Plus className="text-indigo-500" size={20} />
              {editingId ? 'Edit Assessment' : 'New Assessment'}
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-widest">Configuration Panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Title</label>
              <input 
                name="title" value={form.title} onChange={(e) => setForm(c => ({...c, title: e.target.value}))}
                className="input-base"
                placeholder="e.g. Java Advanced 2024" required
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                <select 
                  name="category" value={form.category} onChange={(e) => setForm(c => ({...c, category: e.target.value}))}
                  className="input-base pr-8 appearance-none"
                >
                  {['Java', 'Python', '.NET', 'Aptitude', 'Frontend', 'SQL', 'General'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Type</label>
                <select 
                  name="sectionType" value={form.sectionType} onChange={(e) => setForm(c => ({...c, sectionType: e.target.value}))}
                  className="input-base pr-8 appearance-none"
                >
                  <option value="MAIN">MAIN</option>
                  <option value="PRACTICE">PRACTICE</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Difficulty</label>
                <select 
                  name="difficultyLevel" value={form.difficultyLevel} onChange={(e) => setForm(c => ({...c, difficultyLevel: e.target.value}))}
                  className="input-base pr-8 appearance-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                <select 
                  name="status" value={form.status} onChange={(e) => setForm(c => ({...c, status: e.target.value}))}
                  className="input-base pr-8 appearance-none"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="LIVE">LIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            {form.status === 'SCHEDULED' && (
               <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Launch Time</label>
                <input 
                  type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={(e) => setForm(c => ({...c, scheduledAt: e.target.value}))}
                  className="input-base border-indigo-500/50"
                  required
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button 
                type="submit" disabled={saving}
                className="flex-1 btn-primary py-3.5"
              >
                {saving ? 'Saving...' : editingId ? 'Update Test' : 'Create Library Entry'}
              </button>
              {editingId && (
                <button 
                  type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Dynamic Test Inventory */}
        <section className="xl:col-span-7 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-50 capitalize flex items-center gap-3">
               <Database size={18} className="text-indigo-400" />
               {activeTab} Inventory
            </h2>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-[#1f2937]">{filteredTests.length} total</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredTests.map(test => (
              <div key={test.id} className="card-base p-6 hover:border-indigo-500/30 transition-all flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl font-bold text-slate-50 leading-tight">{test.title}</h4>
                      <span className={`badge ${test.status === 'LIVE' ? 'badge-success' : 'badge-primary'}`}>{test.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>{test.category}</span>
                      <span>•</span>
                      <span>{test.sectionType}</span>
                      <span>•</span>
                      <span className="text-indigo-400">{test.questionCount} Questions</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/admin/tests/${test.id}/questions`)}
                      className="p-2.5 bg-slate-900 border border-[#1f2937] text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                      title="Library"
                    >
                      <Database size={16} />
                    </button>
                    <button 
                      onClick={() => { setEditingId(test.id); setForm({...test, scheduledAt: test.scheduledAt?.slice(0, 16) || ''}); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                      className="p-2.5 bg-slate-900 border border-[#1f2937] text-indigo-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(test.id)}
                      className="p-2.5 bg-slate-900 border border-[#1f2937] text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="pt-5 border-t border-[#1f2937] flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">
                   <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2 font-bold"><Clock size={14} className="text-indigo-400"/> {test.durationMinutes}M</div>
                      <div className="flex items-center gap-2 font-bold"><Calendar size={14} className="text-indigo-400"/> {formatDateTime(test.scheduledAt || test.startedAt)}</div>
                   </div>
                   <button onClick={() => navigate(`/admin/tests/${test.id}/questions`)} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                      Configure Questions
                   </button>
                </div>
              </div>
            ))}
            
            {filteredTests.length === 0 && (
              <div className="empty-state-card py-24">
                 <AlertCircle className="mx-auto text-[#1f2937] mb-4" size={48} />
                 <p className="text-slate-500 font-black uppercase tracking-widest">No {activeTab} records found</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default AdminDashboard;
