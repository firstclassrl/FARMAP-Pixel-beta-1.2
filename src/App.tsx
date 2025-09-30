import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
const GardenPage = lazy(() => import('./pages/GardenPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const PriceListsPage = lazy(() => import('./pages/PriceListsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SampleRequestsPage = lazy(() => import('./pages/SampleRequestsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const GardenLoginPage = lazy(() => import('./pages/GardenLoginPage').then(m => ({ default: m.GardenLoginPage })));
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Toast from './components/Toast';
import { LoadingFallback } from './components/LoadingFallback';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { user, loading, error } = useAuth();

  // Remove verbose console logs for production readiness

  // Show loading only for a brief moment, then show login if no user
  if (loading) {
    return <LoadingFallback message="Caricamento applicazione..." />;
  }

  // If there's an auth error, always show login page
  if (error) {
    // Optionally, show a toast via global store; avoid console noise
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback message="Caricamento..." /> }>
        <Routes>
          {/* Always make auth routes available */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          
          {/* Garden routes - accessible without main app authentication */}
          <Route path="/garden/login" element={<GardenLoginPage />} />
          
          {/* Garden routes for authenticated users */}
          <Route path="/garden" element={user ? <GardenPage /> : <Navigate to="/garden/login" replace />} />
          <Route path="/garden/product/:id" element={user ? <ProductDetailsPage /> : <Navigate to="/garden/login" replace />} />
          
          {!user ? (
            // Redirect all other routes to login when not authenticated
            <>
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </>
          ) : (
            // Protected routes when authenticated
            <>
              
              {/* Main app routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="price-lists" element={<PriceListsPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="sample-requests" element={<SampleRequestsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="user-management" element={
                  <ProtectedRoute requiredRole="admin"><UserManagementPage /></ProtectedRoute>
                } />
              </Route>
              
              {/* Redirect auth routes to dashboard when already logged in */}
              <Route path="/auth/*" element={<Navigate to="/" replace />} />
              
              {/* Catch-all route for authenticated users */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
        </Suspense>
      </BrowserRouter>
      <Toast />
    </ErrorBoundary>
  );
}

export default App;