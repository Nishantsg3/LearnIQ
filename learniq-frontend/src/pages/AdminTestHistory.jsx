import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AlertCircle,
  Loader2,
  Activity,
  Trash2,
  Info,
  X,
  FileText,
  Zap,
  Database,
  Clock,
  Calendar,
  Search,
  RefreshCcw
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import BackToDashboard from '../components/admin/BackToDashboard';
import ConfirmModal from '../components/ConfirmModal';

const AdminTestHistory = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('practice');
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    type: null, // 'RESTORE' or 'DELETE'
    testId: null,
    title: '',
    message: '',
    confirmText: ''
  });

  const summaryModalRef = useRef(null);
  const summaryCloseBtnRef = useRef(null);
  const previousSummaryFocusRef = useRef(null);

  useEffect(() => {
    if (selectedTest) {
      previousSummaryFocusRef.current = document.activeElement;
      const timer = setTimeout(() => {
        summaryCloseBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (previousSummaryFocusRef.current) {
      previousSummaryFocusRef.current.focus?.();
    }
  }, [selectedTest]);

  useEffect(() => {
    if (!selectedTest || confirmConfig.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedTest(null);
        return;
      }

      if (e.key === 'Tab' && summaryModalRef.current) {
        const focusable = summaryModalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTest, confirmConfig.isOpen]);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tests');
      const normalizedData = (Array.isArray(res.data) ? res.data : []).map(t => ({
        ...t,
        type: (t.testType || t.type || '').toLowerCase()
      }));
      setTests(normalizedData);
    } catch {
      toast.error('Failed to sync history ledger');
    } finally {
      setLoading(false);
    }
  };

  const archivedTests = useMemo(() => {
    const now = new Date();
    return tests.filter(t => {
      if (t.status === 'ARCHIVED') return true;
      
      if (t.type === 'main') {
        const startTime = t.startTime ? new Date(t.startTime) : null;
        const duration = t.durationMinutes || t.duration || 60;
        const endTime = startTime ? new Date(startTime.getTime() + duration * 60000) : (t.endTime ? new Date(t.endTime) : null);
        if (endTime && now > endTime) return true;
      }
      
      return false;
    });
  }, [tests]);
  
  const filteredTests = useMemo(() => {
    return archivedTests.filter(t => {
      const matchesType = t.type === filterType;
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [archivedTests, filterType, searchQuery]);

  const sortedTests = useMemo(() => {
    return [...filteredTests].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.startTime || 0).getTime();
      const timeB = new Date(b.createdAt || b.startTime || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return b.id - a.id;
    });
  }, [filteredTests]);


  const handleRestoreClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'RESTORE',
      testId: id,
      title: 'Restore Assessment?',
      message: 'Restore this assessment to active inventory? It will become visible to students again.',
      confirmText: 'Restore Now'
    });
  };

  const handleDeleteClick = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: 'DELETE',
      testId: id,
      title: 'Purge Record?',
      message: 'PERMANENT DELETION: This will wipe this archived record forever. This action cannot be undone.',
      confirmText: 'Purge Forever'
    });
  };

  const executeConfirm = async () => {
    const { type, testId } = confirmConfig;
    if (!testId) return;

    try {
      if (type === 'RESTORE') {
        await api.put(`/admin/tests/${testId}/status`, { status: 'ACTIVE' });
        toast.success('Assessment restored');
      } else if (type === 'DELETE') {
        await api.delete(`/tests/${testId}`);
        toast.success('Record purged');
      }
      fetchTests();
    } catch {
      toast.error(`${type === 'RESTORE' ? 'Restoration' : 'Purge'} failed`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Retrieving Audit Ledger...</p>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-6 animate-in fade-in duration-700 p-4 sm:p-10">
      <div className="flex flex-col gap-6 border-b border-white/5 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Assessment History</h1>
            <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.3em]">Archival Records & Legacy Data</p>
          </div>
          <div className="flex items-center gap-2 min-w-0 shrink-0">
             <BackToDashboard />
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
            <div className="bg-[#0f0f14] p-1 rounded-lg border border-white/5 flex shadow-2xl gap-1 w-full">
              {['practice', 'main'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 px-3 py-2.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    filterType === type 
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* SEARCH */}
            <div className="relative group w-full">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0f0f14] border border-white/5 rounded-lg pl-10 pr-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-violet-500/30 transition-all w-full placeholder:text-white/50 shadow-2xl"
              />
            </div>
        </div>
      </div>

      {sortedTests.length > 0 ? (
        <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black/20 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Test Identity</th>
                            <th className="px-6 py-4 text-[9px] font-black text-white/60 uppercase tracking-[0.2em] text-right">Archive Stamp</th>
                            <th className="px-6 py-4 text-[9px] font-black text-white/60 uppercase tracking-[0.2em] text-center">Info</th>
                            <th className="px-6 py-4 text-[9px] font-black text-white/60 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedTests.map(test => (
                            <tr key={test.id} className="hover:bg-white/[0.01] transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                      <span className="text-[11px] font-black text-white uppercase tracking-widest">{test.title}</span>
                                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${filterType === 'main' ? 'border-rose-500/20 text-rose-400' : 'border-emerald-500/20 text-emerald-400'} uppercase`}>
                                        {test.category}
                                      </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                                        {new Date(test.createdAt || Date.now()).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric'
                                        })}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <button 
                                      type="button"
                                      onClick={() => setSelectedTest(test)}
                                      className="p-2.5 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                                      title="View Summary"
                                      aria-label={`View summary for ${test.title}`}
                                    >
                                      <Info size={14} />
                                    </button>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button 
                                        type="button"
                                        onClick={() => handleRestoreClick(test.id)}
                                        className="p-2.5 bg-emerald-500/5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                                        title="Restore to Active"
                                        aria-label={`Restore ${test.title} to active`}
                                      >
                                        <RefreshCcw size={14} />
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => handleDeleteClick(test.id)}
                                        className="p-2.5 bg-rose-500/5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                                        title="Purge Record"
                                        aria-label={`Purge record for ${test.title}`}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 opacity-50 text-slate-400">
          <div className="p-6 bg-white/5 rounded-full mb-6">
            <Search size={40} strokeWidth={1} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">
            {searchQuery ? `No matching archived records for "${searchQuery}"` : `Zero archived ${filterType} clusters detected`}
          </p>
        </div>
      )}

      {/* DEPLOYMENT SUMMARY MODAL */}
      {selectedTest && (
        <div className="fixed inset-0 lg:pl-[340px] z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedTest(null)}
          />
          <div
            ref={summaryModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-modal-title"
            className="relative w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div>
                <h2 id="history-modal-title" className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Deployment Summary</h2>
                <p className="text-[#9ca3af] text-[9px] font-black uppercase tracking-[0.3em] mt-1">Archived Cluster Parameters</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTest(null)}
                aria-label="Close summary"
                className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="p-6 rounded-2xl border border-white/5 bg-black/40 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-white/60 uppercase tracking-widest flex items-center gap-2"><Zap size={12}/> Mode</span>
                    <span className={`tracking-widest uppercase ${selectedTest.type === 'main' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {selectedTest.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-white/60 uppercase tracking-widest flex items-center gap-2"><Database size={12}/> Subject</span>
                    <span className="text-white/80 tracking-widest uppercase">{selectedTest.category}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-white/60 uppercase tracking-widest flex items-center gap-2"><FileText size={12}/> Questions</span>
                    <span className="text-white/80 tracking-widest uppercase">{selectedTest.questionCount || selectedTest.totalQuestions} Questions</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-white/60 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Duration</span>
                    <span className="text-white/80 tracking-widest uppercase">{selectedTest.durationMinutes || selectedTest.duration} Minutes</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold pt-4 border-t border-white/5">
                    <span className="text-white/60 uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> Deployed</span>
                    <span className="text-white/70 tracking-widest uppercase">
                      {new Date(selectedTest.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                ref={summaryCloseBtnRef}
                type="button"
                onClick={() => setSelectedTest(null)}
                className="w-full py-4 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-[0.4em] transition-all hover:bg-white/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={executeConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
      />
    </div>
  );
};

export default AdminTestHistory;
