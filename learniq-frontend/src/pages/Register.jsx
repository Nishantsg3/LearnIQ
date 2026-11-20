import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, GraduationCap, AlertCircle } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import ThemeToggle from '../components/ThemeToggle';
import AuthServerWakingState from '../components/AuthServerWakingState';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const { isLoggingIn, setIsLoggingIn } = useAuth();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dedicated Server Cold-Start Waking State
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [wakingElapsed, setWakingElapsed] = useState(0);
  const wakingTimerRef = useRef(null);
  const healthPollRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
      if (healthPollRef.current) clearInterval(healthPollRef.current);
    };
  }, []);

  const validateField = (name, value) => {
    let err = "";
    if (name === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
      err = "Invalid email format";
    }
    if (name === "password" && value && value.length < 6) {
      err = "Min 6 chars";
    }
    if (name === "confirmPassword" && value && value !== formData.password) {
      err = "Passwords do not match";
    }
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
    if (error) setError("");
  };

  const executeRegister = async () => {
    setIsLoggingIn(true);
    try {
      await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
      if (healthPollRef.current) clearInterval(healthPollRef.current);
      setIsServerWaking(false);

      toast.success("Account created successfully!");
      navigate("/login");
    } catch (err) {
      const isNetworkError = !err.response;
      const isTimeout = err.code === 'ECONNABORTED';
      const isSleepStatus = err.response && [500, 502, 503, 504].includes(err.response.status);
      const isColdStart = isNetworkError || isTimeout || isSleepStatus;

      setIsServerWaking(false);
      if (isColdStart) {
        const msg = "Enrollment servers are connecting. Please try again in a moment.";
        setError(msg);
        toast(msg, { icon: '⏳' });
      } else {
        const msg = err.response?.data?.message || err.message || "Registration failed";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const _startWakingLoop = () => {
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
          toast.success('Server connection established! Completing registration...');
          executeRegister();
        }
      } catch {
        // Still waking up
      }
    }, 3000);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    executeRegister();
  };

  const handleCancelWaking = () => {
    if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
    if (healthPollRef.current) clearInterval(healthPollRef.current);
    setIsServerWaking(false);
    setIsLoggingIn(false);
  };

  const handleSimulateAwake = () => {
    if (wakingTimerRef.current) clearInterval(wakingTimerRef.current);
    if (healthPollRef.current) clearInterval(healthPollRef.current);
    setIsServerWaking(false);
    toast.success("Simulation bypassed! Redirecting to login...");
    navigate("/login");
  };

  return (
    <AuthLayout variant="onboarding" maxWidth="max-w-[450px]">
      <div className="w-full backdrop-blur-3xl bg-white/90 dark:bg-[#0c0f18]/90 border border-[#EAE4DC] dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300 shadow-[0_16px_50px_-12px_rgba(109,40,217,0.12),0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(167,139,250,0.08)] ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.08]">

        {/* Specular highlight border sheen (Royal Amethyst) */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#A78BFA]/70 to-transparent pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-44 h-20 bg-[#A78BFA]/10 dark:bg-[#7C3AED]/20 rounded-full blur-2xl pointer-events-none" />

        {/* ── CARD TOP UTILITY BAR (COMPACT 100VH) ─────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-2 sm:pb-2.5 sm:mb-2.5 border-b border-[#EAE4DC]/80 dark:border-white/5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5F3FF] dark:bg-[#2E1065] border border-[#DDD6FE] dark:border-[#5B21B6] text-[#6D28D9] dark:text-[#C4B5FD] text-[10px] font-semibold shadow-2xs">
            <GraduationCap size={12} className="text-[#6D28D9] dark:text-[#A78BFA]" />
            <span className="font-mono tracking-wide">CANDIDATE ENROLLMENT</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle size="xs" variant="segmented" />
            <Link
              to="/login"
              className="text-[10px] font-medium text-[#7E6B8F] dark:text-[#94A3B8] hover:text-[#6D28D9] dark:hover:text-[#C4B5FD] px-1.5 py-0.5 rounded hover:bg-[#F5F3FF] dark:hover:bg-[#2E1065] transition-colors flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"
            >
              <span>Sign in</span>
              <ArrowRight size={10} />
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
            {/* Heading (Compact) */}
            <div className="mb-2.5 sm:mb-3">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#F43F5E] dark:text-[#FB7185] block mb-0.5">
                Candidate Registration Gate
              </span>
              <h1 className="font-serif text-lg sm:text-xl font-bold text-[#1E293B] dark:text-[#F8FAFC] tracking-tight leading-snug">
                Create Candidate Account
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-sans leading-relaxed">
                Enroll to access standardized testing, adaptive drills, and analytics.
              </p>
            </div>

            {error && (
              <div className="mb-2.5 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-1.5 animate-in fade-in duration-150">
                <AlertCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 font-sans">
                  <p className="text-[10px] font-bold text-rose-800 dark:text-rose-200 leading-tight">Registration Error</p>
                  <p className="text-[9px] text-rose-700 dark:text-rose-300 leading-relaxed font-normal">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-2 sm:space-y-2.5">
              {/* Row 1: Legal Name + Email in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Full Name */}
                <div className="group">
                  <label className="block text-[10px] font-semibold text-[#334155] dark:text-[#CBD5E1] mb-0.5 font-sans">
                    Legal Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      className="w-full min-h-[38px] pl-8 pr-2.5 py-1.5 bg-[#FAF7F2]/90 dark:bg-[#07090f]/70 focus:bg-white dark:focus:bg-[#0e121d] border border-[#EAE4DC] dark:border-white/10 rounded-xl text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] text-xs font-medium shadow-2xs outline-none transition-all duration-200 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 dark:focus:ring-emerald-400/20 font-sans"
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8DA399] group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                  </div>
                </div>

                {/* Email */}
                <div className="group">
                  <div className="flex justify-between items-center mb-0.5 font-sans">
                    <label className="block text-[10px] font-semibold text-[#334155] dark:text-[#CBD5E1]">
                      Email Address
                    </label>
                    {fieldErrors.email && (
                      <span className="text-[9px] text-rose-500 font-medium">{fieldErrors.email}</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      className="w-full min-h-[38px] pl-8 pr-2.5 py-1.5 bg-[#FAF7F2]/90 dark:bg-[#07090f]/70 focus:bg-white dark:focus:bg-[#0e121d] border border-[#EAE4DC] dark:border-white/10 rounded-xl text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] text-xs font-medium shadow-2xs outline-none transition-all duration-200 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 dark:focus:ring-emerald-400/20 font-sans"
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8DA399] group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="group">
                <div className="flex justify-between items-center mb-0.5 font-sans">
                  <label className="block text-[10px] font-semibold text-[#334155] dark:text-[#CBD5E1]">
                    Create Password
                  </label>
                  {fieldErrors.password && (
                    <span className="text-[9px] text-rose-500 font-medium">{fieldErrors.password}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="w-full min-h-[38px] pl-8 pr-9 py-1.5 bg-[#FAF7F2]/90 dark:bg-[#07090f]/70 focus:bg-white dark:focus:bg-[#0e121d] border border-[#EAE4DC] dark:border-white/10 rounded-xl text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] text-xs font-medium shadow-2xs outline-none transition-all duration-200 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 dark:focus:ring-emerald-400/20 font-sans"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <Lock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8DA399] group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-[#94A3B8] hover:text-[#334155] dark:hover:text-[#F1F5F9] transition-colors rounded outline-none"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="group">
                <div className="flex justify-between items-center mb-0.5 font-sans">
                  <label className="block text-[10px] font-semibold text-[#334155] dark:text-[#CBD5E1]">
                    Confirm Password
                  </label>
                  {fieldErrors.confirmPassword && (
                    <span className="text-[9px] text-rose-500 font-medium">{fieldErrors.confirmPassword}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="w-full min-h-[38px] pl-8 pr-9 py-1.5 bg-[#FAF7F2]/90 dark:bg-[#07090f]/70 focus:bg-white dark:focus:bg-[#0e121d] border border-[#EAE4DC] dark:border-white/10 rounded-xl text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] text-xs font-medium shadow-2xs outline-none transition-all duration-200 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 dark:focus:ring-emerald-400/20 font-sans"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <Lock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8DA399] group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-[#94A3B8] hover:text-[#334155] dark:hover:text-[#F1F5F9] transition-colors rounded outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full min-h-[38px] py-1.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 active:scale-[0.99] text-white font-sans font-bold text-xs shadow-md hover:shadow-emerald-600/25 transition-all duration-150 flex items-center justify-center gap-1.5 mt-1 disabled:opacity-60 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 outline-none"
              >
                {isLoggingIn ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enrolling...</span>
                  </div>
                ) : (
                  <>
                    <span>Complete Enrollment</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Sign In */}
            <div className="mt-2 pt-2 border-t border-[#EAE4DC]/80 dark:border-white/5 text-center font-sans">
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium">
                Already registered?{' '}
                <Link
                  to="/login"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-1 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded outline-none"
                >
                  Sign in to portal
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default Register;
