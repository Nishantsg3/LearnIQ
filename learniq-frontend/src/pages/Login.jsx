import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login({
        token: res.data.token,
        name: res.data.name,
        role: res.data.role
      });
      toast.success('Welcome back!');
      navigate(res.data.role === 'ADMIN' ? '/admin-dashboard' : '/student-dashboard');

    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      headline="Precision in assessment." 
      tagline="Login to your professional dashboard and manage your test journey."
    >
      <div className="card-base p-8 lg:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-50">Welcome back</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
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

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <Link to="/forgot-password" smoky="true" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                Forgot password?
              </Link>
            </div>
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
            className="w-full btn-primary py-3.5 group"
          >
            {loading ? 'Authenticating...' : 'Sign in'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-[#1f2937] text-center">
          <p className="text-sm text-slate-500 font-medium">
            No account yet? <Link to="/register" className="text-indigo-400 font-bold hover:underline">Register here</Link>
          </p>
          <div className="mt-6">
             <Link to="/admin-access" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-all">
                Restricted Admin Access
             </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
