import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * ScrollProgress displays a fixed gradient bar at the top of the page
 * that indicates how far the user has scrolled.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="scroll-progress">
      <motion.div
        className="scroll-progress-bar"
        style={{ scaleX }}
      />
    </div>
  );
}
