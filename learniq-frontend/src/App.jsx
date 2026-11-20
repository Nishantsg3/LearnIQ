import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { AlertCircle, Clock, RefreshCw } from 'lucide-react'

// ── Lazy-loaded Route Components for Code Splitting ──
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const OtpVerification = lazy(() => import('./pages/OtpVerification'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const PracticePage = lazy(() => import('./pages/PracticePage'))
const MainTestsPage = lazy(() => import('./pages/MainTestsPage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminTestList = lazy(() => import('./pages/AdminTestList'))
const AdminTestMaker = lazy(() => import('./pages/AdminTestMaker'))
const AdminTestHistory = lazy(() => import('./pages/AdminTestHistory'))
const AdminTestEdit = lazy(() => import('./pages/AdminTestEdit'))
const AdminStudents = lazy(() => import('./pages/AdminStudents'))
const QuestionManager = lazy(() => import('./pages/QuestionManager'))
const QuestionBank = lazy(() => import('./pages/QuestionBank'))
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'))
const AdminTestLeaderboard = lazy(() => import('./pages/AdminTestLeaderboard'))
const TestAttempt = lazy(() => import('./pages/TestAttempt'))
const StudentTest = lazy(() => import('./pages/StudentTest'))
const TestResultView = lazy(() => import('./pages/TestResultView'))
const TestReview = lazy(() => import('./pages/TestReview'))
const AdminReportList = lazy(() => import('./pages/AdminReportList'))
const BackgroundShowcase = lazy(() => import('./pages/BackgroundShowcase'))

import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import AdminProfileModal from './components/AdminProfileModal'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

const PageFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
    <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-800 border-t-violet-600 rounded-full animate-spin"></div>
    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Loading Module...</p>
  </div>
);

function AppContent() {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const withLayout = (Component) => (
    <MainLayout onProfileClick={() => setIsProfileOpen(true)}>
      {Component}
    </MainLayout>
  );

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { fontSize: '13px', borderRadius: '8px', background: '#333', color: '#fff' }
      }} />

      <AdminProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onSave={() => setIsProfileOpen(false)}
      />

      <div className={`${user?.role === 'ADMIN' ? 'admin-theme' : 'student-theme'} min-h-screen flex flex-col`}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/admin-access" element={<AdminLogin />} />
          <Route path="/admin/login" element={<Navigate to="/admin-access" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          {import.meta.env.DEV && (
            <Route path="/background-showcase" element={<BackgroundShowcase />} />
          )}

          {/* ── STUDENT ROUTES (requiredRole="STUDENT") ─────────────────────── */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute requiredRole="STUDENT">{withLayout(<StudentDashboard />)}</ProtectedRoute>
          } />
          <Route path="/student/section1" element={
            <ProtectedRoute requiredRole="STUDENT">{withLayout(<PracticePage />)}</ProtectedRoute>
          } />
          <Route path="/student/section2" element={
            <ProtectedRoute requiredRole="STUDENT">{withLayout(<MainTestsPage />)}</ProtectedRoute>
          } />
          <Route path="/student/results" element={
            <ProtectedRoute requiredRole="STUDENT">{withLayout(<ResultsPage />)}</ProtectedRoute>
          } />
          <Route path="/student/progress" element={
            <ProtectedRoute requiredRole="STUDENT">{withLayout(<ProgressPage />)}</ProtectedRoute>
          } />

          <Route path="/student-dashboard" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/tests" element={<Navigate to="/student/section1" replace />} />
          <Route path="/student/practice" element={<Navigate to="/student/section1" replace />} />
          <Route path="/student/history" element={<Navigate to="/student/results" replace />} />

          <Route path="/attempt/:attemptId" element={
            <ProtectedRoute requiredRole="STUDENT"><TestAttempt /></ProtectedRoute>
          } />

          <Route path="/student/test/:id" element={
            <ProtectedRoute requiredRole="STUDENT"><StudentTest /></ProtectedRoute>
          } />

          <Route path="/results/:attemptId" element={
            <ProtectedRoute requiredRole="STUDENT">{withLayout(<TestResultView />)}</ProtectedRoute>
          } />

          <Route path="/review/:attemptId" element={
            <ProtectedRoute requiredRole="STUDENT"><TestReview /></ProtectedRoute>
          } />

          {/* ── ADMIN ROUTES (requiredRole="ADMIN") ──────────────────────────── */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminDashboard />)}</ProtectedRoute>
          } />

          <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="/admin/tests" element={<Navigate to="/admin/tests/active" replace />} />
          <Route path="/admin/tests/active" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminTestList />)}</ProtectedRoute>
          } />
          <Route path="/admin/tests/create" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminTestMaker />)}</ProtectedRoute>
          } />
          <Route path="/admin/tests/history" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminTestHistory />)}</ProtectedRoute>
          } />
          <Route path="/admin/tests/edit/:id" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminTestEdit />)}</ProtectedRoute>
          } />

          <Route path="/admin/tests/:testId/questions" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<QuestionManager />)}</ProtectedRoute>
          } />

          <Route path="/admin/tests/:testId/analytics" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminAnalytics />)}</ProtectedRoute>
          } />

          <Route path="/admin/tests/:testId/leaderboard" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminTestLeaderboard />)}</ProtectedRoute>
          } />

          <Route path="/admin/students" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminStudents />)}</ProtectedRoute>
          } />

          <Route path="/admin/questions" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<QuestionBank />)}</ProtectedRoute>
          } />

          <Route path="/admin/leaderboard" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminReportList mode="LEADERBOARD" />)}</ProtectedRoute>
          } />

          <Route path="/admin/analytics" element={
            <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminReportList mode="ANALYTICS" />)}</ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

