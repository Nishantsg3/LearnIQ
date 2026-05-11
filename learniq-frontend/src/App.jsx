import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
