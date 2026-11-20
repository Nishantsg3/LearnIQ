import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';
import ThemeToggle from '../components/ThemeToggle';
import AuthServerWakingState from '../components/AuthServerWakingState';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Dedicated Server Cold-Start Waking State
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [wakingElapsed, setWakingElapsed] = useState(0);
  const wakingTimerRef = useRef(null);
  const healthPollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
      if (healthPollRef.current) clearInterval(healthPollRef.current);
    };
  }, []);

  const executeForgot = async (targetEmail) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: targetEmail });
      if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
      if (healthPollRef.current) clearInterval(healthPollRef.current);
      setIsServerWaking(false);
      setSubmitted(true);
      toast.success('If an account exists, recovery instructions have been sent.');
    } catch (err) {
      const isNetworkError = !err.response;
      const isTimeout = err.code === 'ECONNABORTED';
      const isSleepStatus = err.response && [500, 502, 503, 504].includes(err.response.status);
      const isColdStart = isNetworkError || isTimeout || isSleepStatus;

      setIsServerWaking(false);
      if (isColdStart) {
        const msg = 'Recovery service is connecting. Please try again in a moment.';
        toast(msg, { icon: '⏳' });
      } else {
        const errorMsg = err.response?.data?.message || 'Unable to process recovery request. Please try again.';
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const _startWakingLoop = (targetEmail) => {
    if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
    if (healthPollRef.current) clearInterval(healthPollRef.current);

    setWakingElapsed(0);
    wakingTimerRef.current = setInterval(() => {
      setWakingElapsed(prev => Math.min(prev + 1, 25));
    }, 1000);

    const baseURL = api.defaults.baseURL || 'http://localhost:8080';
    healthPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${baseURL}/health`);
        if (res.ok) {
          clearInterval(healthPollRef.current);
          clearInterval(wakingTimerRef.current);
          toast.success('Server connection established! Sending recovery email...');
          executeForgot(targetEmail);
        }
      } catch {
        // Still waking up
      }
    }, 3000);
  };

  const handleForgot = (e) => {
    e.preventDefault();
    executeForgot(email);
  };

  const handleCancelWaking = () => {
    if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
    if (healthPollRef.current) clearInterval(healthPollRef.current);
    setIsServerWaking(false);
    setLoading(false);
  };

  const handleSimulateAwake = () => {
    if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
    if (healthPollRef.current) clearInterval(healthPollRef.current);
    setIsServerWaking(false);
    setSubmitted(true);
    toast.success('Simulation bypassed! Recovery dispatched.');
  };

  return (
    <AuthLayout variant="onboarding" maxWidth="max-w-[430px]">
      <div className="w-full backdrop-blur-3xl bg-white/90 dark:bg-[#0c0f18]/90 border border-[#EAE4DC] dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden transition-all duration-300 shadow-[0_16px_50px_-12px_rgba(109,40,217,0.12),0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(167,139,250,0.08)] ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.08]">

        {/* Specular highlight border sheen (Royal Amethyst) */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#A78BFA]/70 to-transparent pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-44 h-20 bg-[#A78BFA]/10 dark:bg-[#7C3AED]/20 rounded-full blur-2xl pointer-events-none" />

        {/* ── CARD TOP UTILITY BAR (COMPACT 100VH) ─────────────────────────── */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-3 border-b border-[#EAE4DC]/80 dark:border-white/5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold shadow-2xs">
            <KeyRound size={12} className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono tracking-wide">ACCOUNT RECOVERY</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle size="xs" variant="segmented" />
            <Link
              to="/login"
              className="text-[10px] font-medium text-[#7E6B8F] dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-emerald-300 px-1.5 py-0.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <ArrowLeft size={10} />
              <span>Sign in</span>
            </Link>
          </div>
        </div>

        {isServerWaking ? (
          <AuthServerWakingState
            variant="onboarding"
            elapsed={wakingElapsed}
            onCancel={handleCancelWaking}
            onSimulateAwake={handleSimulateAwake}
          />
        ) : (
          <>
            {/* Heading */}
            <div className="mb-3 sm:mb-4">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                Candidate Credential Service
              </span>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1E293B] dark:text-[#F8FAFC] tracking-tight leading-snug">
                Reset Password
              </h1>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-sans leading-relaxed">
                Enter your registered candidate email address to receive secure recovery instructions.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-[#F0FDF4]/90 dark:bg-emerald-950/30 p-4 text-center font-sans">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="font-serif text-base font-bold text-[#1E293B] dark:text-emerald-100 mb-0.5">
                  Recovery Link Dispatched
                </h3>
                <p className="text-[11px] text-[#475569] dark:text-emerald-300 leading-relaxed mb-3">
                  If an account exists for <strong className="font-mono">{email}</strong>, check your inbox shortly.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => { setSubmitted(false); setEmail(''); }}
                    className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-[#EAE4DC] dark:border-white/10 text-[#475569] dark:text-[#CBD5E1] hover:bg-[#FAF7F2] transition-colors"
                  >
                    Try another email
                  </button>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xs transition-colors"
                  >
                    Return to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-3">
                <div className="group">
                  <label className="block text-[11px] font-semibold text-[#334155] dark:text-[#CBD5E1] mb-1 font-sans">
                    Candidate Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="student1@learniq.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-[40px] sm:min-h-[42px] pl-9 pr-3 py-1.5 sm:py-2 bg-[#FAF7F2]/90 dark:bg-[#07090f]/70 focus:bg-white dark:focus:bg-[#0e121d] border border-[#EAE4DC] dark:border-white/10 rounded-xl text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] text-xs font-medium shadow-2xs outline-none transition-all duration-200 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 dark:focus:ring-emerald-400/20 font-sans"
                    />
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8DA399] group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[40px] sm:min-h-[42px] py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 active:scale-[0.99] text-white font-sans font-bold text-xs shadow-md hover:shadow-emerald-600/25 transition-all duration-150 flex items-center justify-center gap-1.5 mt-1 disabled:opacity-60 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 outline-none"
                >
                  {loading ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Dispatching...</span>
                    </div>
                  ) : (
                    <>
                      <span>Send Recovery Instructions</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-3 pt-2.5 border-t border-[#EAE4DC]/80 dark:border-white/5 text-center font-sans">
              <Link
                to="/login"
                className="text-[10px] text-[#64748B] dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
              >
                Remember your password? Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;
