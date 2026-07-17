import { useEffect, useState } from 'react';

/**
 * ForecastIQ — Image-based logo component.
 * Uses dark/light variants that swap based on data-theme attribute.
 * mix-blend-mode makes the solid background transparent against the page.
 */
export default function Logo({ size = 36, animated = true, withText = true, textClassName = '' }) {
  const [theme, setTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const isDark = theme === 'dark';
  const logoSrc = isDark ? '/logo-dark.png' : '/logo-light.png';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <span
        className={`fiq-logo${animated ? ' fiq-logo-animated' : ''}`}
        style={{ width: size, height: size, display: 'inline-block', flexShrink: 0 }}
      >
        <img
          src={logoSrc}
          alt="ForecastIQ logo"
          width={size}
          height={size}
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
            display: 'block',
            mixBlendMode: isDark ? 'screen' : 'multiply',
            filter: isDark ? 'contrast(3) brightness(1.2)' : 'none',
          }}
        />
      </span>
      {withText && (
        <span className={textClassName || 'fiq-logo-text'}>
          Forecast<span className="text-gradient">IQ</span>
        </span>
      )}
    </div>
  );
}

const styleSheet = `
.fiq-logo{flex-shrink:0}
.fiq-logo-text{font-weight:700;font-size:1.25rem;letter-spacing:-.02em;color:var(--text-primary);white-space:nowrap}
.fiq-logo-animated img{
  transition: transform 0.3s ease;
}
.fiq-logo-animated:hover img{
  transform: scale(1.08);
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
