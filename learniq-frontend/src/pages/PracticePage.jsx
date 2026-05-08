import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Clock,
  FileText,
  Zap,
  CheckCircle2,
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
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-12 animate-in fade-in duration-700 p-8 overflow-y-auto custom-scrollbar">
      
      {/* SIMPLE HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => navigate('/student/dashboard')}
            className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-all shadow-[0_0_30px_rgba(16,185,129,0.1)]"
          >
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Section 1</h1>
            <p className="text-emerald-500/80 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Practice Vault</p>
            <p className="text-white/20 text-[9px] font-medium uppercase tracking-[0.2em] mt-1">Refine your skills and build absolute confidence through targeted practice sessions.</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-slate-400 hover:text-white group"
        >
          <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto no-scrollbar pr-2 h-full pb-20 pt-10">
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
        borderRadius: 28,
        padding: '32px 32px 48px 32px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? `0 24px 48px rgba(0,0,0,0.5)` : 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '260px'
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
        <FileText size={140} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: hovered ? `${accent}20` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hovered ? accent + '40' : 'rgba(255,255,255,0.05)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: hovered ? accent : '#444',
                transition: 'all 0.3s',
            }}>
                <Zap size={20} />
            </div>
            {latestAttempt && (
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest h-fit">
                    Active
                </div>
            )}
        </div>

        <div className="mb-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{test.category || 'General'}</p>
            <h3 className="text-xl font-black text-white/90 uppercase tracking-tight leading-none">{test.title}</h3>
        </div>

        <div className="flex gap-4 mt-auto">
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <Clock size={12} className="text-emerald-500/50" />
                {test.durationMinutes}m
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <FileText size={12} className="text-emerald-500/50" />
                {test.questionCount}q
            </div>
            {completedCount > 0 && (
                <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">
                    <CheckCircle2 size={12} />
                    Done
                </div>
            )}
        </div>
      </div>

      {/* Action Button */}
      <div className={`mt-8 pt-6 border-t border-white/5 flex items-center justify-between transition-all duration-300 ${hovered ? 'opacity-100' : 'opacity-40'}`}>
         <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {latestAttempt ? 'Resume Session' : 'Start Assessment'}
         </span>
         <ArrowUpRight size={18} style={{ color: hovered ? accent : '#fff' }} />
      </div>
    </div>
  );
};

export default PracticePage;