import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const INSTITUTE_CODE = 'LEARNIQ@ADMIN2026'

function AdminRegister() {
  const [step, setStep] = useState(1)
  const [code, setCode] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleCodeVerify = (e) => {
    e.preventDefault()
    if (code === INSTITUTE_CODE) {
      toast.success('Code verified! Set up admin account.')
      setStep(2)
    } else {
      toast.error('Invalid institute code')
      setCode('')
    }
  }

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('https://learniq-rz0t.onrender.com/api/auth/register', {
        ...form, role: 'ADMIN'
      })
      toast.success('Admin account created!')
      setTimeout(() => navigate('/admin-access'), 1500)
    } catch (err) {
      toast.error(err.response?.data || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="split-layout">
      <div className="dark-panel" style={{background:'#0a0a0a'}}>
        <div>
          <div className="brand" style={{color:'#fff'}}>
            Learn<span style={{color:'#7c3aed'}}>IQ</span>
          </div>
          <div className="tagline" style={{color:'#888'}}>
            Institute administration portal<br />Restricted access only
          </div>
        </div>
        <div className="big-text" style={{color:'#fff'}}>
          Create admin<br />
          <span style={{color:'#7c3aed'}}>credentials.</span>
        </div>
      </div>

      <div className="form-panel">
        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px'}}>
          <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'#7c3aed'}}></div>
          <span style={{fontSize:'11px', color:'#999', letterSpacing:'.06em', textTransform:'uppercase'}}>
            Admin Setup · Step {step} of 2
          </span>
        </div>

        {step === 1 ? (
          <>
            <h2 style={{color:'#111'}}>Institute verification</h2>
            <p className="sub" style={{color:'#666'}}>
              Enter the institute secret code to create an admin account
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
              display:'flex', alignItems:'center', gap:'8px',
              background:'#f0fdf4', border:'1px solid #bbf7d0',
              borderRadius:'8px', padding:'10px 14px', marginBottom:'20px'
            }}>
              <span style={{color:'#16a34a', fontSize:'12px', fontWeight:'500'}}>
                ✓ Institute code verified
              </span>
            </div>
            <h2 style={{color:'#111'}}>Create admin account</h2>
            <p className="sub" style={{color:'#666'}}>
              This account will have full admin access
            </p>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Full name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Admin full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="admin@institute.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create admin account'}
              </button>
            </form>
          </>
        )}

        <p style={{textAlign:'center', marginTop:'16px', fontSize:'12px'}}>
          <Link to="/admin-access" style={{color:'#999'}}>← Back to admin login</Link>
        </p>
      </div>
    </div>
  )
}

export default AdminRegister