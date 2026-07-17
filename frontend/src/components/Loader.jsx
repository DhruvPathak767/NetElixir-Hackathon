export function Loader({ size = 40, label }) {
  return (
    <div className="loader-wrap">
      <div className="loader" style={{ width: size, height: size }}>
        <svg viewBox="0 0 50 50" width={size} height={size}>
          <circle cx="25" cy="25" r="20" fill="none" stroke="var(--border)" strokeWidth="4" />
          <circle
            cx="25" cy="25" r="20" fill="none"
            stroke="url(#loaderGrad)" strokeWidth="4" strokeLinecap="round"
            strokeDasharray="80 200"
            className="loader-arc"
          />
          <defs>
            <linearGradient id="loaderGrad" x1="0" y1="0" x2="50" y2="50">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {label && <p className="loader-label">{label}</p>}
    </div>
  );
}

export function Spinner({ size = 18 }) {
  return (
    <span className="spinner" style={{ width: size, height: size }} aria-hidden />
  );
}

export function TypingDots() {
  return (
    <span className="typing-dots" aria-label="Loading">
      <span /><span /><span />
    </span>
  );
}

export function Skeleton({ width = '100%', height = 20, rounded = 'md', className = '' }) {
  const r = { sm: 'var(--r-sm)', md: 'var(--r-md)', lg: 'var(--r-lg)', full: 'var(--r-full)' }[rounded] || 'var(--r-md)';
  return (
    <span
      className={`skeleton shimmer ${className}`}
      style={{ display: 'block', width, height, borderRadius: r }}
    />
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <Loader size={56} label={label} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="table-responsive" style={{ opacity: 0.7 }}>
      <table className="table">
        <thead>
          <tr>
            <th><Skeleton height={16} width="80%" /></th>
            <th><Skeleton height={16} width="60%" /></th>
            <th><Skeleton height={16} width="90%" /></th>
            <th><Skeleton height={16} width="50%" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td><Skeleton height={20} /></td>
              <td><Skeleton height={20} width="80%" /></td>
              <td><Skeleton height={20} width="60%" /></td>
              <td><Skeleton height={20} width="70%" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartSkeleton({ height = 300 }) {
  return (
    <div style={{ height, width: '100%', display: 'flex', alignItems: 'flex-end', gap: '2%', padding: '10px 0', opacity: 0.5 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton 
          key={i} 
          width="6.3%" 
          height={`${20 + Math.random() * 80}%`} 
          rounded="sm" 
          className="chart-bar-skeleton"
        />
      ))}
    </div>
  );
}
