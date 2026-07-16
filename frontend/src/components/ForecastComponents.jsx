import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Target, Wallet, Cpu, CheckCircle2,
  Shield, Clock, Code2, GitBranch
} from 'lucide-react';
import Card from './Card.jsx';
import { StatCard } from './ReusableWidgets.jsx';

/* -------------------------------------------------------
   Shared chart styling — dark + light mode aware
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
  cursor: { stroke: 'var(--border-brand)', strokeWidth: 1 },
};

/* -------------------------------------------------------
   Confidence Level → badge class
------------------------------------------------------- */
function getBadgeClass(level) {
  const l = level?.toLowerCase();
  if (l === 'excellent' || l === 'very high' || l === 'high') return 'badge-success';
  if (l === 'good') return 'badge-info';
  if (l === 'moderate' || l === 'medium') return 'badge-warning';
  return 'badge-danger';
}

/* -------------------------------------------------------
   Animated Confidence Gauge — SVG ring
   Props: score (0–100), size (px)
------------------------------------------------------- */
export const ConfidenceGauge = memo(function ConfidenceGauge({ score, size = 110 }) {
  const center = size / 2;
  const r = center * 0.72;
  const circ = 2 * Math.PI * r;
  const strokeW = size * 0.075;

  return (
    <div style={{ width: size, height: size, flexShrink: 0, position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--bg-surface-3)" strokeWidth={strokeW} />
        {/* Animated fill */}
        <motion.circle
          cx={center} cy={center} r={r} fill="none"
          stroke="url(#confGradPanel)"
          strokeWidth={strokeW}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * Math.min(100, Math.max(0, score))) / 100 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="confGradPanel" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-400)" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      {/* Centre text — rendered outside rotated SVG */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: size * 0.19, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          {score}%
        </span>
        <span style={{ fontSize: size * 0.09, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
          score
        </span>
      </div>
    </div>
  );
});

/* -------------------------------------------------------
   MetaRow — single labelled row inside the panel
------------------------------------------------------- */
function MetaRow({ icon: Icon, label, value, highlight = false, last = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 0',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <Icon size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
      <span style={{
        fontSize: 'var(--fs-xs)', fontWeight: 700,
        color: highlight ? 'var(--brand-400)' : 'var(--text-primary)',
      }}>{value}</span>
    </div>
  );
}

/* -------------------------------------------------------
   AccuracyChip — compact metric tile
------------------------------------------------------- */
function AccuracyChip({ label, value, unit = '', color }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center',
      background: 'var(--bg-surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      padding: '10px 6px',
    }}>
      <div style={{
        fontSize: 9, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
      }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, color: color || 'var(--text-primary)' }}>
        {value}{unit}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   ForecastConfidencePanel
   Unified section showing ALL fields from POST /forecast-confidence.
------------------------------------------------------- */
export const ForecastConfidencePanel = memo(function ForecastConfidencePanel({
  score, level, interval, reliability,
  lowerBound, upperBound,
  generatedAt, processingTimeMs, apiVersion, modelVersion,
  modelMetrics,
}) {
  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.055 } },
  };
  const rowVariants = {
    hidden: { opacity: 0, x: -6 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.28 } },
  };

  return (
    <Card reveal padding="lg" style={{
      background: 'linear-gradient(135deg, rgba(34,211,238,0.04), transparent)',
      border: '1px solid var(--border-brand)',
    }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div className="card-title" style={{ margin: 0 }}>Forecast Confidence</div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
            Reliability analysis and model diagnostics
          </div>
        </div>
        <span className={`badge ${getBadgeClass(level)}`} style={{ fontSize: 10, padding: '3px 10px', flexShrink: 0 }}>
          {level}
        </span>
      </div>

      {/* Gauge + metadata rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'start', marginBottom: 14 }}>
        {/* Left: gauge + tier pill */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <ConfidenceGauge score={score} size={110} />
          <span style={{
            fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)',
            background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-full)', padding: '2px 10px', whiteSpace: 'nowrap',
          }}>
            {reliability}
          </span>
        </div>

        {/* Right: all 7 metadata rows with stagger animation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', paddingTop: 2 }}
        >
          <motion.div variants={rowVariants}>
            <MetaRow icon={Shield} label="Confidence Interval" value={interval} highlight />
          </motion.div>
          <motion.div variants={rowVariants}>
            <MetaRow icon={TrendingUp} label="Lower Bound" value={`$${Math.round(lowerBound).toLocaleString()}`} />
          </motion.div>
          <motion.div variants={rowVariants}>
            <MetaRow icon={TrendingUp} label="Upper Bound" value={`$${Math.round(upperBound).toLocaleString()}`} highlight />
          </motion.div>
          <motion.div variants={rowVariants}>
            <MetaRow icon={Clock} label="Generated At" value={formattedDate} />
          </motion.div>
          <motion.div variants={rowVariants}>
            <MetaRow icon={Cpu} label="Processing Time" value={processingTimeMs ? `${processingTimeMs.toFixed(1)} ms` : '—'} />
          </motion.div>
          <motion.div variants={rowVariants}>
            <MetaRow icon={Code2} label="API Version" value={apiVersion || 'v1'} />
          </motion.div>
          <motion.div variants={rowVariants}>
            <MetaRow icon={GitBranch} label="Model Release" value={modelVersion || '—'} last />
          </motion.div>
        </motion.div>
      </div>

      {/* LightGBM accuracy chips */}
      {modelMetrics && (
        <>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 8 }}>
            <div style={{
              fontSize: 9, fontWeight: 600, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              LightGBM Accuracy
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <AccuracyChip label="Test R²"   value={modelMetrics.r2.toFixed(3)}              color="var(--brand-400)" />
            <AccuracyChip label="MAPE"      value={modelMetrics.mape.toFixed(1)} unit="%"   color="var(--warning)"   />
            <AccuracyChip label="CV R²"     value={modelMetrics.cross_validation_r2.toFixed(3)} color="var(--success)" />
          </div>
        </>
      )}
    </Card>
  );
});

