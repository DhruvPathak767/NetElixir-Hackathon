import { useEffect, useRef } from 'react';

/**
 * Aurora animated background + grid overlay + floating particles.
 * Fixed full-viewport, pointer-events none, sits behind all content.
 */
export default function AuroraBackground() {
  const particlesRef = useRef(null);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    // Generate particles once
    const count = 24; // Increased from 18
    const els = [];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${12 + Math.random() * 18}s`;
      p.style.animationDelay = `${Math.random() * 12}s`;
      const scale = 0.5 + Math.random() * 1.5;
      p.style.transform = `scale(${scale})`;
      container.appendChild(p);
      els.push(p);
    }
    return () => els.forEach((p) => p.remove());
  }, []);

  return (
    <>
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob b1" />
        <div className="aurora-blob b2" />
        <div className="aurora-blob b3" />
        <div className="aurora-blob b4" />
      </div>
      <div className="grid-overlay" aria-hidden />
      <div className="particles" ref={particlesRef} aria-hidden />
    </>
  );
}
