import { Navigate } from 'react-router-dom'
import { getToken, getUserRole } from '../utils/auth'

const ProtectedRoute = ({ children, role }) => {
  const token = getToken()
  const userRole = getUserRole()
  if (!token) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to="/login" replace />
  return children
}

export default ProtectedRoute