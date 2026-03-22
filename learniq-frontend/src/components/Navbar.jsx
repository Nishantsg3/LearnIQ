import { getUserName, getUserRole, logout } from '../utils/auth'
import { Link, useLocation } from 'react-router-dom'

function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const Navbar = () => {
  const name = getUserName()
  const role = getUserRole()
  const location = useLocation()

  const adminLinks = [
    { label: 'Dashboard', path: '/admin-dashboard' },
    { label: 'Manage Tests', path: '/admin-tests' },
    { label: 'Question Bank', path: '/admin-questions' },
    { label: 'Schedule', path: '/admin-schedule' },
    { label: 'Results', path: '/admin-results' },
  ]

  const studentLinks = [
    { label: 'My Tests', path: '/student-dashboard' },
    { label: 'Results', path: '/student-results' },
    { label: 'Profile', path: '/student-profile' },
  ]

  const links = role === 'ADMIN' ? adminLinks : studentLinks

  return (
    <div className="navbar">
      <div style={{display:'flex', alignItems:'center', gap:'32px'}}>
        <div className="brand">Learn<span>IQ</span></div>
        <nav style={{display:'flex', gap:'4px'}}>
          {links.map(link => (
            <Link key={link.path} to={link.path} style={{
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: location.pathname === link.path ? '#111' : '#888',
              background: location.pathname === link.path ? '#f3f4f6' : 'transparent',
              fontWeight: location.pathname === link.path ? '500' : '400',
              transition: 'all .15s'
            }}>
              {link.label}
            </Link>
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