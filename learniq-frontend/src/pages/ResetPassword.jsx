import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, ArrowRight, ShieldCheck, ArrowLeft, Shield } from 'lucide-react';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

const THEME_COLOR = '#7c3aed';
const ACCENT_COLOR = '#a78bfa';

function ResetPassword() {
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      await api.post(`/auth/reset-password`, {
        token,
        password: formData.password
      });
      toast.success('Password updated successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#1c1c22',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '16px 20px',
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

  if (!token) {
    return (
      <AuthLayout 
        panelColor={THEME_COLOR}
        accentColor={ACCENT_COLOR}
        title="INVALID LINK"
        description="The password reset link is missing or has expired."
      >
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <Shield size={48} style={{ color: '#f87171', marginBottom: 16 }} />
            <h3 style={{ color: '#fff', margin: '0 0 8px' }}>Reset Link Error</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
              The security token in your URL is invalid. Please request a new link from the forgot password page.
            </p>
          </div>
          <Link to="/forgot-password" style={{ color: ACCENT_COLOR, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
            ← REQUEST NEW LINK
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      panelColor={THEME_COLOR}
      accentColor={ACCENT_COLOR}
      title={<>SECURE YOUR<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>CREDENTIALS.</span></>}
      description={<>ALMOST THERE. CHOOSE A STRONG NEW<br />PASSWORD TO PROTECT YOUR<br />ASSESSMENT DATA AND HISTORY.</>}
    >
      {/* Reset Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `${ACCENT_COLOR}18`,
            border: `1px solid ${ACCENT_COLOR}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: ACCENT_COLOR,
          }}
        >
          <Shield size={18} />
        </div>
        <span
          style={{
            color: ACCENT_COLOR,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Identity Security
        </span>
      </div>

      {/* Heading */}
      <h2
        style={{
          color: '#fff',
          fontWeight: 900,
          fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          margin: 0,
        }}
      >
        SET NEW PASSWORD
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
        COMPLETE YOUR SECURITY UPDATE
      </p>

      <form onSubmit={handleReset}>
        {/* New Password */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>New Password</label>
          <input
            name="password" type="password" required
            style={inputStyle}
            placeholder="••••••••"
            value={formData.password} onChange={handleChange}
            onFocus={(e) => (e.target.style.borderColor = `${ACCENT_COLOR}60`)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.06)')}
          />
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Confirm New Password</label>
          <input
            name="confirmPassword" type="password" required
            style={inputStyle}
            placeholder="••••••••"
            value={formData.confirmPassword} onChange={handleChange}
            onFocus={(e) => (e.target.style.borderColor = `${ACCENT_COLOR}60`)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.06)')}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-accent w-full py-4 mt-4 reset-btn"
          style={{ borderRadius: 9999 }}
        >
          {loading ? (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Reset Password</span>
              <ArrowRight size={18} />
            </div>
          )}
        </button>
      </form>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link 
          to="/login" 
          style={{
            color: '#555',
            fontSize: 11,
            fontWeight: 700,
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
        >
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .reset-btn:hover {
          background: #6d28d9 !important;
          transform: translateY(-1px);
          border-color: ${ACCENT_COLOR}80 !important;
          box-shadow: 0 6px 20px 0 rgba(124,58,237,0.3) !important;
        }
        .reset-btn:active {
          background: #5b21b6 !important;
          transform: translateY(0px);
        }
        input::placeholder { color: #2a2a30; }
      `}</style>
    </AuthLayout>
  );
}

export default ResetPassword;
