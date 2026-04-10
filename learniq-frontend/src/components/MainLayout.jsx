import React from 'react';
import Sidebar from './Sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get Page Title from Pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('admin-dashboard')) return 'Admin Overview';
    if (path.includes('student-dashboard')) return 'Student Dashboard';
    if (path.includes('bank')) return 'Question Library';
    if (path.includes('results')) return 'Assessment Results';
    if (path.includes('questions')) return 'Test Configuration';
    if (path.includes('stats')) return 'Analytics';
    return 'LearnIQ';
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* SaaS Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col" style={{ marginLeft: '230px' }}>
        
        {/* Top Header - Minimal & Professional */}
        <header className="h-16 border-b border-[#1f2937] px-8 flex items-center justify-between sticky top-0 bg-[#0f172a]/90 backdrop-blur-sm z-40 transition-all">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
            {getPageTitle()}
          </h2>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <span className="text-xs font-bold text-slate-400">{user?.name}</span>
               <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-[#1f2937]">
                 <UserCircle className="text-slate-500" size={18} />
               </div>
            </div>
            <button 
              onClick={logout}
              className="text-slate-500 hover:text-rose-400 transition-colors p-1"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-10 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
           {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
