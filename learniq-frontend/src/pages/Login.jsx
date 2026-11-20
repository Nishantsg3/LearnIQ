import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  GraduationCap,
  ArrowRight,
  Shield,
  Mail,
  Lock,
  AlertCircle,
  Sparkles,
  Key
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import ThemeToggle from '../components/ThemeToggle';
import AuthServerWakingState from '../components/AuthServerWakingState';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dedicated Server Cold-Start Waking State
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [wakingElapsed, setWakingElapsed] = useState(0);
  const wakingTimerRef = useRef(null);
  const healthPollRef = useRef(null);

  const { login, isLoggingIn, setIsLoggingIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Deterministic simulation hook for QA & screenshot verification
  useEffect(() => {
    const shouldSimulate = searchParams.get('coldStart') === 'true' || searchParams.get('simulateColdStart') === 'true';
    if (shouldSimulate) {
      setIsServerWaking(true);
      setWakingElapsed(8);
    }
  }, [searchParams]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
      if (healthPollRef.current) clearInterval(healthPollRef.current);
    };
  }, []);

  const executeLogin = async (targetEmail, targetPassword) => {
    setErrorMessage('');
    setIsLoggingIn(true);

    try {
      const res = await api.post('/auth/login', {
        email: targetEmail.trim().toLowerCase(),
        password: targetPassword
      });

      if (res.data?.token) {
        // Clear active waking state
        if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
        if (healthPollRef.current) clearInterval(healthPollRef.current);
        setIsServerWaking(false);

        login({
          token: res.data.token,
          name: res.data.name,
          role: res.data.role,
          email: res.data.email,
          id: res.data.id,
          avatar: res.data.avatar || null
        });
        toast.success('Welcome back, ' + (res.data.name || 'Candidate'));
        navigate('/student/dashboard');
      }
    } catch (err) {
      const isNetworkError = !err.response;
      const isTimeout = err.code === 'ECONNABORTED';
      const isSleepStatus = err.response && [500, 502, 503, 504].includes(err.response.status);
      const isColdStart = isNetworkError || isTimeout || isSleepStatus;

      setIsServerWaking(false);
      if (isColdStart) {
        const msg = 'Examination servers are connecting. Please try again in a moment.';
        setErrorMessage(msg);
        toast(msg, { icon: '⏳' });
      } else {
        const msg = err.response?.data?.message || 'Invalid candidate email or password.';
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Starts the elapsed timer strictly capped at 25s, and background health polling
  const _startWakingLoop = (pendingEmail, pendingPassword) => {
    if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
    if (healthPollRef.current) clearInterval(healthPollRef.current);

    setWakingElapsed(0);

    // Strictly capped at 25s to avoid fake infinite counters
    wakingTimerRef.current = setInterval(() => {
      setWakingElapsed(prev => Math.min(prev + 1, 25));
    }, 1000);

    // 3-second health polling loop
    const baseURL = api.defaults.baseURL || 'http://localhost:8080';
    healthPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${baseURL}/health`);
        if (res.ok) {
          clearInterval(healthPollRef.current);
          clearInterval(wakingTimerRef.current);
          toast.success('Server connection established! Authenticating...');
          executeLogin(pendingEmail, pendingPassword);
        }
      } catch {
        // Still waking up
      }
    }, 3000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    executeLogin(email, password);
  };

  const handleCancelWaking = () => {
    if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
    if (healthPollRef.current) clearInterval(healthPollRef.current);
    setIsServerWaking(false);
    setIsLoggingIn(false);
  };

  // Immediate Simulation Bypass: Authenticates user directly with valid backend credentials
  const handleSimulateAwake = async () => {
    if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
    if (healthPollRef.current) clearInterval(healthPollRef.current);

    const activeEmail = (email && email.trim()) || 'student1@learniq.com';
    const activePassword = password || 'student@111';
    setEmail(activeEmail);
    setPassword(activePassword);
    setIsServerWaking(false);

    await executeLogin(activeEmail, activePassword);
  };

  const handleFillDemoStudent = () => {
    if (!import.meta.env.DEV) return;
    setEmail('student1@learniq.com');
    setPassword('student@111');
    setErrorMessage('');
    toast.success('Demo candidate credentials loaded');
  };

  return (
    <AuthLayout variant="student">
      <div className="w-full backdrop-blur-3xl bg-white/90 dark:bg-[#0c0f18]/90 border border-[#EAE4DC] dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden transition-all duration-300 shadow-[0_16px_50px_-12px_rgba(226,125,96,0.12),0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(99,102,241,0.08)] ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.08]">

        {/* Specular highlight border sheen (Warm Amber / Luminous Indigo) */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#E5A638]/70 dark:via-[#6366F1]/70 to-transparent pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-44 h-20 bg-[#E5A638]/10 dark:bg-[#6366F1]/15 rounded-full blur-2xl pointer-events-none" />

        {/* ── CARD TOP UTILITY BAR (INTEGRATED THEME & ROLE SWITCH) ─────────── */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-3 border-b border-[#EAE4DC]/80 dark:border-white/5">
          {/* Role Indicator Pill (Royal Indigo / Amethyst) */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold shadow-2xs">
            <GraduationCap size={12} className="text-indigo-600 dark:text-indigo-400" />
            <span className="font-mono tracking-wide">CANDIDATE DESK</span>
          </div>

          {/* Right Controls: Integrated ThemeToggle + Faculty Link */}
          <div className="flex items-center gap-2">
            <ThemeToggle size="xs" variant="segmented" />

            <Link
              to="/admin-access"
              className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF5EE] dark:bg-white/5 hover:bg-violet-50 dark:hover:bg-violet-950/50 border border-[#E8DEC8] dark:border-white/10 text-[#7E6B8F] dark:text-[#94A3B8] hover:text-violet-700 dark:hover:text-violet-300 text-[10px] font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-violet-500 active:scale-95"
              title="Access faculty administrative console"
            >
              <Shield size={11} className="text-[#8DA399] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
              <span>Faculty</span>
              <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── WAKING SERVER STATE OVERLAY (COLD-START RECOVERY) ─────────────── */}
        {isServerWaking ? (
          <AuthServerWakingState
            variant="student"
            elapsed={wakingElapsed}
            onCancel={handleCancelWaking}
            onSimulateAwake={handleSimulateAwake}
          />
        ) : (
          <>
            {/* Heading Section (Compact 100vh fit) */}
            <div className="mb-3 sm:mb-4">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#0F766E] dark:text-[#2DD4BF] block mb-0.5">
                Standardized Examination Suite
              </span>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1E293B] dark:text-[#F8FAFC] tracking-tight leading-snug">
                Candidate Sign In
              </h1>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-sans leading-relaxed">
                Enter your credentials to access scheduled tests, practice drills, and scorecards.
              </p>
            </div>

            {/* Inline Error Message Banner (Only for genuine credential failure) */}
            {errorMessage && (
              <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 font-sans">
                  <p className="text-[11px] font-bold text-rose-800 dark:text-rose-200 leading-tight">Authentication Check Failed</p>
                  <p className="text-[10px] text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed font-normal">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 text-xs font-bold ml-1 min-w-[18px] min-h-[18px] flex items-center justify-center cursor-pointer"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {/* Credentials Form (Compact 100vh inputs) */}
            <form onSubmit={handleLogin} className="space-y-2.5 sm:space-y-3">

              {/* Email Field with spruce/teal focus ring */}
              <div className="group">
                <label className="block text-[11px] font-semibold text-[#334155] dark:text-[#CBD5E1] mb-1 font-sans">
                  Candidate Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="w-full min-h-[40px] sm:min-h-[42px] pl-9 pr-3 py-1.5 sm:py-2 bg-[#FAF7F2]/90 dark:bg-[#07090f]/70 focus:bg-white dark:focus:bg-[#0e121d] border border-[#EAE4DC] dark:border-white/10 rounded-xl text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] text-xs font-medium shadow-2xs outline-none transition-all duration-200 focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-4 focus:ring-[#6366F1]/15 dark:focus:ring-[#818CF8]/20 hover:border-[#D5CCC0] dark:hover:border-white/20 font-sans"
                    placeholder="student1@learniq.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                    required
                    autoComplete="email"
                  />
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6366F1] dark:group-focus-within:text-[#818CF8] transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Password Field with Royal Amethyst focus ring */}
              <div className="group">
                <div className="flex justify-between items-center mb-1 font-sans">
                  <label className="block text-[11px] font-semibold text-[#334155] dark:text-[#CBD5E1]">
                    Examination Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[10px] font-semibold text-[#6366F1] dark:text-[#818CF8] hover:text-[#4F46E5] dark:hover:text-[#A78BFA] hover:underline focus-visible:ring-2 focus-visible:ring-[#6366F1] rounded outline-none"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full min-h-[40px] sm:min-h-[42px] pl-9 pr-10 py-1.5 sm:py-2 bg-[#FAF7F2]/90 dark:bg-[#07090f]/70 focus:bg-white dark:focus:bg-[#0e121d] border border-[#EAE4DC] dark:border-white/10 rounded-xl text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] text-xs font-medium shadow-2xs outline-none transition-all duration-200 focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-4 focus:ring-[#6366F1]/15 dark:focus:ring-[#818CF8]/20 hover:border-[#D5CCC0] dark:hover:border-white/20 font-sans"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                    required
                    autoComplete="current-password"
                  />
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6366F1] dark:group-focus-within:text-[#818CF8] transition-colors pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#334155] dark:hover:text-[#F1F5F9] transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-[#6366F1] outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Sign In CTA (Royal Amethyst to Deep Indigo & Sky Azure) */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full min-h-[40px] sm:min-h-[42px] py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-700 hover:to-sky-600 active:scale-[0.99] text-white font-sans font-bold text-xs shadow-md hover:shadow-indigo-500/25 transition-all duration-150 flex items-center justify-center gap-2 mt-1 disabled:opacity-60 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6366F1] outline-none"
              >
                {isLoggingIn ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </div>
                ) : (
                  <>
                    <span>Enter Examination Hall</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>

            {/* Seamless Keychain-Style Demo Credentials Chip (Compact) */}
            {import.meta.env.DEV && (
              <div className="mt-2.5 pt-2 sm:mt-3 sm:pt-2.5 border-t border-[#EAE4DC]/80 dark:border-white/5 flex items-center justify-between text-xs font-sans">
                <div className="flex items-center gap-1.5 text-[#7E6B8F] dark:text-[#94A3B8]">
                  <Sparkles size={11} className="text-[#818CF8]" />
                  <span className="text-[10px] font-medium">Quick Demo Preset</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemoStudent}
                  className="min-h-[28px] text-[10px] font-semibold text-[#6366F1] dark:text-[#818CF8] hover:text-[#312E81] dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#6366F1] outline-none cursor-pointer"
                >
                  <Key size={11} />
                  <span>Fill Demo Student</span>
                </button>
              </div>
            )}

            {/* Footer Link (Compact) */}
            <div className="mt-2 pt-2 border-t border-[#EAE4DC]/80 dark:border-white/5 text-center font-sans">
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium">
                New candidate?{' '}
                <Link
                  to="/register"
                  className="text-[#6366F1] dark:text-[#818CF8] font-bold hover:underline ml-1 focus-visible:ring-2 focus-visible:ring-[#6366F1] rounded outline-none"
                >
                  Create candidate account
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default Login;
