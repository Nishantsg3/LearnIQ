import api from './api';

export const setSession = (token, user) => {
  const role = user.role;
  if (role === 'ADMIN') {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
  } else {
    localStorage.setItem('studentToken', token);
    localStorage.setItem('studentUser', JSON.stringify(user));
  }
};

export const getToken = (role) => {
  if (role === 'ADMIN') return localStorage.getItem('adminToken');
  if (role === 'STUDENT') return localStorage.getItem('studentToken');
  
  // Fallback / Auto-detect for existing code
  const adminToken = localStorage.getItem('adminToken');
  const studentToken = localStorage.getItem('studentToken');
  
  // If we are on an admin route, prioritize adminToken
  if (window.location.pathname.startsWith('/admin')) {
    return adminToken || localStorage.getItem('token');
  }
  return studentToken || localStorage.getItem('token');
};

export const getUser = (role) => {
  const token = getToken(role);
  if (!token) return null;
  
  let storedUser;
  if (role === 'ADMIN') storedUser = localStorage.getItem('adminUser');
  else if (role === 'STUDENT') storedUser = localStorage.getItem('studentUser');
  else {
    // Auto-detect
    if (window.location.pathname.startsWith('/admin')) {
      storedUser = localStorage.getItem('adminUser');
    } else {
      storedUser = localStorage.getItem('studentUser');
    }
    // Final fallback to legacy key
    if (!storedUser) storedUser = localStorage.getItem('user');
  }

  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export const getUserRole = (role) => getUser(role)?.role || null;
export const getUserName = (role) => getUser(role)?.name || null;

export const logout = (role) => {
  if (role === 'ADMIN') {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin-access';
  } else {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentUser');
    localStorage.removeItem('token'); // Cleanup legacy
    localStorage.removeItem('user'); // Cleanup legacy
    window.location.href = '/login';
  }
};
