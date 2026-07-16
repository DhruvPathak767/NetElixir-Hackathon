import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { PageLoader } from './components/Loader.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Upload from './pages/Upload.jsx';
import DatasetPreview from './pages/DatasetPreview.jsx';
import ValidationReport from './pages/ValidationReport.jsx';
import Preprocessing from './pages/Preprocessing.jsx';
import FeatureEngineering from './pages/FeatureEngineering.jsx';
import ModelTraining from './pages/ModelTraining.jsx';
import Forecast from './pages/Forecast.jsx';
import BudgetSimulator from './pages/BudgetSimulator.jsx';
import AIInsights from './pages/AIInsights.jsx';
import AIChat from './pages/AIChat.jsx';
import RecommendationHistory from './pages/RecommendationHistory.jsx';
import Reports from './pages/Reports.jsx';
import ModelMonitor from './pages/ModelMonitor.jsx';
import SystemHealth from './pages/SystemHealth.jsx';
import Settings from './pages/Settings.jsx';
import Landing from './pages/Landing.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';


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
              <Route path="ai-insights" element={<AIInsights />} />
              <Route path="ai-chat" element={<AIChat />} />
              <Route path="recommendation-history" element={<RecommendationHistory />} />
              <Route path="reports" element={<Reports />} />
              <Route path="model-monitor" element={<ModelMonitor />} />
              <Route path="system-health" element={<SystemHealth />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