function App() {
  const [healthStatus, setHealthStatus] = useState('AWAKE'); // 'AWAKE' | 'CHECKING' | 'TIMEOUT'
  const secondsLeftRef = useRef(150);
  const isCheckingHealthRef = useRef(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'https://learniq-backend-vglf.onrender.com/api/v1';

  // Handle global backend sleep/awake/timeout events from Axios interceptors
  useEffect(() => {
    const handleSleep = () => {
      // Never display blocking overlay on public/auth routes — forms must remain interactive
      const path = window.location.pathname;
      const isAuthPage = path === '/' || path === '/login' || path === '/admin-access' || path === '/register' || path === '/forgot-password' || path === '/verify-otp' || path.startsWith('/reset-password');
      if (isAuthPage) return;

      setHealthStatus('CHECKING');
      secondsLeftRef.current = 150;
    };
    const handleAwake = () => {
      setHealthStatus('AWAKE');
    };
    const handleTimeout = () => {
      setHealthStatus('TIMEOUT');
    };
    window.addEventListener('backend-sleep', handleSleep);
    window.addEventListener('backend-awake', handleAwake);
    window.addEventListener('backend-timeout', handleTimeout);
    return () => {
      window.removeEventListener('backend-sleep', handleSleep);
      window.removeEventListener('backend-awake', handleAwake);
      window.removeEventListener('backend-timeout', handleTimeout);
    };
  }, []);

  // Non-blocking initial background health verification (does not block UI)
  useEffect(() => {
    const checkInitialHealth = async () => {
      if (isCheckingHealthRef.current) return;
      isCheckingHealthRef.current = true;
      try {
        const response = await fetch(`${baseUrl}/health`);
        if (response.ok) {
          setHealthStatus('AWAKE');
        }
      } catch {
        // Silent background check: do not block login unless an actual request fails with cold-start status
      } finally {
        isCheckingHealthRef.current = false;
      }
    };
    checkInitialHealth();
  }, [baseUrl]);

  // Active health check & countdown timer loop when server is sleeping
  useEffect(() => {
    if (healthStatus !== 'CHECKING') return;

    let countdownInterval;
    let healthCheckInterval;

    const checkHealth = async () => {
      if (isCheckingHealthRef.current) return;
      isCheckingHealthRef.current = true;
      try {
        const response = await fetch(`${baseUrl}/health`);
        if (response.ok) {
          setHealthStatus('AWAKE');
          console.log(`[DIAGNOSTIC] Backend wake-up: source=App.jsx, timestamp=${new Date().toISOString()}`);
          window.dispatchEvent(new CustomEvent('backend-awake'));
        }
      } catch {
        console.log("Backend server is warming up...");
      } finally {
        isCheckingHealthRef.current = false;
      }
    };

    // Run health check immediately
    checkHealth();

    // Start 1-second countdown timer
    countdownInterval = setInterval(() => {
      secondsLeftRef.current -= 1;
      if (secondsLeftRef.current <= 0) {
        clearInterval(countdownInterval);
        clearInterval(healthCheckInterval);
        setHealthStatus('TIMEOUT');
        window.dispatchEvent(new CustomEvent('backend-timeout'));
      }
    }, 1000);

    // Ping health endpoint every 4 seconds
    healthCheckInterval = setInterval(checkHealth, 4000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(healthCheckInterval);
    };
  }, [healthStatus, baseUrl]);

  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
