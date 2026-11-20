import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';
import ThemeToggle from '../components/ThemeToggle';

function OtpVerification() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please register again.');
      navigate('/register');
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('Verification successful. You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new verification code has been sent');
    } catch {
      toast.error('Failed to resend code');
    }
  };

  return (
    <AuthLayout variant="onboarding" maxWidth="max-w-[430px]">
      <div className="w-full backdrop-blur-3xl bg-white/90 dark:bg-[#0c0f18]/90 border border-[#EAE4DC] dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden transition-all duration-300 shadow-[0_16px_50px_-12px_rgba(244,63,94,0.12),0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(244,63,94,0.08)] ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.08]">

        {/* Specular highlight border sheen */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F43F5E]/70 dark:via-[#FB7185]/70 to-transparent pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-44 h-20 bg-[#F43F5E]/10 dark:bg-[#FB7185]/15 rounded-full blur-2xl pointer-events-none" />

        {/* ── CARD TOP UTILITY BAR (COMPACT 100VH) ─────────────────────────── */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-3 border-b border-[#EAE4DC]/80 dark:border-white/5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-[#F43F5E] dark:text-[#FB7185] text-[10px] font-semibold shadow-2xs">
            <ShieldCheck size={12} className="text-[#F43F5E] dark:text-[#FB7185]" />
            <span className="font-mono tracking-wide">TWO-STEP VERIFICATION</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle size="xs" variant="segmented" />
            <Link
              to="/register"
              className="text-[10px] font-medium text-[#7E6B8F] dark:text-[#94A3B8] hover:text-[#F43F5E] dark:hover:text-[#FB7185] px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-[#F43F5E]"
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
            Enter 6-Digit Code
          </h1>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-sans leading-relaxed">
            Passkey dispatched to <strong className="font-semibold text-[#1E293B] dark:text-[#F1F5F9] font-mono">{email}</strong>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 font-sans">
          <div>
            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              className="w-full min-h-[52px] sm:min-h-[58px] px-3 py-2 bg-[#FAF7F2]/90 dark:bg-[#07090f]/70 border-2 border-[#EAE4DC] dark:border-white/10 rounded-2xl text-center text-2xl sm:text-3xl font-mono font-bold tracking-[0.35em] text-[#1E293B] dark:text-[#F8FAFC] focus:bg-white dark:focus:bg-[#0e121d] focus:border-[#F43F5E] dark:focus:border-[#FB7185] focus:ring-4 focus:ring-[#F43F5E]/15 dark:focus:ring-[#FB7185]/20 outline-none transition placeholder:text-[#94A3B8] shadow-inner"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full min-h-[40px] sm:min-h-[42px] py-2 px-4 rounded-xl bg-gradient-to-r from-[#F43F5E] to-[#F59E0B] hover:from-[#E11D48] hover:to-[#D97706] active:scale-[0.99] text-white font-sans font-bold text-xs shadow-md hover:shadow-[#F43F5E]/20 transition-all duration-150 flex items-center justify-center gap-1.5 mt-1 disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F43F5E] outline-none"
          >
            {loading ? (
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying passkey...</span>
              </div>
            ) : (
              <>
                <span>Verify & Activate Candidate</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        <div className="mt-3 pt-2.5 border-t border-[#EAE4DC]/80 dark:border-white/5 text-center font-sans">
          <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mb-1.5">
            Didn't receive the passkey email?
          </p>
          <button
            type="button"
            onClick={resendOtp}
            className="min-h-[28px] px-3 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-white bg-emerald-50/90 dark:bg-emerald-950/60 hover:bg-emerald-100/90 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 font-sans shadow-2xs"
          >
            <RefreshCw size={11} />
            <span>Resend verification code</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default OtpVerification;
