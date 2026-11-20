import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Shield,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Award,
  ChevronRight,
  Calendar,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Zap,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Skeleton } from '../components/common/Skeleton';
import PlayingCardFrame from '../components/PlayingCardFrame';
import Apple3DTiltCard from '../components/Apple3DTiltCard';

// Real-time live clock for student dashboard (12-hour AM/PM format with second-by-second ticker)
const LiveClock = React.memo(() => {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-[#151921]/90 backdrop-blur-md rounded-xl border border-slate-300/90 dark:border-white/15 shadow-2xs select-none">
      <Clock size={15} className="text-[#6366F1] dark:text-[#818CF8] shrink-0" aria-hidden="true" />
      <span className="font-bold tabular-nums tracking-wide">
        {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
      </span>
      <span className="text-slate-300 dark:text-slate-600">•</span>
      <span className="text-slate-600 dark:text-slate-400 font-medium">
        {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
});
LiveClock.displayName = 'LiveClock';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [testsRes, attemptsRes] = await Promise.allSettled([
        api.get('/tests'),
        api.get('/attempts/me')
      ]);

      if (testsRes.status === 'fulfilled' && Array.isArray(testsRes.value.data)) {
        setTests(testsRes.value.data);
      } else {
        setTests([]);
      }

      if (attemptsRes.status === 'fulfilled' && Array.isArray(attemptsRes.value.data)) {
        setAttempts(attemptsRes.value.data);
      } else {
        setAttempts([]);
      }
    } catch (err) {
      console.error('[StudentDashboard] Error fetching telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── DERIVED DOMAIN STATE ──────────────────────────────────────────────────
  const inProgressAttempt = useMemo(() => {
    return attempts.find(a => a.status === 'IN_PROGRESS' || (!a.submitted && a.status !== 'SUBMITTED'));
  }, [attempts]);

  const submittedAttempts = useMemo(() => {
    return attempts.filter(a => a.submitted || a.status === 'SUBMITTED');
  }, [attempts]);

  const latestAttempt = useMemo(() => {
    return submittedAttempts[0] || null;
  }, [submittedAttempts]);

  const liveMainTest = useMemo(() => {
    const nowTime = new Date();
    return tests.find(t => {
      const type = (t.testType || t.type || '').toUpperCase();
      const status = (t.status || '').toUpperCase();
      if (type !== 'MAIN') return false;
      if (status === 'ARCHIVED') return false;
      const start = t.startTime ? new Date(t.startTime) : null;
      const end = t.endTime ? new Date(t.endTime) : (start ? new Date(start.getTime() + (t.durationMinutes || 60) * 60000) : null);
      if (start && end) return nowTime >= start && nowTime <= end;
      return status === 'ACTIVE' || status === 'LIVE';
    }) || null;
  }, [tests]);

  const upcomingMainTest = useMemo(() => {
    const nowTime = new Date();
    return tests.find(t => {
      const type = (t.testType || t.type || '').toUpperCase();
      const status = (t.status || '').toUpperCase();
      if (type !== 'MAIN' || status === 'ARCHIVED') return false;
      const start = t.startTime ? new Date(t.startTime) : null;
      return start && start > nowTime;
    }) || null;
  }, [tests]);

  // Overall Performance Statistics
  const stats = useMemo(() => {
    if (submittedAttempts.length === 0) {
      return { totalDrills: 0, avgScore: 0, topScore: 0, totalQuestionsSolved: 0 };
    }
    const scores = submittedAttempts.map(a => a.scorePercent || 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const top = Math.max(...scores);
    const questions = submittedAttempts.reduce((acc, a) => acc + (a.attemptedCount || a.correctCount || 0), 0);
    return {
      totalDrills: submittedAttempts.length,
      avgScore: avg,
      topScore: top,
      totalQuestionsSolved: questions
    };
  }, [submittedAttempts]);

  // Subject / Category Performance Breakdown
  const categoryBreakdown = useMemo(() => {
    if (submittedAttempts.length === 0) return [];
    const map = {};
    submittedAttempts.forEach(a => {
      const cat = (a.category || 'General').toUpperCase();
      if (!map[cat]) map[cat] = { count: 0, sum: 0, best: 0 };
      map[cat].count += 1;
      const sc = a.scorePercent || 0;
      map[cat].sum += sc;
      if (sc > map[cat].best) map[cat].best = sc;
    });
    return Object.entries(map).map(([name, item]) => ({
      name,
      attempts: item.count,
      avg: Math.round(item.sum / item.count),
      best: item.best
    })).sort((a, b) => b.attempts - a.attempts).slice(0, 4);
  }, [submittedAttempts]);

  // Dynamic Greeting based on candidate local time
  const dynamicGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = useMemo(() => {
    const raw = (user?.fullName || user?.name || '').trim();
    if (!raw || raw.toLowerCase() === 'student' || user?.email === 'student1@learniq.com' || user?.email?.startsWith('student1')) {
      return 'Student One';
    }
    return raw;
  }, [user]);

  const formatUpcomingDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col space-y-8 animate-in fade-in duration-200 motion-reduce:animate-none">

      {/* ── 1. SCHOLARLY MASTHEAD & METRICS LEDGER ─────────────────── */}
      <section aria-labelledby="dashboard-masthead-title" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-5 border-b border-slate-200 dark:border-[#232936]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-medium text-indigo-800 dark:text-indigo-300">
                <GraduationCap size={13} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <span>{user?.id ? `Candidate #${user.id}` : 'Candidate'}</span>
              </div>
            </div>

            <h1 id="dashboard-masthead-title" className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {dynamicGreeting}, {displayName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl font-normal leading-relaxed">
              {inProgressAttempt
                ? 'An unfinished examination session is awaiting resumption. Responses and timer status are synchronized.'
                : 'Personalized diagnostics, topic mastery distribution, and scheduled milestone assessments.'
              }
            </p>
          </div>

          <div className="shrink-0">
            <LiveClock />
          </div>
        </div>

        {/* PERFORMANCE ACHIEVEMENTS HUD */}
        <div className="space-y-3 mb-12 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                PERFORMANCE ACHIEVEMENTS
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">Tactile Assessment Ledger</span>
            </div>
          </div>

          {/* Luxury Rectangular Playing Cards Grid (2 RED, 2 BLACK AUTHENTIC SUITES) */}
          <div
            role={loading ? 'status' : 'region'}
            aria-busy={loading ? 'true' : undefined}
            aria-live="polite"
            aria-label={loading ? 'Loading performance summary' : 'Candidate achievement playing card statistics'}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5.5"
          >
            {loading && <span className="sr-only">Loading performance summary...</span>}

            {/* ── Playing Card 1: Practice Drills (♠ Ace of Spades — Deep Carbon / Slate BLACK) ── */}
            <div className="relative group/card animate-apple-stagger-1 apple-tactile-card">
              <div className="absolute -inset-3 sm:-inset-4 rounded-[36px] bg-slate-800/25 dark:bg-slate-400/15 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-2xl pointer-events-none" />
              <div className="absolute -inset-1 rounded-3xl bg-slate-900/30 dark:bg-slate-200/20 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-md pointer-events-none" />

              <Apple3DTiltCard
                onClick={() => navigate('/student/section1')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/student/section1'); }}
                className="bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F0] to-[#F3EDE2] dark:from-[#131722]/95 dark:to-[#0C0F17]/95 group-hover/card:bg-white dark:group-hover/card:bg-[#151a27] backdrop-blur-2xl border border-transparent rounded-3xl p-2.5 xs:p-4 pb-2 xs:pb-3.5 shadow-[0_14px_34px_-6px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.85)] group-hover/card:shadow-[0_24px_50px_-8px_rgba(0,0,0,0.22)] dark:group-hover/card:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-between h-[320px] xs:h-[340px] sm:h-[355px] lg:h-[370px] cursor-pointer text-slate-900 dark:text-slate-100 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-slate-200/40 via-white/80 dark:via-white/[0.06] to-transparent opacity-0 group-hover/card:opacity-100 -translate-x-full group-hover/card:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                <PlayingCardFrame strokeColor="currentColor" glowColor="rgba(15,23,42,0.85)" />

                {/* Center Suit Watermark (Luminous in Light & Dark) */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                  style={{ transform: 'translateZ(12px)' }}
                >
                  <span className="text-[100px] xs:text-[120px] sm:text-[150px] font-serif font-black text-slate-900/[0.05] dark:text-white/[0.05] group-hover/card:scale-120 group-hover/card:text-slate-900/40 dark:group-hover/card:text-white/35 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    ♠
                  </span>
                </div>

                {/* Top Row: Pip & Badge (Layered at translateZ 26px) */}
                <div className="relative z-10 flex items-start justify-between" style={{ transform: 'translateZ(26px)' }}>
                  <div className="flex flex-col items-center leading-none select-none">
                    <span className="font-mono font-black text-xs xs:text-sm tracking-tighter text-slate-900 dark:text-slate-100">01</span>
                    <span className="font-serif text-base xs:text-lg leading-none mt-0.5 text-slate-900 dark:text-slate-100">♠</span>
                  </div>
                  <div className="flex items-center gap-1 xs:gap-1.5">
                    <span className="text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 xs:px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
                      SUITE
                    </span>
                    <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-2xs group-hover/card:scale-110 transition-transform">
                      <Target size={12} className="xs:w-[13px] xs:h-[13px]" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Centerpiece Figure (Layered at translateZ 44px) */}
                <div className="relative z-10 my-auto text-center py-1.5 xs:py-2 flex flex-col items-center justify-center" style={{ transform: 'translateZ(44px)' }}>
                  <div className="text-3xl xs:text-4xl sm:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-slate-50 group-hover/card:scale-105 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                    {loading ? <Skeleton className="h-10 w-20 rounded-md mx-auto" /> : stats.totalDrills}
                  </div>
                  <div className="mt-1 xs:mt-1.5 text-[10px] xs:text-xs font-mono font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    PRACTICE DRILLS
                  </div>
                  <p className="hidden xs:block text-[9px] sm:text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5 max-w-[170px] leading-snug">
                    Practice modules completed
                  </p>

                  <div className="hidden xs:inline-flex mt-2 sm:mt-3 items-center gap-1.5 px-2 xs:px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] border border-slate-300/80 dark:border-white/10 text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 shadow-2xs">
                    <span>✦ MODULE SUITE 01 ✦</span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="relative z-10 pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-end justify-between text-[9px] xs:text-[10px] font-mono" style={{ transform: 'translateZ(26px)' }}>
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] xs:text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Progress</span>
                    <span className="text-[9px] xs:text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80px] xs:max-w-[120px]">
                      {stats.totalDrills > 0 ? 'Verified tests' : 'Awaiting'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center leading-none select-none">
                    <span className="font-serif text-sm xs:text-base leading-none text-slate-900 dark:text-slate-100">♠</span>
                    <span className="font-mono font-black text-[10px] xs:text-xs tracking-tighter text-slate-900 dark:text-slate-100 mt-0.5">01</span>
                  </div>
                </div>
              </Apple3DTiltCard>
            </div>

            {/* ── Playing Card 2: Cumulative Accuracy (♥ Queen of Hearts — Pure Crimson RED) ── */}
            <div className="relative group/card animate-apple-stagger-2 apple-tactile-card">
              <div className="absolute -inset-3 sm:-inset-4 rounded-[36px] bg-rose-500/35 dark:bg-rose-500/20 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-2xl pointer-events-none" />
              <div className="absolute -inset-1 rounded-3xl bg-rose-500/40 dark:bg-rose-400/30 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-md pointer-events-none" />

              <Apple3DTiltCard
                onClick={() => navigate('/student/progress')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/student/progress'); }}
                className="bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F0] to-[#F3EDE2] dark:from-[#131722]/95 dark:to-[#0C0F17]/95 group-hover/card:bg-white dark:group-hover/card:bg-[#151a27] backdrop-blur-2xl border border-transparent rounded-3xl p-2.5 xs:p-4 pb-2 xs:pb-3.5 shadow-[0_14px_34px_-6px_rgba(225,29,72,0.14),0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.85)] group-hover/card:shadow-[0_24px_50px_-8px_rgba(225,29,72,0.25)] dark:group-hover/card:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-between h-[320px] xs:h-[340px] sm:h-[355px] lg:h-[370px] cursor-pointer text-[#E11D48] dark:text-[#FB7185] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-rose-200/40 via-white/80 dark:via-white/[0.06] to-transparent opacity-0 group-hover/card:opacity-100 -translate-x-full group-hover/card:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                <PlayingCardFrame strokeColor="currentColor" glowColor="rgba(225,29,72,0.85)" />

                {/* Center Suit Watermark (Luminous in Light & Dark) */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                  style={{ transform: 'translateZ(12px)' }}
                >
                  <span className="text-[100px] xs:text-[120px] sm:text-[150px] font-serif font-black text-rose-600/[0.05] dark:text-rose-400/[0.05] group-hover/card:scale-120 group-hover/card:text-rose-600/40 dark:group-hover/card:text-rose-400/35 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    ♥
                  </span>
                </div>

                {/* Top Row: Pip & Badge */}
                <div className="relative z-10 flex items-start justify-between" style={{ transform: 'translateZ(26px)' }}>
                  <div className="flex flex-col items-center leading-none select-none">
                    <span className="font-mono font-black text-xs xs:text-sm tracking-tighter text-rose-700 dark:text-rose-300">02</span>
                    <span className="font-serif text-base xs:text-lg leading-none mt-0.5 text-[#E11D48] dark:text-[#FB7185]">♥</span>
                  </div>
                  <div className="flex items-center gap-1 xs:gap-1.5">
                    <span className="text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 xs:px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/70 text-[#E11D48] dark:text-[#FB7185] border border-rose-200/80 dark:border-rose-800/60 shadow-2xs">
                      TIER
                    </span>
                    <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-[#E11D48] dark:text-[#FB7185] flex items-center justify-center border border-rose-200/80 dark:border-rose-800/60 shadow-2xs group-hover/card:scale-110 transition-transform">
                      <TrendingUp size={12} className="xs:w-[13px] xs:h-[13px]" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Centerpiece Figure */}
                <div className="relative z-10 my-auto text-center py-1.5 xs:py-2 flex flex-col items-center justify-center" style={{ transform: 'translateZ(44px)' }}>
                  <div className="text-3xl xs:text-4xl sm:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-slate-50 group-hover/card:scale-105 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(225,29,72,0.18)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                    {loading ? <Skeleton className="h-10 w-20 rounded-md mx-auto" /> : `${stats.avgScore}%`}
                  </div>
                  <div className="mt-1 xs:mt-1.5 text-[10px] xs:text-xs font-mono font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    CUMULATIVE ACCURACY
                  </div>
                  <p className="hidden xs:block text-[9px] sm:text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5 max-w-[170px] leading-snug">
                    Empirical success quotient
                  </p>

                  <div className="hidden xs:inline-flex mt-2 sm:mt-3 items-center gap-1.5 px-2 xs:px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/50 text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider text-[#E11D48] dark:text-[#FB7185] shadow-2xs">
                    <span>✦ ACCURACY TIER 02 ✦</span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="relative z-10 pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-end justify-between text-[9px] xs:text-[10px] font-mono" style={{ transform: 'translateZ(26px)' }}>
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] xs:text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Standing</span>
                    <span className="text-[9px] xs:text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80px] xs:max-w-[120px]">
                      {stats.avgScore >= 75 ? 'Mastery' : stats.avgScore >= 50 ? 'Proficient' : 'Developing'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center leading-none select-none">
                    <span className="font-serif text-sm xs:text-base leading-none text-[#E11D48] dark:text-[#FB7185]">♥</span>
                    <span className="font-mono font-black text-[10px] xs:text-xs tracking-tighter text-rose-700 dark:text-rose-300 mt-0.5">02</span>
                  </div>
                </div>
              </Apple3DTiltCard>
            </div>

            {/* ── Playing Card 3: Questions Solved (♣ King of Clubs — Deep Carbon / Slate BLACK) ── */}
            <div className="relative group/card animate-apple-stagger-3 apple-tactile-card">
              <div className="absolute -inset-3 sm:-inset-4 rounded-[36px] bg-slate-800/25 dark:bg-slate-400/15 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-2xl pointer-events-none" />
              <div className="absolute -inset-1 rounded-3xl bg-slate-900/30 dark:bg-slate-200/20 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-md pointer-events-none" />

              <Apple3DTiltCard
                onClick={() => navigate('/student/results')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/student/results'); }}
                className="bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F0] to-[#F3EDE2] dark:from-[#131722]/95 dark:to-[#0C0F17]/95 group-hover/card:bg-white dark:group-hover/card:bg-[#151a27] backdrop-blur-2xl border border-transparent rounded-3xl p-2.5 xs:p-4 pb-2 xs:pb-3.5 shadow-[0_14px_34px_-6px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.85)] group-hover/card:shadow-[0_24px_50px_-8px_rgba(0,0,0,0.22)] dark:group-hover/card:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-between h-[320px] xs:h-[340px] sm:h-[355px] lg:h-[370px] cursor-pointer text-slate-900 dark:text-slate-100 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-slate-200/40 via-white/80 dark:via-white/[0.06] to-transparent opacity-0 group-hover/card:opacity-100 -translate-x-full group-hover/card:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                <PlayingCardFrame strokeColor="currentColor" glowColor="rgba(15,23,42,0.85)" />

                {/* Center Suit Watermark (Luminous in Light & Dark) */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                  style={{ transform: 'translateZ(12px)' }}
                >
                  <span className="text-[100px] xs:text-[120px] sm:text-[150px] font-serif font-black text-slate-900/[0.05] dark:text-white/[0.05] group-hover/card:scale-120 group-hover/card:text-slate-900/40 dark:group-hover/card:text-white/35 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    ♣
                  </span>
                </div>

                {/* Top Row: Pip & Badge */}
                <div className="relative z-10 flex items-start justify-between" style={{ transform: 'translateZ(26px)' }}>
                  <div className="flex flex-col items-center leading-none select-none">
                    <span className="font-mono font-black text-xs xs:text-sm tracking-tighter text-slate-900 dark:text-slate-100">03</span>
                    <span className="font-serif text-base xs:text-lg leading-none mt-0.5 text-slate-900 dark:text-slate-100">♣</span>
                  </div>
                  <div className="flex items-center gap-1 xs:gap-1.5">
                    <span className="text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 xs:px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
                      SOLVED
                    </span>
                    <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-2xs group-hover/card:scale-110 transition-transform">
                      <CheckCircle2 size={12} className="xs:w-[13px] xs:h-[13px]" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Centerpiece Figure */}
                <div className="relative z-10 my-auto text-center py-1.5 xs:py-2 flex flex-col items-center justify-center" style={{ transform: 'translateZ(44px)' }}>
                  <div className="text-3xl xs:text-4xl sm:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-slate-50 group-hover/card:scale-105 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                    {loading ? <Skeleton className="h-10 w-20 rounded-md mx-auto" /> : stats.totalQuestionsSolved}
                  </div>
                  <div className="mt-1 xs:mt-1.5 text-[10px] xs:text-xs font-mono font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    QUESTIONS SOLVED
                  </div>
                  <p className="hidden xs:block text-[9px] sm:text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5 max-w-[170px] leading-snug">
                    Problems submitted & verified
                  </p>

                  <div className="hidden xs:inline-flex mt-2 sm:mt-3 items-center gap-1.5 px-2 xs:px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] border border-slate-300/80 dark:border-white/10 text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 shadow-2xs">
                    <span>✦ RECORD 03 ✦</span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="relative z-10 pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-end justify-between text-[9px] xs:text-[10px] font-mono" style={{ transform: 'translateZ(26px)' }}>
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] xs:text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Solved</span>
                    <span className="text-[9px] xs:text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80px] xs:max-w-[120px]">
                      Verified items
                    </span>
                  </div>
                  <div className="flex flex-col items-center leading-none select-none">
                    <span className="font-serif text-sm xs:text-base leading-none text-slate-900 dark:text-slate-100">♣</span>
                    <span className="font-mono font-black text-[10px] xs:text-xs tracking-tighter text-slate-900 dark:text-slate-100 mt-0.5">03</span>
                  </div>
                </div>
              </Apple3DTiltCard>
            </div>

            {/* ── Playing Card 4: Peak Record (♦ Jack of Diamonds — Pure Scarlet RED) ── */}
            <div className="relative group/card animate-apple-stagger-4 apple-tactile-card">
              <div className="absolute -inset-3 sm:-inset-4 rounded-[36px] bg-red-500/35 dark:bg-red-500/20 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-2xl pointer-events-none" />
              <div className="absolute -inset-1 rounded-3xl bg-red-500/40 dark:bg-red-400/30 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-md pointer-events-none" />

              <Apple3DTiltCard
                onClick={() => navigate('/student/results')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/student/results'); }}
                className="bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F0] to-[#F3EDE2] dark:from-[#131722]/95 dark:to-[#0C0F17]/95 group-hover/card:bg-white dark:group-hover/card:bg-[#151a27] backdrop-blur-2xl border border-transparent rounded-3xl p-2.5 xs:p-4 pb-2 xs:pb-3.5 shadow-[0_14px_34px_-6px_rgba(220,38,38,0.14),0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.85)] group-hover/card:shadow-[0_24px_50px_-8px_rgba(220,38,38,0.25)] dark:group-hover/card:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col justify-between h-[320px] xs:h-[340px] sm:h-[355px] lg:h-[370px] cursor-pointer text-[#DC2626] dark:text-[#F87171] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-200/40 via-white/80 dark:via-white/[0.06] to-transparent opacity-0 group-hover/card:opacity-100 -translate-x-full group-hover/card:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                <PlayingCardFrame strokeColor="currentColor" glowColor="rgba(220,38,38,0.85)" />

                {/* Center Suit Watermark (Luminous in Light & Dark) */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                  style={{ transform: 'translateZ(12px)' }}
                >
                  <span className="text-[100px] xs:text-[120px] sm:text-[150px] font-serif font-black text-red-600/[0.05] dark:text-red-400/[0.05] group-hover/card:scale-120 group-hover/card:text-red-600/40 dark:group-hover/card:text-red-400/35 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    ♦
                  </span>
                </div>

                {/* Top Row: Pip & Badge */}
                <div className="relative z-10 flex items-start justify-between" style={{ transform: 'translateZ(26px)' }}>
                  <div className="flex flex-col items-center leading-none select-none">
                    <span className="font-mono font-black text-xs xs:text-sm tracking-tighter text-red-700 dark:text-red-300">04</span>
                    <span className="font-serif text-base xs:text-lg leading-none mt-0.5 text-[#DC2626] dark:text-[#F87171]">♦</span>
                  </div>
                  <div className="flex items-center gap-1 xs:gap-1.5">
                    <span className="text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 xs:px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/70 text-[#DC2626] dark:text-[#F87171] border border-red-200/80 dark:border-red-800/60 shadow-2xs">
                      PEAK
                    </span>
                    <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-lg bg-red-50 dark:bg-red-950/70 text-[#DC2626] dark:text-[#F87171] flex items-center justify-center border border-red-200/80 dark:border-red-800/60 shadow-2xs group-hover/card:scale-110 transition-transform">
                      <Award size={12} className="xs:w-[13px] xs:h-[13px]" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Centerpiece Figure */}
                <div className="relative z-10 my-auto text-center py-1.5 xs:py-2 flex flex-col items-center justify-center" style={{ transform: 'translateZ(44px)' }}>
                  <div className="text-3xl xs:text-4xl sm:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-slate-50 group-hover/card:scale-105 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(220,38,38,0.18)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                    {loading ? <Skeleton className="h-10 w-20 rounded-md mx-auto" /> : `${stats.topScore}%`}
                  </div>
                  <div className="mt-1 xs:mt-1.5 text-[10px] xs:text-xs font-mono font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    PEAK RECORD
                  </div>
                  <p className="hidden xs:block text-[9px] sm:text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5 max-w-[170px] leading-snug">
                    Highest single score recorded
                  </p>

                  <div className="hidden xs:inline-flex mt-2 sm:mt-3 items-center gap-1.5 px-2 xs:px-2.5 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider text-[#DC2626] dark:text-[#F87171] shadow-2xs">
                    <span>✦ SUMMIT 04 ✦</span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="relative z-10 pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-end justify-between text-[9px] xs:text-[10px] font-mono" style={{ transform: 'translateZ(26px)' }}>
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] xs:text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Personal Best</span>
                    <span className="text-[9px] xs:text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80px] xs:max-w-[120px]">
                      All-time summit
                    </span>
                  </div>
                  <div className="flex flex-col items-center leading-none select-none">
                    <span className="font-serif text-sm xs:text-base leading-none text-[#DC2626] dark:text-[#F87171]">♦</span>
                    <span className="font-mono font-black text-[10px] xs:text-xs tracking-tighter text-red-700 dark:text-red-300 mt-0.5">04</span>
                  </div>
                </div>
              </Apple3DTiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. ASYMMETRIC OPERATIONAL WORKSPACE (7 : 5) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN (7 COLS): Operational Lead, Mastery Matrix & Timeline */}
        <div className="lg:col-span-7 space-y-8">

          {/* 2.1 IN-PROGRESS ASSESSMENT RESUMPTION CARD (IF ACTIVE) */}
          {loading ? (
            <div role="status" aria-busy="true" aria-label="Loading active assessment" className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-academy-card border border-academy-rule dark:border-academy-rule shadow-xs space-y-4">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-8 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <div className="flex gap-4 pt-4 border-t border-academy-rule dark:border-academy-rule">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <Skeleton className="h-11 w-44 rounded-lg mt-2" />
            </div>
          ) : inProgressAttempt ? (
            /* Active In-Progress Attempt Resumption */
            <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-academy-card dark:to-academy-card border border-amber-200/90 dark:border-amber-800/40 border-l-4 border-l-amber-500 shadow-xs space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/50 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                  Examination In Progress
                </span>
                <span className="text-xs font-mono text-amber-800 dark:text-amber-400 font-medium">
                  Resumption Ready
                </span>
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-academy-ink tracking-tight">
                  {inProgressAttempt.testTitle || 'Diagnostic Assessment'}
                </h2>
                <p className="text-xs sm:text-sm text-academy-ink-secondary mt-2 leading-relaxed font-normal">
                  Your drafted answers and remaining duration are securely preserved in the vault. Resume immediately to submit your responses.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 text-xs text-academy-muted font-mono">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <Clock size={14} aria-hidden="true" />
                  <span>Session Live</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <span>Encrypted State Cache</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/student/test/${inProgressAttempt.testId}?attemptId=${inProgressAttempt.id}&mode=${inProgressAttempt.testType || 'PRACTICE'}`)}
                  aria-label={`Resume in-progress assessment: ${inProgressAttempt.testTitle || 'Diagnostic Assessment'}`}
                  className="min-h-[44px] px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs hover:shadow transition-all duration-150 flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
                >
                  <span>Resume Assessment Now</span>
                  <PlayCircle size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}

          {/* 2.2 ACADEMIC MASTERY MATRIX */}
          <section aria-labelledby="mastery-matrix-heading" className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-academy-card border border-academy-rule dark:border-academy-rule shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-academy-rule dark:border-academy-rule">
              <div>
                <h2 id="mastery-matrix-heading" className="font-serif text-xl font-normal text-academy-ink">Academic Mastery Matrix</h2>
                <p className="text-xs text-academy-muted mt-1">Empirical subject accuracy from verified attempts</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-academy-paper-subtle dark:bg-[#1a202c] border border-academy-rule dark:border-academy-rule text-academy-ink">
                {categoryBreakdown.length > 0 ? `${categoryBreakdown.length} Curricula Tracked` : 'Ready'}
              </span>
            </div>

            {loading ? (
              <div role="status" aria-busy="true" aria-label="Loading topic mastery" className="space-y-5">
                <span className="sr-only">Loading topic mastery...</span>
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-4 w-32 rounded" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : categoryBreakdown.length > 0 ? (
              <div className="space-y-6">
                {categoryBreakdown.map((cat) => {
                  const isMastered = cat.avg >= 75;
                  const isProficient = cat.avg >= 50 && cat.avg < 75;
                  const tierLabel = isMastered ? 'Mastered' : isProficient ? 'Proficient' : 'Developing';
                  const tierBadgeColor = isMastered
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/50'
                    : isProficient
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border-brand-200/80 dark:border-brand-800/50'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/50';

                  const barColor = isMastered
                    ? 'bg-emerald-500'
                    : isProficient
                    ? 'bg-brand-600 dark:bg-brand-500'
                    : 'bg-amber-500';

                  return (
                    <div key={cat.name} className="space-y-2 group">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${barColor}`} aria-hidden="true" />
                          <span className="font-semibold text-academy-ink text-sm">{cat.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${tierBadgeColor} flex items-center gap-1`}>
                            {isMastered ? <CheckCircle2 size={11} aria-hidden="true" /> : isProficient ? <Zap size={11} aria-hidden="true" /> : <AlertCircle size={11} aria-hidden="true" />}
                            <span>{tierLabel}</span>
                          </span>
                        </div>
                        <div className="font-mono text-xs tabular-nums text-academy-muted">
                          <strong className="text-academy-ink font-bold text-sm">{cat.avg}%</strong> ({cat.attempts} {cat.attempts === 1 ? 'drill' : 'drills'})
                        </div>
                      </div>

                      <div
                        role="progressbar"
                        aria-valuenow={cat.avg}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuetext={`${cat.avg} percent average, tier ${tierLabel}`}
                        aria-label={`${cat.name} topic mastery: ${cat.avg}% average, status ${tierLabel}`}
                        className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#1a202c] overflow-hidden"
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out motion-reduce:transition-none ${barColor}`}
                          style={{ width: `${Math.max(cat.avg, 6)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs text-academy-muted pt-1">
                        <span className="font-mono text-[11px]">Peak accuracy: <strong className="text-academy-ink font-semibold">{cat.best}%</strong></span>
                        <button
                          type="button"
                          onClick={() => navigate(`/student/section1?category=${encodeURIComponent(cat.name)}`)}
                          aria-label={`Launch subject drill for ${cat.name}`}
                          className="min-h-[36px] py-1 px-3 rounded-lg border border-brand-200/80 dark:border-brand-800/60 bg-brand-50/50 dark:bg-brand-950/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-900 dark:hover:text-brand-200 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
                        >
                          <span>Launch Subject Drill</span>
                          <ArrowRight size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs sm:text-sm text-academy-muted max-w-md mx-auto leading-relaxed">
                  No completed drills logged yet. Complete your first diagnostic drill to establish subject telemetry.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/student/section1')}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-100/70 dark:hover:bg-brand-900/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
                >
                  Start Diagnostic Drill
                </button>
              </div>
            )}
          </section>

          {/* 2.3 PROCTORED EXAMINATION SCHEDULE & MILESTONES */}
          <section aria-labelledby="milestones-heading" className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-academy-card border border-academy-rule dark:border-academy-rule shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-academy-rule dark:border-academy-rule">
              <div>
                <h2 id="milestones-heading" className="font-serif text-xl font-normal text-academy-ink">Examination Milestones</h2>
                <p className="text-xs text-academy-muted mt-1">Formal synchronized proctored evaluations and registry</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-academy-paper-subtle dark:bg-[#1a202c] border border-academy-rule dark:border-academy-rule text-academy-ink">
                Term Register
              </span>
            </div>

            {liveMainTest ? (
              <div className="p-5 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-gradient-to-r from-rose-50/70 via-rose-50/30 to-white dark:from-rose-950/40 dark:via-academy-card dark:to-academy-card flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                      Live Examination Hall Active
                    </span>
                    <span className="text-xs font-mono text-rose-900 dark:text-rose-300 font-medium">Proctoring Enforced</span>
                  </div>
                  <h3 className="text-base font-semibold text-academy-ink">{liveMainTest.title}</h3>
                  <p className="text-xs text-academy-ink-secondary">{liveMainTest.durationMinutes || 60} Minutes • Synchronized Session</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/section2')}
                  aria-label={`Enter live examination hall for proctored test: ${liveMainTest.title}`}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs hover:shadow transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
                >
                  Enter Examination Hall
                </button>
              </div>
            ) : upcomingMainTest ? (
              <div className="p-5 rounded-xl border border-academy-rule dark:border-academy-rule bg-academy-paper-subtle dark:bg-[#151921] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/60 flex items-center gap-1.5">
                      <Calendar size={12} aria-hidden="true" />
                      Scheduled Examination
                    </span>
                    <span className="text-xs font-mono text-academy-muted">
                      {formatUpcomingDate(upcomingMainTest.startTime)}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-academy-ink">{upcomingMainTest.title}</h3>
                  <p className="text-xs text-academy-ink-secondary">{upcomingMainTest.durationMinutes || 60} Minutes • Standard Examination Window</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/section2')}
                  aria-label={`Inspect syllabus and hall pass for scheduled examination: ${upcomingMainTest.title}`}
                  className="min-h-[44px] px-4 py-2.5 rounded-lg border border-academy-rule dark:border-academy-rule bg-white dark:bg-academy-card hover:bg-academy-paper-subtle text-academy-ink text-xs font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
                >
                  Inspect Syllabus & Hall Pass
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-academy-rule dark:border-academy-rule bg-academy-paper-subtle dark:bg-[#151921] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-academy-ink">No Scheduled Proctored Examinations</h3>
                  <p className="text-xs text-academy-muted">All formal examinations for this cycle are concluded. Focus on subject mastery drills.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/section2')}
                  aria-label="View proctored examination schedule"
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 bg-white dark:bg-academy-card hover:bg-slate-100 dark:hover:bg-[#1a202c] hover:-translate-y-0.5 hover:shadow-sm text-academy-ink text-xs font-semibold transition-all shrink-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
                >
                  View Schedule
                </button>
              </div>
            )}
          </section>

        </div>

        {/* RIGHT ARCHIVAL RAIL (5 COLS): Verified Scorecard & Activity Feed */}
        <div className="lg:col-span-5 space-y-8">

          {/* 2.4 LATEST VERIFIED SCORECARD */}
          <section aria-labelledby="latest-evaluation-heading" className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-academy-card border border-academy-rule dark:border-academy-rule shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-academy-rule dark:border-academy-rule">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300">
                  <Award size={16} aria-hidden="true" />
                </div>
                <h2 id="latest-evaluation-heading" className="font-serif text-xl font-normal text-academy-ink">Latest Evaluation</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50">
                Synchronized
              </span>
            </div>

            {loading ? (
              <div role="status" aria-busy="true" aria-label="Loading scorecard" className="space-y-4">
                <Skeleton className="h-5 w-48 rounded" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            ) : latestAttempt ? (
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-academy-muted">Assessment Title</span>
                  <h3 className="text-base sm:text-lg font-semibold text-academy-ink mt-1">
                    {latestAttempt.testTitle || 'Diagnostic Assessment'}
                  </h3>
                  <p className="text-xs text-academy-muted mt-1 font-mono">
                    {latestAttempt.category || 'General'} • {new Date(latestAttempt.submittedAt || latestAttempt.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div
                  aria-label={`Score achieved: ${Math.round(latestAttempt.scorePercent || 0)} percent`}
                  className="p-4 sm:p-5 rounded-xl bg-academy-paper-subtle dark:bg-[#13171f] border border-academy-rule dark:border-academy-rule flex items-center justify-between tabular-nums"
                >
                  <div className="space-y-1">
                    <span className="block text-xs font-mono uppercase tracking-wider text-academy-muted">Score Achieved</span>
                    <span className="text-xs sm:text-sm text-academy-ink-secondary font-medium">
                      {latestAttempt.correctCount ?? 0} of {latestAttempt.totalQuestions ?? 10} correct
                    </span>
                    <div className="pt-0.5">
                      <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        (latestAttempt.scorePercent || 0) >= 70
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                          : (latestAttempt.scorePercent || 0) >= 50
                          ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800/40'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                      }`}>
                        {(latestAttempt.scorePercent || 0) >= 70 ? 'Distinction' : (latestAttempt.scorePercent || 0) >= 50 ? 'Proficient' : 'Needs Review'}
                      </span>
                    </div>
                  </div>

                  <div className={`text-3xl sm:text-4xl font-mono font-bold ${
                    (latestAttempt.scorePercent || 0) >= 70
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : (latestAttempt.scorePercent || 0) >= 50
                      ? 'text-brand-700 dark:text-brand-300'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {Math.round(latestAttempt.scorePercent || 0)}%
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/results/${latestAttempt.id}`)}
                  aria-label={`Inspect detailed scorecard for ${latestAttempt.testTitle || 'Diagnostic Assessment'}, scored ${Math.round(latestAttempt.scorePercent || 0)} percent`}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 bg-white dark:bg-academy-card hover:bg-slate-100 dark:hover:bg-[#1a202c] hover:-translate-y-0.5 hover:shadow-sm text-academy-ink text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
                >
                  <span>Inspect Detailed Scorecard</span>
                  <ChevronRight size={15} className="text-academy-muted" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs sm:text-sm text-academy-muted leading-relaxed">
                  No completed attempts recorded in this session. Complete a practice drill to establish your baseline telemetry.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/student/section1')}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-100/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
                >
                  Start Diagnostic Drill
                </button>
              </div>
            )}
          </section>

          {/* 2.5 RECENT TEST HISTORY (Ledger Rows) */}
          <section aria-labelledby="recent-history-heading" className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-academy-card border border-academy-rule dark:border-academy-rule shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-academy-rule dark:border-academy-rule">
              <h2 id="recent-history-heading" className="font-serif text-xl font-normal text-academy-ink">Recent Test History</h2>
              <button
                type="button"
                onClick={() => navigate('/student/results')}
                aria-label={`View all ${submittedAttempts.length} completed test submissions`}
                className="min-h-[36px] px-2 py-1 -my-1 -mx-2 rounded-md text-xs font-mono text-brand-700 dark:text-brand-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
              >
                View All ({submittedAttempts.length})
              </button>
            </div>

            {loading ? (
              <div role="status" aria-busy="true" aria-label="Loading recent attempts" className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3.5 rounded-xl border border-academy-rule dark:border-academy-rule flex justify-between items-center">
                    <Skeleton className="h-4 w-36 rounded" />
                    <Skeleton className="h-5 w-12 rounded" />
                  </div>
                ))}
              </div>
            ) : submittedAttempts.length > 0 ? (
              <div className="divide-y divide-academy-rule-subtle dark:divide-academy-rule-subtle">
                {submittedAttempts.slice(0, 4).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => navigate(`/results/${a.id}`)}
                    aria-label={`View scorecard for ${a.testTitle || 'Diagnostic Assessment'}, scored ${Math.round(a.scorePercent || 0)} percent`}
                    className="w-full text-left py-3.5 px-2 min-h-[52px] flex items-center justify-between gap-3 group hover:bg-academy-paper-subtle dark:hover:bg-[#1a202c] rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-academy-ink truncate group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                        {a.testTitle || 'Diagnostic Assessment'}
                      </p>
                      <p className="text-[11px] font-mono text-academy-muted mt-0.5">
                        {a.category} • {new Date(a.submittedAt || a.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                        (a.scorePercent || 0) >= 70
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40'
                          : (a.scorePercent || 0) >= 50
                          ? 'text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800/40'
                          : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40'
                      }`}>
                        {Math.round(a.scorePercent || 0)}%
                      </span>
                      <ChevronRight size={14} className="text-academy-muted group-hover:text-brand-700 dark:group-hover:text-brand-300 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-academy-muted text-center py-5">No recent submissions recorded.</p>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/student/progress')}
                aria-label="View comprehensive candidate analytics and progress"
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 bg-white dark:bg-academy-card hover:bg-slate-100 dark:hover:bg-[#1a202c] hover:-translate-y-0.5 hover:shadow-sm text-academy-ink text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151921]"
              >
                <TrendingUp size={15} className="text-brand-700 dark:text-brand-300" aria-hidden="true" />
                <span>View Comprehensive Analytics</span>
              </button>
            </div>
          </section>

        </div>

      </div>

    </div>
  );
};

export default StudentDashboard;
