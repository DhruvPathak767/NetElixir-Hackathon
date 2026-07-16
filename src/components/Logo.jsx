import { useEffect, useState } from 'react';

/**
 * ForecastIQ — Live animated logo.
 * SVG-based neural-node mark with pulsing synapses and a scanning wave.
 * Pure CSS animation, no external deps. Scales via `size` prop.
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
            <linearGradient id="fiqGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="55%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="fiqGradSoft" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <filter id="fiqGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer ring */}
          <circle
            cx="50" cy="50" r="44"
            stroke="url(#fiqGrad)"
            strokeWidth="2.5"
            opacity="0.35"
            className={animated ? 'fiq-ring' : ''}
          />

          {/* Rotating dashed orbit */}
          <g className={animated ? 'fiq-orbit' : ''} style={{ transformOrigin: '50px 50px' }}>
            <circle
              cx="50" cy="50" r="36"
              stroke="url(#fiqGradSoft)"
              strokeWidth="1.5"
              strokeDasharray="4 8"
              opacity="0.5"
            />
          </g>

          {/* Scanning wave line */}
          {animated && (
            <line
              x1="14" y1="50" x2="86" y2="50"
              stroke="url(#fiqGrad)"
              strokeWidth="1.5"
              opacity="0.25"
              className="fiq-scan"
            />
          )}

          {/* Neural connections */}
          <g stroke="url(#fiqGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.55">
            <line x1="50" y1="22" x2="50" y2="50" className={animated ? 'fiq-line fiq-l1' : ''} />
            <line x1="50" y1="50" x2="26" y2="68" className={animated ? 'fiq-line fiq-l2' : ''} />
            <line x1="50" y1="50" x2="74" y2="68" className={animated ? 'fiq-line fiq-l3' : ''} />
            <line x1="26" y1="68" x2="74" y2="68" className={animated ? 'fiq-line fiq-l4' : ''} />
          </g>

          {/* Nodes */}
          <g filter="url(#fiqGlow)">
            <circle cx="50" cy="22" r="6" fill="url(#fiqGrad)" className={animated ? 'fiq-node fiq-n1' : ''} />
            <circle cx="50" cy="50" r="8" fill="url(#fiqGrad)" className={animated ? 'fiq-node fiq-n0' : ''} />
            <circle cx="26" cy="68" r="5" fill="url(#fiqGradSoft)" className={animated ? 'fiq-node fiq-n2' : ''} />
            <circle cx="74" cy="68" r="5" fill="url(#fiqGradSoft)" className={animated ? 'fiq-node fiq-n3' : ''} />
          </g>

          {/* Center pulse */}
          {animated && <circle cx="50" cy="50" r="3" fill="#fff" className="fiq-core" />}
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
.fiq-ring { transform-origin: 50px 50px; animation: fiqRingPulse 3s ease-in-out infinite; }
@keyframes fiqRingPulse {
  0%,100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.04); }
}
.fiq-orbit { animation: fiqSpin 14s linear infinite; }
@keyframes fiqSpin { to { transform: rotate(360deg); } }
.fiq-scan { animation: fiqScan 2.4s ease-in-out infinite; transform-origin: 50px 50px; }
@keyframes fiqScan {
  0%,100% { transform: rotate(-12deg); opacity: 0.15; }
  50% { transform: rotate(12deg); opacity: 0.4; }
}
.fiq-line { stroke-dasharray: 40; stroke-dashoffset: 40; animation: fiqLineDraw 2s ease forwards; }
.fiq-l1 { animation-delay: 0.1s; }
.fiq-l2 { animation-delay: 0.3s; }
.fiq-l3 { animation-delay: 0.5s; }
.fiq-l4 { animation-delay: 0.7s; }
@keyframes fiqLineDraw { to { stroke-dashoffset: 0; } }
.fiq-node { transform-origin: center; animation: fiqNodePulse 2.5s ease-in-out infinite; }
.fiq-n0 { animation-delay: 0s; }
.fiq-n1 { animation-delay: 0.3s; }
.fiq-n2 { animation-delay: 0.6s; }
.fiq-n3 { animation-delay: 0.9s; }
@keyframes fiqNodePulse {
  0%,100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.25); opacity: 0.8; }
}
.fiq-core { animation: fiqCorePulse 1.6s ease-in-out infinite; transform-origin: 50px 50px; }
@keyframes fiqCorePulse {
  0%,100% { opacity: 0.9; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.6); }
}
@media (prefers-reduced-motion: reduce) {
  .fiq-ring,.fiq-orbit,.fiq-scan,.fiq-line,.fiq-node,.fiq-core { animation: none !important; }
  .fiq-line { stroke-dashoffset: 0 !important; }
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
