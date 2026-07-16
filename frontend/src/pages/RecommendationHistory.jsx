/**
 * RecommendationHistory.jsx
 * Redirects to the AI Decision Center History tab.
 * The full history experience now lives in AIInsights.jsx (Tab 3).
 */
import { Navigate } from 'react-router-dom';

export default function RecommendationHistory() {
  return <Navigate to="/app/ai-insights?tab=3" replace />;
}
