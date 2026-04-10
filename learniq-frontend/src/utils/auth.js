import api from './api';

// REGISTER USER
export const register = async (name, email, password) => {
  console.log("CALLING REGISTER API...");
  try {
    const response = await api.post('/auth/register', {
      name,
      email,
      password
    });
    console.log("REGISTER RESPONSE SUCCESS:", response.data);
    return response.data;
  } catch (err) {
    console.error("REGISTER API ERROR:", err.response?.data || err.message);
    throw err;
  }
};

// LOGIN USER
export const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password
  });
  return response.data;
};

// SESSION MANAGEMENT
export const setSession = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getToken = () => localStorage.getItem('token');

export const getUser = () => {
  const userString = localStorage.getItem('user');
  if (!userString) return null;
  try {
    return JSON.parse(userString);
  } catch (e) {
    return null;
  }
};

export const getUserRole = () => getUser()?.role || localStorage.getItem('role');
export const getUserName = () => getUser()?.name || localStorage.getItem('name');

export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};