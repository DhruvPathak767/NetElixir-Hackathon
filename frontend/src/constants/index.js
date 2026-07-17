export const APP_NAME = 'ForecastIQ';
export const APP_TAGLINE = 'AI-Powered Marketing Spend Optimization';

export const NAV_ITEMS = [
  { path: '/app/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/app/upload', label: 'Upload Data', icon: 'UploadCloud' },
  { path: '/app/dataset-preview', label: 'Dataset Preview', icon: 'Eye' },
  { path: '/app/validation-report', label: 'Validation Report', icon: 'ShieldCheck' },
  { path: '/app/preprocessing', label: 'Preprocessing', icon: 'Cpu' },
  { path: '/app/feature-engineering', label: 'Feature Engineering', icon: 'GitBranch' },
  { path: '/app/model-training', label: 'Model Training', icon: 'Award' },
  { path: '/app/forecast', label: 'Forecast Studio', icon: 'TrendingUp' },
  { path: '/app/budget-simulator', label: 'Budget Simulator', icon: 'SlidersHorizontal' },
  { path: '/app/scenario-comparison', label: 'Scenario Comparison', icon: 'Columns' },
  { path: '/app/ai-insights', label: 'AI Insights', icon: 'Sparkles' },
  { path: '/app/ai-chat', label: 'AI Chat', icon: 'MessageSquare' },
  { path: '/app/recommendation-history', label: 'AI Rec History', icon: 'History' },
  { path: '/app/model-monitor', label: 'Model Monitor', icon: 'Activity' },
  { path: '/app/reports', label: 'Reports', icon: 'FileText' },
  { path: '/app/settings', label: 'Settings', icon: 'Settings' },
];

export const SIDEBAR_FOOTER_ITEMS = [
  { path: '/app/settings', label: 'Settings', icon: 'Settings' },
];

export const CHART_COLORS = {
  primary: '#22d3ee',
  secondary: '#10b981',
  accent: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

export const CHANNELS = [
  { key: 'google_ads', label: 'Google Ads', color: '#22d3ee' },
  { key: 'meta_ads', label: 'Meta Ads', color: '#3b82f6' },
  { key: 'tiktok_ads', label: 'TikTok Ads', color: '#10b981' },
  { key: 'linkedin_ads', label: 'LinkedIn Ads', color: '#f59e0b' },
  { key: 'email', label: 'Email', color: '#ec4899' },
  { key: 'organic', label: 'Organic / SEO', color: '#8b5cf6' },
];

export const KPI_META = {
  roas: { label: 'ROAS', format: (v) => `${v.toFixed(2)}x`, icon: 'Target' },
  cpa: { label: 'CPA', format: (v) => `$${v.toFixed(2)}`, icon: 'DollarSign' },
  cac: { label: 'CAC', format: (v) => `$${v.toFixed(2)}`, icon: 'UserPlus' },
  ltv: { label: 'LTV', format: (v) => `$${v.toFixed(0)}`, icon: 'HeartHandshake' },
  revenue: { label: 'Revenue', format: (v) => `$${(v / 1000).toFixed(1)}k`, icon: 'TrendingUp' },
  spend: { label: 'Spend', format: (v) => `$${(v / 1000).toFixed(1)}k`, icon: 'Wallet' },
  conversions: { label: 'Conversions', format: (v) => v.toLocaleString(), icon: 'CheckCircle2' },
  ctr: { label: 'CTR', format: (v) => `${v.toFixed(2)}%`, icon: 'MousePointerClick' },
};
