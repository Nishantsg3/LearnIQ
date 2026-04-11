import { useAuth } from '../context/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — guards routes by role.
 *
 * Two-layer check:
 * 1. FAST: synchronous localStorage role check before async /auth/me resolves.
 *    Prevents wrong-dashboard flash in multi-tab scenarios.
 * 2. ASYNC: waits for AuthContext to finish the /auth/me verification.
 */
const ProtectedRoute = ({ children, role }) => {
  const { role: userRole, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // ── Layer 1: Fast synchronous localStorage check ──────────────────────────
  // Reads role directly from storage without waiting for the async /auth/me call.
  // This catches cross-tab contamination immediately on render.
  if (loading) {
    const rawToken = localStorage.getItem('token');
    if (!rawToken) {
      // No token at all — definitely not authenticated
      const fallbackLogin = role === 'ADMIN' ? '/admin-access' : '/login';
      return <Navigate to={fallbackLogin} state={{ from: location }} replace />;
    }

    try {
      const rawUser = localStorage.getItem('user');
      const storedUser = rawUser ? JSON.parse(rawUser) : null;

      if (storedUser?.role && role && storedUser.role !== role) {
        // Role mismatch in storage — redirect to appropriate login immediately
        const fallbackLogin = role === 'ADMIN' ? '/admin-access' : '/login';
        console.warn(`[ProtectedRoute] Role mismatch: required=${role}, stored=${storedUser.role}`);
        return <Navigate to={fallbackLogin} state={{ from: location }} replace />;
      }
    } catch (_) {
      // Malformed localStorage — clear and redirect
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }

    // Storage looks valid — show spinner while async check completes
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="w-8 h-8 border-4 border-[#1f2937] border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // ── Layer 2: Async AuthContext check (post /auth/me) ──────────────────────
  if (!isAuthenticated) {
    const fallbackLogin = role === 'ADMIN' ? '/admin-access' : '/login';
    return <Navigate to={fallbackLogin} state={{ from: location }} replace />;
  }

  if (role && userRole !== role) {
    // Authenticated but wrong role (e.g. student trying to access admin route)
    const fallback = userRole === 'ADMIN' ? '/admin-dashboard' : '/student-dashboard';
    console.warn(`[ProtectedRoute] Access denied: required=${role}, actual=${userRole}`);
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;