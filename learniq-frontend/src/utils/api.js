import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
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
  
  // 🛡️ Request-Aware Token Discovery:
  // We determine the token based on the target endpoint, not just the current page.
  // This prevents 403s during background sync or cross-portal navigation.
  const targetUrl = config.url || '';
  let token;
  
  if (targetUrl.startsWith('/admin') || targetUrl.startsWith('/questions')) {
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
  console.error('[API] Request Error:', error);
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API] Success: ${response.config.url}`);
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Check for 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn(`[API] Unauthorized (401): ${originalRequest?.url}`);
      // Do NOT force logout here. Let the context/page handle it.
      // This prevents "flickering" logout on minor network/API blips.
    }

    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      // toast.error('Network connection issues detected.');
    }

    const status = error.response?.status;
    const url = error.config?.url;
    const data = error.response?.data;
    console.error(`[API] Error ${status} on ${url}:`, data || error.message);
    return Promise.reject(error);
  }
);

export default api;
