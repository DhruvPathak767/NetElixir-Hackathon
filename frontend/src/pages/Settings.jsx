/**
 * Settings.jsx — User Settings
 * Reads from real authenticated user object (AuthContext).
 * Profile section shows the actual logged-in user's name, email.
 * Password change calls real changePassword API.
 * Notifications + Appearance are preference toggles stored in localStorage per user.
 */
import { useState } from 'react';
import { User, Mail, Bell, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../components/Toast.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';

const NOTIF_KEY = (userId) => `fiq_notif_prefs_${userId}`;

function getStoredNotifs(userId) {
  try {
    const stored = localStorage.getItem(NOTIF_KEY(userId));
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    weeklyReport: true,
    aiAlerts: true,
    budgetThreshold: true,
    productUpdates: false,
  };
}

export default function Settings() {
  const toast = useToast();
  const { mode, setMode } = useTheme();
  const { user, changePassword, updateUser } = useAuth();

  const [notif, setNotif] = useState(getStoredNotifs(user?.id));
  const [pwdOpen, setPwdOpen] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Profile state (pre-populated from real user)
  const [displayName, setDisplayName] = useState(user?.full_name || user?.name || '');
  const [displayEmail] = useState(user?.email || '');

  const toggleNotif = (key) => {
    const updated = { ...notif, [key]: !notif[key] };
    setNotif(updated);
    if (user?.id) localStorage.setItem(NOTIF_KEY(user.id), JSON.stringify(updated));
    toast.success(`${key === 'weeklyReport' ? 'Weekly report' : key === 'aiAlerts' ? 'AI alerts' : key === 'budgetThreshold' ? 'Budget alerts' : 'Product updates'} ${!notif[key] ? 'enabled' : 'disabled'}`);
  };

  const handleSaveProfile = () => {
    // Update display name in local user state
    if (displayName && updateUser) {
      updateUser({ ...user, full_name: displayName, name: displayName });
    }
    toast.success('Profile saved successfully');
  };

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd || !confirmPwd) {
      toast.error('All password fields are required');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPwd.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setPwdLoading(true);
    try {
      await changePassword(oldPwd, newPwd, confirmPwd);
      toast.success('Password changed successfully');
      setPwdOpen(false);
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Password change failed';
      toast.error(msg);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-desc">Manage your profile, security, and notification preferences</p>
        </div>
      </StaggerItem>

      <StaggerItem style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>

        {/* Profile */}
        <Card reveal padding="lg">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} /> Profile
          </div>
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="input-group">
              <label className="input-label">Full name</label>
              <div className="input-wrap">
                <User size={16} />
                <input
                  className="input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  id="settings-name"
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  className="input"
                  value={displayEmail}
                  readOnly
                  style={{ opacity: 0.7 }}
                  id="settings-email"
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Account ID</label>
              <div className="input-wrap">
                <Shield size={16} />
                <input
                  className="input"
                  value={user?.id ? `#${user.id}` : '—'}
                  readOnly
                  style={{ opacity: 0.7 }}
                />
              </div>
            </div>
          </div>
          <Button style={{ marginTop: 16 }} onClick={handleSaveProfile}>Save changes</Button>
        </Card>

        {/* Appearance */}
        <Card reveal padding="lg">
          <div className="section-title">Appearance</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {['dark', 'light', 'system'].map((t) => (
              <button
                key={t}
                onClick={() => setMode(t)}
                className={`btn ${mode === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, textTransform: 'capitalize' }}
                id={`theme-${t}`}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card reveal padding="lg">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} /> Notifications
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {[
              { key: 'weeklyReport', label: 'Weekly performance report', desc: 'A summary of your KPIs every Monday' },
              { key: 'aiAlerts', label: 'AI alerts', desc: 'Real-time alerts when AI detects anomalies' },
              { key: 'budgetThreshold', label: 'Budget threshold warnings', desc: 'Notify when spend exceeds 90% of budget' },
              { key: 'productUpdates', label: 'Product updates', desc: 'New features and improvements' },
            ].map((item) => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <button
                  className={`toggle ${notif[item.key] ? 'active' : ''}`}
                  onClick={() => toggleNotif(item.key)}
                  aria-label={item.label}
                  id={`notif-${item.key}`}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Security / Password */}
        <Card reveal padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Lock size={18} /> Security
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPwdOpen(!pwdOpen)}
            >
              {pwdOpen ? 'Cancel' : 'Change Password'}
            </Button>
          </div>

          {pwdOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
              {/* Current password */}
              <div className="input-group">
                <label className="input-label">Current password</label>
                <div className="input-wrap">
                  <Lock size={16} />
                  <input
                    type={showOld ? 'text' : 'password'}
                    className="input"
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    placeholder="Current password"
                    id="settings-old-pwd"
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="icon-btn" style={{ width: 28, height: 28 }}>
                    {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {/* New password */}
              <div className="input-group">
                <label className="input-label">New password</label>
                <div className="input-wrap">
                  <Lock size={16} />
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="input"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    id="settings-new-pwd"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="icon-btn" style={{ width: 28, height: 28 }}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {/* Confirm password */}
              <div className="input-group">
                <label className="input-label">Confirm new password</label>
                <div className="input-wrap">
                  <Lock size={16} />
                  <input
                    type="password"
                    className="input"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Repeat new password"
                    id="settings-confirm-pwd"
                  />
                </div>
              </div>
              <Button loading={pwdLoading} onClick={handleChangePassword} style={{ alignSelf: 'flex-start' }}>
                Update Password
              </Button>
            </div>
          )}
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
