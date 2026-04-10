import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Play, 
  Calendar, 
  History, 
  LogOut, 
  Database,
  BarChart,
  UserCircle,
  FileCheck2,
  Trophy
} from 'lucide-react';
import { getUser, logout } from '../utils/auth';

const Sidebar = () => {
  const user = getUser();
  const isAdmin = user?.role === 'ADMIN';

  const menuItems = isAdmin ? [
    { name: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={18}/> },
    { name: 'Question Bank', path: '/admin/bank', icon: <Database size={18}/> },
    { name: 'Analytics', path: '/admin/stats', icon: <BarChart size={18}/> },
  ] : [
    { name: 'Dashboard', path: '/student-dashboard?tab=overview', icon: <LayoutDashboard size={18}/> },
    { name: 'Live Tests', path: '/student-dashboard?tab=live', icon: <Play size={18}/> },
    { name: 'Upcoming', path: '/student-dashboard?tab=upcoming', icon: <Calendar size={18}/> },
    { name: 'Results', path: '/student-dashboard?tab=results', icon: <History size={18}/> },
  ];

  return (
    <aside 
      style={{ width: '230px' }}
      className="fixed left-0 top-0 h-screen bg-[#020617] border-r border-[#1f2937] flex flex-col z-50"
    >
      {/* Branding */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold text-slate-50 tracking-tight">LearnIQ</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
              ${isActive 
                ? 'bg-indigo-500/10 text-indigo-400' 
                : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
              }
            `}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Profile/Footer Summary (Optional, but kept simple) */}
      <div className="p-4 border-t border-[#1f2937]">
        <div className="p-3 bg-[#111827] rounded-xl flex items-center gap-3 mb-2 border border-[#1f2937]">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <UserCircle className="text-slate-500" size={20} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 text-sm font-semibold hover:bg-slate-800/50 hover:text-rose-400 transition-all"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
