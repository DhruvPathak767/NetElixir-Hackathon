import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../components/Toast.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';

export default function Login() {
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('alex@forecastiq.io');
  const [password, setPassword] = useState('demo1234');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return toast.warning('Please fill in all fields');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Welcome back to ForecastIQ!');
      navigate('/app/dashboard');
    }, 900);
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your ForecastIQ account">
      <form onSubmit={onSubmit}>
        <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StaggerItem className="input-group">
          <label className="input-label">Email</label>
          <div className="input-wrap">
            <Mail size={16} />
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
        </StaggerItem>
        <StaggerItem className="input-group">
          <label className="input-label">Password</label>
          <div className="input-wrap">
            <Lock size={16} />
            <input className="input" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPw((s) => !s)} style={{ position: 'absolute', right: 12, color: 'var(--text-muted)' }} aria-label="Toggle password">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </StaggerItem>
        <StaggerItem style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand-500)' }} /> Remember me
          </label>
          <Link to="/forgot-password" style={{ color: 'var(--brand-400)', fontWeight: 500 }}>Forgot password?</Link>
        </StaggerItem>
        <StaggerItem>
          <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={<ArrowRight size={18} />}>
            Sign in
          </Button>
        </StaggerItem>
        </StaggerContainer>
      </form>
      <div className="auth-divider">or continue with</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" fullWidth leftIcon={<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#fff" d="M21.35 11.1H12v3.8h5.35c-.25 1.4-1.7 4.1-5.35 4.1A6.5 6.5 0 0 1 5.5 12 6.5 6.5 0 0 1 12 5.5c1.95 0 3.25.83 4 1.55l2.55-2.45C16.9 3.35 14.7 2.5 12 2.5A9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.4 0 9-3.8 9-9.15 0-.6-.05-1.05-.15-1.25z"/></svg>}>Google</Button>
        <Button variant="secondary" fullWidth leftIcon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3C19 3 21 5 21 7.5c0 1.5-.7 2.8-1.7 3.7l-1 1c-.4.4-.6 1-.6 1.6v.2c0 1-.8 1.8-1.8 1.8h-3.4c-1 0-1.8-.8-1.8-1.8v-.2c0-.6-.2-1.2-.6-1.6l-1-1C7.7 10.3 7 9 7 7.5 7 5 9 3 11.5 3c.8 0 1.5.2 2.1.5.6-.3 1.3-.5 2.1-.5h.8z"/></svg>}>SSO</Button>
      </div>
      <p className="auth-toggle-link">
        Don't have an account? <Link to="/signup">Sign up free</Link>
      </p>
    </AuthLayout>
  );
}
