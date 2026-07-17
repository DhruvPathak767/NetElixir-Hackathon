/**
 * AIComponents.jsx — Reusable components for Phase 2.4 AI Decision Center
 * All components use existing design tokens (CSS vars, framer-motion, Card).
 */
import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, AlertCircle, CheckCircle2, Info, ChevronDown, ChevronUp,
  Sparkles, BrainCircuit, RotateCcw, ShieldAlert, History,
} from 'lucide-react';
import Card from './Card.jsx';
import Button from './Button.jsx';
import { Skeleton } from './Loader.jsx';

/* ============================================================
   Design Config Maps
   ============================================================ */
const PRIORITY_CONFIG = {
  High:   { cls: 'badge-danger',   dot: '#ef4444' },
  Medium: { cls: 'badge-warning',  dot: '#f59e0b' },
  Low:    { cls: 'badge-success',  dot: '#10b981' },
};

const SEVERITY_CONFIG = {
  High:   { cls: 'badge-danger',  icon: AlertTriangle, bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.2)',  color: 'var(--error)' },
  Medium: { cls: 'badge-warning', icon: AlertCircle,   bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.2)', color: 'var(--warning)' },
  Low:    { cls: 'badge-info',    icon: Info,          bg: 'rgba(6,182,212,0.06)',   border: 'rgba(6,182,212,0.2)',  color: 'var(--info)' },
};

export const CATEGORY_COLORS = {
  Budget:       '#22d3ee',
  Campaign:     '#10b981',
  Performance:  '#f59e0b',
  Optimization: '#8b5cf6',
  Growth:       '#34d399',
  Risk:         '#ef4444',
  Efficiency:   '#3b82f6',
};

/* ============================================================
   HealthGauge — animated SVG ring with score text
   ============================================================ */
export const HealthGauge = memo(function HealthGauge({ score, size = 120 }) {
  const center = size / 2;
  const r = center * 0.72;
  const circ = 2 * Math.PI * r;
  const strokeW = size * 0.076;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--bg-surface-3)" strokeWidth={strokeW} />
        <motion.circle
          cx={center} cy={center} r={r} fill="none" stroke={color}
          strokeWidth={strokeW} strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * Math.min(100, Math.max(0, score))) / 100 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <span style={{ fontSize: size * 0.2, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.085, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>health</span>
      </div>
    </div>
  );
});

/* ============================================================
   PriorityBadge
   ============================================================ */
