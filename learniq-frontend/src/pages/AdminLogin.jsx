import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const INSTITUTE_CODE = 'LEARNIQ@ADMIN2026'

function AdminLogin() {
    const [step, setStep] = useState(1)
    const [code, setCode] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleCodeVerify = (e) => {
        e.preventDefault()
        if (code === INSTITUTE_CODE) {
            toast.success('Code verified!')
            setStep(2)
        } else {
            toast.error('Invalid institute code')
            setCode('')
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await axios.post('https://learniq-rz0t.onrender.com/api/auth/login', { email, password })
            if (res.data.role !== 'ADMIN') {
                toast.error('Access denied. Admin credentials required.')
                setLoading(false)
                return
            }
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('role', res.data.role)
            localStorage.setItem('name', res.data.name)
            toast.success('Welcome, Admin!')
            navigate('/admin-dashboard')
        } catch {
            toast.error('Invalid credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="split-layout">
            <div className="dark-panel" style={{ background: '#0a0a0a' }}>
                <div>
                    <div className="brand" style={{ color: '#fff' }}>
                        Learn<span style={{ color: '#7c3aed' }}>IQ</span>
                    </div>
                    <div className="tagline" style={{ color: '#888' }}>
                        Institute administration portal<br />Restricted access only
                    </div>
                </div>
                <div className="big-text" style={{ color: '#fff' }}>
                    Manage tests.<br />
                    <span style={{ color: '#7c3aed' }}>Track results.</span>
                </div>
            </div>

            <div className="form-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></div>
                    <span style={{ fontSize: '11px', color: '#999', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                        Admin Portal · Step {step} of 2
                    </span>
                </div>

                {step === 1 ? (
                    <>
                        <h2 style={{ color: '#111' }}>Institute verification</h2>
                        <p className="sub" style={{ color: '#666' }}>
                            Enter the secret code provided by your institute to proceed
                        </p>
                        <form onSubmit={handleCodeVerify}>
                            <div className="form-group">
                                <label>Institute secret code</label>
                                <input
                                    type="password"
                                    placeholder="Enter secret code"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <button className="btn-primary" type="submit">
                                Verify code
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: '8px', padding: '10px 14px', marginBottom: '20px'
                        }}>
                            <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: '500' }}>
                                ✓ Institute code verified
                            </span>
                        </div>
                        <h2 style={{ color: '#111' }}>Admin sign in</h2>
                        <p className="sub" style={{ color: '#666' }}>
                            Enter your administrator credentials
                        </p>
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label>Admin email</label>
                                <input
                                    type="email"
                                    placeholder="admin@institute.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="btn-primary" type="submit" disabled={loading}>
                                {loading ? 'Verifying...' : 'Access dashboard'}
                            </button>
                        </form>
                    </>
                )}

                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px' }}>
                    <Link to="/login" style={{ color: '#555', fontWeight: '500' }}>
                        ← Back to student login
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default AdminLogin
// The secret code is `LEARNIQ@ADMIN2026` — only share this with your mentor and actual admins.
