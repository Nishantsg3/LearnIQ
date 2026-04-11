import { useAuth } from '../context/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — strict role-based route guard.
 *
 * Accepts `requiredRole` prop: "STUDENT" | "ADMIN"
 *
 * Two-layer check:
 *
 * LAYER 1 (synchronous, instant):
 *   Reads localStorage directly BEFORE /auth/me resolves.
 *   Blocks manual URL access immediately — no flash of wrong content.
 *
 * LAYER 2 (async, authoritative):
 *   After AuthContext finishes /auth/me, validates role against backend-verified data.
 *   This is the true security gate.
 *
 * Role mismatch redirects:
 *   - Admin accessing student route → /admin-dashboard
 *   - Student accessing admin route → /student-dashboard
 *   - No token → appropriate login page
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { role: userRole, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Helper: where to redirect on role mismatch (go to YOUR dashboard, not login)
  const redirectForMismatch = (actualRole) => {
    if (actualRole === 'ADMIN') return '/admin-dashboard';
    if (actualRole === 'STUDENT') return '/student-dashboard';
    // Unknown role — send to login
    return requiredRole === 'ADMIN' ? '/admin-access' : '/login';
  };

  // Helper: where to redirect when no session exists
  const loginPage = () => requiredRole === 'ADMIN' ? '/admin-access' : '/login';

  // ── LAYER 1: Synchronous localStorage check (runs before /auth/me) ─────────
  if (loading) {
    const rawToken = localStorage.getItem('token');

    if (!rawToken) {
      // No token at all — not authenticated
      return <Navigate to={loginPage()} state={{ from: location }} replace />;
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

      if (storedUser?.role) {
        if (requiredRole && storedUser.role !== requiredRole) {
          // Wrong role trying to access this route
          console.warn(
            `[ProtectedRoute] Layer-1 block: required=${requiredRole}, stored=${storedUser.role}`
          );
          return <Navigate to={redirectForMismatch(storedUser.role)} replace />;
        }
      }
    } catch (_) {
      // Malformed JSON in localStorage
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }

    // Token + role look valid — show loading spinner while /auth/me completes
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="w-8 h-8 border-4 border-[#1f2937] border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // ── LAYER 2: Authoritative check (post /auth/me backend verification) ──────

  if (!isAuthenticated) {
    // Token was invalid / expired
    return <Navigate to={loginPage()} state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Authenticated but WRONG ROLE — hard redirect, no exceptions
    console.warn(
      `[ProtectedRoute] Layer-2 block: required=${requiredRole}, actual=${userRole}`
    );
    return <Navigate to={redirectForMismatch(userRole)} replace />;
  }

  return children;
};

export default ProtectedRoute;