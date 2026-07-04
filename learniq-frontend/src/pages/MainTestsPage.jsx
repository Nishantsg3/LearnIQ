import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Clock,
  FileText,
  Shield,
  ArrowUpRight,
  Lock
} from 'lucide-react';
import api from '../utils/api';

const MainTestsPage = () => {
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
      navigate(`/student/test/${testId}?attemptId=${res.data.attemptId}&mode=MAIN`);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.attemptId) {
        navigate(`/student/test/${testId}?attemptId=${err.response.data.attemptId}&mode=MAIN`);
        return;
      }
      const errorMsg = err.response?.data?.message || 'Failed to initialize assessment';
      toast.error(errorMsg);
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
      
      const now = new Date();
      // Filter for MAIN tests that are active/live and haven't expired
      const validMainTests = (testsRes.data || []).filter(t => {
        const rawType = (t.testType || t.type || '').toUpperCase();
        if (rawType !== 'MAIN') return false;
        
        const rawStatus = (t.status || '').toUpperCase();
        if (rawStatus !== 'ACTIVE' && rawStatus !== 'LIVE' && rawStatus !== 'SCHEDULED') return false;
        if (!t.startTime) return false;
        
        const startTime = new Date(t.startTime);
        const expireTime = new Date(startTime.getTime() + (t.durationMinutes * 60000));
        
        return now < expireTime;
      });
      
      setTests(validMainTests);
      setAttempts(attemptsRes.data || []);
    } catch {
      toast.error('Failed to load main tests');
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

  const getPastAttempts = (testId) => {
    return attempts.filter(a => a.testId === testId && a.submitted);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-white/5 border-t-red-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 sm:space-y-12 animate-in fade-in duration-700 p-4 sm:p-6 lg:p-8 overflow-hidden">
      
      {/* SIMPLE HEADER */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 sm:gap-6">
          <div 
            onClick={() => navigate('/student/dashboard')}
            className="w-10 h-10 sm:w-14 sm:h-14 bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-red-500 cursor-pointer hover:bg-red-500/20 transition-all"
          >
            <Shield size={20} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight leading-none">Section 2</h1>
            <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em]">Main Assessments</p>
            <p className="hidden sm:block text-white/20 text-[9px] font-medium uppercase tracking-[0.2em]">Demonstrate your mastery and achieve your target performance in the main evaluation window.</p>
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
        {tests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <Shield size={32} className="text-white/10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white/80 uppercase tracking-widest">No main assessment scheduled</h3>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Please check back later for upcoming evaluation windows.</p>
            </div>
            <button 
                onClick={() => fetchData()}
                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-400"
            >
                Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start overflow-y-auto no-scrollbar pr-1 sm:pr-2 h-full pb-8 pt-4 sm:pt-6">
            {tests.map(test => {
              const latestAttempt = getLatestAttempt(test.id);
              const pastAttempts = getPastAttempts(test.id);
              const isCompleted = pastAttempts.length > 0;
              const isLocked = test.startTime && new Date() < new Date(test.startTime);

              return (
                <StatCard 
                  key={test.id} 
                  test={test} 
                  latestAttempt={latestAttempt}
                  isCompleted={isCompleted}
                  isLocked={isLocked}
                  pastAttemptId={pastAttempts[0]?.id}
                  onAction={() => {
                    if (isLocked) {
                        toast(`Access Restricted: Unlocking in ${new Date(new Date(test.startTime) - new Date()).toISOString().substr(11, 8)}`, { 
                            icon: '🔒',
                            style: {
                                background: 'rgba(20, 20, 25, 0.7)',
                                backdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#ef4444',
                                borderRadius: '20px',
                                padding: '20px 24px',
                                boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8)',
                                fontSize: '11px',
                                fontWeight: '900',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                minWidth: '340px'
                            }
                        });
                    } else if (isCompleted) {
                        navigate(`/results/${pastAttempts[0].id}`);
                    } else if (latestAttempt) {
                        navigate(`/student/test/${test.id}?attemptId=${latestAttempt.id}&mode=MAIN`);
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

const StatCard = ({ test, latestAttempt, isCompleted, isLocked, pastAttemptId, onAction }) => {
  const [hovered, setHovered] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const accent = isLocked ? '#64748b' : '#ef4444'; // Red for active

  useEffect(() => {
    if (!isLocked || !test.startTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const start = new Date(test.startTime);
      const diff = start - now;

      if (diff <= 0) {
        setTimeLeft('READY');
        clearInterval(timer);
        window.location.reload(); // Auto-refresh when time hits zero
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      const parts = [];
      if (h > 0) parts.push(h.toString().padStart(2, '0'));
      parts.push(m.toString().padStart(2, '0'));
      parts.push(s.toString().padStart(2, '0'));
      
      setTimeLeft(parts.join(':'));
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, test.startTime]);

  return (
    <div
      onClick={onAction}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#1a0d0d' : '#0d0d12',
        border: `1px solid ${hovered ? accent + '40' : 'rgba(255,255,255,0.03)'}`,
        borderRadius: 12,
        padding: 'clamp(16px, 4vw, 28px)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 20px 40px rgba(0,0,0,0.6)` : 'none',
        position: 'relative',
        overflow: 'hidden',
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
        {isLocked ? <Lock size={140} /> : <Shield size={140} />}
      </div>
      
      {/* Content Section */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header: Icon + Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
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
                {isLocked ? <Lock size={18} /> : <Shield size={18} />}
            </div>
            {isLocked ? (
                 <div className="px-3 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-md text-[8px] font-black uppercase tracking-widest h-fit flex items-center gap-1">
                    <Lock size={10} />
                    Locked
                </div>
            ) : isCompleted ? (
                 <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[8px] font-black uppercase tracking-widest h-fit">
                    Completed
                </div>
            ) : latestAttempt ? (
                <div className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[8px] font-black uppercase tracking-widest h-fit">
                    Active
                </div>
            ) : (
                <div className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[8px] font-black uppercase tracking-widest h-fit">
                    Main Test
                </div>
            )}
        </div>

        {/* Identity: Category + Title */}
        <div className="mb-3">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">{test.category || 'General'}</p>
            <h3 className="text-lg font-black text-white/90 uppercase tracking-tight leading-tight line-clamp-2 min-h-[2.5rem]">{test.title}</h3>
        </div>

        {/* Info: Duration + Questions */}
        <div className="flex items-center gap-3 mb-0">
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5">
                <Clock size={12} className="text-red-500/50" />
                {test.durationMinutes}m
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5">
                <FileText size={12} className="text-red-500/50" />
                {test.questionCount}q
            </div>
        </div>

        {/* Footer: Action Button */}
        <div className={`pt-5 mt-4 border-t border-white/5 flex items-center justify-between transition-all duration-300 ${hovered ? 'opacity-100' : 'opacity-30'}`}>
           <div className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis mr-4 ${isLocked ? 'text-red-500/80 animate-pulse' : 'text-white'}`}>
              {isLocked ? (
                  <div className="flex items-center gap-3">
                      <span className="text-white/20">STARTS IN</span>
                      <span className="font-mono text-xs tabular-nums text-red-500">{timeLeft || '--:--'}</span>
                  </div>
              ) : isCompleted ? 'View Result Report' : latestAttempt ? 'Resume Session' : 'Start Assessment'}
           </div>
           {!isLocked && (
             <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-all">
               <ArrowUpRight size={16} style={{ color: hovered ? accent : '#fff' }} />
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default MainTestsPage;