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

      // 🔥 ALWAYS trust backend response only
      setUser({
        name: res.data.name,
        role: res.data.role,
      });

      setRole(res.data.role);
      setIsAuthenticated(true);

      // 🔥 OPTIONAL: sync local storage (safe)
      authUtils.setSession(token, {
        name: res.data.name,
        role: res.data.role,
      });

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
    authUtils.setSession(userData.token, {
      name: userData.name,
      role: userData.role,
    });

    // 🔥 Immediately set state
    setUser({
      name: userData.name,
      role: userData.role,
    });

    setRole(userData.role);
    setIsAuthenticated(true);
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