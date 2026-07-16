import { motion } from 'framer-motion';
import { useReveal } from '../hooks/useUI.js';

export default function Card({
  children,
  className = '',
  hover = true,
  reveal = false,
  glow = false,
  padding = 'md',
  onClick,
  ...rest
}) {
  const ref = useReveal();
  const pad = { none: '', sm: 'card-pad-sm', md: 'card-pad-md', lg: 'card-pad-lg' }[padding] || 'card-pad-md';
  const cls = [
    'card',
    hover ? 'card-hover' : '',
    glow ? 'card-glow' : '',
    pad,
    reveal ? 'reveal' : '',
    className,
  ].filter(Boolean).join(' ');

  const props = reveal ? { ref } : {};
  
  return (
    <motion.div 
      className={cls} 
      onClick={onClick} 
      whileHover={hover ? { y: -4, rotateX: 1, rotateY: 1 } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      {...props} 
      {...rest}
    >
      {children}
    </motion.div>
  );
}
