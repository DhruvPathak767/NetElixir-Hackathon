import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../components/Toast.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { validateResetToken, resetPassword } from '../services/authApi.js';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setVerifying(false);
        return;
      }
      try {
        const response = await validateResetToken(token);
        if (response.success) {
          setTokenValid(true);
          setEmail(response.data?.email || '');
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

  const pwStrength = () => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };

  const strength = pwStrength();
  const strengthLabel = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['var(--error)', 'var(--error)', 'var(--warning)', 'var(--info)', 'var(--success)'][strength];

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      return toast.warning('Please fill in all fields');
    }
    if (password.length < 8) {
      return toast.warning('Password must be at least 8 characters long');
    }
    if (strength < 2) {
      return toast.warning('Choose a stronger password');
    }
    if (password !== confirmPassword) {
      return toast.warning('Passwords do not match');
    }

    setLoading(true);
    try {
      const response = await resetPassword(token, password, confirmPassword);
      if (response.success) {
        setSuccess(true);
        toast.success('Password updated successfully!');
      } else {
        toast.error(response.message || 'Failed to reset password.');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred during password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {verifying ? (
        <AuthLayout key="verifying" title="Verifying link" subtitle="Validating your secure security credentials">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
            <div className="btn-spinner" style={{ width: 32, height: 32, borderWidth: 3, borderColor: 'var(--brand-500) transparent transparent transparent' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Verifying reset token...</p>
          </div>
        </AuthLayout>
      ) : !tokenValid ? (
        <AuthLayout key="invalid" title="Reset link expired" subtitle="This security credentials link is invalid or expired">
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', margin: '0 auto 16px auto', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 48, height: 48, borderRadius: '50%' }}>
              <ShieldAlert size={24} />
            </div>
            <div className="empty-state-title" style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center' }}>Invalid Link</div>
            <div className="empty-state-desc" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center', lineHeight: 1.5 }}>
              The password reset token is either invalid, expired, or has already been used. Please request a new reset link.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <Link to="/forgot-password" style={{ display: 'block', width: '100%' }}>
                <Button variant="primary" fullWidth>Request new link</Button>
              </Link>
              <Link to="/login" style={{ display: 'block', width: '100%' }}>
                <Button variant="outline" fullWidth leftIcon={<ArrowLeft size={16} />}>Back to sign in</Button>
              </Link>
            </div>
          </div>
        </AuthLayout>
      ) : success ? (
        <AuthLayout key="success" title="Reset complete" subtitle="Your account password has been updated">
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', margin: '0 auto 16px auto', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 48, height: 48, borderRadius: '50%' }}>
              <CheckCircle size={24} />
            </div>
            <div className="empty-state-title" style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center' }}>Password Reset Successfully</div>
            <div className="empty-state-desc" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center', lineHeight: 1.5 }}>
              Your account password has been updated successfully. You can now log in using your new credentials.
            </div>
            <Link to="/login" style={{ display: 'block', width: '100%' }}>
              <Button variant="primary" fullWidth rightIcon={<ArrowRight size={16} />}>Go to sign in</Button>
            </Link>
          </div>
        </AuthLayout>
      ) : (
        <AuthLayout key="form" title="Choose new password" subtitle={`Choose a strong password for ${email}`}>
          <form onSubmit={onSubmit}>
            <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <StaggerItem className="input-group">
                <label className="input-label">New Password</label>
                <div className="input-wrap">
                  <Lock size={16} />
                  <input
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    style={{ position: 'absolute', right: 12, color: 'var(--text-muted)' }}
                    aria-label="Toggle password"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}
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

              <StaggerItem className="input-group">
                <label className="input-label">Confirm Password</label>
                <div className="input-wrap">
                  <Lock size={16} />
                  <input
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </StaggerItem>

              <StaggerItem style={{ marginTop: 8 }}>
                <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={<ArrowRight size={18} />}>
                  Reset password
                </Button>
              </StaggerItem>
            </StaggerContainer>
          </form>
        </AuthLayout>
      )}
    </AnimatePresence>
  );
}
