import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { BRANDING } from '../config/branding';

// Student portal uses vibrant, lighter violet to contrast with admin's deep navy
const STUDENT_COLOR = '#7c3aed';
const STUDENT_ACCENT = '#a78bfa'; // lighter violet accent for interactive elements

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, setIsLoggingIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.token) {
        login({ token: res.data.token, name: res.data.name, role: res.data.role });
        toast.success('Identity Verified.');
        navigate('/student/dashboard');
      }
    } catch (err) {
      if (!err.response) {
        // No response at all — server unreachable, cold start, or network timeout
        toast.error('Server is starting up. Please wait a moment and try again.', { duration: 5000 });
      } else {
        // HTTP response received — show the backend's specific message
        toast.error(err.response?.data?.message || 'Invalid email or password.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#1c1c22',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '18px 20px',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
  };

  const labelStyle = {
    display: 'block',
    color: '#888',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: 10,
  };

  return (
    <AuthLayout 
      panelColor={STUDENT_COLOR}
      accentColor={STUDENT_ACCENT}
      showMobileDecorations={true}
      title={<>ELEVATE YOUR<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>POTENTIAL.</span></>}
      description={<>UNLEASH YOUR CAPABILITIES WITH<br />RESEARCH-BACKED ASSESSMENTS<br />DESIGNED FOR GROWTH.</>}
    >

      {/* Minimal Brand Identity */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <img 
          src={BRANDING.logos.icon} 
          alt="LearnIQ Symbol" 
          className="w-6 h-6 sm:w-8 sm:h-8 object-contain" 
        />
        <div className="flex flex-col min-w-0 justify-center">
          <span className="text-[9px] sm:text-[10px] font-bold text-violet-400 tracking-[0.2em] uppercase leading-none mb-1">
            Unified Identity
          </span>
          <span className="text-sm sm:text-base font-black text-white tracking-widest uppercase opacity-90 leading-none">
            Student Portal
          </span>
        </div>
      </div>

      {/* Responsive Heading */}
      <h2
        style={{
          color: '#fff',
          fontWeight: 900,
          fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          margin: 0,
        }}
      >
        WELCOME BACK
      </h2>

      {/* Subtitle */}
      <p
        style={{
          color: '#666',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginTop: 4,
          marginBottom: 16,
        }}
      >
        SIGN IN TO YOUR ACCOUNT
      </p>

      <form onSubmit={handleLogin}>
        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            style={{ ...inputStyle, padding: '14px 20px' }}
            placeholder="Enter your student email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = `${STUDENT_ACCENT}60`)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.06)')}
            required
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <Link
              to="/forgot-password"
              style={{
                color: STUDENT_ACCENT,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Recover?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              style={{ ...inputStyle, padding: '14px 20px', paddingRight: 52 }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = `${STUDENT_ACCENT}60`)}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.06)')}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#555',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoggingIn}
          className="btn-accent w-full py-4 mt-4 student-btn"
        >
          {isLoggingIn ? (
            <div
              style={{
                width: 20,
                height: 20,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          ) : (
            <span>Sign in →</span>
          )}
        </button>
      </form>

      {/* Footer */}
      <p
        style={{
          color: '#555',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textAlign: 'center',
          marginTop: 20,
          textTransform: 'uppercase',
        }}
      >
        No account?{' '}
        <Link
          to="/register"
          style={{
            color: '#fff',
            fontWeight: 900,
            textDecoration: 'none',
            letterSpacing: '0.08em',
          }}
        >
          REGISTER HERE
        </Link>
      </p>

      {/* Admin link */}
      <p style={{ textAlign: 'center', marginTop: 16 }}>
        <Link
          to="/admin-access"
          style={{
            color: '#333',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#888')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#333')}
        >
          Admin Access
        </Link>
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .student-btn:hover {
          background: #6d28d9 !important;
          transform: translateY(-1px);
          border-color: ${STUDENT_ACCENT}80 !important;
          box-shadow: 0 6px 20px 0 rgba(124,58,237,0.3) !important;
        }
        .student-btn:active {
          background: #5b21b6 !important;
          transform: translateY(0px);
        }
        input::placeholder { color: #2a2a30; }
      `}</style>
    </AuthLayout>
  );
}

export default Login;

