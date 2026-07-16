/**
 * AIInsights.jsx — Phase 2.4 Executive AI Decision Center
 * 4-tab workspace connecting:
 *   GET /business-insights
 *   GET /ai-recommendations
 *   GET /ai-recommendations/history
 */
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, TrendingDown, BrainCircuit, BarChart3, History, Sparkles,
  RefreshCw, DollarSign, Target, Activity, Wallet, Award, Cpu,
  Shield, CheckCircle2, Clock, Search, List, Grid3X3,
  ChevronLeft, ChevronRight, Download, Star, ArrowRight,
  Zap, AlignLeft, AlertTriangle, FileText,
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { useToast } from '../components/Toast.jsx';
import {
  HealthGauge, PriorityBadge, SeverityBadge, ConfidenceBar,
  RecommendationCard, RiskAlertStrip, GrowthOpportunityCard,
  WeekendComparisonTable, DataQualityPanel, InsightItem,
  AISkeletonLoader, AIErrorCard, AIEmptyState, CATEGORY_COLORS,
} from '../components/AIComponents.jsx';
import { getBusinessInsights, getAIRecommendations, getRecommendationHistoryList } from '../services/api.js';

/* ── Shared chart tokens ─────────────────────────────────── */
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
const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#22d3ee', '#8b5cf6', '#3b82f6', '#ec4899'];

/* ── Tab definitions ──────────────────────────────────────── */
const TABS = [
  { id: 0, label: 'Business Insights', icon: TrendingUp },
  { id: 1, label: 'Recommendations',   icon: BrainCircuit },
  { id: 2, label: 'Analytics',          icon: BarChart3 },
  { id: 3, label: 'History',            icon: History },
];

/* ═══════════════════════════════════════════════════════════
   TAB 0 — Business Insights
   ═══════════════════════════════════════════════════════════ */
