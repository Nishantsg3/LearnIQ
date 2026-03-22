import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('https://learniq-rz0t.onrender.com/api/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('name', res.data.name)
      toast.success('Welcome back!')
      if (res.data.role === 'ADMIN') navigate('/admin-dashboard')
      else navigate('/student-dashboard')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="split-layout">
      <div className="dark-panel">
        <div>
          <div className="brand">Learn<span>IQ</span></div>
          <div className="tagline">Upskill. Upgrade. Achieve.</div>
        </div>
        <div className="big-text">Practice hard.<br /><span>Score higher.</span></div>
      </div>
      <div className="form-panel">
        <h2 style={{color:'#111'}}>Student login</h2>
        <p className="sub" style={{color:'#666'}}>Sign in to access your tests and results</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="form-link" style={{color:'#555'}}>
          No account yet? <Link to="/register" style={{color:'#7c3aed'}}>Register here</Link>
        </p>
        <p style={{textAlign:'center', marginTop:'8px', fontSize:'11px'}}>
          <Link to="/admin-access" style={{color:'#bbb'}}>Institute admin portal →</Link>
        </p>
      </div>
    </div>
  )
}

export default Login