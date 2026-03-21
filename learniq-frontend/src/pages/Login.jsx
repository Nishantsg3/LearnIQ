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
      const res = await axios.post('http://localhost:8080/api/auth/login', { email, password })
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
          <div className="tagline">Online aptitude test system<br />for institutes & students</div>
        </div>
        <div className="big-text">Conduct smarter<br /><span>aptitude tests.</span></div>
      </div>
      <div className="form-panel">
        <h2>Welcome back</h2>
        <p className="sub">Sign in to your account</p>
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
        <p className="form-link">No account yet? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  )
}

export default Login