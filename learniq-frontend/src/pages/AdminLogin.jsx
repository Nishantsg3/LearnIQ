import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('https://learniq-rz0t.onrender.com/api/auth/login', { email, password })
      if (res.data.role !== 'ADMIN') {
        toast.error('Access denied. Admin credentials required.')
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
      <div className="dark-panel" style={{background:'#0a0a0a'}}>
        <div>
          <div className="brand">Learn<span>IQ</span></div>
          <div className="tagline">Institute administration portal<br />Restricted access only</div>
        </div>
        <div className="big-text">Manage tests.<br /><span>Track results.</span></div>
      </div>
      <div className="form-panel">
        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px'}}>
          <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'#7c3aed'}}></div>
          <span style={{fontSize:'11px', color:'#999', letterSpacing:'.06em', textTransform:'uppercase'}}>Admin Portal</span>
        </div>
        <h2>Admin sign in</h2>
        <p className="sub">Institute administrator credentials only</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Admin email</label>
            <input type="email" placeholder="admin@institute.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Access dashboard'}
          </button>
        </form>
        <p className="form-link" style={{marginTop:'16px'}}>
          <Link to="/login" style={{color:'#999'}}>← Back to student login</Link>
        </p>
      </div>
    </div>
  )
}

export default AdminLogin