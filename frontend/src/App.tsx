import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { SearchPage } from './pages/public/SearchPage';
import { MapPage } from './pages/public/MapPage';

import { DashboardPage } from './pages/student/DashboardPage';
import { ReportLostPage } from './pages/student/ReportLostPage';
import { ReportFoundPage } from './pages/student/ReportFoundPage';
import { ItemDetailPage } from './pages/student/ItemDetailPage';
import { CaseDetailPage } from './pages/student/CaseDetailPage';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/lost/:id" element={<ItemDetailPage type="lost" />} />
                <Route path="/found/:id" element={<ItemDetailPage type="found" />} />

                {/* Student Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report-lost"
                  element={
                    <ProtectedRoute>
                      <ReportLostPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report-found"
                  element={
                    <ProtectedRoute>
                      <ReportFoundPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cases/:caseId"
                  element={
                    <ProtectedRoute>
                      <CaseDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
