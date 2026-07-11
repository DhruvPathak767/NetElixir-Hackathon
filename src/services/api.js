/**
 * Mock data + simulated API service for ForecastIQ.
 * In a real app these would call the backend; here we simulate latency
 * and return deterministic-ish data so the UI is fully functional.
 */

import { CHANNELS } from '../constants/index.js';

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

/* ---------- Helpers ---------- */
function rand(seed) {
  // deterministic pseudo-random based on seed
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function genSeries(months, base, variance, trend = 0) {
  return months.map((m, i) => ({
    label: m,
    value: Math.max(0, base + trend * i + (rand(i + 1) - 0.5) * variance),
  }));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ---------- Dashboard ---------- */
export async function getDashboardSummary() {
  await delay();
  return {
    kpis: {
      roas: { value: 4.32, prev: 3.91, delta: 10.5 },
      revenue: { value: 482000, prev: 421000, delta: 14.5 },
      spend: { value: 111600, prev: 107700, delta: 3.6 },
      conversions: { value: 8240, prev: 7650, delta: 7.7 },
      cpa: { value: 13.54, prev: 14.08, delta: -3.8 },
      ltv: { value: 312, prev: 289, delta: 7.9 },
    },
    spendVsRevenue: MONTHS.map((m, i) => ({
      label: m,
      spend: 8000 + i * 350 + rand(i) * 1500,
      revenue: 28000 + i * 1400 + rand(i + 10) * 6000,
    })),
    channelSplit: CHANNELS.map((c, i) => ({
      name: c.label,
      value: 10 + rand(i + 2) * 20,
      color: c.color,
    })),
    recentUploads: [
      { id: 1, name: 'Q4_Google_Ads.csv', date: '2025-01-12', rows: 12480, status: 'processed' },
      { id: 2, name: 'Meta_campaigns_2024.xlsx', date: '2025-01-10', rows: 8200, status: 'processed' },
      { id: 3, name: 'TikTok_dec.csv', date: '2025-01-08', rows: 3400, status: 'processing' },
    ],
    aiAlerts: [
      { id: 1, type: 'opportunity', title: 'Reallocate 15% from LinkedIn to TikTok', desc: 'Projected +8.2% ROAS lift', severity: 'high' },
      { id: 2, type: 'warning', title: 'Meta Ads CPA rising', desc: 'CPA up 12% over last 7 days', severity: 'medium' },
      { id: 3, type: 'insight', title: 'Email channel underutilized', desc: 'Highest LTV but lowest spend share', severity: 'low' },
    ],
  };
}

/* ---------- Forecast ---------- */
export async function getForecast({ horizon = 6, scenario = 'baseline' } = {}) {
  await delay(800);
  const factor = scenario === 'optimistic' ? 1.12 : scenario === 'pessimistic' ? 0.88 : 1;
  const months = MONTHS.slice(0, horizon);
  return {
    actual: MONTHS.slice(0, 6).map((m, i) => ({ label: m, value: 28000 + i * 1400 + rand(i) * 4000 })),
    forecast: months.map((m, i) => ({
      label: m,
      value: (32000 + i * 1600 + rand(i + 20) * 3000) * factor,
      lower: (32000 + i * 1600) * factor * 0.85,
      upper: (32000 + i * 1600) * factor * 1.18,
    })),
    confidence: 0.87,
    metrics: {
      projectedRevenue: Math.round(245000 * factor),
      projectedSpend: 68400,
      projectedROAS: +(4.6 * factor).toFixed(2),
    },
  };
}

/* ---------- Budget Simulator ---------- */
export async function runBudgetSimulation({ totalBudget, allocation } = {}) {
  await delay(1000);
  // Simple model: each channel has a different efficiency curve
  const eff = { google_ads: 4.8, meta_ads: 3.9, tiktok_ads: 5.4, linkedin_ads: 2.1, email: 6.2, organic: 8.0 };
  let revenue = 0;
  const breakdown = (allocation || []).map((a) => {
    const r = a.budget * (eff[a.channel] || 3) * (1 - Math.log10(a.budget / 5000 + 1) * 0.15);
    revenue += r;
    return { ...a, revenue: Math.round(r), roas: +(r / a.budget).toFixed(2) };
  });
  return {
    totalRevenue: Math.round(revenue),
    totalROAS: +(revenue / totalBudget).toFixed(2),
    projectedConversions: Math.round(revenue / 58),
    breakdown,
  };
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

/* ---------- AI Insights ---------- */
export async function getAIInsights() {
  await delay(900);
  return {
    insights: [
      {
        id: 1,
        type: 'opportunity',
        title: 'Reallocate budget from LinkedIn to TikTok',
        desc: 'TikTok is showing 2.3x higher ROAS than LinkedIn for the same audience segment. Moving 15% of LinkedIn budget could yield an additional $12,400 in monthly revenue.',
        impact: '+8.2% ROAS',
        confidence: 0.91,
        action: 'Apply in Budget Simulator',
      },
      {
        id: 2,
        type: 'warning',
        title: 'Meta Ads frequency exceeds optimal range',
        desc: 'Ad fatigue detected — frequency at 4.8 (optimal: 1.5–3). Refresh creative within 7 days to prevent CTR decline.',
        impact: '-6% CTR risk',
        confidence: 0.84,
        action: 'View Channel Analytics',
      },
      {
        id: 3,
        type: 'insight',
        title: 'Email channel has highest LTV contribution',
        desc: 'Email-driven customers show 34% higher LTV ($418 vs $312 avg) yet receive only 8% of total spend. Consider increasing share to 12–15%.',
        impact: '+$18k LTV',
        confidence: 0.78,
        action: 'Adjust allocation',
      },
      {
        id: 4,
        type: 'seasonality',
        title: 'Q1 seasonality dip approaching',
        desc: 'Historical patterns suggest a 9–14% revenue dip in weeks 6–8. Front-load spend in weeks 1–4 to smooth the curve.',
        impact: 'Smoothing',
        confidence: 0.72,
        action: 'View Forecast',
      },
    ],
    chatHistory: [],
  };
}

export async function sendAIChat(message) {
  await delay(700 + Math.random() * 800);
  const responses = {
    default: "Based on your last 90 days of data, your most efficient channel is TikTok Ads with a ROAS of 5.4x. I'd recommend reallocating 10–15% of LinkedIn spend there. Would you like me to simulate that scenario?",
    budget: "If you increase total budget by 20% while keeping the current allocation ratios, projected revenue rises to ~$578k but blended ROAS drops slightly to 4.1x due to diminishing returns on Google Ads. Want to see the optimized allocation instead?",
    forecast: "The 6-month forecast projects $245k in revenue at 87% confidence. The main risk factor is Meta Ads CPA trending upward — I'd monitor it weekly. The optimistic scenario projects $274k.",
    channel: "Email has the highest LTV ($418) but lowest spend share (8%). TikTok has the best ROAS (5.4x). LinkedIn is underperforming at 2.1x ROAS. I'd prioritize TikTok and Email over LinkedIn.",
  };
  const lower = message.toLowerCase();
  let key = 'default';
  if (lower.includes('budget')) key = 'budget';
  else if (lower.includes('forecast') || lower.includes('project')) key = 'forecast';
  else if (lower.includes('channel') || lower.includes('email') || lower.includes('tiktok')) key = 'channel';
  return { reply: responses[key] };
}

/* ---------- Channel Analytics ---------- */
export async function getChannelAnalytics(channel = 'all') {
  await delay();
  const data = CHANNELS.map((c, i) => ({
    key: c.key,
    label: c.label,
    color: c.color,
    spend: 12000 + rand(i) * 12000,
    revenue: 40000 + rand(i + 5) * 60000,
    roas: 2 + rand(i + 10) * 5,
    cpa: 8 + rand(i + 15) * 12,
    ctr: 0.8 + rand(i + 20) * 3,
    conversions: 200 + rand(i + 25) * 800,
    trend: MONTHS.map((m, j) => ({ label: m, value: 3000 + j * 200 + rand(i * 10 + j) * 2000 })),
  }));
  if (channel === 'all') return data;
  return data.filter((d) => d.key === channel);
}

/* ---------- Upload ---------- */
export async function uploadFile(file) {
  await delay(1200 + Math.random() * 1500);
  return {
    id: Date.now(),
    name: file.name,
    size: file.size,
    rows: Math.floor(file.size / 8) || 1200,
    status: 'processed',
    detectedColumns: ['date', 'channel', 'spend', 'impressions', 'clicks', 'conversions', 'revenue'],
    mapping: {},
  };
}

/* ---------- Reports ---------- */
export async function getReports() {
  await delay();
  return [
    { id: 1, name: 'Q4 2024 Performance Summary', date: '2025-01-15', type: 'pdf', size: '2.4 MB' },
    { id: 2, name: 'Channel Efficiency Analysis', date: '2025-01-12', type: 'pdf', size: '1.8 MB' },
    { id: 3, name: 'Budget Optimization Plan', date: '2025-01-10', type: 'xlsx', size: '420 KB' },
    { id: 4, name: 'Monthly Forecast — January', date: '2025-01-05', type: 'pdf', size: '1.2 MB' },
  ];
}

/* ---------- Settings ---------- */
export async function getSettings() {
  await delay(300);
  return {
    profile: { name: 'Alex Morgan', email: 'alex@forecastiq.io', role: 'Marketing Lead', company: 'Nimbus Labs' },
    notifications: {
      weeklyReport: true,
      aiAlerts: true,
      budgetThreshold: true,
      productUpdates: false,
    },
    integrations: [
      { id: 'google', name: 'Google Ads', connected: true, status: 'active' },
      { id: 'meta', name: 'Meta Ads', connected: true, status: 'active' },
      { id: 'tiktok', name: 'TikTok Ads', connected: true, status: 'active' },
      { id: 'linkedin', name: 'LinkedIn Ads', connected: false, status: 'disconnected' },
      { id: 'hubspot', name: 'HubSpot', connected: false, status: 'disconnected' },
    ],
  };
}
