import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Heart, Cpu, RotateCcw } from 'lucide-react';
import Card from './Card.jsx';
import Button from './Button.jsx';
import { Skeleton } from './Loader.jsx';
import AnimatedCounter from './AnimatedCounter.jsx';

/**
 * Reusable Section Header with title, description and actions
 */
export function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header" style={{ marginBottom: 20 }}>
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-desc">{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}

/**
 * Premium Stat KPI Card with Animated Counter, Dynamic Deltas and Icon overlays
 */
export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  delta, 
  deltaLabel = 'vs last period', 
  loading = false, 
  glow = false, 
  prefix = '', 
  suffix = '', 
  decimals = 0 
}) {
  if (loading) {
    return (
      <Card hover={false} padding="lg">
        <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
        <Skeleton width="70%" height={32} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={14} />
      </Card>
    );
  }

  const isNumeric = typeof value === 'number';
  const hasDelta = typeof delta === 'number';
  const deltaUp = hasDelta && delta >= 0;

  return (
    <Card hover reveal glow={glow} className="kpi" style={{ minHeight: 90 }}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {Icon && <span className="kpi-icon"><Icon size={18} /></span>}
      </div>
      <div className="kpi-value">
        {isNumeric ? (
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        ) : (
          <span>{value}</span>
        )}
      </div>
      {hasDelta && (
        <div className="kpi-delta" style={{ color: deltaUp ? 'var(--success)' : 'var(--error)' }}>
          {deltaUp ? '▲ +' : '▼ '}
          <AnimatedCounter value={Math.abs(delta)} decimals={1} suffix={`% ${deltaLabel}`} />
        </div>
      )}
    </Card>
  );
}

/**
 * Card skeleton loader
 */
export function LoadingCard({ lines = 3, padding = 'lg' }) {
  return (
    <Card hover={false} padding={padding}>
      <Skeleton width="30%" height={18} style={{ marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={`${90 - i * 10}%`} height={14} />
        ))}
      </div>
    </Card>
  );
}

/**
 * Standardized error handler placeholder
 */
export function ErrorCard({ title = 'Diagnostic Error', message = 'Failed to fetch model metrics.', onRetry }) {
  return (
    <Card hover={false} padding="lg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px' }}>
      <div className="empty-state-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--r-lg)', margin: '0 auto 16px' }}>
        <AlertTriangle size={24} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 'var(--fs-base)', color: 'var(--text-primary)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', maxWidth: 280, marginBottom: 16 }}>{message}</div>
      {onRetry && (
        <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </Card>
  );
}

/**
 * Colorful tag indicator for status classes
 */
export function StatusChip({ status, type = 'info' }) {
  const badgeCls = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    muted: 'badge-muted'
  }[type] || 'badge-info';

  return (
    <span className={`badge ${badgeCls}`} style={{ textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

/**
 * Statistical confidence percentage badge
 */
export function ConfidenceBadge({ score, rating = 'High' }) {
  const fillWidth = `${Math.min(100, Math.max(0, score))}%`;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 120 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
        <span style={{ fontWeight: 500 }}>Confidence</span>
        <span style={{ color: 'var(--brand-400)', fontWeight: 600 }}>{score}%</span>
      </div>
      <div className="confidence-bar" style={{ height: 6 }}>
        <motion.div 
          className="confidence-fill" 
          initial={{ width: 0 }}
          animate={{ width: fillWidth }}
          transition={{ duration: 0.8 }}
          style={{ height: '100%' }}
        />
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Rating: <strong>{rating}</strong></div>
    </div>
  );
}

/**
 * Model health diagnostic card
 */
export function ModelHealthCard({ version, score, rating = 'Excellent' }) {
  return (
    <Card reveal padding="lg" glow>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div className="insight-icon opportunity" style={{ width: 38, height: 38 }}>
          <Heart size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>Model Health</div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>Version {version}</div>
        </div>
      </div>
      <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {score}%
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', fontWeight: 400 }}>{rating}</span>
      </div>
      <div className="confidence-bar" style={{ marginTop: 10, height: 6 }}>
        <div className="confidence-fill" style={{ width: `${score}%`, background: 'var(--success)' }} />
      </div>
    </Card>
  );
}