/* -------------------------------------------------------
   ModelMetricCard (kept for import compatibility)
------------------------------------------------------- */
export const ModelMetricCard = memo(function ModelMetricCard({ title, value, unit = '', description }) {
  return (
    <div style={{
      background: 'var(--bg-surface-2)', padding: '6px 4px',
      borderRadius: 'var(--r-md)', textAlign: 'center',
      border: '1px solid var(--border)', flex: 1,
    }}>
      <div style={{ fontSize: 8, color: 'var(--text-secondary)' }}>{title}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{value}{unit}</div>
      {description && <div style={{ fontSize: 7, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
    </div>
  );
});

/* -------------------------------------------------------
   ForecastSummaryCard
------------------------------------------------------- */
export const ForecastSummaryCard = memo(function ForecastSummaryCard({ revenue, spend, roas }) {
  return (
    <Card reveal padding="md" style={{
      background: 'linear-gradient(135deg, rgba(34,211,238,0.05), transparent)',
      margin: 0,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            Forecast Summary
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            The model projects a total revenue of{' '}
            <strong>${Math.round(revenue).toLocaleString()}</strong> on a spend of{' '}
            <strong>${Math.round(spend).toLocaleString()}</strong>. Blended ROAS is{' '}
            <strong>{roas.toFixed(2)}x</strong>.
          </p>
        </div>
      </div>
    </Card>
  );
});

/* -------------------------------------------------------
   ForecastMetadataCard (kept for import compatibility)
------------------------------------------------------- */
export const ForecastMetadataCard = memo(function ForecastMetadataCard({
  generatedAt, apiVersion, modelVersion, processingTimeMs
}) {
  const formattedDate = generatedAt ? new Date(generatedAt).toLocaleString() : '-';
  return (
    <Card reveal padding="md">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Cpu size={14} style={{ color: 'var(--brand-400)' }} />
        <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>System Diagnostics</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          ['Generated At', formattedDate, 'var(--text-muted)'],
          ['Processing Time', processingTimeMs ? `${processingTimeMs.toFixed(1)} ms` : '-', 'var(--text-primary)'],
          ['API Version', apiVersion || 'v1', 'var(--text-muted)'],
          ['Model Release', modelVersion || 'v3', 'var(--text-primary)'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}:</span>
            <span style={{ color, fontWeight: 500 }}>{val}</span>
          </div>
        ))}
      </div>
    </Card>
  );
});

/* -------------------------------------------------------
   PredictionTimeline — chart with dark/light theme tokens
------------------------------------------------------- */
export const PredictionTimeline = memo(function PredictionTimeline({
  chartData, historyLoading, pointResult,
}) {
  return (
    <Card reveal padding="lg" style={{ display: 'flex', flexDirection: 'column', minHeight: 350 }}>
      <div className="card-title" style={{ fontSize: 'var(--fs-sm)', marginBottom: 4 }}>Revenue Trend Forecast</div>
      <div className="card-subtitle" style={{ fontSize: 11, marginBottom: 20 }}>
        {pointResult
          ? 'Historical actuals + forecasted revenue with uncertainty bounds'
          : 'Historical actuals — run prediction to overlay the forecast point'}
      </div>
      {historyLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={240}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="label" axisLine={false} tickLine={false}
                tick={{ fill: 'var(--chart-axis)', fontSize: 10 }}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: 'var(--chart-axis)', fontSize: 10 }}
              />
              <Tooltip
                formatter={(v) => (v != null ? `$${Math.round(v).toLocaleString()}` : '-')}
                {...CHART_TOOLTIP_STYLE}
              />
              {pointResult && (
                <>
                  <Area type="monotone" dataKey="upper" stroke="none" fill="url(#fcGrad)" name="Upper bound" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="var(--bg-surface)" name="Lower bound" />
                </>
              )}
              <Line
                type="monotone" dataKey="actual"
                stroke="#10b981" strokeWidth={2.5}
                dot={{ r: 2, fill: '#10b981' }}
                name="Historical Actual"
              />
              {pointResult && (
                <Line
                  type="monotone" dataKey="forecast"
                  stroke="#22d3ee" strokeWidth={2.5} strokeDasharray="6 4"
                  dot={{ r: 3, fill: '#22d3ee' }}
                  name="Campaign Forecast"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
});

/* -------------------------------------------------------
   ForecastMetricsGrid — top 3 KPI cards
------------------------------------------------------- */
export const ForecastMetricsGrid = memo(function ForecastMetricsGrid({ revenue, roas, spend }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      <StatCard label="Predicted Revenue" value={revenue} prefix="$" decimals={0} icon={TrendingUp} />
      <StatCard label="Predicted ROAS"    value={roas}    suffix="x" decimals={2}  icon={Target}    />
      <StatCard label="Total Spend"       value={spend}   prefix="$" decimals={0}  icon={Wallet}    />
    </div>
  );
});
