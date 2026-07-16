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
