import api from './api';
import { storage } from './storage';

export const setSession = (token, user) => {
  const role = user.role;
  if (role === 'ADMIN') {
    storage.setItem('adminToken', token);
    storage.setItem('adminUser', JSON.stringify(user));
  } else {
    storage.setItem('studentToken', token);
    storage.setItem('studentUser', JSON.stringify(user));
  }
};

export const getToken = (role) => {
  if (role === 'ADMIN') return storage.getItem('adminToken');
  if (role === 'STUDENT') return storage.getItem('studentToken');
  
  // Fallback / Auto-detect for existing code
  const adminToken = storage.getItem('adminToken');
  const studentToken = storage.getItem('studentToken');
  
  // If we are on an admin route, prioritize adminToken
  if (window.location.pathname.startsWith('/admin')) {
    return adminToken || storage.getItem('token');
  }
  return studentToken || storage.getItem('token');
};

export const getUser = (role) => {
  const token = getToken(role);
  if (!token) return null;
  
  let storedUser;
  if (role === 'ADMIN') storedUser = storage.getItem('adminUser');
  else if (role === 'STUDENT') storedUser = storage.getItem('studentUser');
  else {
    // Auto-detect
    if (window.location.pathname.startsWith('/admin')) {
      storedUser = storage.getItem('adminUser');
    } else {
      storedUser = storage.getItem('studentUser');
    }
    // Final fallback to legacy key
    if (!storedUser) storedUser = storage.getItem('user');
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
    storage.removeItem('adminToken');
    storage.removeItem('adminUser');
    window.location.href = '/admin-access';
  } else {
    storage.removeItem('studentToken');
    storage.removeItem('studentUser');
    storage.removeItem('token'); // Cleanup legacy
    storage.removeItem('user'); // Cleanup legacy
    window.location.href = '/login';
  }
};
