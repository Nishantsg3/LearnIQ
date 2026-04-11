import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Play,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  History,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  Trophy,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const name = user?.name;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        api.get('/tests'),
        api.get('/attempts/me'),
      ]);
      setTests(testsRes.data);
      setAttempts(attemptsRes.data);
    } catch (err) {
      if (!isSilent) {
        console.error('Fetch error:', err);
        toast.error('Unable to retrieve latest dashboard data');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── LOGIC & FILTERING ───────────────────────────────────────────────────

  const attemptedTestIds = useMemo(() => new Set(attempts.map(a => a.testId)), [attempts]);

  // Map testId -> attemptId for already-completed attempts (to link to results)
  const completedAttemptByTestId = useMemo(() => {
    const map = {};
    attempts.forEach(a => {
      if (a.scorePercent !== -1) map[a.testId] = a.id;
    });
    return map;
  }, [attempts]);

  // LIVE: status=LIVE only (strictly no DRAFT)
  const liveTests = useMemo(() => tests.filter(t => t.status === 'LIVE'), [tests]);

  // UPCOMING: status=SCHEDULED
  const upcomingTests = useMemo(() => tests.filter(t => t.status === 'SCHEDULED'), [tests]);

  // ATTEMPTED / COMPLETED: 
  const completedAttempts = useMemo(() => attempts.filter(a => a.scorePercent !== -1), [attempts]);
  const activeAttemptsList = useMemo(() => attempts.filter(a => a.scorePercent === -1), [attempts]);

  // MISSED: status=COMPLETED AND MAIN AND unattempted
  const missedTests = useMemo(() => tests.filter(t =>
    t.status === 'COMPLETED' && t.sectionType === 'MAIN' && !attemptedTestIds.has(t.id)
  ), [tests, attemptedTestIds]);

  const stats = useMemo(() => [
    { label: 'Live Assessments', value: liveTests.length, icon: <Activity size={20} className="text-indigo-400" /> },
    { label: 'Completed', value: completedAttempts.length, icon: <CheckCircle size={20} className="text-emerald-400" /> },
    { label: 'Missed Tests', value: missedTests.length, icon: <AlertCircle size={20} className="text-rose-400" /> },
    { label: 'Avg. Score', value: completedAttempts.length > 0 ? `${Math.round(completedAttempts.reduce((acc, a) => acc + a.scorePercent, 0) / completedAttempts.length)}%` : '—', icon: <TrendingUp size={20} className="text-indigo-400" /> },
  ], [liveTests, completedAttempts, missedTests]);

  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  // ONLY REPLACE THIS FUNCTION inside your file

  const startTest = async (testId) => {
    try {
      const res = await api.post('/attempts/start', { testId });

      if (!res.data || !res.data.attemptId) {
        throw new Error('Invalid response from server');
      }

      const { attemptId } = res.data;

      // 🔥 Navigate safely
      navigate(`/attempt/${attemptId}`);

    } catch (err) {
      console.error("Start test error:", err);

      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to start test session';

      toast.error(msg);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#1f2937] border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* Tab Navigation */}
      <div className="tab-container">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'live', label: 'Live Tests', count: liveTests.length },
          { id: 'upcoming', label: 'Upcoming', count: upcomingTests.length },
          { id: 'attempts', label: 'My Attempts', count: attempts.length },
          { id: 'missed', label: 'Missed', count: missedTests.length },
        ].map(tab => (
          <div
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`tab-item ${currentTab === tab.id ? 'tab-item-active' : ''}`}
          >
            {tab.label} {tab.count > 0 && <span className="ml-1 opacity-40 font-bold">({tab.count})</span>}
          </div>
        ))}
      </div>

      {currentTab === 'overview' && (
        <div className="space-y-12">
          {/* Stats Grid */}
          <div className="dashboard-grid">
            {stats.map(s => (
              <div key={s.label} className="card-base p-6 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-[#1f2937] flex items-center justify-center">
                  {s.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-50 mt-0.5">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Recommendations */}
            <section className="lg:col-span-7 space-y-6">
              <h2 className="text-lg font-bold text-slate-50 flex items-center gap-3">
                <Play size={18} className="text-indigo-400" />
                Recommended for you
              </h2>
              <div className="space-y-4">
                {liveTests.slice(0, 3).map(test => (
                  <div key={test.id} className="card-base p-5 flex items-center justify-between border-l-4 border-l-indigo-600">
                    <div>
                      <h4 className="font-bold text-slate-50">{test.title}</h4>
                      <div className="flex items-center gap-4 mt-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock size={12} /> {test.durationMinutes}m</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><FileText size={12} /> {test.questionCount} Qs</span>
                        <span className="badge badge-primary">{test.category}</span>
                      </div>
                    </div>
                    <button onClick={() => startTest(test.id)} className="btn-primary py-2 px-6 text-xs">
                      Engage
                    </button>
                  </div>
                ))}
                {liveTests.length === 0 && (
                  <div className="empty-state-card py-12">
                    <p className="text-slate-500 text-sm font-bold italic">No active assessments available</p>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Progress */}
            <section className="lg:col-span-5 space-y-6">
              <h2 className="text-lg font-bold text-slate-50 flex items-center gap-3">
                <TrendingUp size={18} className="text-emerald-400" />
                Recent Activity
              </h2>
              <div className="card-base overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/50 border-b border-[#1f2937]">
                    <tr>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Test</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2937]">
                    {completedAttempts.slice(0, 5).map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/30 transition-all group">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-200 line-clamp-1">{a.testTitle}</p>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-black">{formatDateTime(a.submittedAt)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-bold ${a.scorePercent >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {a.scorePercent}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => navigate(`/results/${a.id}`)}
                            className="text-slate-500 hover:text-indigo-400 transition-all p-1"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {completedAttempts.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-5 py-12 text-center text-slate-500 text-sm italic font-bold">
                          Zero history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}

      {currentTab === 'live' && (
        <div className="dashboard-grid">
              {liveTests.map(test => {
                const alreadyAttempted = test.sectionType === 'MAIN' && completedAttemptByTestId[test.id];
                return (
                <div key={test.id} className="card-base p-6 space-y-6 flex flex-col hover:border-indigo-500/50">
                  <div className="flex justify-between items-start">
                    <span className="badge badge-success">Active</span>
                    <span className="badge badge-primary">{test.category}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-50 leading-tight">{test.title}</h3>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{test.description || 'Professional technical assessment for ' + test.category}</p>
                  </div>
                  <div className="flex items-center gap-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] pt-2">
                    <span className="flex items-center gap-1.5 border-r border-[#1f2937] pr-5"><Clock size={14} className="text-indigo-400" /> {test.durationMinutes}M</span>
                    <span className="flex items-center gap-1.5"><FileText size={14} className="text-indigo-400" /> {test.questionCount} Qs</span>
                  </div>
                  {alreadyAttempted ? (
                    <button
                      onClick={() => navigate(`/results/${completedAttemptByTestId[test.id]}`)}
                      className="w-full btn-secondary py-3 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      ✓ View Result
                    </button>
                  ) : (
                    <button onClick={() => startTest(test.id)} className="w-full btn-primary py-3">
                      Start Assessment
                    </button>
                  )}
                </div>
              )})}
          {liveTests.length === 0 && (
            <div className="col-span-full empty-state-card">
              <AlertCircle size={40} className="text-[#1f2937] mx-auto mb-4" />
              <h3 className="font-bold text-slate-500 uppercase tracking-widest">No live tests available</h3>
            </div>
          )}
        </div>
      )}

      {currentTab === 'upcoming' && (
        <div className="dashboard-grid">
          {upcomingTests.map(test => (
            <div key={test.id} className="card-base p-6 space-y-6 opacity-80 cursor-not-allowed">
              <div className="flex justify-between items-start">
                <span className="badge badge-warning">Scheduled</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{test.difficultyLevel}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-50">{test.title}</h3>
                <p className="text-[10px] text-indigo-400 font-black mt-3 flex items-center gap-2 uppercase tracking-wider">
                  <Calendar size={14} /> Opens {formatDateTime(test.scheduledAt)}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>{test.durationMinutes} MINS</span>
                <span>•</span>
                <span>{test.questionCount} QUESTIONS</span>
              </div>
              <button disabled className="w-full btn-secondary py-3 opacity-30">
                Locked
              </button>
            </div>
          ))}
          {upcomingTests.length === 0 && (
            <div className="col-span-full empty-state-card">
              <p className="font-bold text-slate-500 uppercase tracking-widest">Zero scheduled assessments</p>
            </div>
          )}
        </div>
      )}

      {currentTab === 'attempts' && (
        <div className="card-base overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-[#1f2937]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Assessment</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Score</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]">
              {attempts.map(a => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-6">
                    <p className="font-bold text-slate-50">{a.testTitle}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-widest">{formatDateTime(a.submittedAt || a.startedAt)}</p>
                  </td>
                  <td className="px-6 py-6 font-bold">
                    {a.scorePercent === -1 ? (
                      <span className="text-amber-400 text-xs flex items-center gap-2">
                        <Activity size={12} className="animate-pulse" /> In-Progress
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle size={12} /> Completed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-center">
                    {a.scorePercent === -1 ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${a.scorePercent >= 60 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {a.scorePercent}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-right">
                    {a.scorePercent !== -1 ? (
                      <button
                        onClick={() => navigate(`/results/${a.id}`)}
                        className="btn-secondary py-1.5 px-4 text-[10px] uppercase font-black tracking-widest bg-slate-900 border-[#1f2937] hover:border-indigo-500/50"
                      >
                        View Report
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/attempt/${a.id}`)}
                        className="text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        Resume
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {attempts.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={40} className="text-slate-800" />
                      <p className="text-slate-500 font-bold uppercase tracking-widest">No attempt records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {currentTab === 'missed' && (
        <div className="dashboard-grid">
          {missedTests.map(test => (
            <div key={test.id} className="card-base p-6 space-y-4 border-rose-500/20 bg-rose-500/5">
              <div className="flex justify-between items-start">
                <span className="badge badge-danger">Lapsed</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{test.category}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">{test.title}</h3>
                <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-widest">Requirement Expired</p>
              </div>
              <div className="pt-2 text-xs text-slate-500 leading-relaxed font-medium">
                This mandatory assessment was missed. Evaluation is no longer possible.
              </div>
            </div>
          ))}
          {missedTests.length === 0 && (
            <div className="col-span-full empty-state-card border-none bg-emerald-500/5">
              <Trophy size={40} className="text-emerald-500/20 mx-auto mb-4" />
              <h3 className="font-bold text-emerald-400/50 uppercase tracking-widest">Clean Status: Zero Lapses</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
