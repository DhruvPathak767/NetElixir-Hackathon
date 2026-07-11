import { useEffect, useState, useRef } from 'react';

/**
 * AnimatedCounter counts up to a target value using requestAnimationFrame.
 * It uses an IntersectionObserver to start the animation only when visible.
 */
export default function AnimatedCounter({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
}) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  // Trigger when it comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Animation logic
  useEffect(() => {
    if (!isVisible) return;

    let startTime = null;
    let animationFrame;

    const targetValue = parseFloat(value) || 0;

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percent = Math.min(progress / duration, 1);
      
      const easedPercent = easeOutQuart(percent);
      setCount(targetValue * easedPercent);

      if (progress < duration) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setCount(targetValue);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [value, duration, isVisible]);

  // Format value based on decimals (or dynamic if it's large)
  let displayValue = count.toFixed(decimals);
  
  // if formatting logic is already handled by a passed-in function (not currently supported by props, but we can handle commas)
  if (value > 999 && decimals === 0) {
    displayValue = Math.round(count).toLocaleString();
  }

  return (
    <span ref={ref} style={{ display: 'inline-block' }}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
