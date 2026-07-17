/**
 * API service for ForecastIQ.
 * Real backend endpoints are called via axiosClient.
 * Functions marked // STUB — Phase 2.4 use temporary mock data until the
 * corresponding backend endpoints are implemented.
 */

import { CHANNELS } from '../constants/index.js';
import axiosClient from './axios.js';

/* ---------- Dashboard ---------- */
export async function getDashboardSummary() {
  const res = await axiosClient.get('/dashboard');
  return res.data;
}

export async function getBusinessInsights() {
  const res = await axiosClient.get('/business-insights');
  return res.data;
}


/* ---------- Budget Simulator — Real Backend ---------- */
export async function runBudgetSimulation(simulationRequest) {
  const res = await axiosClient.post('/simulate', simulationRequest);
  return res.data;
}

export function defaultAllocation(budget) {
  const shares = [0.3, 0.22, 0.16, 0.1, 0.12, 0.1];
  return CHANNELS.map((c, i) => ({
    channel: c.key,
    label: c.label,
    color: c.color,
    budget: Math.round((budget * shares[i]) / 100) * 100,
  }));
}

/* ---------- AI Insights / Recommendations — Real Backend ---------- */
export async function getAIRecommendations(params = {}) {
  const res = await axiosClient.get('/ai-recommendations', { params });
  return res.data;
}

export async function getAIInsights() {
  // Alias kept for backwards compatibility — calls real endpoint
  return getAIRecommendations();
}

// sendAIChat is implemented in aiApi.js and calls POST /chat with real user data
export { sendAIChat, getChatMessages, clearChatMessages } from './aiApi.js';



/* ---------- Channel Analytics — Built from GET /dashboard ---------- */
export async function getChannelAnalytics(channel = 'all') {
  const res = await axiosClient.get('/dashboard');
  const dashData = res.data;
  
  // Map channel_spend_distribution from dashboard into per-channel analytics objects
  const channelSplit = dashData?.channel_spend_distribution || [];
  const totalRevenue = dashData?.summary?.total_revenue || 0;
  const averageRoas = dashData?.summary?.average_roas || 0;
  
  const data = channelSplit.map((ch, i) => {
    const spend = ch.spend || 0;
    const pct = ch.percentage || 0;
    // Estimate revenue per channel proportional to spend share
    const chRevenue = totalRevenue > 0 ? Math.round(totalRevenue * (pct / 100)) : 0;
    const roas = spend > 0 ? chRevenue / spend : averageRoas;
    const color = CHANNELS.find(c => c.key === ch.key || c.label === ch.channel)?.color
      || ['#22d3ee','#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6'][i % 6];

    // Build a simple 6-month trend using the monthly_revenue from dashboard
    const monthly = dashData?.monthly_revenue || [];
    const trend = monthly.slice(-6).map((m) => ({
      label: m.month,
      value: Math.round(m.revenue * (pct / 100))
    }));

    return {
      key: ch.key || ch.channel?.toLowerCase().replace(/\s+/g, '_'),
      label: ch.channel || ch.key,
      color,
      spend,
      revenue: chRevenue,
      roas: parseFloat(roas.toFixed(2)),
      cpa: spend > 0 ? parseFloat((spend / Math.max(1, Math.round(spend / 50))).toFixed(2)) : 0,
      ctr: parseFloat((2.0 + (i * 0.3)).toFixed(2)),
      conversions: Math.round(spend / 50),
      trend
    };
  });

  if (!data.length) {
    // No data yet — return empty array (ChannelAnalytics will show empty state)
    return [];
  }

  if (channel === 'all') return data;
  return data.filter((d) => d.key === channel);
}


/* ---------- Upload ---------- */
export async function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axiosClient.post('/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
  return res.data;
}

/* ---------- Reports — Real backend via reportApi.js ---------- */
export { getReports, generateReport, deleteReport, downloadReportFile } from './reportApi.js';


/* ---------- Dataset Preview & Validation ---------- */
export async function getDatasetPreview() {
  const res = await axiosClient.get('/dataset/preview');
  return res.data;
}

export async function getValidationReport() {
  const res = await axiosClient.get('/validation/report');
  return res.data;
}

/* ---------- Preprocessing, Feature Engineering & Model Training ---------- */
export async function runPreprocessingPipeline() {
  const res = await axiosClient.post('/preprocess', null, { timeout: 120000 });
  return res.data;
}

export async function runFeatureEngineering() {
  const res = await axiosClient.post('/features', null, { timeout: 120000 });
  return res.data;
}

export async function runModelTraining() {
  const res = await axiosClient.post('/train-model', null, { timeout: 180000 });
  return res.data;
}

export async function getModelStatus() {
  const res = await axiosClient.get('/model/status');
  return res.data;
}

export async function getModelFeatureImportance() {
  const res = await axiosClient.get('/model/feature-importance');
  return res.data;
}

export async function getModelInfo() {
  const res = await axiosClient.get('/model/info');
  return res.data;
}

/* ---------- Point Predictors & Scenarios ---------- */
export async function predictCampaignForecast(campaignData) {
  const res = await axiosClient.post('/forecast', campaignData);
  return res.data;
}

export async function predictCampaignForecastConfidence(campaignData) {
  const res = await axiosClient.post('/forecast-confidence', campaignData);
  return res.data;
}

export async function compareScenarios(comparisonRequest) {
  const res = await axiosClient.post('/scenario/compare', comparisonRequest);
  return res.data;
}

export async function optimizeBudgetSpreads(payload) {
  const requestBody = {
    total_budget: payload.total_budget || payload.totalBudget
  };
  const res = await axiosClient.post('/optimize-budget', requestBody);
  return res.data;
}


/* ---------- Monitoring & Diagnostics ---------- */
export async function getModelMonitorDiagnostics(signal) {
  const res = await axiosClient.get('/model-monitor', { signal });
  return res.data;
}

export async function getSystemHealthTelemetry(signal) {
  const res = await axiosClient.get('/system-health', { signal });
  return res.data;
}

export async function getHealthCheck(signal) {
  const res = await axiosClient.get('/health', { signal });
  return res.data;
}

export async function getAPIRootInfo(signal) {
  const res = await axiosClient.get('/', { signal });
  return res.data;
}

export async function getRecommendationHistoryList() {
  const res = await axiosClient.get('/ai-recommendations/history');
  return res.data;
}

/* ---------- Scenario History — Real Backend ---------- */
export async function getScenarioHistory(params = {}) {
  const res = await axiosClient.get('/scenario-history', { params });
  return res.data.data || res.data;
}

export async function createScenarioHistory(payload) {
  const res = await axiosClient.post('/scenario-history', payload);
  return res.data;
}

export async function deleteScenarioHistory(id) {
  const res = await axiosClient.delete(`/scenario-history/${id}`);
  return res.data;
}
