import axios from 'axios';

// Centralized Environment-Aware API Configuration
const IS_DEV = import.meta.env.MODE === 'development';
const PROD_URL = import.meta.env.VITE_API_URL || 'https://learniq-backend.onrender.com/api/v1';
const LOCAL_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: IS_DEV ? LOCAL_URL : PROD_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  const studentToken = localStorage.getItem('studentToken');
  const legacyToken = localStorage.getItem('token');
  
  const isViewingAdminPortal = window.location.pathname.startsWith('/admin');
  let token;
  
  if (isViewingAdminPortal) {
    token = adminToken || legacyToken || studentToken;
  } else {
    token = studentToken || legacyToken || adminToken;
  }

  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor for Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently handle common errors to prevent UI flickering
    // Logging only critical failures in production
    if (import.meta.env.MODE === 'development') {
      console.error('[API] Error:', error.response?.data?.message || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
