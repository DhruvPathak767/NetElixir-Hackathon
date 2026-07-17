import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { PageLoader } from './components/Loader.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import AppLayout from './layouts/AppLayout.jsx';

// Lazy loaded pages
const Login = lazy(() => import('./pages/Login.jsx'));
const Signup = lazy(() => import('./pages/Signup.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Upload = lazy(() => import('./pages/Upload.jsx'));
const DatasetPreview = lazy(() => import('./pages/DatasetPreview.jsx'));
const ValidationReport = lazy(() => import('./pages/ValidationReport.jsx'));
const Preprocessing = lazy(() => import('./pages/Preprocessing.jsx'));
const FeatureEngineering = lazy(() => import('./pages/FeatureEngineering.jsx'));
const ModelTraining = lazy(() => import('./pages/ModelTraining.jsx'));
const Forecast = lazy(() => import('./pages/Forecast.jsx'));
const BudgetSimulator = lazy(() => import('./pages/BudgetSimulator.jsx'));
const AIInsights = lazy(() => import('./pages/AIInsights.jsx'));
const AIChat = lazy(() => import('./pages/AIChat.jsx'));
const RecommendationHistory = lazy(() => import('./pages/RecommendationHistory.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const ModelMonitor = lazy(() => import('./pages/ModelMonitor.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Landing = lazy(() => import('./pages/Landing.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const Docs = lazy(() => import('./pages/Docs.jsx'));
const Support = lazy(() => import('./pages/Support.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <PageLoader label="Restoring session..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader label="Loading ForecastIQ..." />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/reset%20password/:token" element={<ResetPassword />} />
                <Route path="/reset password/:token" element={<ResetPassword />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/support" element={<Support />} />
                <Route path="/app" element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="upload" element={<Upload />} />
                  <Route path="dataset-preview" element={<DatasetPreview />} />
                  <Route path="validation-report" element={<ValidationReport />} />
                  <Route path="preprocessing" element={<Preprocessing />} />
                  <Route path="feature-engineering" element={<FeatureEngineering />} />
                  <Route path="model-training" element={<ModelTraining />} />
                  <Route path="forecast" element={<Forecast />} />
                  <Route path="budget-simulator" element={<BudgetSimulator />} />
                  <Route path="scenario-comparison" element={<BudgetSimulator />} />
                  <Route path="ai-insights" element={<AIInsights />} />
                  <Route path="ai-chat" element={<AIChat />} />
                  <Route path="recommendation-history" element={<RecommendationHistory />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="model-monitor" element={<ModelMonitor />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
