import { useNavigate } from 'react-router-dom';
import {
  Zap,
  FileText,
  History,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const THEME = '#7c3aed';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [counts, setCounts] = useState({ practice: 0, liveMain: 0, scheduled: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await api.get('/tests/counts');
        if (res.data && typeof res.data.practice === 'number') {
          setCounts({
            practice: res.data.practice,
            liveMain: res.data.liveMain,
            scheduled: res.data.scheduled
          });
          return;
        }
      } catch {
        // Fallback to legacy calculation if /tests/counts is not yet reached
      }

      try {
        const res = await api.get('/tests');
        const tests = Array.isArray(res.data) ? res.data : [];
        const now = new Date();

        let p = 0;
        let lm = 0;
        let s = 0;

        tests.forEach(t => {
          const type = (t.testType || t.type || '').toUpperCase();
          const status = (t.status || '').toUpperCase();
          if (status === 'ARCHIVED') return;

          if (type === 'PRACTICE' && (status === 'ACTIVE' || status === 'LIVE')) {
            p++;
          } else if (type === 'MAIN') {
            const startTime = t.startTime ? new Date(t.startTime) : null;
            const duration = t.durationMinutes || t.duration || 60;
            const endTime = startTime ? new Date(startTime.getTime() + duration * 60000) : (t.endTime ? new Date(t.endTime) : null);

            if (startTime && now < startTime) {
              s++;
            } else if (startTime && now >= startTime && (!endTime || now <= endTime)) {
              lm++;
            } else if ((status === 'ACTIVE' || status === 'LIVE') && (!endTime || now <= endTime)) {
              lm++;
            }
          }
        });

        setCounts({ practice: p, liveMain: lm, scheduled: s });
      } catch {
        console.error('Failed to fetch counts');
      }
    };
    fetchCounts();
  }, []);

  const navCards = [
    {
      label: 'Section 1',
      description: 'Practice & Skill Clusters',
      icon: <Zap size={22} />,
      accent: '#10b981', // Emerald
      path: '/student/section1',
      badge: counts.practice > 0 ? `${counts.practice} Live` : null
    },
    {
      label: 'Section 2',
      description: 'Advanced Logical Reasoning',
      icon: <FileText size={22} />,
      accent: '#f43f5e', // Rose/Red
      path: '/student/section2',
      badge: counts.liveMain > 0 ? `${counts.liveMain} Live` : (counts.scheduled > 0 ? `${counts.scheduled} Scheduled` : null),
      badgeColor: counts.liveMain > 0 ? '#f43f5e' : '#f59e0b' // Red for live, Orange for scheduled
    },
    {
      label: 'Results',
      description: 'Personal Performance Ledger',
      icon: <History size={22} />,
      accent: '#a78bfa', // Violet
      path: '/student/results'
    },
    {
      label: 'Progress',
      description: 'Real-time Telemetry Analytics',
      icon: <TrendingUp size={22} />,
      accent: '#60a5fa', // Blue
      path: '/student/progress'
    }
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-700 p-4 sm:p-6 lg:p-8 flex flex-col">

      {/* HEADER */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-violet-400">{user?.name?.split(' ')[0] || 'Scholar'}</span>
          </h1>
          <div className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full flex items-center gap-2 backdrop-blur-md">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
             <span className="text-[9px] font-medium text-white/70 tracking-wider uppercase">Portal Active</span>
          </div>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm font-normal tracking-normal ml-4">
           Select an assessment module below to continue your learning journey.
        </p>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
        {navCards.map((card) => (
          <StatCard key={card.label} card={card} onClick={() => navigate(card.path)} />
        ))}
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
        boxShadow: hovered
          ? `inset 0 1px 0 0 rgba(255,255,255,0.12), 0 16px 36px -8px rgba(0,0,0,0.55)`
          : `inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 24px -4px rgba(0,0,0,0.35)`,
        padding: 'clamp(20px, 3.5vw, 28px)',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        minHeight: 'clamp(140px, 22vw, 190px)'
      }}
    >
      {/* Subtle top accent sheen on hover */}
      <div
        className="absolute top-0 left-8 right-8 h-px transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)`,
          opacity: hovered ? 0.6 : 0
        }}
      />

      {/* Top Row: Icon Well + Live Pill + Arrow Indicator */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-3">
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

          {card.badge && (
            <div
              className="px-2.5 py-1 rounded-full flex items-center gap-2 backdrop-blur-md transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${(card.badgeColor || card.accent)}35`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: (card.badgeColor || card.accent), boxShadow: `0 0 6px ${(card.badgeColor || card.accent)}` }} />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-white tracking-tight">
                  {card.badge.split(' ')[0]}
                </span>
                <span className="text-[9px] font-medium uppercase tracking-wider opacity-80" style={{ color: (card.badgeColor || card.accent) }}>
                  {card.badge.split(' ')[1]}
                </span>
              </div>
            </div>
          )}
        </div>

        <ArrowUpRight
          size={18}
          className="text-white/40 group-hover:text-white transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>

      {/* Bottom Content: Typographic Hierarchy */}
      <div className="w-full">
        <p className="text-[11px] font-medium text-white/55 uppercase tracking-wider mb-1">
          {card.label}
        </p>
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
          {card.description}
        </h3>
      </div>
    </button>
  );
};

export default StudentDashboard;
