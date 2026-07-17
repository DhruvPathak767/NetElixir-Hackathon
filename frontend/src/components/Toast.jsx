import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const ICONS = {
  success: <CheckCircle2 size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

let idc = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((type, message, duration = 4000) => {
    const id = ++idc;
    setToasts((t) => [...t, { id, type, message, duration }]);
    if (duration) setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const api = {
    success: (m, d) => push('success', m, d),
    error: (m, d) => push('error', m, d),
    warning: (m, d) => push('warning', m, d),
    info: (m, d) => push('info', m, d),
    remove,
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-container" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div 
              key={t.id} 
              className={`toast toast-${t.type}`}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <span className="toast-icon">{ICONS[t.type]}</span>
              <span className="toast-msg">{t.message}</span>
              <button className="toast-close" onClick={() => remove(t.id)} aria-label="Dismiss">
                <X size={16} />
              </button>
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: t.duration ? t.duration / 1000 : 4, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: 3,
                  background: 'var(--text-primary)',
                  opacity: 0.1,
                  borderRadius: '0 0 var(--r-md) var(--r-md)'
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
