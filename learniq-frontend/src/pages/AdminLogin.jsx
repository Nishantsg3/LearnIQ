import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/admin-login', { email, password });
      login({
        token: res.data.token,
        name: res.data.name,
        role: res.data.role
      });
      toast.success('Admin access granted');
      navigate('/admin-dashboard');

    } catch (err) {
      toast.error('Unauthorized: Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      headline="Administrative Console." 
      tagline="Secure access for assessment administrators and proctors."
    >
      <div className="card-base p-8 lg:p-10">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 text-white mb-4">
             <ShieldCheck size={20} />
          </div>
          <h2 className="text-2xl font-bold text-slate-50">Admin access</h2>
          <p className="text-slate-500 text-sm mt-1">Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                className="input-base pl-11"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                className="input-base pl-11"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3.5 group mt-2"
          >
            {loading ? 'Verifying...' : 'Login as Admin'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#1f2937] text-center">
          <Link to="/login" className="text-sm font-semibold text-indigo-400 hover:underline">
            Return to user login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default AdminLogin;
