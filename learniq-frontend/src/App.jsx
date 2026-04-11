import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/AdminLogin'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import OtpVerification from './pages/OtpVerification'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import QuestionManager from './pages/QuestionManager'
import QuestionBank from './pages/QuestionBank'
import TestAttempt from './pages/TestAttempt'
import TestResultView from './pages/TestResultView'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import { AuthProvider } from './context/AuthContext'

function App() {
  const withLayout = (Component) => (
    <MainLayout>
      {Component}
    </MainLayout>
  );

  return (
    <AuthProvider>
      <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { fontSize: '13px', borderRadius: '8px', background: '#333', color: '#fff' }
      }} />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
        <Route path="/admin-access" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── STUDENT ROUTES (requiredRole="STUDENT") ─────────────────────── */}
        {/* Admin trying these → /admin-dashboard */}
        <Route path="/student-dashboard" element={
          <ProtectedRoute requiredRole="STUDENT">{withLayout(<StudentDashboard />)}</ProtectedRoute>
        } />

        <Route path="/attempt/:attemptId" element={
          <ProtectedRoute requiredRole="STUDENT"><TestAttempt /></ProtectedRoute>
        } />

        <Route path="/results/:attemptId" element={
          <ProtectedRoute requiredRole="STUDENT">{withLayout(<TestResultView />)}</ProtectedRoute>
        } />

        {/* ── ADMIN ROUTES (requiredRole="ADMIN") ──────────────────────────── */}
        {/* Student trying these → /student-dashboard */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="ADMIN">{withLayout(<AdminDashboard />)}</ProtectedRoute>
        } />

        <Route path="/admin/tests/:testId/questions" element={
          <ProtectedRoute requiredRole="ADMIN">{withLayout(<QuestionManager />)}</ProtectedRoute>
        } />

        <Route path="/admin/bank" element={
          <ProtectedRoute requiredRole="ADMIN">{withLayout(<QuestionBank />)}</ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  )
}

export default App
