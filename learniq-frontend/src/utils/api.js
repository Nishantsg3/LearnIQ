import axios from 'axios';

const api = axios.create({
  // Hardcoded for production testing as per requirement
  baseURL: 'https://learniq-rz0t.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  console.log(`[API] Calling: ${config.method.toUpperCase()} ${config.url}`);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('[API] Request Error:', error);
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API] Success: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API] Error: ${error.config?.url}`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;