import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Database,
  Users,
  FileText,
  BarChart3,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  RefreshCw,
  Trophy,
  Archive,
  AlertCircle,
  Clock,
  ChevronRight,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import api from '../utils/api';
import { Skeleton } from '../components/common/Skeleton';
import PlayingCardFrame from '../components/PlayingCardFrame';
import Apple3DTiltCard from '../components/Apple3DTiltCard';

const CATEGORIES = ["Java", "Python", "ASP.NET", "Aptitude", "DBMS", "Cloud"];

// Isolated Live Digital Clock Component (Ticks second-by-second with ZERO parent re-renders or visual jitter)
const LiveClock = React.memo(() => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 h-[44px] min-h-[44px] max-h-[44px] px-4 rounded-xl bg-white/90 dark:bg-[#151921]/90 backdrop-blur-md border-2 border-slate-300 dark:border-white/20 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 shadow-2xs select-none">
      <Clock size={15} className="text-violet-600 dark:text-violet-400 shrink-0" aria-hidden="true" />
      <span className="tabular-nums tracking-wide font-bold">
        {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
      </span>
      <span className="text-slate-300 dark:text-slate-600">•</span>
      <span className="text-slate-600 dark:text-slate-400 font-medium">
        {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </span>
  );
});
LiveClock.displayName = 'LiveClock';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [dashboardStats, setDashboardStats] = useState({
    totalAssessments: 0,
    practiceTests: 0,
    mainTests: 0,
    studentCount: 0,
    questionCount: 0
  });

  const [recentTests, setRecentTests] = useState([]);
  const [testSittings, setTestSittings] = useState({});
  const [categoryCounts, setCategoryCounts] = useState({});

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }

    try {
      const [statsRes, testsRes, countsRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/tests'),
        api.get('/questions/category-counts')
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setDashboardStats({
          totalAssessments: Number(statsRes.value.data.totalAssessments) || 0,
          practiceTests: Number(statsRes.value.data.practiceTests) || 0,
          mainTests: Number(statsRes.value.data.mainTests) || 0,
          studentCount: Number(statsRes.value.data.studentCount) || 0,
          questionCount: Number(statsRes.value.data.questionCount) || 0
        });
      }

      if (countsRes.status === 'fulfilled' && countsRes.value?.data && typeof countsRes.value.data === 'object') {
        const normalized = {};
        Object.entries(countsRes.value.data).forEach(([key, val]) => {
          normalized[key.toUpperCase()] = typeof val === 'number' ? val : Number(val) || 0;
        });
        setCategoryCounts(normalized);
      }

      const rawTests = testsRes.status === 'fulfilled' && Array.isArray(testsRes.value?.data)
        ? testsRes.value.data
        : [];
      const activeList = rawTests.filter(t => t.status !== 'ARCHIVED');

      const sortedTests = [...activeList].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
      });

      const top5 = sortedTests.slice(0, 5);

      const analyticsPromises = top5.map(test => {
        const isMain = (test.testType || test.type || '').toUpperCase() === 'MAIN';
        if (isMain) {
          return api.get(`/admin/tests/${test.id}/analytics`).catch(() => null);
        }
        return Promise.resolve(null);
      });

      const analyticsResults = await Promise.all(analyticsPromises);
      const sittingsMap = {};
      top5.forEach((test, idx) => {
        const res = analyticsResults[idx];
        if (res?.data) {
          sittingsMap[test.id] = res.data.totalAttempts ?? 0;
        }
      });

      setTestSittings(sittingsMap);
      setRecentTests(top5);
      // Telemetry successfully fetched
      setError(null);
    } catch (err) {
      console.error('[AdminDashboard] Fetch error:', err);
      if (!isSilent) {
        setError('Platform telemetry synchronization failed. Check backend availability or credentials.');
        toast.error('Platform synchronization failed');
      }
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 sm:p-7 lg:p-9 max-w-7xl mx-auto flex flex-col animate-in fade-in duration-200">

      {/* ── IMMERSIVE FIRST FOLD: COMMAND MASTHEAD + 4 LUXURY PLAYING CARDS ── */}
      <div className="min-h-[calc(100vh-7.5rem)] flex flex-col justify-between shrink-0">
        {/* ── OPERATIONAL COMMAND MASTHEAD ────────────────────────────────────── */}
        <div className="border-b border-slate-200/90 dark:border-[#262a33] pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                Institutional Administration • Telemetry Nominal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-extrabold text-[#090d16] dark:text-slate-100 tracking-tight leading-tight">
              Administrative Command Console
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl font-normal leading-relaxed">
              Real-time examination telemetry, institutional question repository inventory, and active candidate management.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 shrink-0 w-full lg:w-auto self-end">
            <div className="hidden sm:flex items-center">
              <LiveClock />
            </div>

            <button
              onClick={() => navigate('/admin/tests/create')}
              className="apple-shimmer-btn px-4 h-[44px] min-h-[44px] max-h-[44px] rounded-xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 hover:from-violet-500 hover:via-violet-600 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-violet-500/25 border-2 border-violet-400/50 hover:-translate-y-0.5 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Plus size={15} />
              <span>Create Test</span>
            </button>
            <button
              onClick={() => fetchData()}
              disabled={loading || refreshing}
              className="apple-tactile-btn h-[44px] w-[44px] min-h-[44px] min-w-[44px] max-h-[44px] max-w-[44px] rounded-xl bg-white dark:bg-[#151921] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-[#1f232b] hover:-translate-y-0.5 hover:shadow-md text-slate-600 dark:text-slate-300 transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-60 flex items-center justify-center active:scale-95"
              title="Refresh telemetry"
              aria-label="Refresh telemetry"
            >
              <RefreshCw size={15} className={loading || refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── ERROR RECOVERY BANNER ────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>
          <button
            onClick={() => fetchData()}
            className="px-3.5 py-1.5 min-h-[44px] rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── SHOWCASE FOLD: LUXURY PLAYING CARDS HUD (PERFECT REST FRAMING) ─────── */}
      <section aria-label="Institutional telemetry playing cards" className="space-y-4 mb-24 sm:mb-32 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/40 shadow-2xs">
              EXECUTIVE TELEMETRY
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">Assessment Overview</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:inline">
            Core Performance Metrics
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5.5">
          {/* ── Card 1: Main Exams (♠ Ace of Spades — Deep Carbon / Slate BLACK) ──────── */}
          <div className="relative group/card animate-apple-stagger-1 apple-tactile-card">
            <div className="absolute -inset-3 sm:-inset-4 rounded-[36px] bg-slate-800/25 dark:bg-slate-400/15 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-2xl pointer-events-none" />
            <div className="absolute -inset-1 rounded-3xl bg-slate-900/30 dark:bg-slate-200/20 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-md pointer-events-none" />

            <Apple3DTiltCard
              onClick={() => navigate('/admin/tests/active?type=MAIN')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/admin/tests/active?type=MAIN'); }}
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
                    PROCTORED
                  </span>
                  <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-2xs group-hover/card:scale-110 transition-transform">
                    <ShieldCheck size={12} className="xs:w-[13px] xs:h-[13px]" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Centerpiece Figure (Layered at translateZ 44px for deep 3D lift) */}
              <div className="relative z-10 my-auto text-center py-1.5 xs:py-2 flex flex-col items-center justify-center" style={{ transform: 'translateZ(44px)' }}>
                <div className="text-3xl xs:text-4xl sm:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-slate-50 group-hover/card:scale-105 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                  {loading ? <Skeleton className="h-10 w-20 rounded-md mx-auto" /> : dashboardStats.mainTests}
                </div>
                <div className="mt-1 xs:mt-1.5 text-[10px] xs:text-xs font-mono font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  MAIN EXAMS
                </div>
                <p className="hidden xs:block text-[9px] sm:text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5 max-w-[170px] leading-snug">
                  Locked 50Q / 60M Standard
                </p>

                <div className="hidden xs:inline-flex mt-2 sm:mt-3 items-center gap-1.5 px-2 xs:px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] border border-slate-300/80 dark:border-white/10 text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 shadow-2xs">
                  <span>✦ AUTHORITY LEDGER 01 ✦</span>
                </div>
              </div>

              {/* Bottom Row (Layered at translateZ 26px) */}
              <div className="relative z-10 pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-end justify-between text-[9px] xs:text-[10px] font-mono" style={{ transform: 'translateZ(26px)' }}>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] xs:text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Standard</span>
                  <span className="text-[9px] xs:text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80px] xs:max-w-[120px]">Official Modules</span>
                </div>
                <div className="flex flex-col items-center leading-none select-none">
                  <span className="font-serif text-sm xs:text-base leading-none text-slate-900 dark:text-slate-100">♠</span>
                  <span className="font-mono font-black text-[10px] xs:text-xs tracking-tighter text-slate-900 dark:text-slate-100 mt-0.5">01</span>
                </div>
              </div>
            </Apple3DTiltCard>
          </div>

          {/* ── Card 2: Practice Drills (♥ Queen of Hearts — Pure Crimson RED) ────── */}
          <div className="relative group/card animate-apple-stagger-2 apple-tactile-card">
            <div className="absolute -inset-3 sm:-inset-4 rounded-[36px] bg-rose-500/35 dark:bg-rose-500/20 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-2xl pointer-events-none" />
            <div className="absolute -inset-1 rounded-3xl bg-rose-500/40 dark:bg-rose-400/30 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-md pointer-events-none" />

            <Apple3DTiltCard
              onClick={() => navigate('/admin/tests/active?type=PRACTICE')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/admin/tests/active?type=PRACTICE'); }}
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

              {/* Top Row: Pip & Badge (Layered at translateZ 26px) */}
              <div className="relative z-10 flex items-start justify-between" style={{ transform: 'translateZ(26px)' }}>
                <div className="flex flex-col items-center leading-none select-none">
                  <span className="font-mono font-black text-xs xs:text-sm tracking-tighter text-rose-700 dark:text-rose-300">02</span>
                  <span className="font-serif text-base xs:text-lg leading-none mt-0.5 text-[#E11D48] dark:text-[#FB7185]">♥</span>
                </div>
                <div className="flex items-center gap-1 xs:gap-1.5">
                  <span className="text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 xs:px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/70 text-[#E11D48] dark:text-[#FB7185] border border-rose-200/80 dark:border-rose-800/60 shadow-2xs">
                    FORMATIVE
                  </span>
                  <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-[#E11D48] dark:text-[#FB7185] flex items-center justify-center border border-rose-200/80 dark:border-rose-800/60 shadow-2xs group-hover/card:scale-110 transition-transform">
                    <Zap size={12} className="xs:w-[13px] xs:h-[13px]" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Centerpiece Figure (Layered at translateZ 44px) */}
              <div className="relative z-10 my-auto text-center py-1.5 xs:py-2 flex flex-col items-center justify-center" style={{ transform: 'translateZ(44px)' }}>
                <div className="text-3xl xs:text-4xl sm:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-slate-50 group-hover/card:scale-105 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(225,29,72,0.18)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                  {loading ? <Skeleton className="h-10 w-20 rounded-md mx-auto" /> : dashboardStats.practiceTests}
                </div>
                <div className="mt-1 xs:mt-1.5 text-[10px] xs:text-xs font-mono font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  PRACTICE DRILLS
                </div>
                <p className="hidden xs:block text-[9px] sm:text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5 max-w-[170px] leading-snug">
                  Self-paced formative modules
                </p>

                <div className="hidden xs:inline-flex mt-2 sm:mt-3 items-center gap-1.5 px-2 xs:px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/50 text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider text-[#E11D48] dark:text-[#FB7185] shadow-2xs">
                  <span>✦ TELEMETRY 02 ✦</span>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="relative z-10 pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-end justify-between text-[9px] xs:text-[10px] font-mono" style={{ transform: 'translateZ(26px)' }}>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] xs:text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Curriculum</span>
                  <span className="text-[9px] xs:text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80px] xs:max-w-[120px]">Adaptive Format</span>
                </div>
                <div className="flex flex-col items-center leading-none select-none">
                  <span className="font-serif text-sm xs:text-base leading-none text-[#E11D48] dark:text-[#FB7185]">♥</span>
                  <span className="font-mono font-black text-[10px] xs:text-xs tracking-tighter text-rose-700 dark:text-rose-300 mt-0.5">02</span>
                </div>
              </div>
            </Apple3DTiltCard>
          </div>

          {/* ── Card 3: Question Bank (♣ King of Clubs — Deep Carbon / Slate BLACK) ── */}
          <div className="relative group/card animate-apple-stagger-3 apple-tactile-card">
            <div className="absolute -inset-3 sm:-inset-4 rounded-[36px] bg-slate-800/25 dark:bg-slate-400/15 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-2xl pointer-events-none" />
            <div className="absolute -inset-1 rounded-3xl bg-slate-900/30 dark:bg-slate-200/20 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-md pointer-events-none" />

            <Apple3DTiltCard
              onClick={() => navigate('/admin/questions')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/admin/questions'); }}
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
                    INVENTORY
                  </span>
                  <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-2xs group-hover/card:scale-110 transition-transform">
                    <Database size={12} className="xs:w-[13px] xs:h-[13px]" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Centerpiece Figure */}
              <div className="relative z-10 my-auto text-center py-1.5 xs:py-2 flex flex-col items-center justify-center" style={{ transform: 'translateZ(44px)' }}>
                <div className="text-3xl xs:text-4xl sm:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-slate-50 group-hover/card:scale-105 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                  {loading ? <Skeleton className="h-10 w-24 rounded-md mx-auto" /> : dashboardStats.questionCount}
                </div>
                <div className="mt-1 xs:mt-1.5 text-[10px] xs:text-xs font-mono font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  QUESTION BANK
                </div>
                <p className="hidden xs:block text-[9px] sm:text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5 max-w-[170px] leading-snug">
                  Catalogued item repository
                </p>

                <div className="hidden xs:inline-flex mt-2 sm:mt-3 items-center gap-1.5 px-2 xs:px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] border border-slate-300/80 dark:border-white/10 text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 shadow-2xs">
                  <span>✦ VAULT 03 ✦</span>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="relative z-10 pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-end justify-between text-[9px] xs:text-[10px] font-mono" style={{ transform: 'translateZ(26px)' }}>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] xs:text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Catalog</span>
                  <span className="text-[9px] xs:text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80px] xs:max-w-[120px]">{CATEGORIES.length} Disciplines</span>
                </div>
                <div className="flex flex-col items-center leading-none select-none">
                  <span className="font-serif text-sm xs:text-base leading-none text-slate-900 dark:text-slate-100">♣</span>
                  <span className="font-mono font-black text-[10px] xs:text-xs tracking-tighter text-slate-900 dark:text-slate-100 mt-0.5">03</span>
                </div>
              </div>
            </Apple3DTiltCard>
          </div>

          {/* ── Card 4: Candidate Roster (♦ Jack of Diamonds — Pure Scarlet RED) ────── */}
          <div className="relative group/card animate-apple-stagger-4 apple-tactile-card">
            <div className="absolute -inset-3 sm:-inset-4 rounded-[36px] bg-red-500/35 dark:bg-red-500/20 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-2xl pointer-events-none" />
            <div className="absolute -inset-1 rounded-3xl bg-red-500/40 dark:bg-red-400/30 opacity-0 group-hover/card:opacity-100 transition-all duration-300 blur-md pointer-events-none" />

            <Apple3DTiltCard
              onClick={() => navigate('/admin/students')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/admin/students'); }}
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
                    CANDIDATES
                  </span>
                  <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-lg bg-red-50 dark:bg-red-950/70 text-[#DC2626] dark:text-[#F87171] flex items-center justify-center border border-red-200/80 dark:border-red-800/60 shadow-2xs group-hover/card:scale-110 transition-transform">
                    <Users size={12} className="xs:w-[13px] xs:h-[13px]" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Centerpiece Figure */}
              <div className="relative z-10 my-auto text-center py-1.5 xs:py-2 flex flex-col items-center justify-center" style={{ transform: 'translateZ(44px)' }}>
                <div className="text-3xl xs:text-4xl sm:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-slate-50 group-hover/card:scale-105 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(220,38,38,0.18)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                  {loading ? <Skeleton className="h-10 w-20 rounded-md mx-auto" /> : dashboardStats.studentCount}
                </div>
                <div className="mt-1 xs:mt-1.5 text-[10px] xs:text-xs font-mono font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  CANDIDATE ROSTER
                </div>
                <p className="hidden xs:block text-[9px] sm:text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5 max-w-[170px] leading-snug">
                  Enrolled & active accounts
                </p>

                <div className="hidden xs:inline-flex mt-2 sm:mt-3 items-center gap-1.5 px-2 xs:px-2.5 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 text-[8px] xs:text-[9px] font-mono font-bold uppercase tracking-wider text-[#DC2626] dark:text-[#F87171] shadow-2xs">
                  <span>✦ ROSTER 04 ✦</span>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="relative z-10 pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-end justify-between text-[9px] xs:text-[10px] font-mono" style={{ transform: 'translateZ(26px)' }}>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] xs:text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Enrolled</span>
                  <span className="text-[9px] xs:text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80px] xs:max-w-[120px]">Active Directory</span>
                </div>
                <div className="flex flex-col items-center leading-none select-none">
                  <span className="font-serif text-sm xs:text-base leading-none text-[#DC2626] dark:text-[#F87171]">♦</span>
                  <span className="font-mono font-black text-[10px] xs:text-xs tracking-tighter text-red-700 dark:text-red-300 mt-0.5">04</span>
                </div>
              </div>
            </Apple3DTiltCard>
          </div>
        </div>

        {/* Delicate Fold Scroll Transition Indicator */}
        <div className="hidden sm:flex items-center justify-center gap-2 pt-6 pb-2 text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 select-none">
          <span className="tracking-wider uppercase text-[10px]">Scroll For Operational Ledger & Launchpad</span>
          <ChevronDown size={13} className="animate-bounce text-violet-600 dark:text-violet-400" />
        </div>
      </section>
    </div>

      {/* ── ASYMMETRIC OPERATIONAL COCKPIT (8 COLS / 4 COLS) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 pt-10 border-t border-slate-200/60 dark:border-white/5">

        {/* ── LEFT 8 COLS: ACTIVE OPERATIONS & TELEMETRY MATRIX ─────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Quick Command Rail */}
          <div className="bg-white dark:bg-[#151921] border border-slate-200/90 dark:border-[#262a33] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
              <Sparkles size={14} className="text-violet-600 dark:text-violet-400" />
              <span>Operational Launchpad:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate('/admin/tests/active')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#151921] hover:bg-slate-100 dark:hover:bg-violet-950/40 border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Layers size={13} className="text-violet-600 dark:text-violet-400" />
                <span>Active Tests</span>
              </button>

              <button
                onClick={() => navigate('/admin/questions')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#151921] hover:bg-slate-100 dark:hover:bg-violet-950/40 border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Database size={13} className="text-violet-600 dark:text-violet-400" />
                <span>Question Bank</span>
              </button>

              <button
                onClick={() => navigate('/admin/students')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#151921] hover:bg-slate-100 dark:hover:bg-violet-950/40 border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Users size={13} className="text-violet-600 dark:text-violet-400" />
                <span>Candidates</span>
              </button>

              <button
                onClick={() => navigate('/admin/tests/history')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#151921] hover:bg-slate-100 dark:hover:bg-violet-950/40 border-2 border-slate-300 dark:border-white/20 hover:border-violet-500 dark:hover:border-violet-400 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Archive size={13} className="text-violet-600 dark:text-violet-400" />
                <span>History Archive</span>
              </button>
            </div>
          </div>

          {/* Active Assessments Table */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  Recent Active Assessments
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Live cohort tracking with real-time submission counts
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/tests/active')}
                className="px-3 py-1.5 rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50/50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:border-violet-300 dark:hover:border-violet-700 hover:-translate-y-0.5 hover:shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>View all active</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#151921] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2 w-full max-w-md">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-3 w-48 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-9 w-20 rounded-lg" />
                      <Skeleton className="h-9 w-20 rounded-lg" />
                    </div>
                  </div>
                ))
              ) : recentTests.length === 0 ? (
                <div className="bg-white dark:bg-[#151921] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-8 text-center space-y-3">
                  <FileText size={28} className="mx-auto text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Active Assessments Found</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Create your first practice test or main exam module to view active cohort telemetry.
                  </p>
                  <button
                    onClick={() => navigate('/admin/tests/create')}
                    className="px-4 py-2 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Create Assessment</span>
                  </button>
                </div>
              ) : (
                recentTests.map((test) => {
                  const isMain = (test.testType || test.type || '').toUpperCase() === 'MAIN';
                  const sittings = testSittings[test.id];

                  return (
                    <div
                      key={test.id}
                      className="bg-white dark:bg-[#151921] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {isMain ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
                              <ShieldCheck size={11} />
                              Main Exam
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/40">
                              <Zap size={11} />
                              Practice Test
                            </span>
                          )}
                          <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1f232b] px-2 py-0.5 rounded-md">
                            {test.category || 'General'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            ID: #{test.id}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#090d16] dark:text-slate-100 truncate">
                          {test.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            <span>{test.durationMinutes || 60}m</span>
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Layers size={12} className="text-slate-400" />
                            <span>{test.questionCount || 0} questions</span>
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Activity size={12} className="text-indigo-500" />
                            {isMain ? (
                              sittings !== undefined ? `${sittings} sittings submitted` : 'Syncing sittings...'
                            ) : (
                              'Self-paced practice test'
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#222630]">
                        {isMain ? (
                          <>
                            <button
                              onClick={() => navigate(`/admin/tests/${test.id}/analytics`)}
                              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 border-2 border-violet-300 dark:border-violet-700/80 hover:border-violet-400 dark:hover:border-violet-500 hover:-translate-y-0.5 hover:shadow-md text-violet-700 dark:text-violet-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                              title="View exam telemetry"
                            >
                              <BarChart3 size={14} />
                              <span>Analytics</span>
                            </button>

                            <button
                              onClick={() => navigate(`/admin/tests/${test.id}/leaderboard`)}
                              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-white dark:bg-[#151921] hover:bg-slate-100 dark:hover:bg-[#1a1d24] border-2 border-slate-300 dark:border-white/20 hover:border-violet-400 dark:hover:border-violet-500 hover:-translate-y-0.5 hover:shadow-md text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                              title="View class standings"
                            >
                              <Trophy size={14} className="text-amber-500" />
                              <span>Standings</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => navigate(`/admin/tests/${test.id}/questions`)}
                              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 border-2 border-violet-300 dark:border-violet-700/80 hover:border-violet-400 dark:hover:border-violet-500 hover:-translate-y-0.5 hover:shadow-md text-violet-700 dark:text-violet-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                              title="Curate drill questions"
                            >
                              <FileText size={14} className="text-violet-600 dark:text-violet-400" />
                              <span>Questions</span>
                            </button>

                            <button
                              onClick={() => navigate(`/admin/tests/edit/${test.id}`)}
                              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-white dark:bg-[#151921] hover:bg-slate-100 dark:hover:bg-[#1a1d24] border-2 border-slate-300 dark:border-white/20 hover:border-violet-400 dark:hover:border-violet-500 hover:-translate-y-0.5 hover:shadow-md text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                              title="Configure drill"
                            >
                              <Activity size={14} className="text-violet-600 dark:text-violet-400" />
                              <span>Configure</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT 4 COLS: REPOSITORY HEALTH & COHORT DOCK ─────────────────── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Question Repository Inventory Health */}
          <div className="bg-white dark:bg-[#151921] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#20242c]">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Question Repository Health
                </h3>
              </div>
              <button
                onClick={() => navigate('/admin/questions')}
                className="px-3 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/60 border-2 border-violet-300 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98]"
              >
                <span>Curate</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Catalogued:</span>
              <span className="text-2xl font-mono font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {dashboardStats.questionCount} Qs
              </span>
            </div>

            {/* Micro-Progress Bars for Disciplines vs 50Q Exam Quota */}
            <div className="space-y-3 pt-1">
              {CATEGORIES.map(cat => {
                const count = categoryCounts[cat.toUpperCase()] ?? 0;
                const isReady = count >= 50;
                const percent = Math.min(100, Math.round((count / 50) * 100));

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cat}</span>
                      <span className={isReady ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                        {count}/50 {isReady ? '✓ Ready' : `(-${50 - count})`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#111317] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isReady ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-[#20242c] text-[11px] text-slate-500 dark:text-slate-400">
              Main exams strictly require <strong>50 questions</strong> per subject repository.
            </div>
          </div>

          {/* Enrolled Candidate Cohort Card */}
          <div className="bg-white dark:bg-[#151921] rounded-2xl border border-slate-200/90 dark:border-[#262a33] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#20242c]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Candidate Roster Health
                </h3>
              </div>
              <button
                onClick={() => navigate('/admin/students')}
                className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-300 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98]"
              >
                <span>Directory</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Enrolled Candidates:</span>
              <span className="text-2xl font-mono font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {dashboardStats.studentCount}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Active candidates registered with authorized institutional credentials. Individual exam transcripts and sitting verifications are logged in the student directory.
            </p>

            <button
              onClick={() => navigate('/admin/students')}
              className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-white dark:bg-[#151921] hover:bg-slate-100 dark:hover:bg-[#1f2533] border border-slate-300/90 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:-translate-y-0.5 hover:shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Inspect Candidate Directory</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
