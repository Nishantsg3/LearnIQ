import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

const THEME_COLOR = '#7c3aed';
const ACCENT_COLOR = '#a78bfa';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('If an account exists, a reset link has been sent.');
      // No navigation here, user stays on page to see instructions
    } catch (err) {
      // Still show success to prevent email enumeration
      toast.success('If an account exists, a reset link has been sent.');
    } finally {
      setLoading(false);
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
      accentColor={ACCENT_COLOR}
      showMobileDecorations={true}
      title={<>RESTORE YOUR<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>ACCESS.</span></>}
      description={<>INITIATE SECURE RECOVERY TO REGAIN<br />CONTROL OF YOUR LEARNING<br />AND ASSESSMENT DATA.</>}
    >
      {/* Recovery Badge */}
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
          <KeyRound size={18} />
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
          Account Recovery
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
        RECOVER
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
        RESET INSTRUCTIONS WILL BE SENT
      </p>

      <form onSubmit={handleForgot}>
        {/* Email */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            style={{ ...inputStyle, padding: '14px 20px' }}
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = `${ACCENT_COLOR}60`)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.06)')}
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-accent w-full py-4 mt-4 recovery-btn"
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
              <span>Send Instructions</span>
              <ArrowRight size={18} />
            </div>
          )}
        </button>
      </form>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
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
        .recovery-btn:hover {
          background: #6d28d9 !important;
          transform: translateY(-1px);
          border-color: ${ACCENT_COLOR}80 !important;
          box-shadow: 0 6px 20px 0 rgba(124,58,237,0.3) !important;
        }
        .recovery-btn:active {
          background: #5b21b6 !important;
          transform: translateY(0px);
        }
        input::placeholder { color: #2a2a30; }
      `}</style>
    </AuthLayout>
  );
}

export default ForgotPassword;

