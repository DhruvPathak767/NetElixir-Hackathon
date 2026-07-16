import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
  danger: 'btn-danger',
  success: 'btn-success',
};

const SIZES = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  icon: 'btn-icon',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  type = 'button',
  ...rest
}) {
  const ref = useRef(null);
  const classes = [
    'btn',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? 'btn-full' : '',
    loading ? 'btn-loading' : '',
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) return;
    // ripple
    const el = ref.current;
    if (el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const rect = el.getBoundingClientRect();
      const ink = document.createElement('span');
      ink.className = 'ripple-ink';
      const size = Math.max(rect.width, rect.height);
      ink.style.width = ink.style.height = `${size}px`;
      ink.style.left = `${e.clientX - rect.left - size / 2}px`;
      ink.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(ink);
      setTimeout(() => ink.remove(), 600);
    }
    onClick?.(e);
  };

  const content = (
    <>
      {loading && <span className="btn-spinner" aria-hidden />}
      {leftIcon && !loading && <span className="btn-icon-left">{leftIcon}</span>}
      <span className="btn-label">{children}</span>
      {rightIcon && !loading && <span className="btn-icon-right">{rightIcon}</span>}
    </>
  );

  const shared = {
    className: classes,
    ref,
    ...rest,
  };

  const MotionLink = motion(Link);
  const MotionA = motion.a;

  const motionProps = {
    whileHover: disabled || loading ? {} : { scale: 1.03 },
    whileTap: disabled || loading ? {} : { scale: 0.97 },
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  };

  if (to) {
    return (
      <MotionLink to={to} {...shared} onClick={handleClick} {...motionProps}>
        {content}
      </MotionLink>
    );
  }
  if (href) {
    return (
      <MotionA href={href} {...shared} onClick={handleClick} {...motionProps}>
        {content}
      </MotionA>
    );
  }
  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      {...shared}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
}
