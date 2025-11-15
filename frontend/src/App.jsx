import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loader from '@/components/Loader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';

import ProtectedRoute from '@/components/ProtectedRoute';

import HomePage from '@/pages/Public/HomePage';
import PublicTournamentListPage from '@/pages/Public/PublicTournamentListPage';
import PublicTournamentViewerPage from '@/pages/Public/PublicTournamentViewerPage';

import LoginPage from '@/pages/Auth/LoginPage';
import SignupPage from '@/pages/Auth/SignupPage';
import PendingApprovalPage from '@/pages/Auth/PendingApprovalPage';
import CheckEmailPage from '@/pages/Auth/CheckEmailPage';
import OtpSetupPage from '@/pages/Auth/OtpSetupPage';
import OtpVerifyPage from '@/pages/Auth/OtpVerifyPage';
import ResetPasswordPage from '@/pages/Auth/ResetPasswordPage';
import DiscordCallbackPage from '@/pages/Auth/DiscordCallbackPage';
import GoogleCallbackPage from '@/pages/Auth/GoogleCallbackPage';

import AdminLayout from '@/pages/Dashboard/AdminLayout';
import AdminDashboard from '@/pages/Dashboard/AdminDashboard';
import TournamentListPage from '@/pages/Dashboard/TournamentListPage';
import TournamentWorkspace from '@/pages/Dashboard/TournamentWorkspace';

import SuperAdminLayout from '@/pages/SuperAdmin/SuperAdminLayout';
import SuperAdminDashboard from '@/pages/SuperAdmin/SuperAdminDashboard';
import UserManagementPage from '@/pages/SuperAdmin/UserManagementPage';
import SystemManagementPage from '@/pages/SuperAdmin/SystemManagementPage';
import AnalyticsPage from '@/pages/SuperAdmin/AnalyticsPage';
import ActivityLogPage from '@/pages/SuperAdmin/ActivityLogPage';

import AccountSettingsPage from '@/pages/Account/AccountSettingsPage';
import MyAccountTab from '@/pages/Account/MyAccountTab';
import UserProfileTab from '@/pages/Account/UserProfileTab';

import NotFoundPage from '@/pages/NotFoundPage';

const PageLayout = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
  >
    {children}
  </motion.div>
);

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AnimatePresence mode='wait'>
        <Routes location={location} key={location.pathname}>
          <Route
            path='/'
            element={
              <PageLayout>
                <HomePage />
              </PageLayout>
            }
          />
          <Route
            path='/tournaments'
            element={
              <PageLayout>
                <PublicTournamentListPage />
              </PageLayout>
            }
          />
          <Route
            path='/tournaments/:id'
            element={
              <PageLayout>
                <PublicTournamentViewerPage />
              </PageLayout>
            }
          />

          <Route
            path='/login'
            element={
              user ? (
                <Navigate to='/admin' replace />
              ) : (
                <PageLayout>
                  <LoginPage />
                </PageLayout>
              )
            }
          />
          <Route
            path='/signup'
            element={
              user ? (
                <Navigate to='/admin' replace />
              ) : (
                <PageLayout>
                  <SignupPage />
                </PageLayout>
              )
            }
          />
          <Route
            path='/pending-approval'
            element={
              <PageLayout>
                <PendingApprovalPage />
              </PageLayout>
            }
          />
          <Route
            path='/check-email'
            element={
              <PageLayout>
                <CheckEmailPage />
              </PageLayout>
            }
          />
          <Route
            path='/verify-email'
            element={
              <PageLayout>
                <PendingApprovalPage />
              </PageLayout>
            }
          />
          <Route
            path='/setup-2fa'
            element={
              user ? (
                <PageLayout>
                  <OtpSetupPage />
                </PageLayout>
              ) : (
                <Navigate to='/login' replace />
              )
            }
          />
          <Route
            path='/verify-2fa'
            element={
              <PageLayout>
                <OtpVerifyPage />
              </PageLayout>
            }
          />
          <Route
            path='/reset-password'
            element={
              <PageLayout>
                <ResetPasswordPage />
              </PageLayout>
            }
          />
          <Route
            path='/auth/callback/discord'
            element={
              <PageLayout>
                <DiscordCallbackPage />
              </PageLayout>
            }
          />
          <Route
            path='/auth/callback/google'
            element={
              <PageLayout>
                <GoogleCallbackPage />
              </PageLayout>
            }
          />

          <Route
            path='/admin'
            element={
              <ProtectedRoute role='admin'>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to='dashboard' replace />} />
            <Route path='dashboard' element={<AdminDashboard />} />
            <Route path='tournaments' element={<TournamentListPage />} />
            <Route path='tournament/:id' element={<TournamentWorkspace />} />
          </Route>

          <Route
            path='/superadmin'
            element={
              <ProtectedRoute role='super_admin'>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to='dashboard' replace />} />
            <Route path='dashboard' element={<SuperAdminDashboard />} />
            <Route path='users' element={<UserManagementPage />} />
            <Route path='system' element={<SystemManagementPage />} />
            <Route path='analytics' element={<AnalyticsPage />} />
            <Route path='activity' element={<ActivityLogPage />} />
          </Route>

          <Route
            path='/account-settings'
            element={
              <ProtectedRoute>
                <AccountSettingsPage />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to='my-account' replace />} />
            <Route path='my-account' element={<MyAccountTab />} />
            <Route path='profile' element={<UserProfileTab />} />
          </Route>

          <Route
            path='*'
            element={
              <PageLayout>
                <NotFoundPage />
              </PageLayout>
            }
          />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default App;
