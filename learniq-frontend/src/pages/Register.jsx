import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, GraduationCap } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';


const STUDENT_COLOR = '#7c3aed';
const STUDENT_ACCENT = '#a78bfa';

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

  const inputStyle = {
    width: '100%',
    background: '#1c1c22',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '14px 20px',
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
      title={<>JOIN THE<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>REVOLUTION.</span></>}
      description={<>BECOME PART OF A GROWING ECOSYSTEM<br />OF PROFESSIONALS DRIVEN BY<br />PRECISION AND EXCELLENCE.</>}
    >
      {/* Student badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `${STUDENT_ACCENT}18`,
            border: `1px solid ${STUDENT_ACCENT}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: STUDENT_ACCENT,
          }}
        >
          <GraduationCap size={18} />
        </div>
        <span
          style={{
            color: STUDENT_ACCENT,
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
        CREATE ACCOUNT
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
        START YOUR PROFESSIONAL JOURNEY
      </p>

      <form onSubmit={handleRegister}>
        {/* Full Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Full Name</label>
          <input
            name="name"
            type="text"
            style={inputStyle}
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            onFocus={(e) => (e.target.style.borderColor = `${STUDENT_ACCENT}60`)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.06)')}
            required
          />
        </div>

        {/* Email Address */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            name="email"
            type="email"
            style={{ 
              ...inputStyle, 
              borderColor: fieldErrors.email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)' 
            }}
            placeholder="name@company.com"
            value={formData.email}
            onChange={handleChange}
            onFocus={(e) => (e.target.style.borderColor = `${STUDENT_ACCENT}60`)}
            onBlur={(e) => (e.target.style.borderColor = fieldErrors.email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)')}
            required
          />
          {fieldErrors.email && <p style={{ color: '#f87171', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>{fieldErrors.email}</p>}
        </div>

        {/* Password Group */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Password */}
          <div style={{ spaceY: 2 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                style={{ 
                  ...inputStyle, 
                  paddingRight: 48,
                  borderColor: fieldErrors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)' 
                }}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onFocus={(e) => (e.target.style.borderColor = `${STUDENT_ACCENT}60`)}
                onBlur={(e) => (e.target.style.borderColor = fieldErrors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <p style={{ color: '#f87171', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>{fieldErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ spaceY: 2 }}>
            <label style={labelStyle}>Confirm</label>
            <div style={{ position: 'relative' }}>
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                style={{ 
                  ...inputStyle, 
                  paddingRight: 48,
                  borderColor: fieldErrors.confirmPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)' 
                }}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={(e) => (e.target.style.borderColor = `${STUDENT_ACCENT}60`)}
                onBlur={(e) => (e.target.style.borderColor = fieldErrors.confirmPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)')}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p style={{ color: '#f87171', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>{fieldErrors.confirmPassword}</p>}
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{error}</p>}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isLoggingIn}
          className="btn-accent w-full py-4 mt-2 student-btn"
        >
          {isLoggingIn ? (
            <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span>Create Account</span>
              <ArrowRight size={18} />
            </div>
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
          marginTop: 24,
          textTransform: 'uppercase',
        }}
      >
        Already have an account?{' '}
        <Link
          to="/login"
          style={{
            color: '#fff',
            fontWeight: 900,
            textDecoration: 'none',
            letterSpacing: '0.08em',
          }}
        >
          SIGN IN
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

export default Register;