const BusinessInsightsTab = memo(function BusinessInsightsTab({ data, loading, error, onRetry }) {
  if (loading) return <AISkeletonLoader />;
  if (error)   return <AIErrorCard title="Business Insights Unavailable" message={error} onRetry={onRetry} />;
  if (!data)   return null;

  const health = data.business_health;
  const perf   = data.overall;
  const trend  = data.monthly_trend;
  const trendUp = trend?.trend === 'Increasing';

  return (
    <StaggerContainer>
      {/* Executive Summary */}
      <StaggerItem style={{ marginBottom: 20 }}>
        <Card reveal padding="lg" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.04), transparent)', borderLeft: '3px solid var(--brand-400)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Sparkles size={20} style={{ color: 'var(--brand-400)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Executive Strategy Summary</div>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{data.executive_summary}</p>
            </div>
          </div>
        </Card>
      </StaggerItem>

      {/* Health Gauge + 4 KPI cards */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: '160px repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {/* Health card */}
        <Card reveal glow padding="lg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <HealthGauge score={health.score} size={100} />
          <div style={{ textAlign: 'center' }}>
            <span className={`badge ${health.score >= 80 ? 'badge-success' : health.score >= 60 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 10 }}>
              {health.rating}
            </span>
          </div>
        </Card>
        {/* KPI cards */}
        {[
          { label: 'Total Revenue',  value: perf.total_revenue,  icon: DollarSign, prefix: '$' },
          { label: 'Total Spend',    value: perf.total_spend,    icon: Wallet,     prefix: '$' },
          { label: 'Overall ROAS',   value: perf.overall_roas,   icon: Target,     suffix: 'x', decimals: 2 },
          { label: 'Net Profit',     value: perf.overall_profit, icon: TrendingUp, prefix: '$' },
        ].map(({ label, value, icon: Icon, prefix = '', suffix = '', decimals = 0 }) => (
          <Card key={label} reveal hover className="kpi" style={{ minHeight: 90 }}>
            <div className="kpi-top">
              <span className="kpi-label">{label}</span>
              <span className="kpi-icon"><Icon size={18} /></span>
            </div>
            <div className="kpi-value" style={{ fontSize: 'var(--fs-xl)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
            </div>
          </Card>
        ))}
      </StaggerItem>

      {/* Best Performers + Trend */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {/* Best Channel */}
        <Card reveal padding="lg">
          <div className="card-subtitle" style={{ marginBottom: 8 }}>🏆 Best Channel</div>
          <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--brand-400)', marginBottom: 4 }}>{data.best_channel?.best_channel}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ROAS: <strong>{data.best_channel?.best_roas?.toFixed(2)}x</strong></div>
        </Card>
        {/* Best Campaign */}
        <Card reveal padding="lg">
          <div className="card-subtitle" style={{ marginBottom: 8 }}>📢 Best Campaign</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
            Revenue: <span style={{ color: 'var(--success)' }}>{data.best_campaign?.highest_revenue_campaign}</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
            ROAS: <span style={{ color: 'var(--brand-400)' }}>{data.best_campaign?.highest_roas_campaign}</span>
          </div>
        </Card>
        {/* Best Region */}
        <Card reveal padding="lg">
          <div className="card-subtitle" style={{ marginBottom: 8 }}>🌍 Regions</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>
            Top Revenue: <strong style={{ color: 'var(--success)' }}>{data.best_region?.highest_revenue_region}</strong>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>
            Top ROAS: <strong style={{ color: 'var(--brand-400)' }}>{data.best_region?.highest_roas_region}</strong>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Lowest: <strong style={{ color: 'var(--error)' }}>{data.best_region?.lowest_performing_region}</strong>
          </div>
        </Card>
        {/* Monthly Trend */}
        <Card reveal padding="lg">
          <div className="card-subtitle" style={{ marginBottom: 8 }}>📈 Monthly Trend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {trendUp ? <TrendingUp size={20} style={{ color: 'var(--success)' }} /> : <TrendingDown size={20} style={{ color: 'var(--error)' }} />}
            <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: trendUp ? 'var(--success)' : 'var(--error)' }}>{trend?.trend}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Slope: {trend?.monthly_slope?.toFixed(2)}</div>
        </Card>
      </StaggerItem>

      {/* Weekend Analysis + Budget Efficiency + Risk */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Weekend Analysis */}
        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 12 }}>📅 Weekday vs Weekend</div>
          <WeekendComparisonTable weekendAnalysis={data.weekend_analysis} />
        </Card>
        {/* Budget Efficiency */}
        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 12 }}>💡 Budget Efficiency</div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--brand-400)', marginBottom: 4 }}>
            {data.budget_efficiency?.revenue_per_one_spent?.toFixed(2)}x
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>Revenue per $1 spent</div>
          <span className={`badge ${data.budget_efficiency?.efficiency_rating === 'Excellent' || data.budget_efficiency?.efficiency_rating === 'Good' ? 'badge-success' : 'badge-warning'}`}>
            {data.budget_efficiency?.efficiency_rating}
          </span>
        </Card>
        {/* Risk Analysis */}
        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 12 }}>🛡 Risk Analysis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Budget Risk',           value: data.risk_analysis?.budget_risk },
              { label: 'Channel Dependency',    value: data.risk_analysis?.channel_dependency },
              { label: 'Forecast Reliability',  value: data.risk_analysis?.forecast_reliability },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span className={`badge ${value === 'Low' ? 'badge-success' : value === 'High' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 9 }}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </StaggerItem>

      {/* Growth Opportunities */}
      {data.growth_opportunities?.length > 0 && (
        <StaggerItem style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <div className="card-title" style={{ marginBottom: 2 }}>🚀 Growth Opportunities</div>
            <div className="card-subtitle">Prioritized expansion areas identified by the AI engine</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {data.growth_opportunities.map((opp, i) => (
              <GrowthOpportunityCard key={i} opp={opp} index={i} />
            ))}
          </div>
        </StaggerItem>
      )}

      {/* AI Insights + Data Quality */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* AI Insights list */}
        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 4 }}>
            <Sparkles size={16} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--brand-400)' }} />
            AI Generated Insights
          </div>
          <div className="card-subtitle" style={{ marginBottom: 14 }}>Dynamic analytics from your marketing dataset</div>
          <div>
            {data.insights?.map((text, i) => (
              <InsightItem key={i} text={text} index={i} />
            ))}
          </div>
        </Card>
        {/* Data Quality */}
        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 12 }}>🔍 Data Quality</div>
          <DataQualityPanel quality={data.data_quality} />
        </Card>
      </StaggerItem>

      {/* Recommendations from business-insights */}
      {data.recommendations?.length > 0 && (
        <StaggerItem>
          <Card reveal padding="lg">
            <div className="card-title" style={{ marginBottom: 14 }}>
              <Award size={16} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--brand-400)' }} />
              Strategic Recommendations ({data.recommendations.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.recommendations.map((rec, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < data.recommendations.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--brand-400)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: '0 0 4px', lineHeight: 1.5 }}>{rec.recommendation}</p>
                    <ConfidenceBar score={rec.confidence} showLabel />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </StaggerItem>
      )}
    </StaggerContainer>
  );
});

