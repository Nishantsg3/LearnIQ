import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Clock,
  FileText,
  Zap,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import api from '../utils/api';

const PracticePage = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingTestId, setStartingTestId] = useState(null);

  const startTest = async (testId) => {
    if (startingTestId) return;
    setStartingTestId(testId);

    try {
      const res = await api.post('/attempts/start', { testId });
      navigate(`/student/test/${testId}?attemptId=${res.data.attemptId}`);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.attemptId) {
        navigate(`/student/test/${testId}?attemptId=${err.response.data.attemptId}`);
        return;
      }
      toast.error('Failed to start test');
    } finally {
      setStartingTestId(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        api.get('/tests'),
        api.get('/attempts/me'),
      ]);
      setTests(Array.isArray(testsRes.data) ? testsRes.data : []);
      setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
    } catch (err) {
      toast.error('Failed to load practice tests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getLatestAttempt = (testId) => {
    return attempts
      .filter(a => a.testId === testId && a.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0];
  };

  const getCompletionCount = (testId) => {
    return attempts.filter(a => a.testId === testId && a.submitted).length;
  };

  const practiceTests = tests.filter(t => {
    const rawType = (t.testType || t.type || '').toUpperCase();
    const isPractice = rawType === 'PRACTICE';
    const isActive = (t.status || '').toUpperCase() === 'ACTIVE' || (t.status || '').toUpperCase() === 'LIVE' || t.active;
    const hasActiveAttempt = !!getLatestAttempt(t.id);
    return isPractice && (isActive || hasActiveAttempt);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-white/5 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 sm:space-y-12 animate-in fade-in duration-700 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      
      {/* SIMPLE HEADER */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 sm:gap-6">
          <div 
            onClick={() => navigate('/student/dashboard')}
            className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-all"
          >
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight leading-none">Section 1</h1>
            <p className="text-emerald-500/80 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em]">Practice Vault</p>
            <p className="hidden sm:block text-white/20 text-[9px] font-medium uppercase tracking-[0.2em]">Refine your skills and build absolute confidence through targeted practice sessions.</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-slate-400 hover:text-white group shrink-0"
        >
          <ArrowUpRight size={12} className="group-hover:rotate-45 transition-transform" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-h-0">
        {practiceTests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <Zap size={32} className="text-white/10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white/80 uppercase tracking-widest">No practice assessments available</h3>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">New practice modules will be released shortly.</p>
            </div>
            <button 
                onClick={() => fetchData()}
                className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400"
            >
                Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 sm:gap-8 items-start overflow-y-auto no-scrollbar pr-1 sm:pr-2 h-full pb-16 sm:pb-20 pt-4 sm:pt-10">
            {practiceTests.map(test => {
              const latestAttempt = getLatestAttempt(test.id);
              const completedCount = getCompletionCount(test.id);

              return (
                <StatCard 
                  key={test.id} 
                  test={test} 
                  latestAttempt={latestAttempt}
                  completedCount={completedCount}
                  startingTestId={startingTestId}
                  onAction={() => {
                    if (latestAttempt) {
                        navigate(`/student/test/${test.id}?attemptId=${latestAttempt.id}`);
                    } else {
                        startTest(test.id);
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ test, latestAttempt, completedCount, startingTestId, onAction }) => {
  const [hovered, setHovered] = useState(false);
  const accent = '#10b981';

  return (
    <div
      onClick={onAction}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#161622' : '#0d0d12',
        border: `1px solid ${hovered ? accent + '30' : 'rgba(255,255,255,0.03)'}`,
        borderRadius: 12,
        padding: 'clamp(16px, 4vw, 24px)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? `0 24px 48px rgba(0,0,0,0.5)` : 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Ghost Icon */}
      <div style={{
        position: 'absolute',
        right: '10%',
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: hovered ? 0.08 : 0.03,
        color: hovered ? accent : '#fff',
        transition: 'all 0.5s ease',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <FileText size={window.innerWidth < 640 ? 80 : 140} />
      </div>

      {/* Content Section */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header: Icon only */}
        <div style={{ marginBottom: '12px' }}>
            <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: hovered ? `${accent}20` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hovered ? accent + '40' : 'rgba(255,255,255,0.05)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: hovered ? accent : '#444',
                transition: 'all 0.3s',
            }}>
                <Zap size={18} />
            </div>
        </div>

        {/* Identity: Category + Title */}
        <div className="mb-3">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">{test.category || 'Skill Path'}</p>
            <h3 className="text-lg font-black text-white/90 uppercase tracking-tight leading-tight line-clamp-2 min-h-[2.5rem]">{test.title}</h3>
        </div>

        {/* Info: Duration + Questions */}
        <div className="flex items-center gap-3 mb-0">
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5">
                <Clock size={12} className="text-emerald-500/50" />
                {test.durationMinutes}m
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5">
                <FileText size={12} className="text-emerald-500/50" />
                {test.questionCount}q
            </div>
        </div>

        {/* Footer: Action Button */}
        <div className={`pt-3 sm:pt-5 mt-4 border-t border-white/5 flex items-center justify-between transition-all duration-300 ${hovered ? 'opacity-100' : 'opacity-40'}`}>
           <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis mr-4">
              {latestAttempt ? 'Resume Session' : 'Start Assessment'}
           </span>
           <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-all">
             <ArrowUpRight size={16} style={{ color: hovered ? accent : '#fff' }} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default PracticePage;