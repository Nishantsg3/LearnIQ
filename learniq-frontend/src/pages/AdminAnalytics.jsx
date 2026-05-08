import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Activity, 
  Clock, 
  Target,
  Percent,
  Loader2,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackToDashboard from '../components/admin/BackToDashboard';

export default function AdminAnalytics() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setError(null);
        const res = await api.get(`/admin/tests/${testId}/analytics`);
        if (res.data) {
          setData(res.data);
        } else {
          throw new Error("Empty dataset received");
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [testId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />
        <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.4em]">Aggregating Intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-center space-y-6">
        <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-2xl animate-in zoom-in-95 duration-500">
           <p className="text-rose-400 font-black uppercase text-[12px] tracking-[0.3em]">Critical Initialization Failure</p>
           <p className="text-white/40 text-[10px] mt-4 font-black uppercase tracking-widest">{error || "Data set unavailable"}</p>
        </div>
        <div className="flex justify-center">
            <BackToDashboard />
        </div>
      </div>
    );
  }

  const stats = [
    { 
        label: 'Total Attempts', 
        value: data?.totalAttempts ?? 0, 
        icon: <Activity size={20} />, 
        color: '#818cf8',
        bg: 'indigo-500',
        desc: 'Submissions' 
    },
    { 
        label: 'Participation', 
        value: `${data?.participationRate ?? 0}%`, 
        icon: <Users size={20} />, 
        color: '#60a5fa',
        bg: 'blue-500',
        desc: 'Student Turnout' 
    },
    { 
        label: 'Average Score', 
        value: `${data?.averageScore ?? 0}%`, 
        icon: <TrendingUp size={20} />, 
        color: '#34d399',
        bg: 'emerald-500',
        desc: 'Mean Performance' 
    },
    { 
        label: 'Pass Rate', 
        value: `${data?.passPercentage ?? 0}%`, 
        icon: <Percent size={20} />, 
        color: '#fbbf24',
        bg: 'amber-500',
        desc: 'Threshold 40%+' 
    },
    { 
        label: 'Highest Score', 
        value: `${data?.highestScore ?? 0}%`, 
        icon: <Award size={20} />, 
        color: '#a78bfa',
        bg: 'violet-500',
        desc: 'Peak Performance' 
    },
    { 
        label: 'Lowest Score', 
        value: `${data?.lowestScore ?? 0}%`, 
        icon: <Target size={20} />, 
        color: '#f43f5e',
        bg: 'rose-500',
        desc: 'Performance Floor' 
    }
  ];

  return (
    <div className="h-[calc(100vh-60px)] p-4">
      <div className="animate-in fade-in duration-700 h-full flex flex-col space-y-4">
        
        {/* HEADER CLUSTER - ULTRA COMPACT */}
        <div className="flex items-center justify-between shrink-0 border-b border-white/5 pb-4 px-4">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(129,140,248,0.5)]"></div>
                <h1 className="text-2xl font-black tracking-tight text-white uppercase italic leading-none">{data?.title || "Assessment"}</h1>
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                    Sector Analytics
                </span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg">
                    <Database size={12} className="text-indigo-500/50" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{data?.category || "General"}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg">
                    <Clock size={12} className="text-indigo-500/50" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{data?.durationMinutes ?? 0} MINS</span>
                </div>
            </div>
          </div>
          <BackToDashboard />
        </div>

        {/* ANALYTICS GRID - PREMIUM COMMAND CENTER STYLE */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((s, i) => (
            <div 
                key={i} 
                className="relative bg-[#0d0d12] border border-white/[0.03] rounded-[2rem] p-8 hover:border-white/20 hover:bg-[#12121a] transition-all duration-500 group shadow-2xl flex flex-col min-h-[240px] overflow-hidden cursor-default"
            >
              {/* LARGE GHOST ICON - SAME AS DASHBOARD */}
              <div 
                  className="absolute right-[10%] top-1/2 -translate-y-1/2 transition-all duration-700 pointer-events-none"
                  style={{ color: s.color, opacity: 0.03 }}
              >
                  <div className="group-hover:opacity-100 transition-opacity duration-700" style={{ opacity: 0.8 }}>
                    {React.cloneElement(s.icon, { 
                        size: 140,
                        className: "transition-all duration-700 group-hover:scale-110 group-hover:drop-shadow-[0_0_40px_currentColor]"
                    })}
                  </div>
              </div>

              {/* TOP ROW: ICON + PULSE */}
              <div className="flex items-center justify-between relative z-10 mb-auto">
                  <div className={`p-4 rounded-2xl border transition-all duration-500`} 
                       style={{ 
                           backgroundColor: `${s.color}15`, 
                           borderColor: `${s.color}30`,
                           color: s.color,
                           boxShadow: `0 8px 25px -8px ${s.color}40`
                       }}>
                      {React.cloneElement(s.icon, { size: 22 })}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-lg backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: s.color }} />
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Live Sync</span>
                  </div>
              </div>
              
              {/* MIDDLE: VALUE */}
              <div className="relative z-10 my-6">
                  <h2 className="text-6xl font-black text-white tabular-nums tracking-tighter leading-none">
                      {s.value}
                  </h2>
              </div>

              {/* BOTTOM: LABEL + DESC */}
              <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-white/60 transition-colors mb-1">
                      {s.label}
                  </p>
                  <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full opacity-40" style={{ backgroundColor: s.color }} />
                      <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest group-hover:text-indigo-400 transition-colors leading-tight">
                          {s.desc}
                      </span>
                  </div>
              </div>

              {/* ACCENT LINE */}
              <div className="absolute top-0 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-white/20 transition-all duration-500" />
            </div>
          ))}
          </div>
        </div>

        {data?.totalAttempts === 0 && (
          <div className="bg-rose-500/5 border border-rose-500/10 rounded-[1.5rem] px-6 py-6 text-center animate-pulse shrink-0">
            <p className="text-rose-400 font-black uppercase text-[10px] tracking-[0.5em] italic">Telemetry Exception: Zero Submissions Recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}
