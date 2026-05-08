import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import * as authUtils from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Determine role based on URL (Stable across reloads)
  const getActiveRole = () => window.location.pathname.startsWith('/admin') ? 'ADMIN' : 'STUDENT';
  
  const [user, setUser] = useState(() => authUtils.getUser(getActiveRole()));
  const [role, setRole] = useState(user?.role || null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(() => {
    const activeRole = getActiveRole();
    authUtils.logout(activeRole);
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setIsInitializing(false);
  }, []);

  const updateUser = useCallback((newData) => {
    const activeRole = getActiveRole();
    setUser(prev => {
      const updatedUser = { ...prev, ...newData };
      const roleKey = activeRole === 'ADMIN' ? 'adminUser' : 'studentUser';
      localStorage.setItem(roleKey, JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const initializeAuth = useCallback(async () => {
    const activeRole = getActiveRole();
    const token = authUtils.getToken(activeRole);

    if (!token) {
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      setIsInitializing(false);
      return;
    }

    try {
      // Use the specific role's token for the /me check
      const res = await api.get('/auth/me');
      const backendUser = res.data;
      
      // Strict isolation: If we are on admin route, we MUST be an admin
      if (activeRole === 'ADMIN' && backendUser.role !== 'ADMIN') {
         console.warn('[AuthContext] Isolation breach: Admin route with Student token');
         logout();
         return;
      }

      setUser(backendUser);
      setRole(backendUser.role);
      setIsAuthenticated(true);
      setIsOffline(false);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
          logout();
      }
    } finally {
      setIsInitializing(false);
    }
  }, [logout]);

  useEffect(() => {
    initializeAuth();

    const handleStorageChange = (e) => {
      const activeRole = getActiveRole();
      const targetTokenKey = activeRole === 'ADMIN' ? 'adminToken' : 'studentToken';
      
      // ONLY refresh if the token for OUR role changed (Login/Logout in another tab for same role)
      // This prevents Student login from affecting Admin tabs
      if (e.key === targetTokenKey) {
        console.log(`[AuthContext] Session for ${activeRole} changed elsewhere. Syncing...`);
        window.location.reload();
      }
      
      // Handle legacy 'token' key if it's cleared (Global logout)
      if (e.key === 'token' && !e.newValue) {
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeAuth]);

  const login = useCallback((userData) => {
    authUtils.setSession(userData.token, {
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar || null
    });

    setUser(userData);
    setRole(userData.role);
    setIsAuthenticated(true);
    setIsInitializing(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isInitializing,
      isLoggingIn,
      setIsLoggingIn,
      isOffline,
      isAuthenticated,
      login,
      logout,
      updateUser
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
