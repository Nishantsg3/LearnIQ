import React from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  History,
  LogOut,
  Database,
  Zap,
  Plus,
  Users,
  Award,
  FileText,
  TrendingUp,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Activity,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

/**
 * Architectural Full-Height macOS/VisionOS Dock Sidebar
 *
 * - Full-height edge-docked architectural layout (seamless, no floating gaps).
 * - Strict domain-driven theme tokens (Admin: Royal Violet / Student: Royal Amethyst).
 * - Tactile Apple-motion spring dynamics (`active:scale-[0.97]`).
 * - High-contrast active indicators with backlight glow.
 */
const Sidebar = ({ onProfileClick, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN' || location.pathname.startsWith('/admin');

  const navSections = isAdmin ? [
    {
      title: 'OPERATIONAL COMMAND',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', sublabel: 'Telemetry & metrics', icon: <LayoutDashboard size={16}/> },
        { name: 'Active Tests', path: '/admin/tests/active', sublabel: 'In-flight assessments', icon: <FileText size={16}/> },
        { name: 'Create Test', path: '/admin/tests/create', sublabel: 'Assessment builder', icon: <Plus size={16}/> },
        { name: 'History Archive', path: '/admin/tests/history', sublabel: 'Historical attempt ledger', icon: <History size={16}/> },
      ]
    },
    {
      title: 'INSTITUTIONAL GOVERNANCE',
      items: [
        { name: 'Question Bank', path: '/admin/questions', sublabel: 'Curated item repository', icon: <Database size={16}/> },
        { name: 'Cohort Leaderboard', path: '/admin/leaderboard', sublabel: 'Merit & percentile matrix', icon: <Award size={16}/> },
        { name: 'Candidate Roster', path: '/admin/students', sublabel: 'Directory & permissions', icon: <Users size={16}/> },
      ]
    }
  ] : [
    {
      title: 'EXAMINATION SUITE',
      items: [
        { name: 'Practice Drills', path: '/student/section1', sublabel: 'Formative self-paced tests', icon: <Zap size={16}/> },
        { name: 'Main Examinations', path: '/student/section2', sublabel: 'Proctored official tests', icon: <FileText size={16}/> },
      ]
    },
    {
      title: 'DIAGNOSTICS & TELEMETRY',
      items: [
        { name: 'Student Cockpit', path: '/student/dashboard', sublabel: 'Performance overview & metrics', icon: <LayoutDashboard size={16}/> },
        { name: 'Historical Results', path: '/student/results', sublabel: 'Diagnostic exam logs', icon: <History size={16}/> },
        { name: 'Mastery Progress', path: '/student/progress', sublabel: 'Skill acquisition curves', icon: <TrendingUp size={16}/> },
      ]
    }
  ];

  const checkActive = (item) => {
    const currentPath = location.pathname;
    if (isAdmin) {
      if (item.name === 'Dashboard') return currentPath === '/admin/dashboard' || currentPath === '/admin-dashboard';
      if (item.name === 'Active Tests') {
        return (
          currentPath === '/admin/tests/active' ||
          currentPath === '/admin/tests' ||
          currentPath.startsWith('/admin/tests/edit') ||
          (currentPath.includes('/admin/tests/') && (currentPath.includes('/questions') || currentPath.includes('/analytics')))
        );
      }
      if (item.name === 'Create Test') return currentPath === '/admin/tests/create';
      if (item.name === 'History Archive' || item.name === 'History') return currentPath === '/admin/tests/history';
      if (item.name === 'Question Bank') return currentPath === '/admin/questions' || currentPath.startsWith('/admin/questions/');
      if (item.name === 'Cohort Leaderboard' || item.name === 'Leaderboard') return currentPath.includes('leaderboard') || currentPath === '/admin/analytics';
      if (item.name === 'Candidate Roster' || item.name === 'Students') return currentPath === '/admin/students' || currentPath.startsWith('/admin/students/');
    } else {
      if (item.name === 'Practice Drills') return currentPath === '/student/section1' || currentPath.includes('/section1');
      if (item.name === 'Main Examinations') return currentPath === '/student/section2' || currentPath.includes('/section2');
      if (item.name === 'Student Cockpit') return currentPath === '/student/dashboard' || currentPath === '/student-dashboard';
      if (item.name === 'Historical Results') return currentPath === '/student/results' || currentPath.startsWith('/student/results/');
      if (item.name === 'Mastery Progress') return currentPath === '/student/progress';
    }
    return currentPath === item.path;
  };

  const studentDisplayName = (() => {
    const raw = (user?.fullName || user?.name || '').trim();
    if (!raw || raw.toLowerCase() === 'student' || user?.email === 'student1@learniq.com' || user?.email?.startsWith('student1')) {
      return 'Student One';
    }
    return raw;
  })();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Full-Height Monolithic Dock Sidebar */}
      <aside
        id="navigation-sidebar"
        aria-label="Sidebar navigation"
        className={`
          fixed top-0 bottom-0 left-0 z-40 w-[260px] h-screen h-[100dvh] max-h-[100dvh]
          bg-white/85 dark:bg-[#0c0f17]/90 backdrop-blur-3xl
          border-r border-slate-200/80 dark:border-white/[0.08]
          flex flex-col justify-between
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          shadow-[4px_0_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_30px_-4px_rgba(0,0,0,0.5)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ── 1. BRAND MASTHEAD & TELEMETRY ──────────────────────────── */}
        <div className="p-4 border-b border-slate-200/70 dark:border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between">
            <BrandLogo
              size="md"
              variant="wordmark"
              subtitle={isAdmin ? 'Faculty Command' : 'Academic Portal'}
              linkTo={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
              onClick={onClose}
            />

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation sidebar"
              className="lg:hidden min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Status Capsule */}
          <div className="mt-3 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isAdmin ? 'TELEMETRY NOMINAL' : 'SESSION VERIFIED'}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-md font-bold tracking-wider ${
              isAdmin
                ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/25'
                : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25'
            }`}>
              {isAdmin ? 'SYS_ADMIN' : 'CANDIDATE'}
            </span>
          </div>
        </div>

        {/* ── 2. RESTRUCTURED NAVIGATION DECK ──────────────────────────── */}
        <nav
          aria-label={isAdmin ? 'Administrative Operations' : 'Scholar Curriculum'}
          className="flex-1 px-3 py-3 space-y-4 overflow-y-auto no-scrollbar"
        >
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-2.5 py-0.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {section.title}
                </span>
              </div>

              {section.items.map((item) => {
                const isActive = checkActive(item);
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                    className={`
                      flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 group relative active:scale-[0.97] ease-[cubic-bezier(0.16,1,0.3,1)]
                      focus-visible:outline-none focus-visible:ring-2 ${isAdmin ? 'focus-visible:ring-violet-500' : 'focus-visible:ring-indigo-500'} focus-visible:ring-offset-2
                      ${isActive
                        ? (isAdmin
                            ? 'bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 text-white shadow-[0_6px_20px_-3px_rgba(124,58,237,0.45)] border border-violet-400/40 font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-white before:rounded-r-full before:shadow-[0_0_10px_rgba(255,255,255,0.9)]'
                            : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 text-white shadow-[0_6px_20px_-3px_rgba(99,102,241,0.45)] border border-indigo-400/40 font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-white before:rounded-r-full before:shadow-[0_0_10px_rgba(255,255,255,0.9)]'
                          )
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] hover:translate-x-1 border border-transparent'
                      }
                    `}
                  >
                    {/* Icon container */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-115 group-hover:rotate-[-6deg] ${
                      isActive
                        ? 'bg-white/20 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}>
                      {React.cloneElement(item.icon, { size: 15, 'aria-hidden': 'true' })}
                    </div>

                    {/* Nav Title & Subtitle */}
                    <div className="flex-1 min-w-0 flex flex-col text-left">
                      <span className={`text-xs truncate tracking-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                        {item.name}
                      </span>
                      <span className={`text-[10px] font-mono truncate ${isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.sublabel}
                      </span>
                    </div>

                    {/* Right Chevron */}
                    <ChevronRight
                      size={13}
                      className={`shrink-0 transition-all duration-200 ${
                        isActive
                          ? 'text-white/90 translate-x-0'
                          : 'text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                      }`}
                    />
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Quick Action Capsule */}
          <div className="pt-2 px-1">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  navigate('/admin/tests/create');
                  if (window.innerWidth < 1024) onClose();
                }}
                className="apple-shimmer-btn w-full py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/25 active:scale-[0.96] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 border border-violet-400/20"
              >
                <Plus size={14} />
                <span>Create Assessment</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  navigate('/student/section1');
                  if (window.innerWidth < 1024) onClose();
                }}
                className="apple-shimmer-btn w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 active:scale-[0.96] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 border border-indigo-400/20"
              >
                <Zap size={14} />
                <span>Launch Practice Drill</span>
              </button>
            )}
          </div>
        </nav>

        {/* ── 3. USER PROFILE FOOTER DOCK ──────────────────────────────── */}
        <div className="p-3 border-t border-slate-300/80 dark:border-white/10 shrink-0 bg-slate-50/80 dark:bg-[#0c0f17]/80 backdrop-blur-md">
          <div className={`relative flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white dark:bg-[#151922] backdrop-blur-xl border border-slate-300 dark:border-white/15 shadow-xs hover:shadow-md transition-all duration-200 ${
            isAdmin ? 'hover:border-violet-500/60 dark:hover:border-violet-400/60' : 'hover:border-indigo-500/60 dark:hover:border-indigo-400/60'
          }`}>
            <button
              type="button"
              onClick={onProfileClick}
              className={`min-h-[38px] flex items-center gap-2.5 min-w-0 flex-1 text-left group active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 ${
                isAdmin ? 'focus-visible:ring-violet-600' : 'focus-visible:ring-indigo-600'
              } cursor-pointer`}
              title="View Profile"
              aria-label="View profile"
            >
              <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 font-mono font-bold text-xs shadow-2xs border ${
                isAdmin
                  ? 'bg-violet-100 dark:bg-violet-950/70 border-violet-300 dark:border-violet-800/80 text-violet-800 dark:text-violet-300 group-hover:scale-105'
                  : 'bg-indigo-100 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800/80 text-indigo-800 dark:text-indigo-300 group-hover:scale-105'
              } transition-transform duration-200`} aria-hidden="true">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : (isAdmin ? 'A' : 'S')}</span>
                )}
                <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white dark:border-[#151922]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight ${
                  isAdmin ? 'group-hover:text-violet-600 dark:group-hover:text-violet-400' : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                } transition-colors`}>
                  {isAdmin ? (user?.name || 'Administrator') : studentDisplayName}
                </p>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user?.email || (isAdmin ? 'admin@learniq.com' : 'student1@learniq.com')}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={logout}
              className="min-w-[34px] min-h-[34px] rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-[0.92] transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