/* ═══════════════════════════════════════════════════════════
   TAB 1 — AI Recommendations
   ═══════════════════════════════════════════════════════════ */
const RecommendationsTab = memo(function RecommendationsTab({
  data, loading, error, onRetry,
  filteredRecs, groupedRecs, categories,
  searchQuery, setSearchQuery,
  priorityFilter, setPriorityFilter,
  categoryFilter, setCategoryFilter,
}) {
  if (loading) return <AISkeletonLoader />;
  if (error)   return <AIErrorCard title="Recommendations Unavailable" message={error} onRetry={onRetry} />;
  if (!data)   return null;

  const noResults = filteredRecs.length === 0;

  return (
    <StaggerContainer>
      {/* Next Best Action banner */}
      <StaggerItem style={{ marginBottom: 20 }}>
        <div style={{
          padding: '14px 20px', borderRadius: 'var(--r-lg)',
          background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(139,92,246,0.06))',
          border: '1px solid var(--border-brand)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r-lg)', background: 'rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={20} style={{ color: 'var(--brand-400)' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Next Best Action</div>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{data.next_best_action}</div>
          </div>
        </div>
      </StaggerItem>

      {/* Summary KPIs */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Recs',      value: data.summary?.total_recommendations, icon: FileText,   color: 'var(--brand-400)' },
          { label: 'High Priority',   value: data.summary?.high_priority,          icon: AlertTriangle, color: 'var(--error)' },
          { label: 'Medium Priority', value: data.summary?.medium_priority,        icon: Activity,  color: 'var(--warning)' },
          { label: 'Low Priority',    value: data.summary?.low_priority,            icon: CheckCircle2, color: 'var(--success)' },
          { label: 'AI Score',        value: data.ai_score,                        icon: Star,      color: 'var(--brand-400)', suffix: '%' },
        ].map(({ label, value, icon: Icon, color, suffix = '' }) => (
          <Card key={label} reveal className="kpi" style={{ minHeight: 80 }}>
            <div className="kpi-top">
              <span className="kpi-label">{label}</span>
              <span className="kpi-icon"><Icon size={16} style={{ color }} /></span>
            </div>
            <div className="kpi-value" style={{ fontSize: 'var(--fs-xl)', color }}>
              <AnimatedCounter value={value || 0} suffix={suffix} decimals={0} />
            </div>
          </Card>
        ))}
      </StaggerItem>

      {/* Business Health + Executive Summary */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, marginBottom: 20 }}>
        <Card reveal padding="lg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <HealthGauge score={data.business_health?.score || 0} size={96} />
          <span className={`badge ${data.business_health?.score >= 80 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
            {data.business_health?.rating}
          </span>
        </Card>
        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 8 }}>Executive Summary</div>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 12px' }}>{data.executive_summary}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 10, color: 'var(--text-muted)' }}>
            <span>🤖 Engine: <strong>{data.metadata?.engine} {data.metadata?.version}</strong></span>
            <span>·</span>
            <span>🕐 Generated: <strong>{new Date(data.generated_at).toLocaleString()}</strong></span>
            <span>·</span>
            <span>⚡ {data.processing_time_ms?.toFixed(1)} ms</span>
            <span>·</span>
            <span>🧩 Model: <strong>{data.model_version}</strong></span>
          </div>
        </Card>
      </StaggerItem>

      {/* Risk Alerts */}
      {data.risk_alerts?.length > 0 && (
        <StaggerItem style={{ marginBottom: 20 }}>
          <div className="card-subtitle" style={{ marginBottom: 8 }}>⚠️ Active Risk Alerts</div>
          <RiskAlertStrip alerts={data.risk_alerts} />
        </StaggerItem>
      )}

      {/* Filter bar */}
      <StaggerItem style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Search recommendations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>
        {/* Priority filter */}
        <select className="input" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ minWidth: 130 }}>
          {['All', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
        </select>
        {/* Category filter */}
        <select className="input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ minWidth: 150 }}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filteredRecs.length} of {data.recommendations?.length} shown
        </span>
      </StaggerItem>

      {/* Recommendations grouped by category */}
      {noResults ? (
        <StaggerItem>
          <AIEmptyState icon={Search} title="No matching recommendations" desc="Try adjusting your filters or search query." />
        </StaggerItem>
      ) : (
        Object.entries(groupedRecs).map(([category, recs]) => (
          <StaggerItem key={category} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[category] || 'var(--brand-400)' }} />
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{category}</span>
              <span style={{ fontSize: 9, background: 'var(--bg-surface-3)', color: 'var(--text-muted)', borderRadius: 'var(--r-full)', padding: '1px 8px' }}>{recs.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {recs.map((rec, i) => (
                <RecommendationCard key={rec.id} rec={rec} index={i} />
              ))}
            </div>
          </StaggerItem>
        ))
      )}

      {/* Growth Opportunities */}
      {data.growth_opportunities?.length > 0 && (
        <StaggerItem style={{ marginTop: 4 }}>
          <Card reveal padding="lg">
            <div className="card-title" style={{ marginBottom: 14 }}>🚀 Growth Opportunities</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {data.growth_opportunities.map((opp, i) => (
                <GrowthOpportunityCard key={i} opp={opp} index={i} />
              ))}
            </div>
          </Card>
        </StaggerItem>
      )}
    </StaggerContainer>
  );
});

/* ═══════════════════════════════════════════════════════════
   TAB 2 — Analytics
   ═══════════════════════════════════════════════════════════ */
const AnalyticsTab = memo(function AnalyticsTab({ insightsData, recsData, historyData, historyLoading }) {
  /* Build chart datasets */
  const priorityCounts = useMemo(() => {
    if (!recsData?.recommendations) return [];
    const map = {};
    recsData.recommendations.forEach(r => { map[r.priority] = (map[r.priority] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [recsData]);

  const categoryCounts = useMemo(() => {
    if (!recsData?.recommendations) return [];
    const map = {};
    recsData.recommendations.forEach(r => { map[r.category] = (map[r.category] || 0) + 1; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || '#6b7280' }))
      .sort((a, b) => b.value - a.value);
  }, [recsData]);

  const confidenceBuckets = useMemo(() => {
    if (!recsData?.recommendations) return [];
    const buckets = [
      { range: '0–20',   min: 0,  max: 20,  count: 0 },
      { range: '21–40',  min: 21, max: 40,  count: 0 },
      { range: '41–60',  min: 41, max: 60,  count: 0 },
      { range: '61–80',  min: 61, max: 80,  count: 0 },
      { range: '81–100', min: 81, max: 100, count: 0 },
    ];
    recsData.recommendations.forEach(r => {
      const b = buckets.find(b => r.confidence >= b.min && r.confidence <= b.max);
      if (b) b.count++;
    });
    return buckets;
  }, [recsData]);

  const severityCounts = useMemo(() => {
    if (!recsData?.risk_alerts) return [];
    const map = {};
    recsData.risk_alerts.forEach(a => { map[a.severity] = (map[a.severity] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [recsData]);

  const healthTrend = useMemo(() => {
    if (!historyData?.length) return [];
    return [...historyData]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-20)
      .map((h, i) => ({ run: `#${i + 1}`, score: h.business_health?.score || 0, time: new Date(h.timestamp).toLocaleDateString() }));
  }, [historyData]);

  const processingTimeTrend = useMemo(() => {
    if (!historyData?.length) return [];
    return [...historyData]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-20)
      .map((h, i) => ({ run: `#${i + 1}`, ms: h.processing_time || 0 }));
  }, [historyData]);

  const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

  if (!recsData) {
    return <AIEmptyState icon={BarChart3} title="Load Recommendations first" desc="Switch to Recommendations tab to fetch data for analytics." />;
  }

  return (
    <StaggerContainer>
      {/* Row 1: Priority + Category */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, marginBottom: 20 }}>
        {/* Priority Distribution */}
        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 4 }}>Priority Distribution</div>
          <div className="card-subtitle" style={{ marginBottom: 16 }}>Breakdown of recommendations by urgency tier</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={priorityCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                {priorityCounts.map((e, i) => <Cell key={i} fill={PRIORITY_COLORS[e.name] || PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip {...TT} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
            {priorityCounts.map(e => (
              <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[e.name] || '#6b7280', display: 'inline-block' }} />
                {e.name}: <strong>{e.value}</strong>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 4 }}>Category Breakdown</div>
          <div className="card-subtitle" style={{ marginBottom: 16 }}>Number of recommendations per marketing category</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryCounts} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={90} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {categoryCounts.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </StaggerItem>

      {/* Row 2: Confidence Distribution */}
      <StaggerItem style={{ marginBottom: 20 }}>
        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 4 }}>Confidence Score Distribution</div>
          <div className="card-subtitle" style={{ marginBottom: 16 }}>How many recommendations fall in each confidence band</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={confidenceBuckets}>
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-400)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--brand-400)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="range" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...TT} formatter={(v) => [`${v} recommendations`, 'Count']} />
              <Area type="monotone" dataKey="count" stroke="var(--brand-400)" strokeWidth={2} fill="url(#confGrad)" name="Count" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </StaggerItem>

      {/* Row 3: History-dependent charts */}
      {historyLoading ? (
        <StaggerItem>
          <Card padding="lg" style={{ height: 240 }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '80px 0', fontSize: 'var(--fs-xs)' }}>
              Loading history data for trend charts…
            </div>
          </Card>
        </StaggerItem>
      ) : (
        <StaggerItem style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Business Health Trend */}
          <Card reveal padding="lg">
            <div className="card-title" style={{ marginBottom: 4 }}>Business Health Trend</div>
            <div className="card-subtitle" style={{ marginBottom: 16 }}>Score evolution across recommendation engine runs</div>
            {healthTrend.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 'var(--fs-xs)' }}>No history data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={healthTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                  <XAxis dataKey="run" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip {...TT} formatter={(v) => [`${v}%`, 'Health Score']} />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Health Score" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Processing Time + Risk Severity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card reveal padding="lg" style={{ flex: 1 }}>
              <div className="card-title" style={{ marginBottom: 4 }}>Processing Time</div>
              <div className="card-subtitle" style={{ marginBottom: 10 }}>Engine latency across runs (ms)</div>
              {processingTimeTrend.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 'var(--fs-xs)' }}>No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={processingTimeTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                    <XAxis dataKey="run" tick={{ ...AXIS_TICK, fontSize: 8 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ ...AXIS_TICK, fontSize: 8 }} axisLine={false} tickLine={false} />
                    <Tooltip {...TT} formatter={(v) => [`${v.toFixed(1)} ms`, 'Processing Time']} />
                    <Bar dataKey="ms" fill="var(--brand-400)" radius={[3, 3, 0, 0]} name="Processing Time (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Risk Severity Split */}
            {severityCounts.length > 0 && (
              <Card reveal padding="lg" style={{ flex: 1 }}>
                <div className="card-title" style={{ marginBottom: 10 }}>Risk Severity Split</div>
                <ResponsiveContainer width="100%" height={90}>
                  <PieChart>
                    <Pie data={severityCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={38} strokeWidth={0}>
                      {severityCounts.map((e, i) => (
                        <Cell key={i} fill={e.name === 'High' ? '#ef4444' : e.name === 'Medium' ? '#f59e0b' : '#22d3ee'} />
                      ))}
                    </Pie>
                    <Tooltip {...TT} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                  {severityCounts.map(e => (
                    <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-secondary)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.name === 'High' ? '#ef4444' : e.name === 'Medium' ? '#f59e0b' : '#22d3ee', display: 'inline-block' }} />
                      {e.name}: {e.value}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </StaggerItem>
      )}
    </StaggerContainer>
  );
});

