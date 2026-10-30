import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('If an account exists, a reset link has been sent.');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Unable to send reset email. Please try again later.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={<>Restore Your<br /><span className="text-violet-300">Account Access.</span></>}
      description="Initiate a secure password recovery request to regain control of your assessments, results, and learning progress."
      badgeText="Account Recovery"
    >
      <div className="bg-white dark:bg-[#15181e] border border-slate-200 dark:border-[#262a33] rounded-3xl shadow-xl dark:shadow-2xl shadow-slate-200/60 dark:shadow-black/50 p-6 sm:p-9 transition-all">
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-semibold">
            <KeyRound size={15} />
            <span>Account Security</span>
          </div>
          <Link
            to="/login"
            className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={12} />
            <span>Back to sign in</span>
          </Link>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            Reset password
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Enter the email associated with your LearnIQ account to receive recovery instructions.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={22} />
            </div>
            <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">Check your inbox</h3>
            <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-1.5 leading-relaxed">
              If an account with <strong className="font-semibold text-emerald-950 dark:text-emerald-200">{email}</strong> exists, we've dispatched password reset instructions.
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-[#111318] focus:bg-white dark:focus:bg-[#1a1d24] border border-slate-300 dark:border-[#2b303c] rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm shadow-2xs outline-none transition-all focus:border-violet-600 dark:focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 hover:border-slate-400 dark:hover:border-[#3d4454]"
                  placeholder="student@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-xs tracking-wider uppercase shadow-md hover:shadow-violet-500/20 transition-all duration-150 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending instructions...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#262a33] text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Remembered your credentials?{' '}
            <Link to="/login" className="font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
              Sign in directly
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;
