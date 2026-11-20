import axios from 'axios';
import { storage } from './storage';

// Centralized Environment-Aware API Configuration
const DEPLOYED_BACKEND_URL = 'https://learniq-backend-vglf.onrender.com/api/v1';
const BASE_URL = import.meta.env.VITE_API_URL || DEPLOYED_BACKEND_URL;

const api = axios.create({
  baseURL: BASE_URL,
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
    // 500 is included: Render cold-start DB pool failures return 500 before 502/503
    const isSleepStatus = error.response && [500, 502, 503, 504].includes(error.response.status);

    // Do not intercept health check or authentication requests
    // Auth requests must fail fast so login/register forms remain interactive and display inline errors
    const isHealthCheck = originalRequest.url && originalRequest.url.includes('/health');
    const isAuthRoute = originalRequest.url && originalRequest.url.includes('/auth/');

    const isSleepError = (isNetworkError || isTimeout || isSleepStatus) && !isHealthCheck && !isAuthRoute;

    // Safety Policy: Only idempotent read operations (GET, HEAD, OPTIONS) may be automatically queued/replayed.
    // State-modifying operations (POST, PUT, DELETE, PATCH, and specifically exam submissions) must NEVER be
    // automatically replayed on timeout or transient failure, because a client timeout does NOT prove the server
    // failed to process the request. Auto-replaying mutations risks duplicate tests, questions, or submissions.
    const requestMethod = (originalRequest.method || 'get').toLowerCase();
    const isIdempotentMethod = ['get', 'head', 'options'].includes(requestMethod);
    const isSubmission = originalRequest.url && originalRequest.url.includes('/submit');
    const isUnsafeToReplay = !isIdempotentMethod || isSubmission;

    if (isUnsafeToReplay && isSleepError) {
      if (!isWakingUp) {
        window.dispatchEvent(new CustomEvent('backend-sleep'));
      }
      return Promise.reject(error);
    }

    // If wake-up is already in progress, queue non-auth, idempotent safe requests only
    // Auth requests and mutations reject immediately to preserve caller flow and form state
    if (isWakingUp && !isHealthCheck && !isAuthRoute && !originalRequest._queued && isIdempotentMethod) {
      originalRequest._queued = true;
      return new Promise((resolve, reject) => {
        const timeoutTimer = setTimeout(() => {
          reject(new Error('Queued request timed out during backend cold-start recovery.'));
        }, 150000);

        failedQueue.push({
          resolve: () => {
            clearTimeout(timeoutTimer);
            resolve(api(originalRequest));
          },
          reject: (err) => {
            clearTimeout(timeoutTimer);
            reject(err);
          }
        });
      });
    }

    if (isSleepError && isIdempotentMethod && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isWakingUp) {
        isWakingUp = true;

        // Dispatch global custom event to show wake-up overlay
        window.dispatchEvent(new CustomEvent('backend-sleep'));

        // Start checking health in background without overlapping requests
        let inFlightHealthCheck = false;
        const checkInterval = setInterval(async () => {
          if (inFlightHealthCheck) return;
          inFlightHealthCheck = true;
          try {
            // Use standard axios to avoid interceptor recursion
            const response = await axios.get(`${api.defaults.baseURL}/health`, { timeout: 3500 });
            if (response.status === 200) {
              clearInterval(checkInterval);
              window.dispatchEvent(new CustomEvent('backend-awake'));
            }
          } catch {
            // Still sleeping/waking up
          } finally {
            inFlightHealthCheck = false;
          }
        }, 4000);

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
          console.log(`[DIAGNOSTIC] Backend wake-up: timestamp=${new Date().toISOString()}`);
          processQueue(null);
        };
        window.addEventListener('backend-timeout', handleTimeout);
        window.addEventListener('backend-awake', handleAwake);
      }

      console.log(`[DIAGNOSTIC] Wake-up retry (idempotent): method=${requestMethod}, url=${originalRequest.url}, timestamp=${new Date().toISOString()}`);
      // Queue this request with bounded recovery timeout (150s max lifetime)
      return new Promise((resolve, reject) => {
        const timeoutTimer = setTimeout(() => {
          reject(new Error('Queued request timed out during backend cold-start recovery.'));
        }, 150000);

        failedQueue.push({
          resolve: () => {
            clearTimeout(timeoutTimer);
            resolve(api(originalRequest));
          },
          reject: (err) => {
            clearTimeout(timeoutTimer);
            reject(err);
          }
        });
      });
    }

    // Global 401 Session Expiration Dispatcher
    if (error.response && error.response.status === 401 && !isAuthRoute) {
      window.dispatchEvent(new CustomEvent('auth-unauthorized'));
    }

    if (import.meta.env.MODE === 'development') {
      console.error('[API] Error:', error.response?.data?.message || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
