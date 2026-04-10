import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

function ResetPassword() {
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      await api.post(`/auth/reset-password`, {
        email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      headline="Secure your account." 
      tagline="Almost there. Choose a strong new password to protect your assessment data and history."
    >
      <div className="card-base p-8 lg:p-10">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-4">
             <ShieldCheck size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-50">Set new password</h2>
          <p className="text-slate-500 text-sm mt-1">Complete your security update</p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Verification Code</label>
            <input
              name="otp" type="text" maxLength="6" required
              className="w-full px-4 py-4 bg-slate-900 border border-[#1f2937] rounded-xl text-center text-2xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-50"
              placeholder="000000"
              value={formData.otp} onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                name="newPassword" type="password" required
                className="input-base pl-11"
                placeholder="••••••••"
                value={formData.newPassword} onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                name="confirmPassword" type="password" required
                className="input-base pl-11"
                placeholder="••••••••"
                value={formData.confirmPassword} onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3.5 group mt-4"
          >
            {loading ? 'Updating security...' : 'Reset Password'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#1f2937] text-center">
          <Link to="/login" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
             Return to login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default ResetPassword;
