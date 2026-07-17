import { motion } from 'framer-motion';
import { useReveal } from '../hooks/useUI.js';

export default function Card({
  children,
  className = '',
  hover = true,
  reveal = false,
  glow = false,
  spotlight = false,
  padding = 'md',
  onClick,
  ...rest
}) {
  const ref = useReveal();
  const pad = { none: '', sm: 'card-pad-sm', md: 'card-pad-md', lg: 'card-pad-lg' }[padding] || 'card-pad-md';
  const isSpotlight = spotlight || hover;

  const handleMouseMove = (e) => {
    if (!isSpotlight) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };
  const cls = [
    'card',
    hover ? 'card-hover' : '',
    glow ? 'card-glow' : '',
    isSpotlight ? 'card-spotlight' : '',
    pad,
    reveal ? 'reveal' : '',
    className,
  ].filter(Boolean).join(' ');

  const props = reveal ? { ref } : {};
  
  return (
    <motion.div 
      className={cls} 
      onClick={onClick}
      onMouseMove={handleMouseMove}
      whileHover={hover ? { y: -3, scale: 1.01 } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      {...props} 
      {...rest}
    >
      {children}
    </motion.div>
  );
}
