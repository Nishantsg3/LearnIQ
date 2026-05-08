import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Filter, 
  ArrowUpRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ProgressPage = () => {
  const navigate = useNavigate();
  const [allAttempts, setAllAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/attempts/me');
        const rawData = Array.isArray(res.data) ? res.data : [];
        const submitted = rawData.filter(a => 
          a && 
          (a.submitted === true || a.status === 'SUBMITTED') && 
          (a.testType !== 'MAIN' && a.mode !== 'MAIN')
        );
        const sorted = submitted
          .filter(a => a && typeof a.scorePercent === 'number' && !isNaN(a.scorePercent))
          .sort((a, b) => {
            const timeA = new Date(a.submittedAt || 0).getTime();
            const timeB = new Date(b.submittedAt || 0).getTime();
            return timeA - timeB;
          });
        setAllAttempts(sorted);
        if (sorted.length > 0) {
            setSelectedTest(String(sorted[0].testId));
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const uniqueTests = useMemo(() => {
    const map = new Map();
    allAttempts.forEach(a => {
      if (a && a.testId && !map.has(a.testId)) map.set(a.testId, a.testTitle || 'Untitled Test');
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [allAttempts]);

  const displayedAttempts = useMemo(() => {
    if (!selectedTest) return [];
    return allAttempts.filter(a => a && String(a.testId) === String(selectedTest)).slice(-3);
  }, [allAttempts, selectedTest]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectedTestTitle = useMemo(() => {
    return uniqueTests.find(t => String(t.id) === String(selectedTest))?.title || 'Select Assessment';
  }, [uniqueTests, selectedTest]);

  useEffect(() => {
    const handleGlobalClick = () => setIsDropdownOpen(false);
    if (isDropdownOpen) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [isDropdownOpen]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 gap-4">
      <div className="w-8 h-8 border-2 border-white/5 border-t-violet-500 rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Initializing...</span>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0f] min-h-0">
      {/* HEADER */}
      <div className="flex items-center justify-between p-10 border-b border-white/5 bg-[#0d0d12]/80 backdrop-blur-xl shrink-0 z-50 relative overflow-visible">
        <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-violet-500 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
            <h1 className="text-xl font-black text-white uppercase tracking-tight italic">Analytics Intelligence</h1>
        </div>

        <div className="flex items-center gap-6">
            <div className="relative w-64" onClick={(e) => e.stopPropagation()}>
                <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all cursor-pointer hover:bg-white/5 flex items-center justify-between group"
                >
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-violet-400 transition-colors" size={12} />
                    <span className="truncate pr-4">{selectedTestTitle}</span>
                    <ChevronDown className={`text-slate-600 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} size={12} />
                </div>

                {/* Custom Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#12121a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[100] animate-in fade-in duration-200">
                        <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                            {uniqueTests.length === 0 ? (
                                <div className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">
                                    No data stream
                                </div>
                            ) : (
                                uniqueTests.map(test => (
                                    <div 
                                        key={test.id}
                                        onClick={() => {
                                            setSelectedTest(test.id);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-between group/item ${
                                            String(test.id) === String(selectedTest) 
                                            ? 'bg-violet-600 text-white' 
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <span className="truncate">{test.title}</span>
                                        {String(test.id) === String(selectedTest) && <CheckCircle2 size={10} />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate('/student/dashboard')}
                className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-slate-400 hover:text-white group"
            >
                <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
            </button>
        </div>
      </div>

      <div className="p-10 flex-1 flex flex-col min-h-0">
        {/* GRAPH SECTION */}
        <div className="flex-1 bg-[#0d0d12] border border-white/5 rounded-[3rem] p-12 relative overflow-hidden shadow-inner flex flex-col">
            {!selectedTest || allAttempts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-10">
                    <TrendingUp size={80} className="text-white mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">System Idle — No Data Stream Found</p>
                </div>
            ) : (
                <div className="flex-1 w-full relative min-h-0">
                   <svg 
                     viewBox="0 0 1600 800" 
                     className="w-full h-full overflow-visible" 
                     preserveAspectRatio="xMidYMid meet"
                   >
                     <defs>
                       <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="#8b5cf6" />
                         <stop offset="100%" stopColor="#6366f1" />
                       </linearGradient>
                       <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                         <feGaussianBlur stdDeviation="12" result="blur" />
                         <feComposite in="SourceGraphic" in2="blur" operator="over" />
                       </filter>
                     </defs>
    
                     {/* Horizontal Grid Lines */}
                     {[100, 75, 50, 25, 0].map((tick) => {
                       const y = 680 - (tick / 100) * 560;
                       return (
                         <g key={tick}>
                           <line x1="150" y1={y} x2="1450" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                           <text 
                             x="120" y={y + 6} 
                             fill="#475569" 
                             fontSize="20" fontWeight="900" 
                             textAnchor="end"
                             className="tabular-nums"
                           >
                             {tick}%
                           </text>
                         </g>
                       );
                     })}
     
                      {/* Data Bars */}
                      {displayedAttempts.length > 0 && displayedAttempts.map((a, i) => {
                          const barCount = displayedAttempts.length;
                          const spacing = 1300 / (barCount + 1);
                          const x = 150 + spacing * (i + 1);
                          const barWidth = Math.min(200, spacing * 0.6);
                          const barHeight = ((a.scorePercent || 0) / 100) * 560;
                          const y = 680 - barHeight;
                          
                          return (
                              <g key={i} className="group/bar cursor-default">
                                  {/* Shadow/Glow Background */}
                                  <rect 
                                      x={x - barWidth/2} y={y} width={barWidth} height={barHeight} 
                                      fill="url(#barGradient)" rx="24"
                                      className="opacity-10 group-hover/bar:opacity-30 transition-all duration-500"
                                      filter="url(#glow)"
                                  />
                                  {/* Main Bar */}
                                  <rect 
                                      x={x - barWidth/2} y={y} width={barWidth} height={barHeight} 
                                      fill="url(#barGradient)" rx="24"
                                      className="transition-all duration-500 group-hover:brightness-125"
                                  />
                                  {/* Value Text */}
                                  <text 
                                      x={x} y={y - 30} fill="white" fontSize="32" fontWeight="900" textAnchor="middle"
                                      className="opacity-0 group-hover/bar:opacity-100 transition-all duration-300 tabular-nums"
                                  >
                                      {Math.round(a.scorePercent || 0)}%
                                  </text>
                                  {/* Label Text */}
                                  <text 
                                      x={x} y="740" fill="#64748b" fontSize="18" fontWeight="900" textAnchor="middle"
                                      className="uppercase tracking-[0.3em] group-hover/bar:fill-white transition-colors"
                                  >
                                      Attempt {i + 1}
                                  </text>
                              </g>
                          );
                      })}
                   </svg>
                </div>
            )}
        </div>

        {/* Footer Branding */}
        <div className="flex items-center gap-3 opacity-20 pt-8">
           <Activity size={14} className="text-white animate-pulse" />
           <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Performance Telemetry Stream Active</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
