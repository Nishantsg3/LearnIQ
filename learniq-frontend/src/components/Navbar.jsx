import { Link } from 'react-router-dom'
import { getUserName, getUserRole, logout } from '../utils/auth'

function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
}

const Navbar = () => {
  const name = getUserName()
  const role = getUserRole()

  const adminLinks = [
    { label: 'Dashboard', path: '/admin-dashboard' },
    { label: 'Global Bank', path: '/admin/bank' }
  ]
  const studentLinks = [
    { label: 'My Tests', path: '/student-dashboard' }
  ]
  const links = role === 'ADMIN' ? adminLinks : studentLinks

  return (
    <header className="navbar">
      <div className="navbar-main">
        <div className="brand">Learn<span>IQ</span></div>
        <nav className="navbar-links">
          {links.map((link) => (
            <Link key={link.label} to={link.path} className={`nav-chip ${window.location.pathname === link.path ? 'active' : ''}`}>
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
    </header>
  )
}

export default Navbar
