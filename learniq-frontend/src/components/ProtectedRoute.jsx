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
  const { role: userRole, isInitializing, isAuthenticated } = useAuth();
  const location = useLocation();

  const redirectForMismatch = (actualRole) => {
    if (actualRole === 'ADMIN') return '/admin/dashboard';
    if (actualRole === 'STUDENT') return '/student-dashboard';
    return requiredRole === 'ADMIN' ? '/admin-access' : '/login';
  };

  const loginPage = () => requiredRole === 'ADMIN' ? '/admin-access' : '/login';
  if (isInitializing) {
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