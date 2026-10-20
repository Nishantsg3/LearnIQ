import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Play, 
  Calendar, 
  History, 
  LogOut, 
  Database,
  Zap,
  Plus,
  UserCircle,
  Award,
  FileText,
  TrendingUp,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BRANDING } from '../config/branding';

const Sidebar = ({ onProfileClick, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  const menuItems = isAdmin ? [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18}/> },
    { name: 'Create Test', path: '/admin/tests/create', icon: <Plus size={18}/> },
    { name: 'History', path: '/admin/tests/history', icon: <History size={18}/> },
    { name: 'Question Bank', path: '/admin/questions', icon: <Database size={18}/> },
    { name: 'Leaderboard', path: '/admin/leaderboard', icon: <Award size={18}/> },
  ] : [
    { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={18}/> },
    { name: 'Section 1', path: '/student/section1', icon: <Zap size={18}/> },
    { name: 'Section 2', path: '/student/section2', icon: <FileText size={18}/> },
    { name: 'Results', path: '/student/results', icon: <History size={18}/> },
    { name: 'Progress', path: '/student/progress', icon: <TrendingUp size={18}/> },
  ];

  const checkActive = (item) => {
    const currentPath = location.pathname;
    if (isAdmin) {
      if (item.name === 'Leaderboard' && currentPath.includes('leaderboard')) return true;
      if (item.name === 'Dashboard') {
        if (currentPath === '/admin/dashboard') return true;
        if (['/admin/tests/active', '/admin/students', '/admin/analytics'].includes(currentPath)) return true;
        if (currentPath.includes('/admin/tests/') && currentPath.includes('/analytics')) return true;
      }
      if (currentPath === item.path) return true;
      if (item.name === 'Create Test' && (currentPath.startsWith('/admin/tests/create') || currentPath.startsWith('/admin/tests/edit'))) return true;
      if (item.path !== '/admin/dashboard' && currentPath.startsWith(item.path)) return true;
      return false;
    }
    if (currentPath === item.path) return true;
    if (item.path === '/student/results' && currentPath.startsWith('/results/')) return true;
    return false;
  };

  const ADMIN_COLOR = '#1e1b4b';

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside 
        className={`
          fixed left-0 top-0 h-screen w-[340px] z-[70] flex flex-col shadow-[15px_0_50px_rgba(0,0,0,0.6)]
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 sidebar-geometric
        `}
        style={{ 
          background: isAdmin ? ADMIN_COLOR : 'linear-gradient(180deg, #6d28d9 0%, #4c1d95 100%)',
        }}
      >
        {/* Concentric circles background (very subtle) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
          {[180, 350, 520, 700].map((size, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: size,
                height: size,
                top: '15%',
                left: '10%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        {/* Brand Header - Enterprise Identity with Mobile Close */}
        <div className="p-8 pb-6 relative z-10 flex-shrink-0 flex items-center justify-between" style={{ paddingRight: '20px' }}>
          <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-2 pr-5 rounded-2xl backdrop-blur-md shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner overflow-hidden flex-shrink-0">
               <img src={BRANDING.logos.icon} alt="" className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-base font-black tracking-widest leading-none flex items-center">
                <span className="text-white">LEARN</span>
                <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent ml-0.5">IQ</span>
              </h1>
              <span className={`text-[9px] font-semibold tracking-[0.2em] uppercase mt-0.5 truncate ${isAdmin ? 'text-white/50' : 'text-white/80'}`}>Intelligence</span>
            </div>
          </div>

          {/* MOBILE CLOSE BUTTON */}
          <button 
            onClick={onClose}
            aria-label="Close navigation sidebar"
            className="lg:hidden w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white/50 hover:text-white transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-95 flex-shrink-0 ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-5 mt-4 pb-6 space-y-1 relative z-10 overflow-y-auto no-scrollbar" style={{ paddingRight: '30px' }}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ml-3 ${isAdmin ? 'text-white/50' : 'text-white/80'}`}>Registry Control</p>
          {menuItems.map((item) => {
            const isActive = checkActive(item);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => { if(window.innerWidth < 1024) onClose(); }}
                className={`
                  flex items-center gap-4 px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl text-[11px] font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out group relative mx-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
                  ${isActive 
                    ? 'text-white bg-white/10 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-sm'
                    : `${isAdmin ? 'text-white/65' : 'text-white/75'} hover:bg-white/5 hover:text-white border border-transparent`
                  }
                `}
              >
                {isActive && (
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-violet-400 rounded-r-full shadow-[0_0_8px_rgba(167,139,250,0.4)]"
                  />
                )}
                <div className={`transition-[color,transform] duration-150 ${isActive ? 'text-violet-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]' : 'group-hover:text-white'}`}>
                  {React.cloneElement(item.icon, { size: 18 })}
                </div>
                <span className="uppercase tracking-[0.2em] transition-transform duration-150 group-hover:translate-x-0.5">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Profile */}
        <div className="p-6 pb-6 relative z-10 flex-shrink-0" style={{ paddingRight: '30px' }}>
          <div className="h-px bg-white/5 mb-4 w-full" />
          
          <button 
            onClick={onProfileClick}
            className="group/profile flex items-center gap-4 cursor-pointer mb-6 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-[background-color,border-color,transform] duration-150 ease-out w-full h-16 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden group-hover/profile:border-violet-400/30 transition-all shadow-xl shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="text-white/30 group-hover/profile:text-violet-400 transition-colors" size={20} />
              )}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-[10px] font-black text-white/90 truncate uppercase tracking-widest leading-none">{user?.name || 'Admin'}</p>
              <p className={`text-[9px] font-medium truncate uppercase tracking-[0.1em] mt-1 ${isAdmin ? 'text-white/50' : 'text-white/80'}`}>{isAdmin ? 'System Authority' : 'Candidate identity'}</p>
            </div>
          </button>
          
          <button 
            onClick={logout}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 ${isAdmin ? 'text-white/65' : 'text-white/75'} text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-[background-color,border-color,color,transform] duration-150 ease-out border border-white/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50`}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
