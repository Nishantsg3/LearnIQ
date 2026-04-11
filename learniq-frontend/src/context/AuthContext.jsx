import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import * as authUtils from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(() => {
    authUtils.logout();
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  }, []);

  const initializeAuth = useCallback(async () => {
    const token = authUtils.getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      const backendRole = res.data.role;

      // Cross-tab contamination guard:
      // If the locally stored role doesn't match what the backend says, wipe it.
      const storedUser = authUtils.getUser();
      if (storedUser?.role && storedUser.role !== backendRole) {
        console.warn('[Auth] Role mismatch detected — clearing contaminated session.');
        logout();
        return;
      }

      setUser({ name: res.data.name, role: backendRole });
      setRole(backendRole);
      setIsAuthenticated(true);

      // Sync localStorage with backend-verified data
      authUtils.setSession(token, { name: res.data.name, role: backendRole });

    } catch (err) {
      console.error('Auth initialization failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = (userData) => {
    // CRITICAL: Wipe any existing session before writing new one.
    // This prevents cross-role contamination (e.g. admin overwriting student token).
    localStorage.clear();

    authUtils.setSession(userData.token, {
      name: userData.name,
      role: userData.role,
    });

    setUser({ name: userData.name, role: userData.role });
    setRole(userData.role);
    setIsAuthenticated(true);

    console.log(`[Auth] New session started — role: ${userData.role}`);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      loading,
      isAuthenticated,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};