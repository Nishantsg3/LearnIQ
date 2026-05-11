import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';


function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const { isLoggingIn, setIsLoggingIn } = useAuth();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let err = "";
    if (name === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
      err = "Invalid email format";
    }
    if (name === "password" && value && value.length < 6) {
      err = "Minimum 6 characters required";
    }
    if (name === "confirmPassword" && value && value !== formData.password) {
      err = "Passwords do not match";
    }
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
    if (error) setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Final validation check before submit
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoggingIn(true);

    try {
      const res = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      toast.success("Account created successfully!");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Registration failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-white uppercase tracking-tight leading-[0.9]">Create<br />Account</h2>
          <p className="text-zinc-500 font-bold text-[10px] tracking-widest uppercase mt-3">Start your professional journey</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
            <input
              name="name"
              type="text"
              className="w-full bg-[#161618] border border-white/5 rounded-xl px-6 py-3.5 text-white placeholder:text-zinc-700 outline-none focus:border-[#6366f1]/50 transition-all text-sm"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
            <input
              name="email"
              type="email"
              className={`w-full bg-[#161618] border rounded-xl px-6 py-3.5 text-white placeholder:text-zinc-700 outline-none transition-all text-sm ${
                fieldErrors.email ? 'border-red-500/50' : 'border-white/5 focus:border-[#6366f1]/50'
              }`}
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {fieldErrors.email && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{fieldErrors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`w-full bg-[#161618] border rounded-xl px-6 py-3.5 text-white placeholder:text-zinc-700 outline-none transition-all text-sm ${
                    fieldErrors.password ? 'border-red-500/50' : 'border-white/5 focus:border-[#6366f1]/50'
                  }`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confirm</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full bg-[#161618] border rounded-xl px-6 py-3.5 text-white placeholder:text-zinc-700 outline-none transition-all text-sm ${
                    fieldErrors.confirmPassword ? 'border-red-500/50' : 'border-white/5 focus:border-[#6366f1]/50'
                  }`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-[11px] font-bold uppercase tracking-widest">{error}</p>}

          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="btn-primary w-full py-4 mt-2"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="text-lg">Create Account</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-4 text-center">
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
             Already have an account? <Link to="/login" className="text-white hover:text-[#6366f1] transition-all ml-1 border-b border-white/20 hover:border-[#6366f1]">Sign In</Link>
           </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Register;