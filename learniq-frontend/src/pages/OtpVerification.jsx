import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

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
    } catch (err) {
      toast.error('Failed to resend code');
    }
  };

  return (
    <AuthLayout 
      headline="Verify your identity." 
      tagline={`We've sent a 6-digit code to ${email}. Please enter it below to continue.`}
    >
      <div className="card-base p-8 lg:p-10">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-4">
             <ShieldCheck size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-50">Email Verification</h2>
          <p className="text-slate-500 text-sm mt-1">Enter the 6-digit code received</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-8">
          <div className="space-y-2">
            <input
              type="text"
              maxLength="6"
              className="w-full px-4 py-5 bg-slate-900 border border-[#1f2937] rounded-xl text-center text-3xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-800 text-slate-50"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || otp.length < 6}
            className="w-full btn-primary py-3.5"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-[#1f2937] text-center">
          <p className="text-sm text-slate-500 font-medium mb-4">
            Didn't receive the code? 
          </p>
          <button 
            onClick={resendOtp}
            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw size={14} /> Resend verification code
          </button>
          <div className="mt-6">
             <Link to="/register" className="text-xs font-semibold text-slate-600 hover:text-slate-400">
                Back to registration
             </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default OtpVerification;

