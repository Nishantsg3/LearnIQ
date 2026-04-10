import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ArrowRight, UserPlus2 } from 'lucide-react';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (formData.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      toast.success('Registration successful. Please verify OTP.');
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      headline="Grow your potential." 
      tagline="Join thousands of students preparing for their dream careers with LearnIQ."
    >
      <div className="card-base p-8 lg:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-50">Create account</h2>
          <p className="text-slate-500 text-sm mt-1">Start your assessment journey today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                name="name" type="text" required
                className="input-base pl-11"
                placeholder="John Doe"
                value={formData.name} onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                name="email" type="email" required
                className="input-base pl-11"
                placeholder="name@company.com"
                value={formData.email} onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  name="password" type="password" required
                  className="input-base pl-11"
                  placeholder="••••••••"
                  value={formData.password} onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm</label>
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
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3.5 group mt-4"
          >
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#1f2937] text-center">
          <p className="text-sm text-slate-500 font-medium">
            Already have an account? <Link to="/login" className="text-indigo-400 font-bold hover:underline transition-all">Sign in</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Register;
