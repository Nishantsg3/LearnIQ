import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const THEME_COLOR = '#7c3aed';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn, setIsLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.token) {
        login({ token: res.data.token, name: res.data.name, role: res.data.role });
        navigate(res.data.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
        toast.success('Access Authenticated.');
      }
    } catch (err) {
      toast.error('Identity Verification Failed');
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
      panelColor={THEME_COLOR}
      title={<>ELEVATE YOUR<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>POTENTIAL.</span></>}
      description={<>UNLEASH YOUR CAPABILITIES WITH<br />RESEARCH-BACKED ASSESSMENTS<br />DESIGNED FOR GROWTH.</>}
    >
      {/* Student Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `${THEME_COLOR}18`,
            border: `1px solid ${THEME_COLOR}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: THEME_COLOR,
          }}
        >
          <GraduationCap size={18} />
        </div>
        <span
          style={{
            color: THEME_COLOR,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Student Portal
        </span>
      </div>

      {/* Heading */}
      <h2
        style={{
          color: '#fff',
          fontWeight: 900,
          fontSize: 'clamp(2rem, 4vw, 2.8rem)',
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
          marginTop: 6,
          marginBottom: 20,
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
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = `${THEME_COLOR}60`)}
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
                color: THEME_COLOR,
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
              onFocus={(e) => (e.target.style.borderColor = `${THEME_COLOR}60`)}
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
          className="submit-btn"
          style={{
            width: '100%',
            background: THEME_COLOR,
            border: `1px solid ${THEME_COLOR}40`,
            borderRadius: 12,
            padding: '14px 20px',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: isLoggingIn ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
            opacity: isLoggingIn ? 0.7 : 1,
            boxShadow: `0 4px 14px 0 ${THEME_COLOR}40`,
          }}
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
        .submit-btn:hover {
          background: #6d28d9 !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px 0 #7c3aed60 !important;
        }
        .submit-btn:active {
          background: #5b21b6 !important;
          transform: translateY(0px);
        }
        input::placeholder { color: #444; }
      `}</style>
    </AuthLayout>
  );
}

export default Login;

