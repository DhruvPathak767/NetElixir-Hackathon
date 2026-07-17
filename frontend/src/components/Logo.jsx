import { useEffect, useState } from 'react';

/**
 * ForecastIQ — Live animated logo.
 * Hexagonal mark with "F" letter, bar chart, and rising trend line.
 * CSS-only animations with dark/light theme support. Scales via `size` prop.
 */
export default function Logo({ size = 36, animated = true, withText = true, textClassName = '' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <span className="fiq-logo" style={{ width: size, height: size, display: 'inline-block' }}>
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="ForecastIQ logo"
        >
          <defs>
            {/* Primary cyan-to-green gradient */}
            <linearGradient id="fiqGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="55%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            {/* Softer gradient for accents */}
            <linearGradient id="fiqGradSoft" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            {/* Vertical bar gradient */}
            <linearGradient id="fiqBarGrad" x1="0" y1="80" x2="0" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="fiqGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Outer glow for hexagon */}
            <filter id="fiqHexGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="g" />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Hexagon outline with glow */}
          <polygon
            points="50,8 88,27 88,73 50,92 12,73 12,27"
            stroke="url(#fiqGrad)"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
            filter="url(#fiqHexGlow)"
            className={animated ? 'fiq-hex-pulse' : ''}
          />

          {/* Inner hexagon subtle fill */}
          <polygon
            points="50,14 82,30 82,70 50,86 18,70 18,30"
            fill="url(#fiqGrad)"
            opacity="0.06"
            className={animated ? 'fiq-hex-fill' : ''}
          />

          {/* "F" letter */}
          <text
            x="26"
            y="62"
            fontFamily="'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif"
            fontWeight="800"
            fontSize="36"
            fill="url(#fiqGrad)"
            filter="url(#fiqGlow)"
            className={animated ? 'fiq-letter' : ''}
          >F</text>

          {/* Bar chart: 4 rising bars */}
          <g opacity="0.85">
            <rect x="54" y="62" width="5" height="12" rx="1" fill="url(#fiqBarGrad)" className={animated ? 'fiq-bar fiq-bar1' : ''} />
            <rect x="61" y="55" width="5" height="19" rx="1" fill="url(#fiqBarGrad)" className={animated ? 'fiq-bar fiq-bar2' : ''} />
            <rect x="68" y="47" width="5" height="27" rx="1" fill="url(#fiqBarGrad)" className={animated ? 'fiq-bar fiq-bar3' : ''} />
            <rect x="75" y="40" width="5" height="34" rx="1" fill="url(#fiqGrad)" className={animated ? 'fiq-bar fiq-bar4' : ''} />
          </g>

          {/* Trend line */}
          <polyline
            points="46,58 56,52 63,46 70,38 77,30"
            stroke="url(#fiqGradSoft)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#fiqGlow)"
            className={animated ? 'fiq-trend-line' : ''}
          />

          {/* Data-point dots */}
          <g fill="url(#fiqGradSoft)" filter="url(#fiqGlow)">
            <circle cx="56" cy="52" r="2.5" className={animated ? 'fiq-dot fiq-dot1' : ''} />
            <circle cx="63" cy="46" r="2.5" className={animated ? 'fiq-dot fiq-dot2' : ''} />
            <circle cx="70" cy="38" r="2.5" className={animated ? 'fiq-dot fiq-dot3' : ''} />
            <circle cx="77" cy="30" r="3" fill="#fff" className={animated ? 'fiq-dot fiq-dot4' : ''} />
          </g>

          {/* Floating sparkle particles */}
          {animated && (
            <g>
              <circle cx="20" cy="18" r="1" fill="#22d3ee" className="fiq-sparkle fiq-sp1" />
              <circle cx="82" cy="22" r="0.8" fill="#34d399" className="fiq-sparkle fiq-sp2" />
              <circle cx="15" cy="55" r="0.7" fill="#67e8f9" className="fiq-sparkle fiq-sp3" />
              <circle cx="86" cy="60" r="1" fill="#22d3ee" className="fiq-sparkle fiq-sp4" />
              <circle cx="35" cy="12" r="0.6" fill="#10b981" className="fiq-sparkle fiq-sp5" />
              <circle cx="70" cy="90" r="0.8" fill="#06b6d4" className="fiq-sparkle fiq-sp6" />
            </g>
          )}

          {/* Ground ripple ellipses */}
          {animated && (
            <g>
              <ellipse cx="50" cy="94" rx="28" ry="3" stroke="url(#fiqGradSoft)" strokeWidth="0.6" fill="none" className="fiq-ripple fiq-rip1" />
              <ellipse cx="50" cy="94" rx="20" ry="2" stroke="url(#fiqGradSoft)" strokeWidth="0.4" fill="none" className="fiq-ripple fiq-rip2" />
            </g>
          )}
        </svg>
      </span>
      {withText && (
        <span className={textClassName || 'fiq-logo-text'}>
          Forecast<span className="text-gradient">IQ</span>
        </span>
      )}
    </div>
  );
}