export function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Low;
  return (
    <span className={`badge ${cfg.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {priority}
    </span>
  );
}

/* ============================================================
   SeverityBadge
   ============================================================ */
export function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Low;
  const Icon = cfg.icon;
  return (
    <span className={`badge ${cfg.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
      <Icon size={9} /> {severity}
    </span>
  );
}

/* ============================================================
   ConfidenceBar — animated progress bar
   ============================================================ */
export function ConfidenceBar({ score, showLabel = true }) {
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {showLabel && (
        <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>{score}%</span>
      )}
      <div style={{ flex: 1, height: 4, background: 'var(--bg-surface-3)', borderRadius: 2, overflow: 'hidden', minWidth: 60 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, score)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   RecommendationCard — full card with all 15+ fields, expandable
   ============================================================ */
export const RecommendationCard = memo(function RecommendationCard({ rec, index }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[rec.category] || 'var(--brand-400)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.28 }}
    >
      <Card padding="lg" style={{ borderLeft: `3px solid ${catColor}`, height: '100%' }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 9, padding: '2px 8px', borderRadius: 'var(--r-full)',
                background: `${catColor}18`, color: catColor,
                border: `1px solid ${catColor}40`, fontWeight: 600,
              }}>
                {rec.category}
              </span>
              <PriorityBadge priority={rec.priority} />
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Score {rec.recommendation_score}/100</span>
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {rec.title}
            </div>
          </div>
          {/* Confidence */}
          <div style={{ flexShrink: 0, width: 90, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <ConfidenceBar score={rec.confidence} showLabel />
            <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>Confidence</span>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>
          {rec.description}
        </p>

        {/* Impact + gain chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 'var(--r-full)', padding: '2px 8px' }}>
            📈 {rec.expected_business_impact}
          </span>
          {rec.estimated_gain?.revenue && (
            <span style={{ fontSize: 9, background: 'rgba(34,211,238,0.1)', color: 'var(--brand-400)', border: '1px solid var(--border-brand)', borderRadius: 'var(--r-full)', padding: '2px 8px' }}>
              Rev {rec.estimated_gain.revenue}
            </span>
          )}
          {rec.estimated_gain?.roas && (
            <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 'var(--r-full)', padding: '2px 8px' }}>
              ROAS {rec.estimated_gain.roas}
            </span>
          )}
        </div>

        {/* Execution row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, flexWrap: 'wrap' }}>
          <span>🎯 {rec.action}</span>
          <span>·</span>
          <span>⚙️ {rec.implementation}</span>
          <span>·</span>
          <span>⏱️ {rec.time_to_implement}</span>
          <span>·</span>
          <span>💰 {rec.estimated_cost} cost</span>
        </div>

        {/* Tags */}
        {rec.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {rec.tags.map((tag, i) => (
              <span key={i} className="tag" style={{ fontSize: 9, padding: '1px 6px' }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--brand-400)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Show less' : 'Full detail'}
        </button>

        {/* ── Expandable section ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Why this recommendation */}
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    Why This Recommendation
                  </div>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {rec.why_this_recommendation}
                  </p>
                </div>

                {/* Evidence list */}
                {rec.because?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                      Evidence
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {rec.because.map((b, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                          <CheckCircle2 size={12} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* KPI Impact */}
                {rec.kpi_impact && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                      Projected KPI Impact
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {[
                        ['Revenue',         rec.kpi_impact['Revenue']],
                        ['ROAS',            rec.kpi_impact['ROAS']],
                        ['CTR',             rec.kpi_impact['CTR']],
                        ['Conv. Rate',      rec.kpi_impact['Conversion Rate']],
                      ].map(([label, val]) => (
                        <div key={label} style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 6px', textAlign: 'center' }}>
                          <div style={{ fontSize: 8, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>{val || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estimated gain - profit */}
                {rec.estimated_gain?.profit && (
                  <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.16)', borderRadius: 'var(--r-sm)', fontSize: 10, color: 'var(--text-secondary)' }}>
                    Estimated Profit Gain: <strong style={{ color: 'var(--success)' }}>{rec.estimated_gain.profit}</strong>
                  </div>
                )}

                {/* Forecast Reliability */}
                {rec.forecast_reliability && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                      Forecast Reliability
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 10, color: 'var(--text-secondary)' }}>
                      <span>Rating: <strong style={{ color: 'var(--text-primary)' }}>{rec.forecast_reliability.rating}</strong></span>
                      <span>CV R²: <strong style={{ color: 'var(--brand-400)' }}>{rec.forecast_reliability.cross_validation_r2?.toFixed(3)}</strong></span>
                      <span>MAPE: <strong style={{ color: 'var(--warning)' }}>{rec.forecast_reliability.mape?.toFixed(1)}%</strong></span>
                      <span>Interval: <strong style={{ color: 'var(--text-primary)' }}>{rec.forecast_reliability.confidence_interval}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
});

/* ============================================================
   RiskAlertStrip — horizontally scrollable alert chips
   ============================================================ */
export function RiskAlertStrip({ alerts = [] }) {
  if (!alerts?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
      {alerts.map((alert, i) => {
        const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.Low;
        const Icon = cfg.icon;
        return (
          <div key={i} style={{
            flexShrink: 0, display: 'flex', gap: 10, alignItems: 'flex-start',
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 'var(--r-md)', padding: '10px 14px',
            maxWidth: 290, minWidth: 200,
          }}>
            <Icon size={15} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{alert.title}</span>
                <SeverityBadge severity={alert.severity} />
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{alert.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   GrowthOpportunityCard
   ============================================================ */
export function GrowthOpportunityCard({ opp, index }) {
  const isHigh = opp.potential === 'High' || opp.priority === 'High';
  const isMed  = opp.potential === 'Medium' || opp.priority === 'Medium';
  const potColor = isHigh ? 'var(--success)' : isMed ? 'var(--warning)' : 'var(--info)';
  const barW = isHigh ? '85%' : isMed ? '55%' : '30%';
  const tierLabel = opp.potential || opp.priority || 'Medium';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      style={{ height: '100%' }}
    >
      <Card padding="md" hover style={{ height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', flex: 1, lineHeight: 1.3 }}>{opp.area}</div>
          <span className="badge badge-success" style={{ fontSize: 8, flexShrink: 0, marginLeft: 6 }}>{opp.expected_gain}</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Potential: <span style={{ color: potColor, fontWeight: 700 }}>{tierLabel}</span>
        </div>
        <div style={{ height: 3, background: 'var(--bg-surface-3)', borderRadius: 2 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: barW }}
            transition={{ duration: 0.8, delay: index * 0.05 }}
            style={{ height: '100%', background: potColor, borderRadius: 2 }}
          />
        </div>
      </Card>
    </motion.div>
  );
}

/* ============================================================
   WeekendComparisonTable — 7-field weekday vs weekend analysis
   ============================================================ */
export function WeekendComparisonTable({ weekendAnalysis: w }) {
  if (!w) return null;
  const rows = [
    { label: 'Revenue', weekday: `$${Math.round(w.weekday_revenue).toLocaleString()}`, weekend: `$${Math.round(w.weekend_revenue).toLocaleString()}`, better: w.better_revenue },
    { label: 'ROAS',    weekday: `${w.weekday_roas?.toFixed(2)}x`,                    weekend: `${w.weekend_roas?.toFixed(2)}x`,                   better: w.better_roas },
    { label: 'CTR',     weekday: 'Weekday data',                                        weekend: 'Weekend data',                                       better: w.better_ctr },
  ];
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {['Metric', 'Weekday', 'Weekend', 'Better'].map(h => (
            <th key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.label}>
            <td style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>{row.label}</td>
            <td style={{ fontSize: 11, padding: '7px 0', borderBottom: '1px solid var(--border)', color: row.better === 'Weekday' ? 'var(--brand-400)' : 'var(--text-secondary)', fontWeight: row.better === 'Weekday' ? 700 : 400 }}>{row.weekday}</td>
            <td style={{ fontSize: 11, padding: '7px 0', borderBottom: '1px solid var(--border)', color: row.better === 'Weekend' ? 'var(--success)' : 'var(--text-secondary)', fontWeight: row.better === 'Weekend' ? 700 : 400 }}>{row.weekend}</td>
            <td style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span className={`badge ${row.better === 'Weekday' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: 8 }}>{row.better}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ============================================================
   DataQualityPanel — quality score gauge + 4 metrics
   ============================================================ */
export function DataQualityPanel({ quality }) {
  if (!quality) return null;
  const qs = quality.quality_score;
  const color = qs >= 80 ? '#10b981' : qs >= 60 ? '#f59e0b' : '#ef4444';
  const circ = 2 * Math.PI * 28;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div style={{ width: 70, height: 70, position: 'relative' }}>
          <svg width="70" height="70" viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="35" cy="35" r="28" fill="none" stroke="var(--bg-surface-3)" strokeWidth="6" />
            <motion.circle
              cx="35" cy="35" r="28" fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - (circ * qs) / 100 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{qs}%</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[
          ['📄 Total Records',  quality.records.toLocaleString()],
          ['⚠️ Missing Values', quality.missing_values],
          ['🔄 Duplicates',     quality.duplicates],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   InsightItem — single AI-generated insight row
   ============================================================ */
export function InsightItem({ text, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid var(--border)' }}
    >
      <Sparkles size={11} style={{ color: 'var(--brand-400)', flexShrink: 0, marginTop: 3 }} />
      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{text}</p>
    </motion.div>
  );
}

/* ============================================================
   AISkeletonLoader — full-section shimmer skeleton
   ============================================================ */
export function AISkeletonLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} padding="lg">
            <Skeleton width="40%" height={12} style={{ marginBottom: 12 }} />
            <Skeleton width="70%" height={28} style={{ marginBottom: 8 }} />
            <Skeleton width="50%" height={10} />
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="lg" style={{ height: 90 }}>
            <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={14} />
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card padding="lg" style={{ height: 220 }}>
          <Skeleton width="40%" height={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={160} rounded="md" />
        </Card>
        <Card padding="lg" style={{ height: 220 }}>
          <Skeleton width="40%" height={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={160} rounded="md" />
        </Card>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} padding="lg">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Skeleton width={44} height={44} rounded="lg" />
            <div style={{ flex: 1 }}>
              <Skeleton width="55%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="85%" height={10} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
   AIErrorCard — full-section error state with retry
   ============================================================ */
export function AIErrorCard({ title = 'AI Engine Error', message, onRetry }) {
  return (
    <div className="empty-state" style={{ minHeight: '45vh' }}>
      <div className="empty-state-icon" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderRadius: 'var(--r-lg)' }}>
        <ShieldAlert size={28} />
      </div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{message}</div>
      {onRetry && (
        <Button variant="primary" onClick={onRetry} leftIcon={<RotateCcw size={16} />} style={{ marginTop: 12 }}>
          Retry
        </Button>
      )}
    </div>
  );
}

/* ============================================================
   AIEmptyState — empty state with icon + prompt
   ============================================================ */
export function AIEmptyState({ icon: Icon = BrainCircuit, title, desc, action }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="empty-state" style={{ minHeight: '40vh' }}
    >
      <motion.div 
        className="empty-state-icon"
        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
      >
        <Icon size={28} style={{ color: 'var(--brand-400)' }} />
      </motion.div>
      <div className="empty-state-title">{title}</div>
      {desc && <div className="empty-state-desc">{desc}</div>}
      {action}
    </motion.div>
  );
}
