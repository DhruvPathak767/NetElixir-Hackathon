import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../components/Toast.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const toast = useToast();
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard');
    }
  }, [isAuthenticated, navigate]);

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

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/google/login`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.warning('Please fill in all fields');
    if (strength < 2) return toast.warning('Choose a stronger password');
    if (!agree) return toast.warning('Please accept the terms');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.password);
      toast.success('Account created! Welcome to ForecastIQ.');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
      <div className="auth-divider">or continue with</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={handleGoogleLogin} variant="secondary" fullWidth leftIcon={<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#fff" d="M21.35 11.1H12v3.8h5.35c-.25 1.4-1.7 4.1-5.35 4.1A6.5 6.5 0 0 1 5.5 12 6.5 6.5 0 0 1 12 5.5c1.95 0 3.25.83 4 1.55l2.55-2.45C16.9 3.35 14.7 2.5 12 2.5A9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.4 0 9-3.8 9-9.15 0-.6-.05-1.05-.15-1.25z"/></svg>}>Google</Button>
      </div>
      <p className="auth-toggle-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
