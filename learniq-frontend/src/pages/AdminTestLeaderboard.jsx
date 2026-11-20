import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';
import BackToDashboard from '../components/admin/BackToDashboard';
import {
  Award,
  Trophy,
  Medal,
  Users,
  Search,
  Clock,
  TrendingUp,
  CheckCircle2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

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
        setLeaderboard(lbRes.data || []);
      } catch {
        toast.error('Failed to fetch leaderboard data');
        navigate('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [testId, navigate]);

  const filteredLeaderboard = leaderboard.filter(entry =>
    (entry?.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry?.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSubmissionTime = (timestamp) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return null;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return null;
    }
  };

  const topScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.score || 0)) : 0;
  const avgScore = leaderboard.length > 0 ? (leaderboard.reduce((acc, curr) => acc + (curr.score || 0), 0) / leaderboard.length).toFixed(1) : 0;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-300 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto flex flex-col space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-academy-rule">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Trophy size={22} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50 uppercase tracking-wider">
                Official Standing
              </span>
              <span className="text-xs font-mono text-academy-muted">• {test?.category || 'General Examination'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-academy-ink tracking-tight mt-1">
              {test?.title || 'Academic Leaderboard'}
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              placeholder="Filter candidate or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-[#151921] border-2 border-slate-300 dark:border-white/20 hover:border-violet-500/80 dark:hover:border-violet-400/80 hover:shadow-md rounded-xl pl-9 pr-8 min-h-[44px] text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 shadow-xs transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-academy-muted hover:text-academy-ink p-0.5 rounded"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <BackToDashboard />
        </div>
      </div>

      {/* COHORT SUMMARY STRIP */}
      {!loading && leaderboard.length > 0 && !searchTerm && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-academy-paper-subtle border border-academy-rule flex items-center justify-center text-academy-accent shrink-0">
              <Users size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-academy-muted">Candidates</p>
              <p className="text-base font-mono font-bold text-academy-ink tabular-nums">{leaderboard.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Trophy size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-academy-muted">Highest Mark</p>
              <p className="text-base font-mono font-bold text-academy-ink tabular-nums">{topScore}%</p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-academy-card rounded-xl border border-academy-rule p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-academy-muted">Cohort Average</p>
              <p className="text-base font-mono font-bold text-academy-ink tabular-nums">{avgScore}%</p>
            </div>
          </div>
        </div>
      )}

      {/* TOP 3 PODIUM PRESENTATION */}
      {loading ? (
        <div role="status" aria-busy="true" aria-label="Loading top rankings podium" className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <span className="sr-only">Loading top rankings podium...</span>
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : leaderboard.length > 0 && !searchTerm ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-2">
          {/* Loop order [1, 0, 2]: Index 1 (Silver), Index 0 (Gold), Index 2 (Bronze)
              Responsive ordering:
              On Mobile: Gold (order-1), Silver (order-2), Bronze (order-3)
              On Desktop: Silver left (md:order-1), Gold center elevated (md:order-2), Bronze right (md:order-3)
          */}
          {[1, 0, 2].map(idx => {
            const entry = leaderboard[idx];
            if (!entry) return null;
            const isGold = idx === 0;
            const isSilver = idx === 1;
            const isBronze = idx === 2;

            const title = isGold ? '1st • Gold Laureate' : isSilver ? '2nd • Silver Scholar' : isBronze ? '3rd • Bronze Scholar' : 'Podium';

            // Unmistakable distinct medal styles: Gold (radiant yellow), Silver (neutral platinum), Bronze (deep copper)
            const badgeColor = isGold
              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/60'
              : isSilver
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600'
              : 'bg-[#ffedd5] dark:bg-[#2a170d] text-[#7c2d12] dark:text-[#fdba74] border-[#ea580c]/50 dark:border-[#9a3412]/70';

            const iconColor = isGold
              ? 'text-amber-500 dark:text-amber-400'
              : isSilver
              ? 'text-slate-500 dark:text-slate-300'
              : 'text-[#c2410c] dark:text-[#ea580c]';

            const cardBorder = isGold
              ? 'border-amber-400/70 dark:border-amber-500/60 shadow-md ring-1 ring-amber-400/30 md:-translate-y-2'
              : isSilver
              ? 'border-slate-300 dark:border-slate-600/70 shadow-sm ring-1 ring-slate-300/30 dark:ring-slate-700/30'
              : 'border-[#c2410c]/50 dark:border-[#9a3412]/60 shadow-sm ring-1 ring-[#c2410c]/25';

            const liftClass = isGold
              ? 'hover:md:-translate-y-4 hover:-translate-y-3 hover:shadow-2xl hover:shadow-amber-500/25 cursor-pointer'
              : 'hover:-translate-y-2 hover:shadow-xl cursor-pointer';

            const accentBar = isGold
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
              : isSilver
              ? 'bg-gradient-to-r from-slate-200 via-slate-400 to-zinc-300 dark:from-slate-600 dark:via-slate-400 dark:to-zinc-500'
              : 'bg-gradient-to-r from-[#9a3412] via-[#c2410c] to-[#ea580c]';

            const orderClass = isGold ? 'order-1 md:order-2' : isSilver ? 'order-2 md:order-1' : 'order-3 md:order-3';

            const Icon = isGold ? Trophy : isSilver ? Medal : Award;

            const hoverGlow = isGold
              ? 'hover:shadow-amber-500/30 hover:border-amber-400 dark:hover:border-amber-300'
              : isSilver
              ? 'hover:shadow-slate-400/20 hover:border-slate-400 dark:hover:border-slate-400'
              : 'hover:shadow-[#c2410c]/20 hover:border-[#ea580c]';

            return (
              <div
                key={idx}
                className={`bg-white dark:bg-[#151921] rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 ${liftClass} relative overflow-hidden ${cardBorder} ${hoverGlow} ${orderClass}`}
              >
                {/* Metallic Top Accent Bar */}
                <div className={`absolute top-0 left-0 right-0 ${isGold ? 'h-1.5' : 'h-1'} ${accentBar}`} />

                <div>
                  <div className="flex items-center justify-between mb-4 mt-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${badgeColor}`}>
                      {title}
                    </span>
                    <Icon size={isGold ? 26 : 22} className={iconColor} aria-hidden="true" />
                  </div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-academy-ink truncate mb-1">
                    {entry.userName}
                  </h3>
                  <p className="text-xs font-mono text-academy-muted truncate">{entry.userEmail}</p>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-academy-muted mt-2.5">
                    <Clock size={12} className={iconColor} aria-hidden="true" />
                    <span>{formatSubmissionTime(entry.submittedAt || entry.completedAt) || 'Verified Submission'}</span>
                  </div>
                </div>

                <div className="pt-5 border-t border-academy-rule mt-5 flex items-baseline justify-between">
                  <span className="text-xs font-mono font-semibold text-academy-muted uppercase tracking-wider">Score</span>
                  <div className="text-3xl font-mono font-extrabold text-academy-ink tabular-nums">
                    {entry.score}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* RANKING TABLE */}
      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <div className="bg-white dark:bg-[#151921] rounded-2xl border border-academy-rule shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-academy-paper-subtle border-b border-academy-rule flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-academy-accent" aria-hidden="true" />
              <h2 className="text-xs font-mono font-bold text-academy-ink uppercase tracking-wider">Candidate Standings</h2>
            </div>
            <span className="text-xs font-mono text-academy-muted font-semibold">{filteredLeaderboard.length} Candidates</span>
          </div>

          {filteredLeaderboard.length > 0 ? (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[620px] text-left border-collapse text-xs">
                  <thead className="border-b border-academy-rule font-mono font-semibold text-academy-muted uppercase tracking-wider bg-academy-paper-subtle/50">
                    <tr>
                      <th className="px-6 py-3.5 text-center w-20">Rank</th>
                      <th className="px-6 py-3.5">Candidate</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5 text-center">Verification</th>
                      <th className="px-6 py-3.5 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-academy-rule">
                    {filteredLeaderboard.map((entry) => (
                      <tr key={`${entry.rank}-${entry.userEmail}`} className="hover:bg-academy-paper-subtle/70 transition-colors">
                        <td className="px-6 py-3.5 text-center font-mono font-bold">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-extrabold ${
                            entry.rank === 1 ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 shadow-2xs' :
                            entry.rank === 2 ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs' :
                            entry.rank === 3 ? 'bg-[#ffedd5] dark:bg-[#2a170d] text-[#7c2d12] dark:text-[#fdba74] border border-[#ea580c]/50 dark:border-[#9a3412]/70 shadow-2xs' :
                            'bg-academy-paper-subtle text-academy-muted border border-academy-rule'
                          }`}>
                            #{entry.rank}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-academy-accent-tint text-academy-accent border border-academy-accent/20 flex items-center justify-center font-serif font-bold text-xs shrink-0">
                              {entry.userName ? entry.userName.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <span className="font-semibold text-academy-ink">{entry.userName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-academy-muted text-xs">
                          {entry.userEmail}
                        </td>
                        <td className="px-6 py-3.5 text-center font-mono text-[11px] text-academy-muted">
                          {formatSubmissionTime(entry.submittedAt || entry.completedAt) || (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={12} aria-hidden="true" />
                              Verified
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-extrabold text-academy-ink tabular-nums text-sm">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md border tabular-nums ${
                            entry.score >= 75 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' :
                            entry.score >= 40 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50' :
                            'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                          }`}>
                            {entry.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View (< md) */}
              <div className="md:hidden divide-y divide-academy-rule">
                {filteredLeaderboard.map((entry) => (
                  <div key={`${entry.rank}-${entry.userEmail}`} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-extrabold shrink-0 ${
                          entry.rank === 1 ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 shadow-2xs' :
                          entry.rank === 2 ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs' :
                          entry.rank === 3 ? 'bg-[#ffedd5] dark:bg-[#2a170d] text-[#7c2d12] dark:text-[#fdba74] border border-[#ea580c]/50 dark:border-[#9a3412]/70 shadow-2xs' :
                          'bg-academy-paper-subtle text-academy-muted border border-academy-rule'
                        }`}>
                          #{entry.rank}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-academy-ink block truncate">{entry.userName}</span>
                          <span className="text-[11px] font-mono text-academy-muted block truncate">{entry.userEmail}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md border tabular-nums text-xs font-mono font-bold shrink-0 ${
                        entry.score >= 75 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' :
                        entry.score >= 40 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50' :
                        'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                      }`}>
                        {entry.score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-academy-muted pt-1">
                      <span>Verification</span>
                      <span>
                        {formatSubmissionTime(entry.submittedAt || entry.completedAt) || (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={12} aria-hidden="true" />
                            Verified
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-academy-muted">
              <Trophy size={36} className="mx-auto mb-3 text-academy-muted opacity-40" aria-hidden="true" />
              <p className="text-sm font-serif font-semibold text-academy-ink">No Candidate Submissions Recorded</p>
              <p className="text-xs text-academy-muted mt-1 max-w-sm mx-auto">
                {searchTerm ? `No candidates found matching "${searchTerm}". Try adjusting your search query.` : 'Submissions will appear here once candidates complete this examination.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
