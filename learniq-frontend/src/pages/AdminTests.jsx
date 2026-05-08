import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  FileText, 
  Database, 
  AlertCircle,
  Loader2,
  Trash2,
  Trophy,
  BarChart3,
  Calendar,
  Zap,
  History,
  LayoutDashboard,
  Award,
  Edit2,
  Eye,
  EyeOff,
  Activity
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import TestBadge from '../components/TestBadge';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';

const AdminTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const activeTab = searchParams.get('tab') || 'MAKER';
  const filterType = searchParams.get('type') || 'ALL';
  
  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    testId: null,
    title: '',
    message: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical',
    totalQuestions: 10,
    duration: 10,
    testType: 'PRACTICE',
    startTime: ''
  });

  useEffect(() => {
    if (formData.testType === 'MAIN') {
      setFormData(prev => ({ ...prev, totalQuestions: 50, duration: 50 }));
    } else {
      setFormData(prev => ({ ...prev, duration: prev.totalQuestions }));
    }
  }, [formData.testType, formData.totalQuestions]);

  const categories = ["Java", "Python", "Aptitude", "DBMS", "Cloud", "ASP.NET"];

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tests');
      console.log("ALL TESTS (ADMIN):", res.data);
      setTests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to sync test clusters');
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = useMemo(() => {
    let result = tests;
    
    if (activeTab === 'LIST') {
      result = result.filter(t => t.status === 'ACTIVE');
      if (filterType === 'MAIN') result = result.filter(t => t.testType === 'MAIN');
      if (filterType === 'PRACTICE') result = result.filter(t => t.testType === 'PRACTICE');
    } else if (activeTab === 'ARCHIVE') {
      result = result.filter(t => t.status === 'ARCHIVED');
    }

    return result;
  }, [tests, activeTab, filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Strict Rule Enforcement
    if (parseInt(formData.totalQuestions) !== parseInt(formData.duration)) {
      toast.error('SCHEMA VIOLATION: Duration must equal Question Count.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category.replace("_", ".").toUpperCase(),
        totalQuestions: parseInt(formData.totalQuestions),
        duration: parseInt(formData.duration),
        testType: formData.testType,
        startTime: formData.testType === 'MAIN' ? formData.startTime : null
      };

      await api.post('/tests', payload);
      toast.success('Assessment cluster deployed successfully');
      setFormData({
        title: '',
        category: 'Java',
        totalQuestions: 10,
        duration: 10,
        testType: 'PRACTICE',
        startTime: ''
      });
      fetchTests();
      setSearchParams({ tab: 'LIST', type: 'ALL' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deployment failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteTest = (id) => {
    setConfirmConfig({
      isOpen: true,
      testId: id,
      title: 'Terminate Cluster',
      message: 'PERMANENT DELETION: This will wipe the assessment and all associated data. Continue?'
    });
  };

  const executeDelete = async () => {
    if (!confirmConfig.testId) return;
    try {
      await api.delete(`/admin/tests/${confirmConfig.testId}`);
      toast.success('Cluster terminated');
      fetchTests();
    } catch (err) {
      toast.error('Termination failed');
    }
  };

  const toggleActiveStatus = async (test) => {
    try {
      const nextStatus = test.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      await api.put(`/admin/tests/${test.id}/status`, { status: nextStatus });
      toast.success(`Cluster ${nextStatus === 'ACTIVE' ? 'activated' : 'archived'}`);
      fetchTests();
    } catch (err) {
      toast.error('Status update failed');
    }
  };

  const handleEdit = (test) => {
    setFormData({
      id: test.id,
      title: test.title,
      category: test.category,
      totalQuestions: test.questionCount,
      duration: test.durationMinutes,
      testType: test.testType,
      startTime: test.startTime || ''
    });
    setSearchParams({ tab: 'MAKER' });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Calibrating Infrastructure...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-[0.3em] italic">
            {activeTab === 'MAKER' ? 'Assessment Maker' : activeTab === 'ARCHIVE' ? 'Test History' : 'Active Inventory'}
          </h1>
          <p className="text-[#9ca3af] text-[10px] font-black uppercase tracking-[0.4em] mt-3">Infrastructure Management</p>
        </div>
        
        {activeTab !== 'MAKER' && activeTab !== 'ARCHIVE' && (
          <button 
            onClick={() => setSearchParams({ tab: 'MAKER' })}
            className="flex items-center gap-3 px-6 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:-translate-y-1 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            Create Test
          </button>
        )}
      </div>

      {(activeTab === 'MAKER' || activeTab === 'LIST') && (
          <div className="flex items-center gap-4 bg-[#111118] p-1.5 rounded-2xl border border-white/5 w-fit">
            {[
              { id: 'MAKER', label: 'Maker', icon: <Zap size={14} /> },
              { id: 'LIST', label: 'Active', icon: <Calendar size={14} /> },
              { id: 'ARCHIVE', label: 'History', icon: <History size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#7c3aed] text-white shadow-lg' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
      )}

      {activeTab === 'LIST' && (
        <div className="flex items-center gap-3 mb-8 bg-black/20 p-1 rounded-xl border border-white/5 w-fit">
          {[
            { id: 'ALL', label: 'All Clusters' },
            { id: 'PRACTICE', label: 'Practice Only' },
            { id: 'MAIN', label: 'Main Only' },
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setSearchParams({ tab: 'LIST', type: type.id })}
              className={`px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                filterType === type.id 
                  ? 'bg-white text-black shadow-lg shadow-white/10' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'MAKER' ? (
        <div className="max-w-5xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-[#111118] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.4)] overflow-hidden relative">
                <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Assessment Generator</h2>
                    <p className="text-[#9ca3af] text-[9px] font-black uppercase tracking-[0.3em] mt-1">Configure parameters to deploy assessment cluster</p>
                </div>
                <form onSubmit={handleSubmit} className="p-10">
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <FileText size={10} className="text-[#7c3aed]"/> Test Identity
                                </label>
                                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-[#0a0a0f] border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#7c3aed]/50 transition-all w-full placeholder:text-white/5" placeholder="e.g. JAVA INFRASTRUCTURE 2024" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <LayoutDashboard size={10} className="text-[#7c3aed]"/> Classification Sector
                                </label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="bg-[#0a0a0f] border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#7c3aed]/50 transition-all w-full cursor-pointer">
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Zap size={10} className="text-[#7c3aed]"/> Operational Mode
                                </label>
                                <select value={formData.testType} onChange={e => setFormData({...formData, testType: e.target.value})} className="bg-[#0a0a0f] border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#7c3aed]/50 transition-all w-full cursor-pointer">
                                    <option value="PRACTICE">PRACTICE MODE</option>
                                    <option value="MAIN">MAIN ASSESSMENT</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Database size={10} className="text-[#7c3aed]"/> Question Density
                                </label>
                                {formData.testType === 'PRACTICE' ? (
                                    <select value={formData.totalQuestions} onChange={e => setFormData({...formData, totalQuestions: parseInt(e.target.value)})} className="bg-[#0a0a0f] border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#7c3aed]/50 transition-all w-full cursor-pointer">
                                        {[5,10,15,20,25,30,35,40,45,50].map(n => <option key={n} value={n}>{n} Questions</option>)}
                                    </select>
                                ) : (
                                    <div className="bg-[#0a0a0f]/50 border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                                        <span>50 Questions</span>
                                        <span className="text-[8px] bg-white/5 px-2 py-1 rounded text-white/20">FIXED</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Clock size={10} className="text-[#7c3aed]"/> Temporal Constraint
                                </label>
                                <div className="bg-[#0a0a0f]/50 border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                                    <span>{formData.duration} Minutes</span>
                                    <span className="text-[8px] bg-[#7c3aed]/10 px-2 py-1 rounded text-[#7c3aed]">
                                        {formData.testType === 'PRACTICE' ? 'SYNCED' : 'FIXED'}
                                    </span>
                                </div>
                            </div>

                            {formData.testType === 'MAIN' && (
                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Calendar size={10} className="text-[#7c3aed]"/> Execution Window
                                    </label>
                                    <input type="datetime-local" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="bg-[#0a0a0f] border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#7c3aed]/50 transition-all w-full" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-12 p-8 bg-white/[0.02] border-t border-white/5 -mx-10 -mb-10">
                        <button type="submit" disabled={saving} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] transition-all duration-300 hover:shadow-[0_15px_40px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:scale-[0.98]">
                            {saving ? 'Processing Infrastructure...' : 'Deploy Assessment Cluster'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      ) : activeTab === 'LIST' && filteredTests.length > 0 ? (
        <div className="space-y-16">
          {/* SECTION 1: PRACTICE */}
          {(filterType === 'ALL' || filterType === 'PRACTICE') && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5"></div>
                <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] italic">Section 1: Practice Protocol</h2>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.filter(t => t.testType === 'PRACTICE').map((test) => (
                  <div key={test.id} className="bg-[#111118] border border-white/5 rounded-3xl p-7 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-400 hover:-translate-y-2 hover:border-emerald-500/30 group animate-in zoom-in-95 duration-300">
                    <div className="flex items-start justify-between mb-8">
                      <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 text-emerald-500 group-hover:bg-emerald-500/10 transition-all duration-300">
                        <Zap size={20} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(test)} className="p-3 bg-black/20 rounded-xl text-emerald-400 hover:bg-emerald-400/10 transition-all" title="Edit Configuration">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => toggleActiveStatus(test)} className={`p-3 bg-black/20 rounded-xl transition-all ${test.isActive ? 'text-amber-500 hover:bg-amber-500/10' : 'text-slate-500 hover:bg-white/10'}`} title={test.isActive ? 'Disable Cluster' : 'Enable Cluster'}>
                          {test.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button onClick={() => deleteTest(test.id)} className="p-3 bg-black/20 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all" title="Delete Cluster">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <TestBadge type={test.testType} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{test.category}</span>
                      </div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight line-clamp-1 mb-2">{test.title}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed h-10">{test.description || 'Active practice cluster deployed.'}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-emerald-500"/> {test.durationMinutes}M</span>
                        <span className="flex items-center gap-1.5"><Database size={12} className="text-emerald-500"/> {test.questionCount}Q</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: MAIN */}
          {(filterType === 'ALL' || filterType === 'MAIN') && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 pt-8">
                <div className="h-px flex-1 bg-white/5"></div>
                <h2 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] italic">Section 2: Main Assessment</h2>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.filter(t => t.testType === 'MAIN').map((test) => (
                  <div key={test.id} className="bg-[#111118] border border-white/5 rounded-3xl p-7 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-400 hover:-translate-y-2 hover:border-rose-500/30 group animate-in zoom-in-95 duration-300">
                    <div className="flex items-start justify-between mb-8">
                      <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 text-rose-500 group-hover:bg-rose-500/10 transition-all duration-300">
                        <FileText size={20} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/admin/tests/${test.id}/leaderboard`)} className="p-3 bg-black/20 rounded-xl text-amber-500 hover:bg-amber-500/10 transition-all">
                          <Trophy size={16} />
                        </button>
                        <button onClick={() => navigate(`/admin/tests/${test.id}/analytics`)} className="p-3 bg-black/20 rounded-xl text-indigo-400 hover:bg-indigo-400/10 transition-all">
                          <BarChart3 size={16} />
                        </button>
                        <button onClick={() => deleteTest(test.id)} className="p-3 bg-black/20 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <TestBadge type={test.testType} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{test.category}</span>
                      </div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight line-clamp-1 mb-2">{test.title}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed h-10">{test.description || 'Active main assessment cluster deployed.'}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-rose-500"/> {test.durationMinutes}M</span>
                        <span className="flex items-center gap-1.5"><Database size={12} className="text-rose-500"/> {test.questionCount}Q</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                         <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Live</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'ARCHIVE' && filteredTests.length > 0 ? (
        <div className="bg-[#111118] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in duration-700">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-black/20 border-b border-white/5">
                        <tr>
                            <th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Assessment Cluster</th>
                            <th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Classification</th>
                            <th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Attempts Captured</th>
                            <th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Created On</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredTests.map(test => (
                            <tr key={test.id} className="hover:bg-white/[0.01] transition-colors group">
                                <td className="px-10 py-6">
                                    <span className="text-[12px] font-black text-white uppercase tracking-widest">{test.title}</span>
                                    <p className="text-[9px] text-slate-600 mt-1.5 uppercase font-black tracking-widest">{test.category} SECTOR</p>
                                </td>
                                <td className="px-10 py-6">
                                    <TestBadge type={test.testType} />
                                </td>
                                <td className="px-10 py-6 text-center">
                                    <div className="flex items-center justify-center gap-3">
                                        <Activity size={14} className="text-[#7c3aed] opacity-50" />
                                        <span className="text-[11px] font-black text-white/40 tabular-nums">{test.attemptCount || 0} Records</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        {new Date(test.createdAt || Date.now()).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric', 
                                          year: 'numeric' 
                                        })}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-30">
          <AlertCircle size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero matching test clusters detected</p>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={executeDelete}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Terminate Cluster"
      />
    </div>
  );
};

export default AdminTests;
