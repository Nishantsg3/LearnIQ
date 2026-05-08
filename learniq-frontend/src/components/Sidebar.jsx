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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside 
        className={`
          fixed left-0 top-0 h-screen w-[340px] z-50 flex flex-col shadow-[15px_0_50px_rgba(0,0,0,0.6)]
          transition-transform duration-500 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{ 
          background: isAdmin ? ADMIN_COLOR : 'linear-gradient(180deg, #6d28d9 0%, #4c1d95 100%)',
          clipPath: window.innerWidth >= 1024 ? 'polygon(0 0, 100% 0, 97% 100%, 0 100%)' : 'none',
        }}
      >
        {/* MOBILE CLOSE BUTTON */}
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

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

        {/* Brand Header */}
        <div className="p-8 pb-4 relative z-10 flex-shrink-0" style={{ paddingRight: '30px' }}>
          <div className="inline-flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/5 pl-2 pr-6 py-2 rounded-2xl shadow-2xl">
            <div 
              style={{
                width: 38,
                height: 38,
                background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: 16,
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              L
            </div>
            <span className="text-lg font-black tracking-[0.05em] uppercase flex items-center">
              <span className="text-white">Learn</span>
              <span className="text-[#a78bfa] ml-0.5">IQ</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-5 mt-4 pb-6 space-y-1 relative z-10 overflow-y-auto no-scrollbar" style={{ paddingRight: '30px' }}>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6 ml-3">Registry Control</p>
          {menuItems.map((item) => {
            const isActive = checkActive(item);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => { if(window.innerWidth < 1024) onClose(); }}
                className={`
                  flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-bold transition-all duration-300 ease-out group relative
                  ${isActive 
                    ? 'text-white bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-md scale-[1.02]' 
                    : 'text-white/30 hover:bg-white/5 hover:text-white/80 hover:scale-[1.01]'
                  }
                `}
              >
                {isActive && (
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-violet-400 rounded-r-full shadow-[0_0_20px_rgba(167,139,250,1)]" 
                  />
                )}
                <div className={`transition-all duration-300 ${isActive ? 'scale-110 text-violet-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]' : 'group-hover:scale-110 group-hover:text-white/80'}`}>
                  {React.cloneElement(item.icon, { size: 18 })}
                </div>
                <span className={`uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Profile */}
        <div className="p-6 pb-6 relative z-10 flex-shrink-0" style={{ paddingRight: '30px' }}>
          <div className="h-px bg-white/5 mb-4 w-full" />
          
          <div 
            onClick={onProfileClick}
            className="group/profile flex items-center gap-4 cursor-pointer mb-6"
          >
            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden group-hover/profile:border-white/20 transition-all shadow-xl">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="text-white/20 group-hover/profile:text-violet-400 transition-colors" size={22} />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-black text-white/90 truncate uppercase tracking-widest">{user?.name || 'Admin'}</p>
              <p className="text-[9px] font-bold text-white/20 truncate uppercase tracking-[0.2em] mt-0.5">{isAdmin ? 'System Authority' : 'Candidate Status'}</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white/5 text-white/30 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 border border-white/5"
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
