import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('https://learniq-rz0t.onrender.com/api/auth/register', { ...form, role: 'STUDENT' })
      toast.success('Account created! Please sign in.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      toast.error(err.response?.data || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="split-layout">
      <div className="dark-panel">
        <div>
          <div className="brand">Learn<span>IQ</span></div>
          <div className="tagline">Join thousands of students<br />preparing with LearnIQ</div>
        </div>
        <div className="big-text">Start your<br /><span>test journey.</span></div>
      </div>
      <div className="form-panel">
        <h2>Create account</h2>
        <p className="sub">Students register here — admins are added by the institute</p>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full name</label>
            <input type="text" name="name" placeholder="Your full name"
              value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" name="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="••••••••"
              value={form.password} onChange={handleChange} required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="form-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}

export default Register