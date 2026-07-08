import axios from 'axios';
import { storage } from './storage';

// Centralized Environment-Aware API Configuration
const IS_DEV = import.meta.env.MODE === 'development';
const PROD_URL = import.meta.env.VITE_API_URL || 'https://learniq-backend-vglf.onrender.com/api/v1';
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
  const adminToken = storage.getItem('adminToken');
  const studentToken = storage.getItem('studentToken');
  const legacyToken = storage.getItem('token');
  
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

let isWakingUp = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response Interceptor for Error Handling and Backend Wake-up Recovery
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is due to backend sleep/timeout/network connection failure
    const isNetworkError = !error.response;
    const isTimeout = error.code === 'ECONNABORTED';
    const isSleepStatus = error.response && [502, 503, 504].includes(error.response.status);
    
    // Do not intercept health check requests to avoid infinite recursion
    const isHealthCheck = originalRequest.url && originalRequest.url.includes('/health');
    
    if ((isNetworkError || isTimeout || isSleepStatus) && !isHealthCheck && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (!isWakingUp) {
        isWakingUp = true;
        
        // Dispatch global custom event to show wake-up overlay
        window.dispatchEvent(new CustomEvent('backend-sleep'));
        
        // Start checking health in background
        const checkInterval = setInterval(async () => {
          try {
            // Use standard axios to avoid interceptor recursion
            const response = await axios.get(`${api.defaults.baseURL}/health`, { timeout: 3000 });
            if (response.status === 200) {
              clearInterval(checkInterval);
              isWakingUp = false;
              window.dispatchEvent(new CustomEvent('backend-awake'));
              processQueue(null);
            }
          } catch (e) {
            // Still sleeping/waking up
          }
        }, 5000);
        
        // Listen for timeout/failure to wake up
        const handleTimeout = () => {
          clearInterval(checkInterval);
          isWakingUp = false;
          window.removeEventListener('backend-timeout', handleTimeout);
          window.removeEventListener('backend-awake', handleAwake);
          processQueue(new Error('Backend connection timed out.'));
        };
        const handleAwake = () => {
          clearInterval(checkInterval);
          isWakingUp = false;
          window.removeEventListener('backend-timeout', handleTimeout);
          window.removeEventListener('backend-awake', handleAwake);
        };
        window.addEventListener('backend-timeout', handleTimeout);
        window.addEventListener('backend-awake', handleAwake);
      }
      
      // Queue this request and return a new promise that resolves when wake-up is complete
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => {
            resolve(api(originalRequest));
          },
          reject: (err) => {
            reject(err);
          }
        });
      });
    }

    if (import.meta.env.MODE === 'development') {
      console.error('[API] Error:', error.response?.data?.message || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
