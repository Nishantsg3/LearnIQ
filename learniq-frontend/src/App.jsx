import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/AdminLogin'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import OtpVerification from './pages/OtpVerification'
import StudentDashboard from './pages/StudentDashboard'
import PracticePage from './pages/PracticePage'
import MainTestsPage from './pages/MainTestsPage'
import ResultsPage from './pages/ResultsPage'
import ProgressPage from './pages/ProgressPage'
import AdminDashboard from './pages/AdminDashboard'


import AdminTestList from './pages/AdminTestList'
import AdminTestMaker from './pages/AdminTestMaker'
import AdminTestHistory from './pages/AdminTestHistory'
import AdminTestEdit from './pages/AdminTestEdit'
import AdminStudents from './pages/AdminStudents'
import QuestionManager from './pages/QuestionManager'
import QuestionBank from './pages/QuestionBank'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminTestLeaderboard from './pages/AdminTestLeaderboard'
import TestAttempt from './pages/TestAttempt'
import StudentTest from './pages/StudentTest'
import TestResultView from './pages/TestResultView'
import TestReview from './pages/TestReview'
import AdminReportList from './pages/AdminReportList'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import AdminProfileModal from './components/AdminProfileModal'
import { AuthProvider, useAuth } from './context/AuthContext'

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
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/admin-access" element={<AdminLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

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
      </div>
    </BrowserRouter>
  );
}

function App() {
  const [healthStatus, setHealthStatus] = useState('CHECKING'); // 'CHECKING' | 'AWAKE' | 'TIMEOUT'
  const [timeLeft, setTimeLeft] = useState(150);
  const [retryCount, setRetryCount] = useState(0);

  // Handle global backend sleep/awake/timeout events from Axios interceptors
  useEffect(() => {
    const handleSleep = () => {
      setHealthStatus('CHECKING');
      setTimeLeft(150);
    };
    const handleAwake = () => {
      setHealthStatus('AWAKE');
    };
    window.addEventListener('backend-sleep', handleSleep);
    window.addEventListener('backend-awake', handleAwake);
    return () => {
      window.removeEventListener('backend-sleep', handleSleep);
      window.removeEventListener('backend-awake', handleAwake);
    };
  }, []);

  // Health check & countdown timer loop
  useEffect(() => {
    if (healthStatus !== 'CHECKING') return;

    let countdownInterval;
    let healthCheckInterval;

    const IS_DEV = import.meta.env.MODE === 'development';
    const PROD_URL = import.meta.env.VITE_API_URL || 'https://learniq-backend-vglf.onrender.com/api/v1';
    const LOCAL_URL = 'http://localhost:8080/api/v1';
    const baseUrl = IS_DEV ? LOCAL_URL : PROD_URL;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${baseUrl}/health`);
        if (response.ok) {
          setHealthStatus('AWAKE');
          console.log(`[DIAGNOSTIC] Backend wake-up: source=App.jsx, timestamp=${new Date().toISOString()}`);
          window.dispatchEvent(new CustomEvent('backend-awake'));
        }
      } catch (err) {
        console.log("Backend server is starting up...");
      }
    };

    // Run initial health check immediately
    checkHealth();

    // Start 1-second countdown timer
    countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          clearInterval(healthCheckInterval);
          setHealthStatus('TIMEOUT');
          window.dispatchEvent(new CustomEvent('backend-timeout'));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start 5-second health check ping
    healthCheckInterval = setInterval(checkHealth, 5000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(healthCheckInterval);
    };
  }, [healthStatus, retryCount]);

  const handleRetry = () => {
    console.log(`[DIAGNOSTIC] Wake-up retry: source=App.jsx, retryCount=${retryCount + 1}, timestamp=${new Date().toISOString()}`);
    setTimeLeft(150);
    setHealthStatus('CHECKING');
    setRetryCount((prev) => prev + 1);
  };

  const elapsed = 150 - timeLeft;
  let wakeTitle = "Starting LearnIQ...";
  let wakeDesc = "The server is waking up.";
  if (elapsed >= 90) {
    wakeTitle = "Almost ready...";
    wakeDesc = "Finalizing startup checks. Thank you for your patience.";
  } else if (elapsed >= 60) {
    wakeTitle = "Still waking...";
    wakeDesc = "Almost there. Initializing core engines...";
  } else if (elapsed >= 30) {
    wakeTitle = "Backend is waking up...";
    wakeDesc = "Establishing database handshake...";
  } else if (elapsed >= 10) {
    wakeTitle = "Checking server...";
    wakeDesc = "Connecting to cloud instance...";
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // ─── CRITICAL FIX ────────────────────────────────────────────────────────────
  // The overlay is rendered ABOVE the AuthProvider/AppContent using CSS fixed
  // positioning and z-index. The router and all page components remain mounted
  // throughout the entire sleep/wake cycle. No remount, no state loss.
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Application tree — always mounted, never replaced */}
      <AuthProvider>
        <AppContent />
      </AuthProvider>

      {/* Wake-up overlay — rendered on top via fixed positioning, not instead of app */}
      {healthStatus !== 'AWAKE' && (
        <div className="fixed inset-0 w-screen h-screen bg-[#0a0a12] flex items-center justify-center p-4 z-[9999]">
          {/* Background Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a1a3a_0%,#0a0a12_70%)] opacity-50" />
          
          <div className="relative w-full max-w-md animate-in zoom-in duration-500 text-center">
            <div className="relative bg-[#1a1a2e]/90 border border-white/10 backdrop-blur-3xl rounded-[32px] p-8 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-pink-500 to-violet-600 animate-pulse" />
              
              {healthStatus === 'CHECKING' ? (
                <>
                  <div className="w-16 h-16 border-4 border-violet-600/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{wakeTitle}</h3>
                  <p className="text-gray-400 text-xs font-semibold leading-relaxed mb-1">{wakeDesc}</p>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                    Time remaining: {formattedTime}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Server Timeout</h3>
                  <p className="text-gray-400 text-xs font-semibold leading-relaxed mb-6">The server is taking longer than expected.<br />Please try again shortly.</p>
                  <button
                    onClick={handleRetry}
                    className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-lg shadow-violet-600/20"
                  >
                    Retry Connection
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
