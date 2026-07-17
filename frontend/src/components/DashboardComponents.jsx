import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Sparkles, AlertTriangle,
  ArrowRight, FileText, CheckCircle2, Award, Cpu,
} from 'lucide-react';
import Card from './Card.jsx';
import Button from './Button.jsx';
import AnimatedCounter from './AnimatedCounter.jsx';
import { Link } from 'react-router-dom';

/* -------------------------------------------------------
   Shared chart theme helpers — dark / light mode aware
------------------------------------------------------- */
const CHART_TOOLTIP_STYLE = {
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

/* -------------------------------------------------------
   Centered Circular SVG Health Gauge
------------------------------------------------------- */
export function BusinessHealthGauge({ score }) {
  const getGlowColor = () => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div style={{ display: 'flex', position: 'relative', width: 100, height: 100, margin: '0 auto' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-surface-3)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r="40" fill="none"
          stroke={getGlowColor()} strokeWidth="8"
          strokeDasharray="251.2"
          initial={{ strokeDashoffset: 251.2 }}
          animate={{ strokeDashoffset: 251.2 - (251.2 * score) / 100 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', top: '35%', left: 0, right: 0, textAlign: 'center' }}>
        <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>{score}</span>
        <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Health</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Business Health Rating Card
------------------------------------------------------- */
export function BusinessHealthCard({ health, rating, trend, risk }) {
  const getRatingClass = () => {
    const r = rating?.toLowerCase();
    if (r === 'excellent' || r === 'good') return 'text-success';
    if (r === 'average') return 'text-warning';
    return 'text-error';
  };

  return (
    <Card reveal padding="lg" glow style={{ height: '100%' }}>
      <div className="card-title" style={{ marginBottom: 12 }}>Business Intelligence</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, alignItems: 'center' }}>
        <div>
          <BusinessHealthGauge score={health} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Performance Rating</div>
            <div className={getRatingClass()} style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
              {rating || 'Excellent'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Trend Direction</div>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {trend || 'Increasing'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Budget Risk Tier</div>
            <span
              className={`badge ${risk === 'Low' ? 'badge-success' : risk === 'Medium' ? 'badge-warning' : 'badge-danger'}`}
              style={{ fontSize: 9, padding: '2px 6px', marginTop: 2 }}
            >
              {risk || 'Low'} Risk
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------
   Animated metric KPI card
------------------------------------------------------- */
export function AnimatedMetricCard({ label, value, icon: Icon, delta, formatType = 'money', glow = false }) {
  const isUp = delta >= 0;

  return (
    <Card hover reveal glow={glow} className="kpi" style={{ minHeight: 90 }}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {Icon && <span className="kpi-icon"><Icon size={18} /></span>}
      </div>
      <div className="kpi-value" style={{ fontSize: 'var(--fs-xl)' }}>
        {typeof value === 'number' ? (
          <AnimatedCounter
            value={value}
            prefix={formatType === 'money' ? '$' : ''}
            suffix={formatType === 'percent' ? '%' : formatType === 'roas' ? 'x' : ''}
            decimals={formatType === 'roas' ? 2 : formatType === 'percent' ? 1 : 0}
          />
        ) : (
          <span>{value}</span>
        )}
      </div>
      {delta !== undefined && (
        <div className="kpi-delta" style={{ color: isUp ? 'var(--success)' : 'var(--error)' }}>
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isUp ? '+' : ''}
          <AnimatedCounter value={Math.abs(delta)} decimals={1} suffix="% vs last period" />
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------
   Dynamic business insights details
------------------------------------------------------- */
export const InsightCard = memo(function InsightCard({ insights = [] }) {
  return (
    <Card hover reveal padding="lg">
      <div className="card-title" style={{ marginBottom: 16 }}>AI Business Insights</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="insight-card"
            style={{
              padding: 12, border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', background: 'var(--bg-surface-2)',
              display: 'flex', gap: 12, alignItems: 'center',
            }}
          >
            <span className="insight-icon info" style={{ width: 32, height: 32, flexShrink: 0 }}>
              <Sparkles size={16} />
            </span>
            <div className="insight-body">
              <div
                className="insight-desc"
                style={{
                  fontSize: 'var(--fs-xs)', color: 'var(--text-primary)', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {insight}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

/* -------------------------------------------------------
   AI recommendations with confidence chips
------------------------------------------------------- */
export const RecommendationCard = memo(function RecommendationCard({ recs = [] }) {
  const getBadgeType = (conf) => {
    if (conf >= 85) return 'badge-success';
    if (conf >= 70) return 'badge-info';
    return 'badge-warning';
  };

  return (
    <Card hover reveal padding="lg">
      <div className="card-title" style={{ marginBottom: 16 }}>Key Recommendations</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recs.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex', gap: 12,
              borderBottom: idx < recs.length - 1 ? '1px solid var(--border)' : 'none',
              paddingBottom: idx < recs.length - 1 ? 12 : 0,
            }}
          >
            <div className="insight-icon opportunity" style={{ width: 34, height: 34, flexShrink: 0 }}>
              <Award size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 'var(--fs-xs)', color: 'var(--text-primary)', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.recommendation}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span className={`badge ${getBadgeType(item.confidence)}`} style={{ fontSize: 8, padding: '1px 4px' }}>
                  {item.confidence}% Confidence
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

/* -------------------------------------------------------
   Main revenue and spends line trend chart
------------------------------------------------------- */
export const RevenueTrendChart = memo(function RevenueTrendChart({ monthlyRevenue }) {
  return (
    <Card reveal padding="lg">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="card-title">Revenue Trend</div>
          <div className="card-subtitle">Monthly marketing revenue timeline aggregation</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={monthlyRevenue}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
          <YAxis
            axisLine={false} tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={AXIS_TICK}
          />
          <Tooltip formatter={(v) => `$${v.toLocaleString()}`} {...CHART_TOOLTIP_STYLE} />
          <Area
            type="monotone" dataKey="revenue"
            stroke="#22d3ee" strokeWidth={2}
            fill="url(#revGrad)" name="Monthly Revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
});

/* -------------------------------------------------------
   Spend split pie chart — inline legend replaces Recharts default
------------------------------------------------------- */
const PIE_COLORS = ['#22d3ee', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

export const SpendTrendChart = memo(function SpendTrendChart({ spendDistribution }) {
  const data = Object.entries(spendDistribution).map(([name, value], idx) => ({
    name,
    value,
    color: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  return (
    <Card reveal padding="lg">
      <div className="card-title">Channel Spend Split</div>
      <div className="card-subtitle" style={{ marginBottom: 12 }}>Percentage distribution of marketing budgets</div>
      <div style={{ height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data} dataKey="value" nameKey="name"
              cx="50%" cy="50%" innerRadius={54} outerRadius={80}
              paddingAngle={3} strokeWidth={0}
            >
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(v) => `$${Math.round(v).toLocaleString()}`} {...CHART_TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Custom inline legend — avoids Recharts default misalignment */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
        justifyContent: 'center', marginTop: 10,
      }}>
        {data.map((entry) => (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>{entry.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
});

/* -------------------------------------------------------
   Executive Summary Text Card
------------------------------------------------------- */
export function ExecutiveSummary({ text }) {
  return (
    <Card reveal padding="lg" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.03), transparent)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Sparkles size={20} style={{ color: 'var(--brand-400)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Executive Strategy Summary
          </div>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {text}
          </p>
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------
   Navigation Quick Action shortcuts
------------------------------------------------------- */
export function QuickActionCard() {
  return (
    <Card reveal padding="lg" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="card-title" style={{ marginBottom: 4 }}>Forecast Automation</div>
        <div className="card-subtitle" style={{ marginBottom: 16 }}>Access forecasting studio or optimize spend splits</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link to="/app/forecast">
          <Button variant="primary" fullWidth rightIcon={<ArrowRight size={16} />}>Run Forecast Estimator</Button>
        </Link>
        <Link to="/app/simulator">
          <Button variant="outline" fullWidth>Launch Budget Simulator</Button>
        </Link>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------
   Activity Log Timeline parameters — typo fixed
------------------------------------------------------- */
export const ActivityTimeline = memo(function ActivityTimeline({
  timestamp, version, totalRecords, duplicates, missing,
}) {
  return (
    <Card reveal padding="lg">
      <div className="card-title" style={{ marginBottom: 16 }}>Operational Diagnostics</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="insight-icon opportunity" style={{ width: 30, height: 30, flexShrink: 0 }}>
            <CheckCircle2 size={14} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>Trained Model Stable</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Model Release {version} loaded</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="insight-icon info" style={{ width: 30, height: 30, flexShrink: 0 }}>
            <FileText size={14} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>CSV Dataset Analyzed</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {totalRecords.toLocaleString()} rows and {duplicates} duplicate entries detected
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="insight-icon warning" style={{ width: 30, height: 30, flexShrink: 0 }}>
            <AlertTriangle size={14} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>Data Quality Audit</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {missing} null cells remaining post preprocessing
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

/* -------------------------------------------------------
   Full page Dashboard Skeleton loader — 2 rows of 4
------------------------------------------------------- */
export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="lg">
            <div style={{ height: 12, width: '40%', background: 'var(--bg-surface-3)', borderRadius: 4, marginBottom: 12 }} />
            <div style={{ height: 28, width: '70%', background: 'var(--bg-surface-3)', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 10, width: '50%', background: 'var(--bg-surface-3)', borderRadius: 4 }} />
          </Card>
        ))}
      </div>
      {/* KPI row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="lg">
            <div style={{ height: 12, width: '40%', background: 'var(--bg-surface-3)', borderRadius: 4, marginBottom: 12 }} />
            <div style={{ height: 28, width: '70%', background: 'var(--bg-surface-3)', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 10, width: '50%', background: 'var(--bg-surface-3)', borderRadius: 4 }} />
          </Card>
        ))}
      </div>
      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        <Card padding="lg" style={{ height: 340 }}>
          <div style={{ height: 20, width: '30%', background: 'var(--bg-surface-3)', borderRadius: 4, marginBottom: 20 }} />
          <div style={{ height: '80%', background: 'var(--bg-surface-3)', borderRadius: 8 }} />
        </Card>
        <Card padding="lg" style={{ height: 340 }}>
          <div style={{ height: 20, width: '40%', background: 'var(--bg-surface-3)', borderRadius: 4, marginBottom: 20 }} />
          <div style={{ height: '80%', background: 'var(--bg-surface-3)', borderRadius: 8 }} />
        </Card>
      </div>
    </div>
  );
}
