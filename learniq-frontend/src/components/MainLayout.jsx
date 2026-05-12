import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, UserCircle, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MainLayout = ({ children, onProfileClick }) => {
  const { user, logout, isOffline } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
        
        {/* Top Header - Studio Grade */}
        <header 
          className="h-20 px-3 sm:px-6 lg:px-10 flex items-center justify-between shrink-0 z-40 relative sticky top-0"
          style={{ 
            background: '#0a0a0f',
            borderBottom: '1px solid rgba(255,255,255,0.02)'
          }}
        >
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-12 min-w-0 flex-1">
            {/* MOBILE MENU TOGGLE */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-95"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <h1 className="text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] shrink-0">
                <span className="text-white">LEARN</span>
                <span className="text-violet-500">IQ</span>
              </h1>
              <span className="text-white/10 font-thin text-lg sm:text-xl select-none">/</span>
              <h1 className="text-[9px] sm:text-[10px] lg:text-sm font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.25em] truncate italic flex-1">
                {getPageTitle()}
              </h1>
            </div>

            <div className="hidden sm:block h-6 w-px bg-white/10" />

            {/* System Clock - Hidden on very small screens */}
            <div className="hidden md:flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-white/80 tracking-[0.15em]">{date}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-black text-violet-300 tracking-[0.2em] drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]">{time}</span>
                <span className="text-[9px] font-bold text-violet-300/60 uppercase">{ampm}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4">
              <button 
                onClick={onProfileClick}
                className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6 px-2 sm:px-6 py-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/profile shadow-2xl min-w-0 sm:min-w-[180px] lg:min-w-[220px] relative overflow-hidden h-14"
              >
                 <div className="absolute top-0 left-0 w-1 h-full bg-violet-600/40" />
                 <div className="text-left hidden sm:block">
                   <p className="text-[10px] font-black text-white uppercase tracking-[0.15em] group-hover/profile:text-violet-400 transition-colors truncate max-w-[120px] lg:max-w-none">
                     {user?.name || 'Scholar'}
                   </p>
                   <p className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em] mt-0.5 italic">
                     {user?.role === 'ADMIN' ? 'System Authority' : 'Authorized Identity'}
                   </p>
                 </div>
                 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden shadow-xl group-hover/profile:border-violet-500/30 transition-all shrink-0">
                   {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <UserCircle className="text-white/20" size={18} />
                   )}
                 </div>
              </button>

              <button 
                onClick={logout}
                className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-500 transition-all group shadow-sm"
                title="Logout"
              >
                <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
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
