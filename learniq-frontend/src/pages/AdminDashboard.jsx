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
import { useAuth } from '../context/AuthContext';
import AdminProfileModal from '../components/AdminProfileModal';

const THEME = '#7c3aed';

const AdminDashboard = () => {
  const { user } = useAuth();
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
      const [testsRes, questionsRes, studentsRes] = await Promise.all([
        api.get('/admin/tests'),
        api.get('/questions/bank'),
        api.get('/admin/students')
      ]);

      const tests = Array.isArray(testsRes.data) ? testsRes.data : [];
      const questions = Array.isArray(questionsRes.data) ? questionsRes.data : [];
      const students = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      
      const now = new Date();
      // Strict filtering: Synchronized with the 'ARCHIVED' status and time window
      const activeTests = tests.filter(t => {
        const type = (t.testType || t.type || '').toUpperCase();
        const status = (t.status || '').toUpperCase();
        if (status === 'ARCHIVED') return false;
        
        if (type === 'MAIN') {
           const startTime = t.startTime ? new Date(t.startTime) : null;
           const duration = t.durationMinutes || t.duration || 60;
           const endTime = startTime ? new Date(startTime.getTime() + duration * 60000) : (t.endTime ? new Date(t.endTime) : null);
           if (endTime && now > endTime) return false;
        }
        return status === 'ACTIVE' || status === 'LIVE' || status === 'SCHEDULED';
      });
      const practiceTests = activeTests.filter(t => (t.testType || t.type)?.toUpperCase() === "PRACTICE");
      const mainTests = activeTests.filter(t => (t.testType || t.type)?.toUpperCase() === "MAIN");

      setDashboardStats({
        totalAssessments: activeTests.length,
        practiceTests: practiceTests.length,
        mainTests: mainTests.length,
        studentCount: students.length,
        questionCount: questions.length
      });
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
      <Loader2 size={36} style={{ color: THEME, animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#555', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Synchronizing systems...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pr-1 sm:pr-2 custom-scrollbar p-3 sm:p-6 lg:p-8">
      <div className="animate-in fade-in duration-700 flex flex-col">
        {/* Page Header - More Compact */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 22, background: THEME, borderRadius: 4 }} />
            <h1 style={{
              color: '#fff',
              fontWeight: 900,
              fontSize: 'clamp(16px, 4vw, 22px)',
              letterSpacing: '-0.02em',
              margin: 0,
              textTransform: 'uppercase',
            }}>
              System Overview
            </h1>
          </div>
          <p style={{
            color: '#444',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginLeft: 14,
          }}>
            Governance & Resource Control
          </p>
        </div>

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 min-h-0">
          {navCards.map((card) => (
            <StatCard key={card.label} card={card} onClick={() => navigate(card.path)} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
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
        borderRadius: 20,
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 15px 35px rgba(0,0,0,0.4)` : 'none',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      {/* Large Background Icon (Lits up on hover - No tilt/scale) */}
      <div style={{
        position: 'absolute',
        right: '15%',
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: hovered ? 0.12 : 0.04,
        color: hovered ? card.accent : '#fff',
        transition: 'all 0.5s ease',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        {React.cloneElement(card.icon, { size: 120 })}
      </div>

      {/* Subtle top accent glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: 2,
        background: hovered ? `linear-gradient(90deg, transparent, ${card.accent}, transparent)` : 'transparent',
        transition: 'all 0.3s ease',
      }} />

      {/* Content Container */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Icon + Arrow row */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: hovered ? `${card.accent}20` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${hovered ? card.accent + '40' : 'rgba(255,255,255,0.05)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: hovered ? card.accent : '#444',
            transition: 'all 0.3s',
          }}>
            {React.cloneElement(card.icon, { size: 18 })}
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/5 group-hover:border-violet-500/30 transition-all shrink-0">
            <ArrowUpRight
              size={14}
              style={{
                color: hovered ? card.accent : '#333',
                opacity: hovered ? 1 : 0.3,
                transition: 'all 0.3s',
              }}
            />
          </div>
        </div>

        {/* Label */}
        <p style={{
          color: '#555',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          {card.label}
        </p>

        {/* Value */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            color: '#fff',
            fontSize: 34,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}>
            {card.value}
          </span>
        </div>

        {/* Description */}
        <p style={{
          color: hovered ? '#888' : '#333',
          fontSize: 10,
          fontWeight: 700,
          marginTop: 8,
          letterSpacing: '0.05em',
          transition: 'all 0.3s',
        }}>
          {card.description}
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
