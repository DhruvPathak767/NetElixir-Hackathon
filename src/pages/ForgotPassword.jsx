import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../components/Toast.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email) return toast.warning('Enter your email');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success('Reset link sent — check your inbox');
    }, 900);
  };

  return (
    <AuthLayout title="Reset password" subtitle="We'll email you a secure link to reset your password">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div 
            key="success"
            className="empty-state" 
            style={{ padding: 24 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="empty-state-icon"><Mail size={24} /></div>
            <div className="empty-state-title">Check your inbox</div>
            <div className="empty-state-desc">We sent a reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. It expires in 30 minutes.</div>
            <Link to="/login" style={{ marginTop: 8 }}><Button variant="outline" leftIcon={<ArrowLeft size={16} />}>Back to sign in</Button></Link>
          </motion.div>
        ) : (
          <motion.form 
            key="form"
            onSubmit={onSubmit} 
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-wrap">
                <Mail size={16} />
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={<ArrowRight size={18} />}>
              Send reset link
            </Button>
            <p className="auth-toggle-link">
              <Link to="/login"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ArrowLeft size={14} /> Back to sign in</span></Link>
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
