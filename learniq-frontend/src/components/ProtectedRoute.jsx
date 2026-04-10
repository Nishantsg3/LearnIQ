import { useAuth } from '../context/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const { role: userRole, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="w-8 h-8 border-4 border-[#1f2937] border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && userRole !== role) {
    const fallback = userRole === 'ADMIN' ? '/admin-dashboard' : '/student-dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;