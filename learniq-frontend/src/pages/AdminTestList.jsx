import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Clock, 
  Database, 
  AlertCircle,
  Loader2,
  Trash2,
  Trophy,
  BarChart3,
  Zap,
  FileText,
  Edit2,
  Archive
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import TestBadge from '../components/TestBadge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BackToDashboard from '../components/admin/BackToDashboard';
import ConfirmModal from '../components/ConfirmModal';

const AdminTestList = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [filterType, setFilterType] = useState('all');
  
  // Modal State
  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    type: null, // 'DELETE' or 'ARCHIVE'
    testId: null,
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchTests();
    const type = searchParams.get('type')?.toLowerCase();
    if (type === 'main') {
      setFilterType('main');
    } else {
      setFilterType('practice'); // Default to practice for 'all' and 'practice'
    }
  }, [searchParams]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tests');
      const rawData = Array.isArray(res.data) ? res.data : [];
      
      const normalizedData = rawData.map(t => {
        // Robust mapping for test type
        const rawType = (t.testType || t.type || 'practice').toUpperCase();
        return {
          ...t,
          type: rawType === 'MAIN' ? 'main' : 'practice'
        };
      });
      
      setTests(normalizedData);
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const activeTests = useMemo(() => tests.filter(t => t.status !== 'ARCHIVED'), [tests]);

  const handleArchiveClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'ARCHIVE',
      testId: id,
      title: 'Archive Assessment?',
      message: 'This will move the cluster to history and hide it from students. You can reactivate it later.'
    });
  };

  const handleDeleteClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'DELETE',
      testId: id,
      title: 'Permanent Deletion',
      message: 'PERMANENT DELETION: This will wipe the assessment and all associated data. It will NOT be shown in history. Continue?'
    });
  };

  const executeConfirm = async () => {
    const { type, testId } = confirmConfig;
    if (!testId) return;

    try {
      if (type === 'ARCHIVE') {
        await api.put(`/admin/tests/${testId}/status`, { status: 'ARCHIVED' });
        toast.success('Assessment archived');
      } else if (type === 'DELETE') {
        await api.delete(`/tests/${testId}`);
        toast.success('Cluster terminated');
      }
      fetchTests();
    } catch (err) {
      toast.error(`${type === 'ARCHIVE' ? 'Archiving' : 'Termination'} failed`);
    }
  };

  const filteredTests = useMemo(() => {
    return activeTests.filter(test => {
      if (filterType === 'practice') return test.type === 'practice';
      if (filterType === 'main') return test.type === 'main';
      return true;
    });
  }, [activeTests, filterType]);

  const practiceTests = useMemo(() => filteredTests.filter(t => t.type === 'practice'), [filteredTests]);
  const mainTests = useMemo(() => filteredTests.filter(t => t.type === 'main'), [filteredTests]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Calibrating Infrastructure...</p>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar p-10">
      <div className="animate-in fade-in duration-700 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white uppercase tracking-[0.2em]">Assessment Inventory</h1>
            <p className="text-[#9ca3af] text-[9px] font-black uppercase tracking-[0.3em] mt-1">Modify core parameters and synchronization settings</p>
          </div>
          
          <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/admin/tests/create')}
                className="btn-white"
              >
                <Plus size={14} />
                New Assessment
              </button>
              <BackToDashboard />
          </div>
        </div>
        {searchParams.get('type') === 'all' && (
          <div className="flex items-center gap-2 mb-10 bg-black/40 p-1 rounded-2xl border border-white/5 w-fit shadow-2xl backdrop-blur-md">
            {['practice', 'main'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`transition-all duration-500 ${
                  filterType === type 
                    ? 'btn-white scale-105 shadow-[0_10px_30px_rgba(255,255,255,0.1)]' 
                    : 'btn-base text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {type === 'practice' ? 'Practice Clusters' : 'Main Assessments'}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-12">
          {(filterType === 'all' || filterType === 'practice') && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <div className="w-1 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Practice Assessments</h2>
              </div>
              {practiceTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {practiceTests.map((test) => (
                    <AssessmentCard key={test.id} test={test} navigate={navigate} deleteTest={handleDeleteClick} archiveTest={handleArchiveClick} />
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.01] border border-dashed border-white/5 rounded-xl py-24 flex flex-col items-center justify-center opacity-10">
                  <p className="text-[9px] font-bold uppercase tracking-widest">No active practice tests</p>
                </div>
              )}
            </div>
          )}

          {(filterType === 'all' || filterType === 'main') && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <div className="w-1 h-4 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Main Assessments</h2>
              </div>
              {mainTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mainTests.map((test) => (
                    <AssessmentCard key={test.id} test={test} navigate={navigate} deleteTest={handleDeleteClick} archiveTest={handleArchiveClick} isMain />
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.01] border border-dashed border-white/5 rounded-xl py-24 flex flex-col items-center justify-center opacity-10">
                  <p className="text-[9px] font-bold uppercase tracking-widest">No active main tests</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={executeConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.type === 'DELETE' ? 'Terminate Cluster' : 'Archive Cluster'}
      />
    </div>
  );
};

const AssessmentCard = ({ test, navigate, deleteTest, archiveTest, isMain = false }) => (
  <div className="relative bg-[#0a0a0f] border border-white/5 rounded-xl p-5 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.02] group">
    <div className="flex items-start justify-between mb-6">
      <div className={`w-10 h-10 flex items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] transition-colors ${isMain ? 'text-rose-500' : 'text-emerald-500'}`}>
        {isMain ? <FileText size={18} /> : <Zap size={18} />}
      </div>
      <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
        <button onClick={() => navigate(`/admin/tests/edit/${test.id}`)} className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all" title="Edit"><Edit2 size={14} /></button>
        <button onClick={() => archiveTest(test.id)} className="p-2 hover:bg-amber-500/10 rounded-lg text-white/60 hover:text-amber-500 transition-all" title="Archive"><Archive size={14} /></button>
        {isMain ? (
          <>
            <button onClick={() => navigate(`/admin/tests/${test.id}/leaderboard`)} className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all" title="Leaderboard"><Trophy size={14} /></button>
            <button onClick={() => navigate(`/admin/tests/${test.id}/analytics`)} className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all" title="Analytics"><BarChart3 size={14} /></button>
          </>
        ) : (
          <button onClick={() => navigate(`/admin/tests/${test.id}/questions`)} className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all" title="Questions"><FileText size={14} /></button>
        )}
        <button onClick={() => deleteTest(test.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-white/60 hover:text-rose-500 transition-all" title="Delete"><Trash2 size={14} /></button>
      </div>
    </div>

    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-3">
        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${isMain ? 'bg-rose-500/5 border-rose-500/10 text-rose-500/70' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/70'}`}>
          {isMain ? 'Main' : 'Practice'}
        </span>
        <div className="flex items-center gap-1.5 text-white/20">
          <Database size={10} />
          <span className="text-[9px] font-bold uppercase tracking-widest">{test.category}</span>
        </div>
      </div>
      <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide line-clamp-1">
        {test.title}
      </h3>
    </div>

    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-4 text-[9px] font-bold text-white/20 uppercase tracking-widest">
        <span className="flex items-center gap-1.5"><Clock size={12} /> {test.durationMinutes || test.duration}M</span>
        <span className="flex items-center gap-1.5"><Database size={12} /> {test.questionCount || test.totalQuestions}Q</span>
      </div>
      <div className="flex items-center gap-2">
         <div className={`w-1.5 h-1.5 rounded-full ${isMain ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'} animate-pulse duration-[3000ms]`}></div>
         <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Active</span>
      </div>
    </div>
  </div>
);

export default AdminTestList;
