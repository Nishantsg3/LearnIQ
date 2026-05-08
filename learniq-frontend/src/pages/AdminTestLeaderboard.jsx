import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  ArrowLeft, 
  Award, 
  Clock, 
  Trophy,
  Medal,
  Users,
  Search,
  Loader2,
  TrendingUp,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackToDashboard from '../components/admin/BackToDashboard';

export default function AdminTestLeaderboard() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const [testRes, lbRes] = await Promise.all([
          api.get(`/tests/${testId}`),
          api.get(`/tests/${testId}/leaderboard`)
        ]);
        setTest(testRes.data);
        setLeaderboard(lbRes.data);
      } catch (err) {
        toast.error('Failed to fetch leaderboard data');
        navigate('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [testId, navigate]);

  const filteredLeaderboard = leaderboard.filter(entry => 
    entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />
        <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.4em]">Ranking Candidates...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar p-10">
      <div className="animate-in fade-in duration-700 space-y-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 border-b border-white/5 pb-10">
          <div className="flex items-center gap-8">
              <div className="w-1.5 h-10 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(129,140,248,0.5)]"></div>
              <div>
                  <h1 className="text-3xl font-black text-white uppercase italic tracking-tight leading-none">Assessment Leaderboard</h1>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3">
                      <span className="text-indigo-400">{test?.title}</span> • {test?.category}
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-6">
              <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <Search size={14} />
                  </div>
                  <input 
                      type="text" 
                      placeholder="SEARCH RANKINGS..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-[#0d0d12] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-indigo-500/50 transition-all w-full md:w-[300px] placeholder:text-white/10 shadow-2xl"
                  />
              </div>
              <BackToDashboard />
          </div>
        </div>

        {/* TOP 3 PODIUM */}
        {leaderboard.length > 0 && !searchTerm && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-center gap-8 px-4">
              {[1, 0, 2].map(idx => {
                  const entry = leaderboard[idx];
                  if (!entry) return null;
                  const isGold = idx === 0;
                  const isSilver = idx === 1;
                  const isBronze = idx === 2;
                  
                  const metalColor = isGold ? '#fbbf24' : isSilver ? '#94a3b8' : '#b45309';
                  const glowColor = isGold ? 'rgba(251,191,36,0.1)' : isSilver ? 'rgba(148,163,184,0.05)' : 'rgba(180,83,9,0.05)';
                  
                  return (
                      <div 
                        key={idx} 
                        className={`flex-1 bg-[#0d0d12] border rounded-[3rem] p-10 flex flex-col items-center text-center relative overflow-hidden transition-all duration-700 group shadow-2xl hover:bg-[#12121a]`}
                        style={{ 
                          minHeight: isGold ? '420px' : isSilver ? '380px' : '350px',
                          borderColor: `${metalColor}20`,
                          boxShadow: `0 20px 40px -10px ${glowColor}`
                        }}
                      >
                          <div className="absolute top-0 left-0 w-full h-1" style={{ background: metalColor }}></div>
                          
                          {/* GHOST RANK */}
                          <div className="absolute -right-6 -bottom-6 text-white/[0.01] group-hover:text-white/[0.03] transition-all duration-700 pointer-events-none group-hover:scale-110">
                              {isGold ? <Trophy size={200} /> : isSilver ? <Medal size={180} /> : <Award size={160} />}
                          </div>

                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border transition-all duration-700 relative z-10 shadow-2xl`}
                               style={{ 
                                 background: `${metalColor}10`, 
                                 borderColor: `${metalColor}20`, 
                                 color: metalColor
                               }}>
                              {isGold ? <Trophy size={32} /> : isSilver ? <Medal size={32} /> : <Award size={32} />}
                          </div>
                          
                          <div className="space-y-2 mb-6 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: metalColor }}>Rank #{idx + 1}</p>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none break-all italic">{entry.userName}</h3>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-3">{entry.userEmail}</p>
                          </div>

                          <div className="mt-auto pt-8 border-t border-white/5 w-full relative z-10">
                              <div className="flex items-baseline justify-center gap-2">
                                <span className={`text-5xl font-black tracking-tighter ${isGold ? 'text-white' : 'text-slate-300'}`}>{entry.score}</span>
                                <span className="text-lg font-black text-slate-600">%</span>
                              </div>
                              <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em] mt-3">Accuracy Index</p>
                          </div>
                      </div>
                  );
              })}
          </div>
        )}

        {/* RANKING LEDGER */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-10">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <Users size={20} />
                  </div>
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.4em]">Candidate Ranking Ledger</h2>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">Live Sync active</span>
              </div>
          </div>

          <div className="space-y-4 pb-20 px-4">
              {filteredLeaderboard.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  const rankColor = entry.rank === 1 ? '#fbbf24' : entry.rank === 2 ? '#94a3b8' : entry.rank === 3 ? '#b45309' : '#475569';
                  
                  return (
                      <div 
                        key={entry.rank} 
                        className="bg-[#0d0d12] border border-white/[0.03] rounded-[2rem] p-6 flex items-center justify-between transition-all duration-300 hover:bg-[#12121a] hover:border-white/10 group shadow-xl"
                      >
                          <div className="flex items-center gap-8">
                              <div 
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black border transition-all duration-500"
                                style={{ 
                                  background: `${rankColor}10`, 
                                  borderColor: `${rankColor}20`, 
                                  color: rankColor,
                                  boxShadow: isTop3 ? `0 0 20px ${rankColor}15` : 'none'
                                }}
                              >
                                  #{entry.rank}
                              </div>
                              
                              <div className="space-y-1">
                                  <h4 className="text-[14px] font-black text-white uppercase tracking-widest group-hover:text-indigo-400 transition-colors italic">
                                      {entry.userName}
                                  </h4>
                                  <div className="flex items-center gap-3 text-slate-600">
                                      <Mail size={12} className="opacity-30" />
                                      <span className="text-[10px] font-bold uppercase tracking-widest">{entry.userEmail}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="text-right space-y-1 pr-6">
                              <div className="flex items-baseline justify-end gap-2">
                                  <span className={`text-3xl font-black tracking-tighter ${
                                      entry.score >= 75 ? 'text-emerald-400' : entry.score >= 40 ? 'text-amber-400' : 'text-rose-400'
                                  }`}>
                                      {entry.score}
                                  </span>
                                  <span className="text-[12px] font-black text-slate-700">%</span>
                              </div>
                              <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Performance Score</p>
                          </div>
                      </div>
                  );
              })}
          </div>
        </div>

        {leaderboard.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 bg-[#0d0d12] rounded-[4rem] border border-dashed border-white/5 animate-pulse">
              <Trophy size={64} className="text-white/5 mb-8" />
              <p className="text-[14px] font-black text-slate-500 uppercase tracking-[0.5em]">No rankings recorded yet</p>
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] mt-4 italic">Awaiting candidate submissions...</p>
          </div>
        )}
      </div>
    </div>
  );
}
