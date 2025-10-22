import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import GardenPage from './pages/GardenPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import Dashboard from './pages/Dashboard';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import PriceListsPage from './pages/PriceListsPage';
import OrdersPage from './pages/OrdersPage';
import CalendarPage from './pages/CalendarPage';
import SampleRequestsPage from './pages/SampleRequestsPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserManagementPage from './pages/UserManagementPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { GardenLoginPage } from './pages/GardenLoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Toast from './components/Toast';
import { LoadingFallback } from './components/LoadingFallback';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { user, profile, loading, error } = useAuth();

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
          ) : profile?.role === 'production' ? (
            // Production users can only access Garden
            <>
              <Route path="/garden" element={<GardenPage />} />
              <Route path="/garden/product/:id" element={<ProductDetailsPage />} />
              <Route path="*" element={<Navigate to="/garden" replace />} />
            </>
          ) : (
            // Protected routes when authenticated (non-production users)
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
      </BrowserRouter>
      <Toast />
    </ErrorBoundary>
  );
}

export default App;