import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/auth/forgot-password?email=${email}`);
      toast.success('Reset code sent to your email');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      headline="Recover access." 
      tagline="Enter your email and we'll send you instructions to reset your password and secure your account."
    >
      <div className="card-base p-8 lg:p-10">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 text-white mb-4">
             <KeyRound size={20} />
          </div>
          <h2 className="text-2xl font-bold text-slate-50">Forgot password?</h2>
          <p className="text-slate-500 text-sm mt-1">No worries, we'll send reset instructions.</p>
        </div>

        <form onSubmit={handleForgot} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                className="input-base pl-11"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3.5 group"
          >
            {loading ? 'Sending...' : 'Send reset instructions'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#1f2937] text-center">
          <Link to="/login" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-2 transition-colors">
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;

