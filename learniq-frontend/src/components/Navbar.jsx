import { getUserName, getUserRole, logout } from '../utils/auth'

function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const Navbar = () => {
  const name = getUserName()
  const role = getUserRole()

  return (
    <div className="navbar">
      <div className="brand">Learn<span>IQ</span></div>
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