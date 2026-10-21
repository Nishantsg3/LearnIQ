import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import { LogOut, UserCircle, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BRANDING } from '../config/branding';

const MainLayout = ({ children, onProfileClick }) => {
  const { user, logout, isOffline } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Get Page Title from Pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('admin-dashboard') || path.includes('/admin/dashboard')) return 'System Overview';
    if (path.includes('student-dashboard') || path.includes('/student/dashboard')) return 'Student Dashboard';
    if (path.includes('students')) return 'Student Directory';
    if (path.includes('tests/history')) return 'Archives';
    if (path.includes('tests/create')) return 'Test Construction';
    if (path.includes('section1')) return 'Practice Assessments';
    if (path.includes('section2')) return 'Main Assessments';
    if (path.includes('tests/active')) return 'Active Inventory';
    if (path.includes('tests')) return 'Assessment Control';
    if (path.includes('questions')) return 'Question Library';
    if (path.includes('bank')) return 'Question Library';
    if (path.includes('results')) return 'Performance History';
    if (path.includes('progress')) return 'Intelligence';
    return 'Portal';
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();

    let hh = date.getHours();
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    hh = hh ? hh : 12;
    const hstr = hh.toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');

    return {
      date: `${d}/${m}/${y}`,
      time: `${hstr}:${mm}:${ss}`,
      ampm
    };
  };

  const { date, time, ampm } = formatDate(currentTime);

  return (
    <div className={`main-layout selection:bg-violet-500/30 min-h-screen bg-[#0d0d10] ${user?.role === 'ADMIN' ? 'admin-theme' : 'student-theme'}`}>
      {/* SaaS Sidebar - Now Responsive */}
      <Sidebar
        onProfileClick={onProfileClick}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area - Responsive Margins */}
      <main className="main-content flex-1 flex flex-col transition-all duration-500 lg:ml-[340px] bg-[#0d0d10] min-h-screen">

        {/* Top Header - Apple Translucent Material & Optical Typography */}
        <header
          className="h-20 px-3 sm:px-6 lg:px-10 flex items-center justify-between shrink-0 z-40 sticky top-0 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.03),0_8px_20px_rgba(0,0,0,0.3)] transition-[background-color,border-color] duration-150 ease-out"
        >
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-10 min-w-0 flex-1">
            {/* MOBILE MENU TOGGLE */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              className="lg:hidden w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.08] transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="hidden sm:flex items-center gap-3">
                <img
                  src={BRANDING.logos.icon}
                  alt="LearnIQ Symbol"
                  className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(124,58,237,0.3)]"
                />
              </div>
              <span className="hidden sm:block text-white/20 font-thin text-lg sm:text-xl select-none">/</span>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate flex-1">
                {getPageTitle()}
              </h1>
            </div>

            <div className="hidden sm:block h-5 w-px bg-white/10" />

            {/* System Clock - Hidden on very small screens */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/75 tracking-tight">{date}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[12px] font-semibold text-violet-300 tracking-tight">{time}</span>
                <span className="text-[9px] font-medium text-violet-300/70 tracking-wider uppercase">{ampm}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
              <button
                onClick={onProfileClick}
                className="flex items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.16] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out group/profile min-w-0 sm:min-w-[170px] lg:min-w-[210px] relative overflow-hidden h-13 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
              >
                 <div className="absolute top-0 left-0 w-1 h-full bg-violet-500/50" />
                 <div className="text-left hidden sm:block">
                   <p className="text-[12px] font-semibold text-white tracking-tight group-hover/profile:text-violet-300 transition-colors truncate max-w-[120px] lg:max-w-none">
                     {user?.name || 'Scholar'}
                   </p>
                   <p className="text-[9px] font-medium text-white/60 tracking-wider uppercase mt-0.5">
                     {user?.role === 'ADMIN' ? 'System Authority' : 'Candidate Portal'}
                   </p>
                 </div>
                 <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.06] flex items-center justify-center border border-white/10 overflow-hidden shadow-sm group-hover/profile:border-violet-500/30 transition-all shrink-0">
                   {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <UserCircle className="text-white/40" size={18} />
                   )}
                 </div>
              </button>

              <button
                onClick={logout}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:bg-rose-500/10 hover:border-rose-500/25 hover:text-rose-400 transition-[background-color,border-color,color,transform] duration-150 ease-out group shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                title="Logout"
              >
                <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform duration-150" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body - Responsive Scrolling */}
        <div className="flex-1 flex flex-col bg-[#0d0d10] min-h-0">
            {isOffline && (
              <div className="m-4 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 shrink-0">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.2em]">
                  ⚠ Offline Mode
                </span>
              </div>
            )}
            <div className="flex-1 overflow-y-auto relative dashboard-content custom-scrollbar min-h-0">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