/* ═══════════════════════════════════════════════════════════
   TAB 3 — Recommendation History
   ═══════════════════════════════════════════════════════════ */
const HistoryTab = memo(function HistoryTab({
  history, loading, error, onRetry, fullHistory,
  historyView, setHistoryView,
  historySearch, setHistorySearch,
  historySort, setHistorySort,
  historyPage, setHistoryPage, totalPages, totalRecords,
}) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} padding="lg">
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ height: 12, width: '20%', background: 'var(--bg-surface-3)', borderRadius: 4 }} />
            <div style={{ height: 12, width: '15%', background: 'var(--bg-surface-3)', borderRadius: 4 }} />
            <div style={{ height: 12, width: '10%', background: 'var(--bg-surface-3)', borderRadius: 4 }} />
          </div>
        </Card>
      ))}
    </div>
  );
  if (error) return <AIErrorCard title="History Unavailable" message={error} onRetry={onRetry} />;

  const avgHealth = fullHistory?.length
    ? (fullHistory.reduce((s, h) => s + h.business_health.score, 0) / fullHistory.length).toFixed(1)
    : 0;
  const avgRecs = fullHistory?.length
    ? (fullHistory.reduce((s, h) => s + h.recommendation_count, 0) / fullHistory.length).toFixed(1)
    : 0;
  const latestVersion = fullHistory?.[0]?.model_version || '—';

  return (
    <StaggerContainer>
      {/* KPI row */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Runs Logged',       value: fullHistory?.length || 0,  icon: History,     color: 'var(--brand-400)' },
          { label: 'Avg Recs / Run',    value: parseFloat(avgRecs),       icon: FileText,    color: 'var(--brand-400)', decimals: 1 },
          { label: 'Avg Health Score',  value: parseFloat(avgHealth),     icon: Activity,    color: 'var(--success)',   suffix: '%', decimals: 1 },
          { label: 'Model Version',     value: latestVersion,             icon: Cpu,         color: 'var(--brand-400)', isString: true },
        ].map(({ label, value, icon: Icon, color, suffix = '', decimals = 0, isString = false }) => (
          <Card key={label} reveal className="kpi" style={{ minHeight: 80 }}>
            <div className="kpi-top">
              <span className="kpi-label">{label}</span>
              <span className="kpi-icon"><Icon size={16} style={{ color }} /></span>
            </div>
            <div className="kpi-value" style={{ fontSize: 'var(--fs-xl)', color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isString ? value : <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />}
            </div>
          </Card>
        ))}
      </StaggerItem>

      {/* Controls */}
      <StaggerItem style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search history..." value={historySearch} onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }} style={{ paddingLeft: 32 }} />
        </div>
        {/* Sort */}
        <select className="input" value={historySort} onChange={e => { setHistorySort(e.target.value); setHistoryPage(1); }} style={{ minWidth: 150 }}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="health_high">Health ↓ High</option>
          <option value="health_low">Health ↑ Low</option>
        </select>
        {/* View switcher */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          {[
            { id: 'table',    icon: List },
            { id: 'card',     icon: Grid3X3 },
            { id: 'timeline', icon: AlignLeft },
          ].map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setHistoryView(id)}
              style={{
                padding: '7px 12px', border: 'none', cursor: 'pointer',
                background: historyView === id ? 'var(--brand-500)' : 'transparent',
                color: historyView === id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>Export</Button>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{totalRecords} records</span>
      </StaggerItem>

      {/* Empty state */}
      {(!fullHistory || fullHistory.length === 0) ? (
        <StaggerItem>
          <AIEmptyState icon={History} title="No history records found" desc="Run the AI recommendation engine to populate the execution log." />
        </StaggerItem>
      ) : history.length === 0 ? (
        <StaggerItem>
          <AIEmptyState icon={Search} title="No matches found" desc="Try a different search or sort." />
        </StaggerItem>
      ) : (
        <>
          {/* TABLE VIEW */}
          {historyView === 'table' && (
            <StaggerItem>
              <Card reveal padding="lg">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: 170 }}>Timestamp</th>
                        <th style={{ minWidth: 140 }}>Business Health</th>
                        <th style={{ minWidth: 120 }}>Recommendations</th>
                        <th style={{ minWidth: 110 }}>Model Version</th>
                        <th style={{ minWidth: 130 }}>Processing Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, idx) => (
                        <tr key={idx} style={{ verticalAlign: 'middle' }}>
                          <td style={{ fontWeight: 600, fontSize: 11 }}>{new Date(item.timestamp).toLocaleString()}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className={`badge ${item.business_health.score >= 80 ? 'badge-success' : item.business_health.score >= 60 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 9 }}>
                                {item.business_health.score}%
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{item.business_health.rating}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-info" style={{ fontSize: 9 }}>{item.recommendation_count} insights</span>
                          </td>
                          <td>
                            <span className="badge badge-muted" style={{ fontSize: 9 }}>{item.model_version}</span>
                          </td>
                          <td>
                            <code style={{ fontSize: 10 }}>{item.processing_time?.toFixed(1)} ms</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </StaggerItem>
          )}

          {/* CARD VIEW */}
          {historyView === 'card' && (
            <StaggerItem style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {history.map((item, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <Card padding="md" hover style={{ height: '100%' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <span className={`badge ${item.business_health.score >= 80 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 9 }}>
                        {item.business_health.score}%
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{item.business_health.rating}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
                      <span>{item.recommendation_count} insights</span>
                      <span>{item.model_version}</span>
                      <span>{item.processing_time?.toFixed(0)} ms</span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </StaggerItem>
          )}

          {/* TIMELINE VIEW */}
          {historyView === 'timeline' && (
            <StaggerItem>
              <div style={{ position: 'relative', paddingLeft: 28 }}>
                {/* Vertical line */}
                <div style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />
                {history.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    style={{ position: 'relative', marginBottom: 16 }}
                  >
                    {/* Dot */}
                    <div style={{
                      position: 'absolute', left: -24, top: 12,
                      width: 12, height: 12, borderRadius: '50%',
                      background: item.business_health.score >= 80 ? 'var(--success)' : 'var(--warning)',
                      border: '2px solid var(--bg-surface)',
                    }} />
                    <Card padding="md">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span className={`badge ${item.business_health.score >= 80 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 9 }}>
                              {item.business_health.score}% · {item.business_health.rating}
                            </span>
                            <span className="badge badge-info" style={{ fontSize: 9 }}>{item.recommendation_count} recs</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>
                          <div>{item.model_version}</div>
                          <div>{item.processing_time?.toFixed(1)} ms</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </StaggerItem>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <StaggerItem style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}>
              <Button
                variant="secondary" size="sm"
                leftIcon={<ChevronLeft size={14} />}
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
              >Prev</Button>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Page {historyPage} of {totalPages}</span>
              <Button
                variant="secondary" size="sm"
                rightIcon={<ChevronRight size={14} />}
                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                disabled={historyPage === totalPages}
              >Next</Button>
            </StaggerItem>
          )}
        </>
      )}
    </StaggerContainer>
  );
});

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function AIInsights() {
  const toast = useToast();

  /* Read ?tab=N from URL if redirected from RecommendationHistory */
  const urlTab = parseInt(new URLSearchParams(window.location.search).get('tab') || '0', 10);
  const [tab, setTab] = useState(isNaN(urlTab) ? 0 : Math.max(0, Math.min(3, urlTab)));

  /* ── State ── */
  const [insights, setInsights]           = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(null);

  const [recs, setRecs]                   = useState(null);
  const [recsLoading, setRecsLoading]     = useState(true);
  const [recsError, setRecsError]         = useState(null);

  const [history, setHistory]             = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]   = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  /* Recommendation filter state */
  const [searchQuery, setSearchQuery]     = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  /* History controls */
  const [historyView, setHistoryView]     = useState('table');
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort]     = useState('newest');
  const [historyPage, setHistoryPage]     = useState(1);
  const HISTORY_PAGE_SIZE = 10;

  /* ── Loaders ── */
  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await getBusinessInsights();
      setInsights(res);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to load business insights';
      setInsightsError(msg);
      toast.error('Business Insights: ' + msg);
    } finally {
      setInsightsLoading(false);
    }
  }, [toast]);

  const loadRecommendations = useCallback(async () => {
    setRecsLoading(true);
    setRecsError(null);
    try {
      const res = await getAIRecommendations();
      setRecs(res);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to load AI recommendations';
      setRecsError(msg);
      toast.error('Recommendations: ' + msg);
    } finally {
      setRecsLoading(false);
    }
  }, [toast]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await getRecommendationHistoryList();
      setHistory(res);
      setHistoryLoaded(true);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to load recommendation history';
      setHistoryError(msg);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  /* Load insights + recs eagerly */
  useEffect(() => {
    loadInsights();
    loadRecommendations();
  }, []);

  /* Lazy-load history when Tab 3 or Tab 2 (Analytics) is first opened */
  useEffect(() => {
    if ((tab === 3 || tab === 2) && !historyLoaded) {
      loadHistory();
    }
  }, [tab, historyLoaded]);

  /* ── Derived data ── */
  const filteredRecs = useMemo(() => {
    if (!recs?.recommendations) return [];
    return recs.recommendations.filter(rec => {
      if (priorityFilter !== 'All' && rec.priority !== priorityFilter) return false;
      if (categoryFilter !== 'All' && rec.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!rec.title.toLowerCase().includes(q) && !rec.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [recs, priorityFilter, categoryFilter, searchQuery]);

  const groupedRecs = useMemo(() => {
    const groups = {};
    filteredRecs.forEach(rec => {
      if (!groups[rec.category]) groups[rec.category] = [];
      groups[rec.category].push(rec);
    });
    return groups;
  }, [filteredRecs]);

  const categories = useMemo(() => {
    if (!recs?.recommendations) return ['All'];
    return ['All', ...new Set(recs.recommendations.map(r => r.category))];
  }, [recs]);

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    let h = [...history];
    if (historySearch) {
      const q = historySearch.toLowerCase();
      h = h.filter(item =>
        item.model_version?.toLowerCase().includes(q) ||
        item.business_health?.rating?.toLowerCase().includes(q)
      );
    }
    if (historySort === 'newest')      h.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    else if (historySort === 'oldest') h.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    else if (historySort === 'health_high') h.sort((a, b) => b.business_health.score - a.business_health.score);
    else if (historySort === 'health_low')  h.sort((a, b) => a.business_health.score - b.business_health.score);
    return h;
  }, [history, historySearch, historySort]);

  const pagedHistory = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return filteredHistory.slice(start, start + HISTORY_PAGE_SIZE);
  }, [filteredHistory, historyPage]);

  const totalPages = Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE);

  /* ── Render ── */
  return (
    <StaggerContainer>
      {/* Page Header */}
      <StaggerItem className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">AI Decision Center</h1>
          <p className="page-desc">Executive intelligence powered by real-time LightGBM analytics</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => { loadInsights(); loadRecommendations(); if (historyLoaded) loadHistory(); }}
          >
            Refresh All
          </Button>
          <span className="badge badge-info"><Sparkles size={14} style={{ marginRight: 4 }} /> AI-Powered</span>
        </div>
      </StaggerItem>

      {/* Tab Navigation */}
      <StaggerItem>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            let badge = null;
            if (t.id === 1 && recs?.summary?.total_recommendations) badge = recs.summary.total_recommendations;
            if (t.id === 3 && history?.length)                       badge = history.length;
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
                {badge != null && (
                  <span style={{ fontSize: 9, background: 'var(--brand-500)', color: '#fff', borderRadius: 'var(--r-full)', padding: '1px 6px', fontWeight: 700 }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </StaggerItem>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {tab === 0 && (
            <BusinessInsightsTab
              data={insights}
              loading={insightsLoading}
              error={insightsError}
              onRetry={loadInsights}
            />
          )}
          {tab === 1 && (
            <RecommendationsTab
              data={recs}
              loading={recsLoading}
              error={recsError}
              onRetry={loadRecommendations}
              filteredRecs={filteredRecs}
              groupedRecs={groupedRecs}
              categories={categories}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
            />
          )}
          {tab === 2 && (
            <AnalyticsTab
              insightsData={insights}
              recsData={recs}
              historyData={history}
              historyLoading={historyLoading}
            />
          )}
          {tab === 3 && (
            <HistoryTab
              history={pagedHistory}
              fullHistory={filteredHistory}
              loading={historyLoading}
              error={historyError}
              onRetry={loadHistory}
              historyView={historyView}
              setHistoryView={setHistoryView}
              historySearch={historySearch}
              setHistorySearch={v => { setHistorySearch(v); setHistoryPage(1); }}
              historySort={historySort}
              setHistorySort={v => { setHistorySort(v); setHistoryPage(1); }}
              historyPage={historyPage}
              setHistoryPage={setHistoryPage}
              totalPages={totalPages}
              totalRecords={filteredHistory.length}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </StaggerContainer>
  );
}
