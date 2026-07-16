export const APP_NAME = 'ForecastIQ';
export const APP_TAGLINE = 'AI-Powered Marketing Spend Optimization';

export const NAV_ITEMS = [
  { path: '/app/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/app/upload', label: 'Upload Data', icon: 'UploadCloud' },
  { path: '/app/forecast', label: 'Forecast', icon: 'TrendingUp' },
  { path: '/app/budget-simulator', label: 'Budget Simulator', icon: 'SlidersHorizontal' },
  { path: '/app/ai-insights', label: 'AI Insights', icon: 'Sparkles' },
  { path: '/app/channel-analytics', label: 'Channel Analytics', icon: 'BarChart3' },
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
