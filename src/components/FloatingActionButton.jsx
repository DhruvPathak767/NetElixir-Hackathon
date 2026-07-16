import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UploadCloud, FileText, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * FloatingActionButton sits at the bottom right and expands to show quick actions.
 */
export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const actions = [
    { id: 'upload', label: 'Upload Data', icon: <UploadCloud size={20} />, path: '/app/upload' },
    { id: 'report', label: 'Generate Report', icon: <FileText size={20} />, path: '/app/reports' },
    { id: 'ai', label: 'Ask AI', icon: <Sparkles size={20} />, path: '/app/ai-insights' }
  ];

  const handleAction = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="fab-container" ref={ref}>
      <button 
        className="fab-trigger" 
        onClick={() => setOpen(!open)}
        aria-label="Quick Actions"
        style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
      >
        <Plus size={24} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', marginBottom: '8px' }}
          >
            {actions.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ delay: (actions.length - 1 - i) * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                className="fab-action"
              >
                <div className="fab-action-label" onClick={() => handleAction(action.path)} style={{ cursor: 'pointer' }}>
                  {action.label}
                </div>
                <button className="fab-action-btn" onClick={() => handleAction(action.path)}>
                  {action.icon}
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
