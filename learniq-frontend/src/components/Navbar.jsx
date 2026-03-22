import { getUserName, getUserRole, logout } from '../utils/auth'

function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const NavLink = ({ label, active }) => (
  <span style={{
    fontSize: '13px',
    padding: '6px 12px',
    borderRadius: '6px',
    color: active ? '#111' : '#888',
    background: active ? '#f3f4f6' : 'transparent',
    fontWeight: active ? '500' : '400',
    cursor: 'pointer',
    transition: 'all .15s',
    userSelect: 'none',
  }}
  onMouseEnter={e => { if (!active) { e.target.style.background = '#f9fafb'; e.target.style.color = '#555' }}}
  onMouseLeave={e => { if (!active) { e.target.style.background = 'transparent'; e.target.style.color = '#888' }}}
  >
    {label}
  </span>
)

const Navbar = () => {
  const name = getUserName()
  const role = getUserRole()

  const adminLinks = [
    { label: 'Dashboard', active: true },
    { label: 'Manage Tests', active: false },
    { label: 'Question Bank', active: false },
    { label: 'Schedule', active: false },
    { label: 'Results', active: false },
  ]

  const studentLinks = [
    { label: 'My Tests', active: true },
    { label: 'Results', active: false },
    { label: 'Profile', active: false },
  ]

  const links = role === 'ADMIN' ? adminLinks : studentLinks

  return (
    <div className="navbar">
      <div style={{display:'flex', alignItems:'center', gap:'28px'}}>
        <div className="brand">Learn<span>IQ</span></div>
        <nav style={{display:'flex', gap:'2px'}}>
          {links.map((link, i) => (
            <NavLink key={i} label={link.label} active={link.active} />
          ))}
        </nav>
      </div>
      <div className="navbar-right">
        <div className="avatar">{getInitials(name)}</div>
        <span className="user-name">{name}</span>
        <span className="role-badge">{role === 'ADMIN' ? 'Admin' : 'Student'}</span>
        <button className="signout-btn" onClick={logout}>Sign out</button>
      </div>
    </div>
  )
}

export default Navbar