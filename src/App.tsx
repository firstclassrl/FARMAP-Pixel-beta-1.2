import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import GardenPage from './pages/GardenPage';
import Dashboard from './pages/Dashboard';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import PriceListsPage from './pages/PriceListsPage';
import OrdersPage from './pages/OrdersPage';
import SampleRequestsPage from './pages/SampleRequestsPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserManagementPage from './pages/UserManagementPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotificationToast } from './components/NotificationToast';
import { LoadingFallback } from './components/LoadingFallback';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { user, loading, error } = useAuth();

  console.log('🚀 App: Current auth state:', { 
    hasUser: !!user, 
    loading, 
    hasError: !!error,
    userEmail: user?.email 
  });

  // Show loading only for a brief moment, then show login if no user
  if (loading) {
    console.log('🚀 App: Showing loading fallback');
    return <LoadingFallback message="Caricamento applicazione..." />;
  }

  // If there's an auth error, always show login page
  if (error) {
    console.error('🚀 App: Auth error:', error);
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Always make auth routes available */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          
          {!user ? (
            // Redirect all other routes to login when not authenticated
            <>
              {console.log('🚀 App: No user, redirecting to login')}
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </>
          ) : (
            // Protected routes when authenticated
            <>
              {console.log('🚀 App: User authenticated, showing protected routes')}
              <Route path="garden" element={<GardenPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="price-lists" element={<PriceListsPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="sample-requests" element={<SampleRequestsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="user-management" element={
                  <ProtectedRoute requiredRole="admin"><UserManagementPage /></ProtectedRoute>
                } />
              </Route>
              {/* Redirect auth routes to dashboard when already logged in */}
              <Route path="/auth/*" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
      <NotificationToast />
    </ErrorBoundary>
  );
}

export default App;