/**
 * BudgetSimulator.jsx — Phase 2.5 Executive Budget Simulator Workspace
 * Features:
 *   - Tab 0: Budget Simulation (POST /simulate) with date inputs, campaign types, regions, custom metrics, and persistent local history.
 *   - Tab 1: Scenario Comparison (POST /scenario/compare) with side-by-side forms, scorebars, risk analyses, and comparison charts.
 *   - Tab 2: Budget Optimizer (POST /optimize-budget) with total budget scaling, baseline vs optimized comparisons, alternative recommend tables, and channel insights.
 */
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  PieChart, Pie, AreaChart, Area,
} from 'recharts';
import {
  SlidersHorizontal, Sparkles, RotateCcw, TrendingUp, DollarSign, Target,
  RefreshCw, Award, Copy, Check, Info, AlertTriangle, AlertCircle, Cpu, Clock, HelpCircle,
  BarChart3, Settings, Columns, Zap, Calendar, MapPin, ChevronDown, ChevronUp, History, Trash2,
  Database
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { Skeleton } from '../components/Loader.jsx';
import { useToast } from '../components/Toast.jsx';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { AIEmptyState } from '../components/AIComponents.jsx';
import {
  runBudgetSimulation, compareScenarios, optimizeBudgetSpreads, getDatasetPreview, getModelStatus,
  getScenarioHistory, createScenarioHistory, deleteScenarioHistory
} from '../services/api.js';

/* ── Global Constants & Configs ────────────────────────────── */
const TABS = [
  { id: 0, label: 'Budget Simulator', icon: SlidersHorizontal },
  { id: 1, label: 'Scenario Comparison', icon: Columns },
  { id: 2, label: 'Budget Optimizer', icon: Zap },
];

const CAMPAIGN_TYPES = ["Awareness", "Brand", "Lead Generation", "Performance", "Remarketing", "Shopping", "Video"];
const REGIONS = ["Central", "East", "North", "South", "West"];
const MONTHS = [
  { val: 1, label: 'January' }, { val: 2, label: 'February' }, { val: 3, label: 'March' },
  { val: 4, label: 'April' }, { val: 5, label: 'May' }, { val: 6, label: 'June' },
  { val: 7, label: 'July' }, { val: 8, label: 'August' }, { val: 9, label: 'September' },
  { val: 10, label: 'October' }, { val: 11, label: 'November' }, { val: 12, label: 'December' }
];
const DAYS_OF_WEEK = [
  { val: 0, label: 'Monday' }, { val: 1, label: 'Tuesday' }, { val: 2, label: 'Wednesday' },
  { val: 3, label: 'Thursday' }, { val: 4, label: 'Friday' }, { val: 5, label: 'Saturday' },
  { val: 6, label: 'Sunday' }
];

const CHART_COLORS = ['#22d3ee', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

const TT = {
  contentStyle: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    fontSize: 11,
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-md)',
  },
};
const AXIS_TICK = { fill: 'var(--chart-axis)', fontSize: 10 };

/* ── Reusable Mini Widgets ─────────────────────────────────── */
const SimulationSkeleton = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
    <Card padding="lg">
      <Skeleton width="40%" height={16} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={32} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={32} style={{ marginBottom: 12 }} />
      <Skeleton width="80%" height={32} />
    </Card>
    <Card padding="lg">
      <Skeleton width="60%" height={24} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={140} />
    </Card>
  </div>
);

