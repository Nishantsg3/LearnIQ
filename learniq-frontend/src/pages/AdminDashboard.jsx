import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Database,
  Users,
  FileText,
  BarChart3,
  Zap,
  Loader2,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import api from '../utils/api';
import AdminProfileModal from '../components/AdminProfileModal';

const THEME = '#7c3aed';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalAssessments: 0,
    practiceTests: 0,
    mainTests: 0,
    studentCount: 0,
    questionCount: 0
  });

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/admin/stats');
      if (res.data) {
        setDashboardStats({
          totalAssessments: res.data.totalAssessments || 0,
          practiceTests: res.data.practiceTests || 0,
          mainTests: res.data.mainTests || 0,
          studentCount: res.data.studentCount || 0,
          questionCount: res.data.questionCount || 0
        });
      }
    } catch (err) {
      console.error('[AdminDashboard] Fetch error:', err);
      if (!isSilent) toast.error('Infrastructure sync failed.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const navCards = useMemo(() => [
    {
      label: 'Total Assessments',
      value: dashboardStats.totalAssessments || 0,
      icon: <FileText size={22} />,
      accent: '#a78bfa',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.15)',
      path: '/admin/tests/active?type=all',
      description: 'All registered tests'
    },
    {
      label: 'Practice Tests',
      value: dashboardStats.practiceTests || 0,
      icon: <Zap size={22} />,
      accent: '#34d399',
      bg: 'rgba(52,211,153,0.08)',
      border: 'rgba(52,211,153,0.15)',
      path: '/admin/tests/active?type=practice',
      description: 'Active practice sessions'
    },
    {
      label: 'Main Tests',
      value: dashboardStats.mainTests || 0,
      icon: <BarChart3 size={22} />,
      accent: '#fbbf24',
      bg: 'rgba(251,191,36,0.08)',
      border: 'rgba(251,191,36,0.15)',
      path: '/admin/tests/active?type=main',
      description: 'Scheduled assessments'
    },
    {
      label: 'Student Registry',
      value: dashboardStats.studentCount || 0,
      icon: <Users size={22} />,
      accent: '#60a5fa',
      bg: 'rgba(96,165,250,0.08)',
      border: 'rgba(96,165,250,0.15)',
      path: '/admin/students',
      description: 'Enrolled learners'
    },
    {
      label: 'Question Bank',
      value: dashboardStats.questionCount || 0,
      icon: <Database size={22} />,
      accent: '#c084fc',
      bg: 'rgba(192,132,252,0.08)',
      border: 'rgba(192,132,252,0.15)',
      path: '/admin/questions',
      description: 'Available questions'
    },
    {
      label: 'Analytics',
      value: 'Live',
      icon: <TrendingUp size={22} />,
      accent: '#fb7185',
      bg: 'rgba(251,113,133,0.08)',
      border: 'rgba(251,113,133,0.15)',
      path: '/admin/analytics',
      description: 'Real-time insights'
    }
  ], [dashboardStats]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <Loader2 size={36} className="text-[#7c3aed] animate-spin" />
      <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Synchronizing systems...
      </p>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pr-1 sm:pr-2 custom-scrollbar p-3 sm:p-6 lg:p-8">
      <div className="animate-in fade-in duration-700 flex flex-col">
        {/* Page Header - Apple Typography & Alignment */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              System Overview
            </h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm font-normal tracking-normal ml-4">
            Governance, analytics telemetry, and test inventory control.
          </p>
        </div>

        {/* Stats Grid - Apple Widget Rhythm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 flex-1 min-h-0">
          {navCards.map((card) => (
            <StatCard key={card.label} card={card} onClick={() => navigate(card.path)} />
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ card, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="apple-card group text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] active:scale-[0.98] transition-[transform,box-shadow,border-color,background-color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-2xl relative overflow-hidden flex flex-col justify-between"
      style={{
        background: hovered ? '#151520' : '#0f0f15',
        border: `1px solid ${hovered ? card.accent + '40' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 18,
        padding: '24px',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? `inset 0 1px 0 0 rgba(255,255,255,0.12), 0 16px 36px -8px rgba(0,0,0,0.55)`
          : `inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 24px -4px rgba(0,0,0,0.35)`,
        minHeight: 165
      }}
    >
      {/* Subtle top accent glow on hover */}
      <div
        className="absolute top-0 left-6 right-6 h-px transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)`,
          opacity: hovered ? 0.6 : 0
        }}
      />

      {/* Top row: Squircle Icon Well + Arrow */}
      <div className="flex items-center justify-between w-full mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: hovered ? `${card.accent}25` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${hovered ? card.accent + '40' : 'rgba(255,255,255,0.08)'}`,
            color: hovered ? card.accent : 'rgba(255,255,255,0.85)',
            boxShadow: hovered ? `0 0 16px ${card.accent}30` : 'none'
          }}
        >
          {React.cloneElement(card.icon, { size: 20 })}
        </div>

        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] group-hover:border-white/20 transition-all shrink-0">
          <ArrowUpRight
            size={14}
            className="text-white/40 group-hover:text-white transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
      </div>

      {/* Middle: Metric Value + Label */}
      <div className="w-full">
        <p className="text-[11px] font-medium text-white/55 uppercase tracking-wider mb-1">
          {card.label}
        </p>

        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none">
            {card.value}
          </span>
        </div>

        <p className="text-xs text-white/65 font-normal tracking-normal transition-colors group-hover:text-white/85">
          {card.description}
        </p>
      </div>
    </button>
  );
};

export default AdminDashboard;
