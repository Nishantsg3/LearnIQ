import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, ArrowRight, ShieldCheck, ShieldAlert, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';
import ThemeToggle from '../components/ThemeToggle';

function ResetPassword() {
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (fieldError) setFieldError('');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setFieldError('Password must be at least 6 characters');
      return toast.error('Password must be at least 6 characters');
    }
    if (formData.password !== formData.confirmPassword) {
      setFieldError('Passwords do not match');
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password`, {
        token,
        password: formData.password
      });
      toast.success('Password updated successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. Link may be expired.';
      setFieldError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout variant="onboarding" maxWidth="max-w-[430px]">
        <div className="w-full backdrop-blur-3xl bg-white/90 dark:bg-[#0c0f18]/90 border border-[#EAE4DC] dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 text-center font-sans relative overflow-hidden shadow-[0_16px_50px_-12px_rgba(244,63,94,0.12)] ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.08]">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert size={24} />
          </div>
          <h2 className="font-serif text-lg font-bold text-[#1E293B] dark:text-[#F8FAFC] mb-1">Invalid or Expired Token</h2>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-4 leading-relaxed">
            The security token in your URL is invalid or has timed out. Please request a new recovery link.
          </p>
          <Link
            to="/forgot-password"
            className="w-full min-h-[40px] py-2 px-4 rounded-xl bg-gradient-to-r from-[#F43F5E] to-[#F59E0B] text-white font-sans font-bold text-xs shadow-md transition-all inline-flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#F43F5E] outline-none"
          >
            <ArrowLeft size={13} />
            <span>Request New Reset Link</span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="onboarding" maxWidth="max-w-[430px]">
      <div className="w-full backdrop-blur-3xl bg-white/90 dark:bg-[#0c0f18]/90 border border-[#EAE4DC] dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden transition-all duration-300 shadow-[0_16px_50px_-12px_rgba(244,63,94,0.12),0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(244,63,94,0.08)] ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.08]">

        {/* Specular highlight border sheen */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F43F5E]/70 dark:via-[#FB7185]/70 to-transparent pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-44 h-20 bg-[#F43F5E]/10 dark:bg-[#F43F5E]/15 rounded-full blur-2xl pointer-events-none" />

        {/* ── CARD TOP UTILITY BAR (COMPACT 100VH) ─────────────────────────── */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-3 border-b border-[#EAE4DC]/80 dark:border-white/5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF1F2] dark:bg-[#881337]/30 border border-[#FFE4E6] dark:border-[#9F1239]/50 text-[#F43F5E] dark:text-[#FDA4AF] text-[10px] font-semibold shadow-2xs">
            <ShieldCheck size={12} className="text-[#F43F5E] dark:text-[#FB7185]" />
            <span className="font-mono tracking-wide">SECURITY UPDATE</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle size="xs" variant="segmented" />
            <Link
              to="/login"
              className="text-[10px] font-medium text-[#7E6B8F] dark:text-[#94A3B8] hover:text-[#F43F5E] dark:hover:text-[#FDA4AF] px-1.5 py-0.5 rounded hover:bg-[#FFF1F2] dark:hover:bg-[#881337]/30 transition-colors flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-[#F43F5E]"
            >
              <ArrowLeft size={10} />
              <span>Cancel</span>
            </Link>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-3 sm:mb-4">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#F43F5E] dark:text-[#FB7185] block mb-0.5">
            Candidate Security Desk
          </span>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1E293B] dark:text-[#F8FAFC] tracking-tight leading-snug">
            Create New Password
          </h1>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-sans leading-relaxed">
            Enter and confirm your new candidate password below.
          </p>
        </div>

        {fieldError && (
          <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-1.5 animate-in fade-in duration-150 font-sans">
            <span className="text-rose-600 dark:text-rose-400 font-bold text-xs">⚠</span>
            <span className="text-[10px] text-rose-700 dark:text-rose-300">{fieldError}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-3 font-sans">
          {/* New Password */}
          <div className="group">
            <label className="block text-[11px] font-semibold text-[#334155] dark:text-[#CBD5E1] mb-1 font-sans">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="w-full min-h-[40px] sm:min-h-[42px] pl-9 pr-10 py-1.5 sm:py-2 bg-[#FAF7F2]/90 dark:bg-[#07090f]/70 focus:bg-white dark:focus:bg-[#0e121d] border border-[#EAE4DC] dark:border-white/10 rounded-xl text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] text-xs font-medium shadow-2xs outline-none transition-all duration-200 focus:border-[#F43F5E] dark:focus:border-[#FB7185] focus:ring-4 focus:ring-[#F43F5E]/15 dark:focus:ring-[#F43F5E]/20 font-sans"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8DA399] group-focus-within:text-[#F43F5E] dark:group-focus-within:text-[#FB7185] transition-colors pointer-events-none" size={15} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#334155] dark:hover:text-[#F1F5F9] transition-colors rounded outline-none"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="group">
            <label className="block text-[11px] font-semibold text-[#334155] dark:text-[#CBD5E1] mb-1 font-sans">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="w-full min-h-[40px] sm:min-h-[42px] pl-9 pr-10 py-1.5 sm:py-2 bg-[#FAF7F2]/90 dark:bg-[#07090f]/70 focus:bg-white dark:focus:bg-[#0e121d] border border-[#EAE4DC] dark:border-white/10 rounded-xl text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] text-xs font-medium shadow-2xs outline-none transition-all duration-200 focus:border-[#F43F5E] dark:focus:border-[#FB7185] focus:ring-4 focus:ring-[#F43F5E]/15 dark:focus:ring-[#F43F5E]/20 font-sans"
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8DA399] group-focus-within:text-[#F43F5E] dark:group-focus-within:text-[#FB7185] transition-colors pointer-events-none" size={15} />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#334155] dark:hover:text-[#F1F5F9] transition-colors rounded outline-none"
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[40px] sm:min-h-[42px] py-2 px-4 rounded-xl bg-gradient-to-r from-[#F43F5E] via-[#FB7185] to-[#F59E0B] hover:opacity-95 active:scale-[0.99] text-white font-sans font-bold text-xs shadow-md hover:shadow-[#F43F5E]/20 transition-all duration-150 flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F43F5E] outline-none"
          >
            {loading ? (
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating password...</span>
              </div>
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}

export default ResetPassword;
