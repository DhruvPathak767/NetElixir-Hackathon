import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../components/Toast.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { motion } from 'framer-motion';

export default function Signup() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pwStrength = () => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = pwStrength();
  const strengthLabel = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['var(--error)', 'var(--error)', 'var(--warning)', 'var(--info)', 'var(--success)'][strength];

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.warning('Please fill in all fields');
    if (strength < 2) return toast.warning('Choose a stronger password');
    if (!agree) return toast.warning('Please accept the terms');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Account created! Welcome to ForecastIQ.');
      navigate('/app/dashboard');
    }, 1000);
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start forecasting in minutes — no credit card required">
      <form onSubmit={onSubmit}>
        <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StaggerItem className="input-group">
            <label className="input-label">Full name</label>
          <div className="input-wrap">
            <User size={16} />
            <input className="input" value={form.name} onChange={set('name')} placeholder="Alex Morgan" />
          </div>
        </StaggerItem>
        <StaggerItem className="input-group">
          <label className="input-label">Work email</label>
          <div className="input-wrap">
            <Mail size={16} />
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" />
          </div>
        </StaggerItem>
        <StaggerItem className="input-group">
          <label className="input-label">Password</label>
          <div className="input-wrap">
            <Lock size={16} />
            <input className="input" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShowPw((s) => !s)} style={{ position: 'absolute', right: 12, color: 'var(--text-muted)' }} aria-label="Toggle password">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.password && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}
            >
              <div className="confidence-bar" style={{ flex: 1 }}>
                <motion.div 
                  className="confidence-fill" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(strength / 4) * 100}%`, backgroundColor: strengthColor }} 
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              </div>
              <motion.span 
                animate={{ color: strengthColor }}
                style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}
              >
                {strengthLabel}
              </motion.span>
            </motion.div>
          )}
        </StaggerItem>
        <StaggerItem>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--brand-500)' }} />
          <span>I agree to the <Link to="/terms" style={{ color: 'var(--brand-400)' }}>Terms</Link> and <Link to="/privacy" style={{ color: 'var(--brand-400)' }}>Privacy Policy</Link></span>
        </label>
        </StaggerItem>
        <StaggerItem>
          <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={<ArrowRight size={18} />}>
            Create account
          </Button>
        </StaggerItem>
        </StaggerContainer>
      </form>
      <p className="auth-toggle-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
