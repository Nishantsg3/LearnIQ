import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import { LogOut, UserCircle, Menu, Clock, Radio, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import BrandLogo from './BrandLogo';
import BackgroundAbstractFluid from './backgrounds/BackgroundAbstractFluid';

/**
 * MainLayout: Apple macOS Sonoma / VisionOS Desktop Command Shell
 *
 * - Full-height edge-docked sidebar (`w-[260px]`).
 * - Seamless edge-to-edge frosted glass top masthead with integrated 12-hour RTC clock,
 *   live system telemetry status, domain-strict breadcrumbs, and segmented theme toggle.
 * - Hardware-accelerated fluid background integration without awkward floating gaps.
 */
const MainLayout = ({ children, onProfileClick }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isAdmin = user?.role === 'ADMIN' || location.pathname.startsWith('/admin');

  // Real-time 12-Hour AM/PM Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-close sidebar on window resize if moving to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation: Close mobile sidebar with Escape key (WCAG 2.1.1 & 2.1.2)
  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsSidebarOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Page Title from Pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('admin-dashboard') || path.includes('/admin/dashboard')) return 'Dashboard';
    if (path.includes('student-dashboard') || path.includes('/student/dashboard')) return 'Dashboard';
    if (path.includes('students')) return 'Candidate Roster';
    if (path.includes('tests/history')) return 'History Archive';
    if (path.includes('tests/create')) return 'Create Assessment';
    if (path.includes('section1')) return 'Practice Drills';
    if (path.includes('section2')) return 'Main Examinations';
    if (path.includes('tests/active')) return 'Active Tests';
    if (path.includes('tests')) return 'Manage Tests';
    if (path.includes('questions') || path.includes('bank')) return 'Question Bank';
    if (path.includes('results')) return 'Historical Results';
    if (path.includes('progress')) return 'Mastery Progress';
    if (path.includes('leaderboard')) return 'Cohort Leaderboard';
    return 'LearnIQ';
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(currentTime);

  const studentDisplayName = user?.fullName || (user?.email?.startsWith('student1') ? 'Student One' : (user?.name || 'Student'));

  return (
    <div className="main-layout relative h-screen h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#FBF9F5] dark:bg-[#0c0f17] text-[#090d16] dark:text-slate-100 font-sans transition-colors duration-200 flex">
      {/* ── GLOBAL ARTISTIC BACKGROUND (DIRECTION 8) ─────────────────────────── */}
      <BackgroundAbstractFluid />

      {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-violet-700 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 font-semibold text-xs tracking-wide transition-all"
      >
        Skip to main content
      </a>

      {/* Monolithic Dock Sidebar */}
      <Sidebar
        onProfileClick={onProfileClick}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          menuButtonRef.current?.focus();
        }}
      />

      {/* Main Content Viewport */}
      <main
        id="main-content"
        tabIndex="-1"
        className="main-content relative z-10 flex-1 flex flex-col transition-all duration-300 lg:ml-[260px] bg-transparent h-screen h-[100dvh] max-h-[100dvh] min-w-0 overflow-hidden focus:outline-none"
      >
        {/* ── SEAMLESS TOP MASTHEAD (Apple Sonoma Style) ──────────────── */}
        <header
          role="banner"
          className="shrink-0 z-30 h-14 sm:h-16 px-3.5 sm:px-6 lg:px-8 bg-white/70 dark:bg-[#0c0f17]/75 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between transition-colors shadow-2xs"
        >
          {/* Left: Mobile Toggle & Hierarchical Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 mr-2">
            <button
              type="button"
              ref={menuButtonRef}
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              aria-expanded={isSidebarOpen}
              aria-controls="navigation-sidebar"
              className={`lg:hidden min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 ${
                isAdmin ? 'focus-visible:ring-violet-500' : 'focus-visible:ring-indigo-600'
              } cursor-pointer`}
            >
              <Menu size={18} aria-hidden="true" />
            </button>

            {/* Mobile Brand Mark */}
            <div className="lg:hidden shrink-0">
              <BrandLogo
                size="sm"
                variant="mark"
                linkTo={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
              />
            </div>

            {/* Breadcrumb Hierarchy */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <span className={`hidden sm:inline-flex items-center text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border tracking-wider uppercase shadow-2xs ${
                isAdmin
                  ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30'
                  : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
              }`}>
                {isAdmin ? 'Faculty Console' : 'Candidate Desk'}
              </span>

              <span className="hidden sm:inline text-slate-300 dark:text-slate-600 font-mono text-xs select-none">/</span>

              <h1 className="text-xs sm:text-sm font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {getPageTitle()}
              </h1>
            </div>

            <div className="hidden md:block h-4 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />

            {/* Live Connectivity Tag */}
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>
          </div>

          {/* Right: Live 12-Hour RTC Clock & Segmented Theme Switcher & User Pill */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live 12-Hour Digital Clock Capsule */}
            <div className="hidden sm:flex items-center gap-2 h-[44px] min-h-[44px] max-h-[44px] px-4 rounded-xl bg-white/95 dark:bg-[#141822]/95 border-2 border-slate-300 dark:border-white/20 text-xs font-mono text-slate-800 dark:text-slate-200 shadow-xs select-none">
              <Clock size={15} className={isAdmin ? 'text-violet-600 dark:text-violet-400 shrink-0' : 'text-indigo-600 dark:text-indigo-400 shrink-0'} />
              <span className="font-bold tracking-tight tabular-nums">{formattedTime}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">{formattedDate}</span>
            </div>

            {/* Prominent Morphing Theme Switcher */}
            <ThemeToggle size="lg" className="h-[44px] min-h-[44px] max-h-[44px]" />

            {/* User Profile Pill */}
            <button
              type="button"
              onClick={onProfileClick}
              className={`h-[44px] min-h-[44px] max-h-[44px] flex items-center gap-2.5 px-3 rounded-xl bg-white/95 dark:bg-[#141822]/95 hover:bg-slate-100/90 dark:hover:bg-[#1c2230] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500/70 dark:hover:border-violet-400/70 text-slate-800 dark:text-slate-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 ${
                isAdmin ? 'focus-visible:ring-violet-500' : 'focus-visible:ring-indigo-600'
              } cursor-pointer group`}
              title="View user profile"
              aria-label="View user profile"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono overflow-hidden shrink-0 shadow-2xs border ${
                isAdmin
                  ? 'bg-violet-100 dark:bg-violet-950/70 border-violet-300 dark:border-violet-800/60 text-violet-800 dark:text-violet-300 group-hover:scale-105'
                  : 'bg-indigo-100 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300 group-hover:scale-105'
              } transition-transform duration-200`}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : (isAdmin ? 'A' : 'S')}</span>
                )}
              </div>
              <span className="text-xs font-semibold hidden md:inline max-w-[120px] truncate">
                {isAdmin ? (user?.name || 'Admin') : studentDisplayName}
              </span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Viewport */}
        <div className="flex-1 overflow-y-auto no-scrollbar focus:outline-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