const SimulatorErrorCard = ({ title, message, onRetry }) => (
  <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 280 }}>
    <div className="empty-state-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--r-lg)', margin: '0 auto 16px' }}>
      <AlertTriangle size={24} />
    </div>
    <div style={{ fontWeight: 600, fontSize: 'var(--fs-base)', color: 'var(--text-primary)', marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', maxWidth: 320, marginBottom: 16 }}>{message}</div>
    {onRetry && (
      <Button variant="primary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={onRetry}>
        Retry Simulation
      </Button>
    )}
  </Card>
);

const RiskBadge = ({ level }) => {
  const cls = level === 'Low' ? 'badge-success' : level === 'High' ? 'badge-danger' : 'badge-warning';
  return <span className={`badge ${cls}`} style={{ fontSize: 9, padding: '2px 6px' }}>{level} Risk</span>;
};

const ScoreIndicator = ({ label, score, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
      <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{score}/100</span>
    </div>
    <div style={{ height: 4, background: 'var(--bg-surface-3)', borderRadius: 2, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8 }}
        style={{ height: '100%', background: color }}
      />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   TAB 0 — Simulator Workspace
   ═══════════════════════════════════════════════════════════ */
const SimulatorTab = memo(function SimulatorTab({
  formData, setFormData, runSim, result, loading, error, clearResult,
  customEngagement, setCustomEngagement, dbHistory, handleRestore, handleCompareScenario,
  handleDeleteScenario, historySearch, setHistorySearch, historyPage, setHistoryPage,
  historyTotalPages, availableChannels
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const totalSpend = useMemo(() => {
    return availableChannels.reduce((acc, ch) => acc + (formData[ch] || 0), 0);
  }, [formData, availableChannels]);

  /* Auto-calculate engagements based on spends unless customized */
  const spendDeps = availableChannels.map(ch => formData[ch]).join(',');
  useEffect(() => {
    if (!customEngagement && availableChannels.length > 0) {
      const total = availableChannels.reduce((acc, ch) => acc + (formData[ch] || 0), 0);
      const cpc = 15.90;
      const ctr = 0.021;
      const convRate = 0.0703;

      const clicks = total > 0 ? Math.round(total / cpc) : 0;
      const impressions = clicks > 0 ? Math.round(clicks / ctr) : 0;
      const conversions = clicks > 0 ? Math.round(clicks * convRate) : 0;

      setFormData(prev => {
        if (prev.clicks === clicks && prev.impressions === impressions && prev.conversions === conversions) {
          return prev;
        }
        return {
          ...prev,
          clicks,
          impressions,
          conversions
        };
      });
    }
  }, [spendDeps, customEngagement, availableChannels, setFormData]);

  const copyToClipboard = () => {
    if (!result) return;
    const text = `Simulation Result (Model ${result.model_version}):
Predicted Revenue: $${result.predicted_revenue.toLocaleString()}
Total Spend: $${result.total_spend.toLocaleString()}
Projected ROAS: ${result.predicted_roas}x
Estimated Net Profit: $${result.estimated_profit.toLocaleString()}
Latency: ${result.prediction_time_ms} ms`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Simulation details copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    const resetData = {
      clicks: 6280,
      impressions: 299000,
      conversions: 440,
      campaign_type: 'Performance',
      region: 'East',
      month: 7,
      day: 15,
      day_of_week: 2,
      is_weekend: 0,
    };
    availableChannels.forEach((ch, idx) => {
      const defaults = [60000, 30000, 10000];
      resetData[ch] = defaults[idx] || 10000;
    });
    setFormData(resetData);
    setCustomEngagement(false);
    clearResult();
  };

  const pieData = useMemo(() => {
    const colors = ['#22d3ee', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];
    return availableChannels.map((ch, idx) => {
      const label = ch.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").replace(/^(.)/, l => l.toUpperCase());
      return {
        name: label + ' Ads',
        value: formData[ch] || 0,
        color: colors[idx % colors.length]
      };
    }).filter(c => c.value > 0);
  }, [formData, availableChannels]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>
      {/* Configuration Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Simulation Config</div>
            <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={handleReset}>Reset</Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. Spend Allocations */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>1. Ad Spends</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {availableChannels.map((ch, idx) => {
                  const colors = ['#22d3ee', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];
                  const color = colors[idx % colors.length];
                  const label = ch.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").replace(/^(.)/, l => l.toUpperCase()) + " Spend";
                  const value = formData[ch] !== undefined ? formData[ch] : 0;
                  return (
                    <div key={ch}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{label}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>${value.toLocaleString()}</strong>
                      </div>
                      <input
                        type="range" min="0" max="200000" step="1000"
                        value={value}
                        onChange={e => setFormData(prev => ({ ...prev, [ch]: +e.target.value }))}
                        className="range-slider"
                        style={{ accentColor: color }}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-surface-2)', borderRadius: 'var(--r-md)', fontSize: 11, marginTop: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Calculated Total Spend:</span>
                <strong style={{ color: 'var(--brand-400)' }}>${totalSpend.toLocaleString()}</strong>
              </div>
            </div>

            {/* 2. Targeting parameters */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>2. Campaign Settings</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <span className="input-label">Campaign Type</span>
                  <select
                    className="input"
                    value={formData.campaign_type}
                    onChange={e => setFormData(prev => ({ ...prev, campaign_type: e.target.value }))}
                  >
                    {CAMPAIGN_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Region</span>
                  <select
                    className="input"
                    value={formData.region}
                    onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  >
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Date Configuration */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>3. Timeline</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <div className="input-group">
                  <span className="input-label">Month</span>
                  <select className="input" value={formData.month} onChange={e => setFormData(prev => ({ ...prev, month: +e.target.value }))}>
                    {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Day</span>
                  <input
                    type="number" className="input" min="1" max="31"
                    value={formData.day}
                    onChange={e => setFormData(prev => ({ ...prev, day: Math.max(1, Math.min(31, +e.target.value)) }))}
                  />
                </div>
                <div className="input-group">
                  <span className="input-label">Day of Week</span>
                  <select className="input" value={formData.day_of_week} onChange={e => setFormData(prev => ({ ...prev, day_of_week: +e.target.value }))}>
                    {DAYS_OF_WEEK.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Weekend</span>
                  <select className="input" value={formData.is_weekend} onChange={e => setFormData(prev => ({ ...prev, is_weekend: +e.target.value }))}>
                    <option value={0}>Weekday</option>
                    <option value={1}>Weekend</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Engagement Metrics */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>4. Engagement Volumes</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 10, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={customEngagement} onChange={e => setCustomEngagement(e.target.checked)} />
                  Manual Overrides
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Impressions', key: 'impressions', step: 1000 },
                  { label: 'Clicks', key: 'clicks', step: 10 },
                  { label: 'Conversions', key: 'conversions', step: 1 }
                ].map(v => (
                  <div key={v.key} className="input-group">
                    <span className="input-label">{v.label}</span>
                    <input
                      type="number" className="input" disabled={!customEngagement}
                      value={formData[v.key]}
                      onChange={e => setFormData(prev => ({ ...prev, [v.key]: Math.max(0, +e.target.value) }))}
                    />
                  </div>
                ))}
              </div>
              {!customEngagement && (
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 6 }}>
                  💡 Engagement metrics are calculated dynamically using historical campaign CTR and CPA metrics. Turn on overrides for custom simulation.
                </div>
              )}
            </div>

            <Button
              variant="primary" fullWidth size="lg"
              loading={loading} onClick={runSim} disabled={totalSpend === 0}
              leftIcon={<SlidersHorizontal size={18} />}
            >
              Run Simulation
            </Button>
          </div>
        </Card>

        {/* History log under form */}
        {/* Scenario History log panel */}
        <Card padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
                <History size={16} style={{ color: 'var(--brand-400)' }} /> Scenario History
              </div>
            </div>
            
            {/* Search Input */}
            <input
              type="text"
              className="input input-sm"
              placeholder="Search by scenario name..."
              value={historySearch}
              onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
              style={{ fontSize: 11, padding: '4px 8px', height: 'auto' }}
            />
          </div>

          {!dbHistory || dbHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: 11 }}>
              No simulations yet.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', maxHeight: 250 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 9 }}>
                      <th style={{ textAlign: 'left', padding: '6px 4px' }}>Scenario Name</th>
                      <th style={{ textAlign: 'right', padding: '6px 4px' }}>Revenue</th>
                      <th style={{ textAlign: 'right', padding: '6px 4px' }}>ROAS</th>
                      <th style={{ textAlign: 'right', padding: '6px 4px' }}>Profit</th>
                      <th style={{ textAlign: 'center', padding: '6px 4px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbHistory.map((h) => (
                      <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 4px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.scenario_name}</div>
                          <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{new Date(h.created_at).toLocaleDateString()}</div>
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: 'var(--brand-400)' }}>
                          ${Math.round(h.predicted_revenue).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                          {h.predicted_roas.toFixed(2)}x
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', color: 'var(--success)' }}>
                          ${Math.round(h.estimated_profit).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              onClick={() => handleRestore(h)}
                              style={{ color: 'var(--brand-400)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 600 }}
                              title="Restore values to simulator"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleCompareScenario(h)}
                              style={{ color: 'var(--accent-400)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 600 }}
                              title="Load into Comparison"
                            >
                              Compare
                            </button>
                            <button
                              onClick={() => handleDeleteScenario(h.id)}
                              style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                              title="Delete scenario log"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {historyTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 10 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    style={{ padding: '2px 8px', height: 'auto' }}
                  >
                    Prev
                  </Button>
                  <span style={{ color: 'var(--text-muted)' }}>Page {historyPage} of {historyTotalPages}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={historyPage === historyTotalPages}
                    onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                    style={{ padding: '2px 8px', height: 'auto' }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Results View */}
      <div>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SimulationSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SimulatorErrorCard title="Simulation Failed" message={error} onRetry={runSim} />
            </motion.div>
          ) : result ? (
            <motion.div
              key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Executive Summary */}
              <Card padding="lg" glow>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div className="card-subtitle" style={{ marginBottom: 4 }}>Projected Revenue</div>
                    <div style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, color: 'var(--brand-400)', lineHeight: 1.1 }}>
                      <AnimatedCounter value={result.predicted_revenue} prefix="$" decimals={2} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="secondary" size="sm" leftIcon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copyToClipboard}>
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Blended ROAS</div>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{result.predicted_roas?.toFixed(2)}x</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Net Profit</div>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--success)' }}>${result.estimated_profit?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Model version</div>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-muted)' }}>{result.model_version}</div>
                  </div>
                </div>
              </Card>

              {/* Allocation share chart */}
              {pieData.length > 0 && (
                <Card padding="lg">
                  <div className="card-title">Budget Allocation share</div>
                  <div style={{ height: 180, display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                          paddingAngle={3} strokeWidth={0}
                        >
                          {pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `$${v.toLocaleString()}`} {...TT} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 8 }}>
                    {pieData.map(e => (
                      <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-secondary)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} />
                        {e.name}: <strong>{((e.value / totalSpend) * 100).toFixed(0)}%</strong>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Attribution and metadata */}
              <Card padding="lg">
                <div className="card-title" style={{ marginBottom: 12 }}>Execution Metrics</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['Total Spends Allocation', `$${result.total_spend.toLocaleString()}`],
                    ['Execution Latency', `${result.prediction_time_ms.toFixed(2)} ms`],
                    ['Model Version Identifier', result.model_version],
                    ['Success Status', 'Success (LGBM inference Passed)'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AIEmptyState icon={SlidersHorizontal} title="Setup Simulation Settings" desc="Fill out spend, settings, and clicks sliders and click 'Run Simulation' to predict campaign yields." />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   TAB 1 — Scenario Comparison
   ═══════════════════════════════════════════════════════════ */
const ComparisonTab = memo(function ComparisonTab({
  scA, setScA, scB, setScB, compare, result, loading, error, availableChannels
}) {
  const isWinnerA = result?.comparison?.winner === 'Scenario A';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Input grids */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Scenario A */}
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--brand-400)' }} />
            <span className="card-title" style={{ marginBottom: 0 }}>Scenario A (Baseline)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {availableChannels.map(ch => {
              const label = ch.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").replace(/^(.)/, l => l.toUpperCase()) + " spend";
              return (
                <div key={ch} className="input-group">
                  <span className="input-label">{label}</span>
                  <input
                    type="number" className="input" min="0" step="5000"
                    value={scA[ch] !== undefined ? scA[ch] : 0}
                    onChange={e => setScA(prev => ({ ...prev, [ch]: Math.max(0, +e.target.value) }))}
                  />
                </div>
              );
            })}
            <div className="input-group">
              <span className="input-label">Campaign Type</span>
              <select className="input" value={scA.campaign_type} onChange={e => setScA(prev => ({ ...prev, campaign_type: e.target.value }))}>
                {CAMPAIGN_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <span className="input-label">Region</span>
              <select className="input" value={scA.region} onChange={e => setScA(prev => ({ ...prev, region: e.target.value }))}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* Scenario B */}
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }} />
            <span className="card-title" style={{ marginBottom: 0 }}>Scenario B (Comparison)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {availableChannels.map(ch => {
              const label = ch.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").replace(/^(.)/, l => l.toUpperCase()) + " spend";
              return (
                <div key={ch} className="input-group">
                  <span className="input-label">{label}</span>
                  <input
                    type="number" className="input" min="0" step="5000"
                    value={scB[ch] !== undefined ? scB[ch] : 0}
                    onChange={e => setScB(prev => ({ ...prev, [ch]: Math.max(0, +e.target.value) }))}
                  />
                </div>
              );
            })}
            <div className="input-group">
              <span className="input-label">Campaign Type</span>
              <select className="input" value={scB.campaign_type} onChange={e => setScB(prev => ({ ...prev, campaign_type: e.target.value }))}>
                {CAMPAIGN_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <span className="input-label">Region</span>
              <select className="input" value={scB.region} onChange={e => setScB(prev => ({ ...prev, region: e.target.value }))}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <Button
        variant="primary" size="lg" fullWidth
        loading={loading} onClick={compare}
        leftIcon={<Columns size={18} />}
      >
        Compare Scenarios
      </Button>

      {/* Comparison Results */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SimulationSkeleton />
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SimulatorErrorCard title="Comparison Failed" message={error} onRetry={compare} />
          </motion.div>
        ) : result ? (
          <motion.div
            key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {/* Winner Banner */}
            <div style={{
              padding: '16px 20px', borderRadius: 'var(--r-lg)',
              background: isWinnerA
                ? 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(34,211,238,0.02))'
                : 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
              border: isWinnerA ? '1px solid var(--border-brand)' : '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', gap: 14
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: isWinnerA ? 'rgba(34,211,238,0.15)' : 'rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', justify: 'center', flexShrink: 0
              }}>
                <Award size={22} style={{ color: isWinnerA ? 'var(--brand-400)' : 'var(--success)', margin: '0 auto' }} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Recommended Choice</div>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{result.comparison?.winner} is the optimal choice</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{result.winner_reason}</div>
              </div>
            </div>

            {/* Side by side comparison summary KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              {[
                { label: 'Expected Revenue', scoreA: result.scenario_a?.revenue, scoreB: result.scenario_b?.revenue, isMoney: true },
                { label: 'Expected Profit',  scoreA: result.scenario_a?.profit,  scoreB: result.scenario_b?.profit,  isMoney: true },
                { label: 'Projected ROAS',    scoreA: result.scenario_a?.roas,    scoreB: result.scenario_b?.roas,    isMoney: false, suffix: 'x' },
                { label: 'Weighted Score',   scoreA: result.scenario_scores?.scenario_a, scoreB: result.scenario_scores?.scenario_b, isMoney: false },
                { label: 'ROI Improvement',  scoreA: '—', scoreB: result.roi_improvement, isMoney: false, isString: true }
              ].map(k => {
                const valA = k.isString ? k.scoreA : (k.isMoney ? `$${k.scoreA.toLocaleString()}` : `${k.scoreA}${k.suffix || ''}`);
                const valB = k.isString ? k.scoreB : (k.isMoney ? `$${k.scoreB.toLocaleString()}` : `${k.scoreB}${k.suffix || ''}`);
                return (
                  <Card key={k.label} className="kpi" style={{ minHeight: 80 }}>
                    <div className="kpi-top">
                      <span className="kpi-label">{k.label}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
                      <div style={{ fontSize: 11, display: 'flex', justify: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>A:</span>
                        <strong style={{ color: isWinnerA ? 'var(--brand-400)' : 'var(--text-secondary)' }}>{valA}</strong>
                      </div>
                      <div style={{ fontSize: 11, display: 'flex', justify: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>B:</span>
                        <strong style={{ color: !isWinnerA ? 'var(--success)' : 'var(--text-secondary)' }}>{valB}</strong>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Score Comparison Bars + Risk Analysis */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
              {/* Executive Summary */}
              <Card padding="lg">
                <div className="card-title">Executive Comparison Summary</div>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{result.executive_summary}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ScoreIndicator label="Scenario A Allocation Score" score={result.scenario_scores?.scenario_a || 50} color="var(--brand-400)" />
                  <ScoreIndicator label="Scenario B Allocation Score" score={result.scenario_scores?.scenario_b || 50} color="var(--success)" />
                </div>
              </Card>

              {/* Risk Analysis Grid */}
              <Card padding="lg">
                <div className="card-title" style={{ marginBottom: 12 }}>Risk Dimensions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['Overall Risk Tier',        result.risk_analysis?.overall],
                    ['Overspending Exposure',    result.risk_analysis?.overspending],
                    ['Concentration Risk',       result.risk_analysis?.channel_concentration],
                    ['Forecast Reliability',     result.risk_analysis?.forecast_reliability]
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', fontSize: 11, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <RiskBadge level={val} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
              {/* Comparison Charts */}
              {result.chart_data && (
                <Card padding="lg">
                  <div className="card-title">Yield Metric Comparison</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={[
                        { name: 'Revenue', A: result.scenario_a.revenue, B: result.scenario_b.revenue },
                        { name: 'Profit', A: result.scenario_a.profit, B: result.scenario_b.profit }
                      ]}
                      margin={{ left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                      <Tooltip {...TT} formatter={v => `$${v.toLocaleString()}`} />
                      <Bar dataKey="A" fill="var(--brand-400)" radius={[4, 4, 0, 0]} name="Scenario A" />
                      <Bar dataKey="B" fill="var(--success)" radius={[4, 4, 0, 0]} name="Scenario B" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Difference breakdown */}
              <Card padding="lg">
                <div className="card-title" style={{ marginBottom: 12 }}>Performance Differences</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['Revenue Advantage', result.comparison?.better_by?.revenue_difference, result.comparison?.better_by?.revenue_percent, true],
                    ['Profit Advantage',  result.comparison?.better_by?.profit_difference,  result.comparison?.better_by?.profit_percent,  true],
                    ['ROAS Margin',      result.comparison?.better_by?.roas_difference,    result.comparison?.better_by?.roas_percent,    false, 'x']
                  ].map(([label, diff, pct, isMoney]) => {
                    const formattedDiff = isMoney ? `$${diff.toLocaleString()}` : `${diff}${pct ? 'x' : ''}`;
                    const betterLabel = isWinnerA ? 'Scenario A ahead' : 'Scenario B ahead';
                    return (
                      <div key={label} style={{ borderBottom: '1px solid var(--border-strong)', paddingBottom: 8 }}>
                        <div style={{ display: 'flex', justify: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                          <strong style={{ color: 'var(--success)' }}>+{formattedDiff} (+{pct}%)</strong>
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{betterLabel}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }}>
            <AIEmptyState icon={Columns} title="Configure Scenarios to Compare" desc="Adjust spend parameters for Scenario A and Scenario B, and run compare to check diagnostic rankings." />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   TAB 2 — Budget Optimizer
   ═══════════════════════════════════════════════════════════ */
const OptimizerTab = memo(function OptimizerTab({
  totalBudget, setTotalBudget, optimize, result, loading, error, availableChannels
}) {
  const pieData = useMemo(() => {
    if (!result?.recommended_budget) return [];
    const colors = ['#22d3ee', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];
    const keys = Object.keys(result.recommended_budget).filter(k => k !== 'total' && k !== 'google' && k !== 'meta' && k !== 'microsoft');
    const channelsToUse = keys.length > 0 ? keys : ['google', 'meta', 'microsoft'];
    return channelsToUse.map((ch, idx) => {
      const label = ch.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").replace(/^(.)/, l => l.toUpperCase());
      return {
        name: label + ' share',
        value: result.recommended_budget[ch] || 0,
        color: colors[idx % colors.length]
      };
    }).filter(c => c.value > 0);
  }, [result]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
      {/* Optimization form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card padding="lg">
          <div className="card-title">Budget Optimizer Hub</div>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
            Input your total ad spend budget. The mathematical optimizer searches candidate configurations to find the revenue-maximizing allocation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <div style={{ display: 'flex', justify: 'space-between', marginBottom: 4 }}>
                <span className="input-label">Total Optimization Budget</span>
                <strong style={{ color: 'var(--brand-400)', fontSize: 13 }}>${totalBudget.toLocaleString()}</strong>
              </div>
              <input
                type="range" min="10000" max="500000" step="5000"
                value={totalBudget}
                onChange={e => setTotalBudget(+e.target.value)}
                className="range-slider"
              />
              <div style={{ display: 'flex', justify: 'space-between', fontSize: 9, color: 'var(--text-muted)' }}>
                <span>$10k</span>
                <span>$500k</span>
              </div>
            </div>

            <Button
              variant="primary" size="lg" fullWidth
              loading={loading} onClick={optimize}
              leftIcon={<Zap size={18} />}
            >
              Optimize Budget Allocation
            </Button>
          </div>
        </Card>

        {result && (
          <Card padding="lg">
            <div className="card-title" style={{ marginBottom: 12 }}>Strategic Recommendations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.recommendations?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingBottom: idx < result.recommendations.length - 1 ? 10 : 0, borderBottom: idx < result.recommendations.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justify: 'center', flexShrink: 0 }}>
                    <Check size={12} style={{ color: 'var(--brand-400)', margin: '0 auto' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 2 }}>{item.text}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className={`badge ${item.priority === 'High' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 8, padding: '1px 4px' }}>{item.priority} Priority</span>
                      <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{item.confidence}% confidence</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Optimization Results */}
      <div>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SimulationSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SimulatorErrorCard title="Optimization Failed" message={error} onRetry={optimize} />
            </motion.div>
          ) : result ? (
            <motion.div
              key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Executive Metrics Header */}
              <Card padding="lg" glow>
                <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div className="card-subtitle" style={{ marginBottom: 4 }}>Optimized Expected Revenue</div>
                    <div style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, color: 'var(--brand-400)', lineHeight: 1.1 }}>
                      <AnimatedCounter value={result.predicted_revenue} prefix="$" decimals={2} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="card-subtitle">Yield Opportunity Score</div>
                    <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, color: 'var(--success)' }}>{result.opportunity_score}/100</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Expected Profit</div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--success)' }}>${result.predicted_profit?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Projected ROAS</div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{result.predicted_roas?.toFixed(2)}x</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ROI Gain</div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--brand-400)' }}>+{result.budget_efficiency?.improvement_percent}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Model version</div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-muted)' }}>{result.model_version}</div>
                  </div>
                </div>
              </Card>

              {/* Executive Summary */}
              <Card padding="lg">
                <div className="card-title">Executive Optimization Summary</div>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{result.executive_summary}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>Winner Strategy Rationale</div>
                    <div style={{ fontSize: 10, color: 'var(--text-primary)', lineHeight: 1.4 }}>{result.optimization_reason}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>Optimized Channels</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {(() => {
                        let items = Object.entries(result.channel_analysis || {}).filter(([c]) => !['google', 'meta', 'microsoft'].includes(c));
                        if (items.length === 0) {
                          items = Object.entries(result.channel_analysis || {}).filter(([c]) => ['google', 'meta', 'microsoft'].includes(c));
                        }
                        return items.map(([c, val]) => (
                          <div key={c} style={{ display: 'flex', justify: 'space-between', fontSize: 9 }}>
                            <span style={{ textTransform: 'capitalize' }}>{c.replace('_Spend','').replace(' Spend','')}:</span>
                            <strong>{val.allocation_percent}% ({val.expected_roi} ROI)</strong>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Recharts allocation donut + revenue chart */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
                <Card padding="lg">
                  <div className="card-title">Recommended Splits</div>
                  <div style={{ height: 130, display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" innerRadius={35} outerRadius={50}
                          paddingAngle={3} strokeWidth={0}
                        >
                          {pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `$${v.toLocaleString()}`} {...TT} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                    {pieData.map(e => (
                      <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-secondary)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.color }} />
                        <strong>${e.value.toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                </Card>

                {result.chart_data && (
                  <Card padding="lg">
                    <div className="card-title">Expected Yield breakdown</div>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart
                        data={result.chart_data.labels.map((l, i) => ({
                          name: l.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", ""),
                          Budget: result.chart_data.recommended_budget[l] !== undefined ? result.chart_data.recommended_budget[l] : result.chart_data.recommended_budget[i],
                          Revenue: result.chart_data.predicted_revenue[i]
                        }))}
                        margin={{ left: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                        <Tooltip {...TT} formatter={v => `$${v.toLocaleString()}`} />
                        <Bar dataKey="Budget" fill="var(--brand-400)" radius={[3, 3, 0, 0]} name="Budget" />
                        <Bar dataKey="Revenue" fill="var(--success)" radius={[3, 3, 0, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}
              </div>

              {/* Alternatives List */}
              {result.top_recommendations?.length > 0 && (() => {
                const channelsToDisplay = result.available_channels || availableChannels;
                return (
                  <Card padding="lg">
                    <div className="card-title" style={{ marginBottom: 10 }}>Top 5 Candidate Allocations</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Choice</th>
                            {channelsToDisplay.map(ch => (
                              <th key={ch} style={{ textAlign: 'right', padding: '6px 4px' }}>
                                {ch.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").replace(/^(.)/, l => l.toUpperCase())}
                              </th>
                            ))}
                            <th style={{ textAlign: 'right', padding: '6px 4px' }}>Revenue</th>
                            <th style={{ textAlign: 'right', padding: '6px 4px' }}>ROAS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.top_recommendations.map(opt => (
                            <tr key={opt.rank} style={{ borderBottom: '1px solid var(--border-strong)' }}>
                              <td style={{ padding: '6px 4px', fontWeight: 700 }}>#{opt.rank}</td>
                              {channelsToDisplay.map(ch => {
                                const val = opt[ch] !== undefined ? opt[ch] : (ch === 'google_spend' || ch === 'Google_Spend' ? opt.google : (ch === 'meta_spend' || ch === 'Meta_Spend' ? opt.meta : opt.microsoft));
                                return (
                                  <td key={ch} style={{ padding: '6px 4px', textAlign: 'right' }}>
                                    ${(val || 0).toLocaleString()}
                                  </td>
                                );
                              })}
                              <td style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>${opt.predicted_revenue.toLocaleString()}</td>
                              <td style={{ padding: '6px 4px', textAlign: 'right' }}>{opt.roas}x</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                );
              })()}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }}>
              <AIEmptyState icon={Zap} title="Setup Optimization Budget" desc="Choose your total marketing budget and run the optimizer to search for revenue-maximizing splits." />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   MAIN CONTAINER
   ═══════════════════════════════════════════════════════════ */
export default function BudgetSimulator() {
  const toast = useToast();
  const location = useLocation();
  const initialTab = useMemo(() => {
    return location.pathname.includes('scenario-comparison') ? 1 : 0;
  }, [location.pathname]);
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (location.pathname.includes('scenario-comparison')) {
      setTab(1);
    } else if (location.pathname.includes('budget-simulator')) {
      setTab(0);
    }
  }, [location.pathname]);
  const [availableChannels, setAvailableChannels] = useState(['Google_Spend', 'Meta_Spend', 'Microsoft_Spend']);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [hasDataset, setHasDataset] = useState(true);
  const [hasModel, setHasModel] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function checkStatusAndLoad() {
      let savedUpload = localStorage.getItem('forecastiq_uploaded');
      let currentFilename = savedUpload ? JSON.parse(savedUpload).filename : null;
      
      if (!currentFilename) {
        try {
          const res = await getDatasetPreview();
          if (res.success && res.dataset_overview) {
            const uploadDetails = {
              filename: res.dataset_overview.filename,
              name: res.dataset_overview.filename.split('_').slice(2).join('_') || res.dataset_overview.filename,
              size: 0,
              formattedSize: `${res.dataset_overview.total_rows} rows`,
              rows: res.dataset_overview.total_rows,
              detectedColumns: res.column_metadata?.map(c => c.name) || [],
              status: 'processed'
            };
            localStorage.setItem('forecastiq_uploaded', JSON.stringify(uploadDetails));
            savedUpload = JSON.stringify(uploadDetails);
            currentFilename = uploadDetails.filename;
            setHasDataset(true);
          } else {
            setHasDataset(false);
            setInitializing(false);
            setChannelsLoading(false);
            return;
          }
        } catch (err) {
          setHasDataset(false);
          setInitializing(false);
          setChannelsLoading(false);
          return;
        }
      }

      try {
        const status = await getModelStatus();
        setHasDataset(true);
        setHasModel(status.model_exists);
        
        if (status.model_exists) {
          const preview = await getDatasetPreview();
          if (preview?.available_channels?.length > 0) {
            setAvailableChannels(preview.available_channels);
          }
        }
      } catch (err) {
        console.error('Error checking status or loading channels:', err);
        if (err.response?.status === 404) {
          setHasDataset(false);
          localStorage.removeItem('forecastiq_uploaded');
        }
      } finally {
        setInitializing(false);
        setChannelsLoading(false);
      }
    }
    checkStatusAndLoad();
  }, []);

  /* Tab 0 State */
  const [formData, setFormData] = useState({
    clicks: 6280,
    impressions: 299000,
    conversions: 440,
    campaign_type: 'Performance',
    region: 'East',
    month: 7,
    day: 15,
    day_of_week: 2,
    is_weekend: 0,
  });
  const [customEngagement, setCustomEngagement] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState(null);

  /* DB-backed Scenario History states */
  const [dbHistory, setDbHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const loadDbHistory = useCallback(async () => {
    try {
      const data = await getScenarioHistory({
        search: historySearch,
        page: historyPage,
        limit: 10
      });
      setDbHistory(data.items || []);
      setHistoryTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to load scenario history from database:', err);
    }
  }, [historySearch, historyPage]);

  useEffect(() => {
    if (hasDataset) {
      loadDbHistory();
    }
  }, [hasDataset, loadDbHistory]);

  const handleRestore = useCallback((item) => {
    if (item.input_parameters) {
      setFormData(item.input_parameters);
      setCustomEngagement(true);
      setSimResult({
        total_spend: item.input_parameters.total_spend || Object.keys(item.input_parameters)
          .filter(k => k.endsWith('_spend') || k.endsWith('_Spend'))
          .reduce((acc, k) => acc + (item.input_parameters[k] || 0), 0),
        predicted_revenue: item.predicted_revenue,
        predicted_roas: item.predicted_roas,
        estimated_profit: item.estimated_profit,
        model_version: 'LGBM v3',
        prediction_time_ms: 12.0
      });
      toast.success(`Restored scenario values for: ${item.scenario_name}`);
    }
  }, [toast]);

  const handleCompareScenario = useCallback((item) => {
    if (item.input_parameters) {
      setScA(item.input_parameters);
      toast.success(`Loaded '${item.scenario_name}' into Scenario A comparison parameters.`);
      setTab(1); // Switch to comparison tab
    }
  }, [toast]);

  const handleDeleteScenario = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this scenario log? This cannot be undone.')) {
      try {
        await deleteScenarioHistory(id);
        toast.success('Scenario history log deleted.');
        loadDbHistory();
      } catch (err) {
        toast.error('Failed to delete scenario history log.');
      }
    }
  }, [loadDbHistory, toast]);

  /* Tab 1 State */
  const [scA, setScA] = useState({ campaign_type: 'Performance', region: 'East' });
  const [scB, setScB] = useState({ campaign_type: 'Brand', region: 'North' });
  const [compResult, setCompResult] = useState(null);
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState(null);

  /* Tab 2 State */
  const [totalBudget, setTotalBudget] = useState(100000);
  const [optResult, setOptResult] = useState(null);
  const [optLoading, setOptLoading] = useState(false);
  const [optError, setOptError] = useState(null);

  /* Synchronize dynamic spends */
  useEffect(() => {
    if (availableChannels.length > 0) {
      setFormData(prev => {
        const next = { ...prev };
        availableChannels.forEach((ch, idx) => {
          if (next[ch] === undefined) {
            const defaults = [60000, 30000, 10000];
            next[ch] = defaults[idx] || 10000;
          }
        });
        return next;
      });
      setScA(prev => {
        const next = { ...prev };
        availableChannels.forEach((ch, idx) => {
          if (next[ch] === undefined) {
            const defaults = [50000, 30000, 20000];
            next[ch] = defaults[idx] || 10000;
          }
        });
        return next;
      });
      setScB(prev => {
        const next = { ...prev };
        availableChannels.forEach((ch, idx) => {
          if (next[ch] === undefined) {
            const defaults = [35000, 25000, 40000];
            next[ch] = defaults[idx] || 10000;
          }
        });
        return next;
      });
    }
  }, [availableChannels]);

  /* ── Tab 0 Sim Handler ── */
  const handleRunSim = async () => {
    setSimLoading(true);
    setSimError(null);
    try {
      const res = await runBudgetSimulation(formData);
      setSimResult(res);

      /* Persist scenario to DB history */
      try {
        await createScenarioHistory({
          scenario_name: `${formData.campaign_type} (${formData.region}) - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          scenario_type: 'simulation',
          input_parameters: formData,
          predicted_revenue: res.predicted_revenue,
          predicted_roas: res.predicted_roas,
          estimated_profit: res.estimated_profit,
          recommendation: 'Rebalance allocations using budget optimization spreads.'
        });
        loadDbHistory();
      } catch (err) {
        console.error('Failed to log simulation scenario run:', err);
      }

      toast.success('Simulation run successfully complete!');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Simulation execution failed';
      setSimError(msg);
      toast.error('Simulation: ' + msg);
    } finally {
      setSimLoading(false);
    }
  };

  /* ── Tab 1 Compare Handler ── */
  const handleCompare = async () => {
    setCompLoading(true);
    setCompError(null);
    try {
      const res = await compareScenarios({ scenario_a: scA, scenario_b: scB });
      setCompResult(res);
      toast.success('Scenario comparison diagnostic complete!');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Comparison failed';
      setCompError(msg);
      toast.error('Comparison: ' + msg);
    } finally {
      setCompLoading(false);
    }
  };

  /* ── Tab 2 Optimize Handler ── */
  const handleOptimize = async () => {
    setOptLoading(true);
    setOptError(null);
    try {
      const res = await optimizeBudgetSpreads({ totalBudget });
      setOptResult(res);
      toast.success('Budget optimization complete!');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Optimization failed';
      setOptError(msg);
      toast.error('Optimization: ' + msg);
    } finally {
      setOptLoading(false);
    }
  };

  /* ---- Render ---- */
  if (!hasDataset) {
    return (
      <StaggerContainer>
        <StaggerItem className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="page-title">Executive Budget Studio</h1>
            <p className="page-desc">Simulate spends, compare scenarios, and run algorithms to allocate resources dynamically</p>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '45vh' }}>
            <div className="empty-state-icon"><Database size={28} /></div>
            <div className="empty-state-title">No dataset uploaded yet</div>
            <div className="empty-state-desc">Please upload a CSV dataset first to execute budget simulations.</div>
            <Link to="/app/upload">
              <Button variant="primary" style={{ marginTop: 12 }}>Upload Dataset</Button>
            </Link>
          </div>
        </StaggerItem>
      </StaggerContainer>
    );
  }

  if (!hasModel) {
    return (
      <StaggerContainer>
        <StaggerItem className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="page-title">Executive Budget Studio</h1>
            <p className="page-desc">Simulate spends, compare scenarios, and run algorithms to allocate resources dynamically</p>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '45vh' }}>
            <div className="empty-state-icon"><Cpu size={28} style={{ color: 'var(--brand-400)' }} /></div>
            <div className="empty-state-title">No Trained Model Found</div>
            <div className="empty-state-desc">You must train a forecasting model before executing budget simulations.</div>
            <Link to="/app/model-training">
              <Button variant="primary" style={{ marginTop: 12 }}>Train Model</Button>
            </Link>
          </div>
        </StaggerItem>
      </StaggerContainer>
    );
  }

  return (
    <StaggerContainer>
      <StaggerItem className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Executive Budget Studio</h1>
          <p className="page-desc">Simulate spends, compare scenarios, and run algorithms to allocate resources dynamically</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge badge-info"><Sparkles size={14} style={{ marginRight: 4 }} /> Optimization Eng. Active</span>
        </div>
      </StaggerItem>

      {/* Tab select bar */}
      <StaggerItem>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 7,
                  fontSize: 'var(--fs-sm)', fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--brand-400)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '2px solid var(--brand-400)' : '2px solid transparent',
                  marginBottom: -1, background: 'none', border: 'none',
                  borderBottomStyle: 'solid', cursor: 'pointer',
                  transition: 'color 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </StaggerItem>

      {/* Tab views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {tab === 0 && (
            <SimulatorTab
              formData={formData}
              setFormData={setFormData}
              runSim={handleRunSim}
              result={simResult}
              loading={simLoading}
              error={simError}
              clearResult={() => setSimResult(null)}
              customEngagement={customEngagement}
              setCustomEngagement={setCustomEngagement}
              dbHistory={dbHistory}
              handleRestore={handleRestore}
              handleCompareScenario={handleCompareScenario}
              handleDeleteScenario={handleDeleteScenario}
              historySearch={historySearch}
              setHistorySearch={setHistorySearch}
              historyPage={historyPage}
              setHistoryPage={setHistoryPage}
              historyTotalPages={historyTotalPages}
              availableChannels={availableChannels}
            />
          )}
          {tab === 1 && (
            <ComparisonTab
              scA={scA}
              setScA={setScA}
              scB={scB}
              setScB={setScB}
              compare={handleCompare}
              result={compResult}
              loading={compLoading}
              error={compError}
              availableChannels={availableChannels}
            />
          )}
          {tab === 2 && (
            <OptimizerTab
              totalBudget={totalBudget}
              setTotalBudget={setTotalBudget}
              optimize={handleOptimize}
              result={optResult}
              loading={optLoading}
              error={optError}
              availableChannels={availableChannels}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </StaggerContainer>
  );
}
