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
    <AuthLayout>
      <div className="space-y-10">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[#6366f1] mb-4">
             <KeyRound size={24} />
          </div>
          <h2 className="text-6xl font-black text-white uppercase tracking-tight">Recover</h2>
          <p className="text-zinc-500 font-bold text-xs tracking-widest uppercase mt-4">Reset instructions will be sent</p>
        </div>

        {/* Form */}
        <form onSubmit={handleForgot} className="space-y-8">
          
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
            <input
              type="email"
              className="w-full bg-[#161618] border border-white/5 rounded-xl px-6 py-5 text-white placeholder:text-zinc-700 outline-none focus:border-[#6366f1]/50 transition-all"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-[#6366f1] text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-[#4f46e5] transition-all duration-300 group active:scale-[0.98] shadow-xl shadow-indigo-500/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="text-lg">Send Instructions</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-4 text-center">
          <Link to="/login" className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-all inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;