/* CSS-in-JS for scoped logo animations */
const styleSheet = `
.fiq-logo { flex-shrink: 0; }
.fiq-logo-text {
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  white-space: nowrap;
}

/* ── Hexagon pulse ── */
.fiq-hex-pulse {
  animation: fiqHexPulse 3s ease-in-out infinite;
}
@keyframes fiqHexPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.85; }
}

.fiq-hex-fill {
  animation: fiqHexFillPulse 3s ease-in-out infinite;
}
@keyframes fiqHexFillPulse {
  0%, 100% { opacity: 0.04; }
  50% { opacity: 0.1; }
}

/* ── Letter "F" shimmer ── */
.fiq-letter {
  animation: fiqLetterShimmer 2.5s ease-in-out infinite;
}
@keyframes fiqLetterShimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}

/* ── Bar chart grow-in ── */
.fiq-bar {
  transform-origin: center bottom;
  animation: fiqBarGrow 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
             fiqBarPulse 3s ease-in-out 1.2s infinite;
  opacity: 0;
  transform: scaleY(0);
}
.fiq-bar1 { animation-delay: 0.1s, 1.3s; }
.fiq-bar2 { animation-delay: 0.25s, 1.45s; }
.fiq-bar3 { animation-delay: 0.4s, 1.6s; }
.fiq-bar4 { animation-delay: 0.55s, 1.75s; }

@keyframes fiqBarGrow {
  to { opacity: 0.85; transform: scaleY(1); }
}
@keyframes fiqBarPulse {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.06); }
}

/* ── Trend line draw ── */
.fiq-trend-line {
  stroke-dasharray: 80;
  stroke-dashoffset: 80;
  animation: fiqTrendDraw 1.5s ease-out 0.3s forwards;
}
@keyframes fiqTrendDraw {
  to { stroke-dashoffset: 0; }
}

/* ── Data dots pop in ── */
.fiq-dot {
  transform-origin: center;
  opacity: 0;
  transform: scale(0);
  animation: fiqDotPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
             fiqDotPulse 2.5s ease-in-out 1.5s infinite;
}
.fiq-dot1 { animation-delay: 0.8s, 2.0s; }
.fiq-dot2 { animation-delay: 1.0s, 2.2s; }
.fiq-dot3 { animation-delay: 1.2s, 2.4s; }
.fiq-dot4 { animation-delay: 1.4s, 2.6s; }

@keyframes fiqDotPop {
  to { opacity: 1; transform: scale(1); }
}
@keyframes fiqDotPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.35); }
}

/* ── Sparkle particles float ── */
.fiq-sparkle {
  animation: fiqSparkle 3s ease-in-out infinite;
}
.fiq-sp1 { animation-delay: 0s; }
.fiq-sp2 { animation-delay: 0.5s; }
.fiq-sp3 { animation-delay: 1.0s; }
.fiq-sp4 { animation-delay: 1.5s; }
.fiq-sp5 { animation-delay: 2.0s; }
.fiq-sp6 { animation-delay: 2.5s; }

@keyframes fiqSparkle {
  0%, 100% { opacity: 0.15; transform: translateY(0) scale(0.6); }
  50% { opacity: 0.7; transform: translateY(-3px) scale(1.3); }
}

/* ── Ground ripple ── */
.fiq-ripple {
  animation: fiqRipple 2.8s ease-in-out infinite;
}
.fiq-rip1 { animation-delay: 0s; }
.fiq-rip2 { animation-delay: 0.4s; }

@keyframes fiqRipple {
  0%, 100% { opacity: 0.1; transform: scaleX(0.85); }
  50% { opacity: 0.3; transform: scaleX(1.1); }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .fiq-hex-pulse, .fiq-hex-fill, .fiq-letter,
  .fiq-bar, .fiq-trend-line, .fiq-dot,
  .fiq-sparkle, .fiq-ripple {
    animation: none !important;
  }
  .fiq-bar { opacity: 0.85 !important; transform: scaleY(1) !important; }
  .fiq-trend-line { stroke-dashoffset: 0 !important; }
  .fiq-dot { opacity: 1 !important; transform: scale(1) !important; }
  .fiq-sparkle { opacity: 0.4 !important; }
  .fiq-ripple { opacity: 0.15 !important; }
}
`;

let injected = false;
export function ensureLogoStyles() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.setAttribute('data-fiq-logo', '');
  el.textContent = styleSheet;
  document.head.appendChild(el);
  injected = true;
}

export function useLogoStyles() {
  useEffect(() => { ensureLogoStyles(); }, []);
}
