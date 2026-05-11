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
            const endTime = startTime ? new Date(startTime.getTime() + duration * 60000) : null;

            if (startTime && now < startTime) {
              s++;
            } else if (startTime && now >= startTime && now <= endTime) {
              lm++;
            } else if (status === 'ACTIVE' || status === 'LIVE') {
              lm++;
            }
          }
        });

        setCounts({ practice: p, liveMain: lm, scheduled: s });
      } catch (err) {
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
      <div className="mb-6 sm:mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="w-1 h-5 bg-[#7c3aed] rounded-full" />
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Welcome back, <span className="text-[#7c3aed]">{user?.name?.split(' ')[0] || 'Scholar'}</span>
          </h1>
          <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">Secure Portal</span>
          </div>
        </div>
        <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] ml-4">
           Candidate Dashboard | Select module to begin
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
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#161622' : '#0d0d12',
        border: `1px solid ${hovered ? card.accent + '30' : 'rgba(255,255,255,0.03)'}`,
        borderRadius: 12,
        padding: 'clamp(20px, 4vw, 32px)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 20px 40px rgba(0,0,0,0.4)` : 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 'clamp(120px, 25vw, 200px)'
      }}
    >
      {/* Large Background Icon (Same as Admin) */}
      <div style={{
        position: 'absolute',
        right: '10%',
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: hovered ? 0.12 : 0.04,
        color: hovered ? card.accent : '#fff',
        transition: 'all 0.5s ease',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        {React.cloneElement(card.icon, { size: window.innerWidth < 640 ? 80 : 140 })}
      </div>

      {/* Subtle top accent glow (Same as Admin) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: 1,
        background: hovered ? `linear-gradient(90deg, transparent, ${card.accent}, transparent)` : 'transparent',
        transition: 'all 0.3s ease',
      }} />

      {/* Content Container */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Icon + Arrow row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: window.innerWidth < 640 ? 12 : 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: hovered ? `${card.accent}20` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${hovered ? card.accent + '40' : 'rgba(255,255,255,0.05)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hovered ? card.accent : '#666',
              transition: 'all 0.3s ease'
            }}>
              {React.cloneElement(card.icon, { size: window.innerWidth < 640 ? 18 : 22 })}
            </div>
            {card.badge && (
              <div style={{
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: `1px solid ${(card.badgeColor || card.accent)}30`,
                boxShadow: `0 4px 15px rgba(0,0,0,0.4)`
              }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="absolute w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: `${(card.badgeColor || card.accent)}40` }} />
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: (card.badgeColor || card.accent) }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ 
                    color: '#fff', 
                    fontSize: 11, 
                    fontWeight: 900, 
                    letterSpacing: '-0.02em'
                    }}>
                    {card.badge.split(' ')[0]}
                    </span>
                    <span style={{ 
                    color: (card.badgeColor || card.accent), 
                    fontSize: 8, 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em',
                    opacity: 0.8
                    }}>
                    {card.badge.split(' ')[1]}
                    </span>
                </div>
              </div>
            )}
          </div>
          <ArrowUpRight
            size={20}
            style={{
              color: hovered ? card.accent : '#333',
              opacity: hovered ? 1 : 0.3,
              transition: 'all 0.3s',
            }}
          />
        </div>

        {/* Label */}
        <p style={{
          color: '#555',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          {card.label}
        </p>

        {/* Value/Title */}
        <h3 style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase'
        }}>
            {card.description}
        </h3>
      </div>
    </div>
  );
};

export default StudentDashboard;
