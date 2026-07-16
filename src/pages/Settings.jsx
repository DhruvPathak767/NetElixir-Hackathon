import { useState, useEffect } from 'react';
import { User, Mail, Building2, Bell, Plug, Shield, Check, X } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../components/Toast.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { getSettings } from '../services/api.js';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';

export default function Settings() {
  const toast = useToast();
  const { mode, setMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({});

  useEffect(() => {
    getSettings().then((s) => { setData(s); setNotif(s.notifications); setLoading(false); });
  }, []);

  if (loading || !data) return null;

  const toggleNotif = (key) => setNotif((n) => ({ ...n, [key]: !n[key] }));

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-desc">Manage your profile, notifications, and integrations</p>
        </div>
      </StaggerItem>

      <StaggerItem style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>
        {/* Profile */}
        <Card reveal padding="lg">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} /> Profile</div>
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="input-group">
              <label className="input-label">Full name</label>
              <div className="input-wrap"><User size={16} /><input className="input" defaultValue={data.profile.name} /></div>
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-wrap"><Mail size={16} /><input className="input" defaultValue={data.profile.email} /></div>
            </div>
            <div className="input-group">
              <label className="input-label">Role</label>
              <div className="input-wrap"><Shield size={16} /><input className="input" defaultValue={data.profile.role} /></div>
            </div>
            <div className="input-group">
              <label className="input-label">Company</label>
              <div className="input-wrap"><Building2 size={16} /><input className="input" defaultValue={data.profile.company} /></div>
            </div>
          </div>
          <Button style={{ marginTop: 16 }} onClick={() => toast.success('Profile saved')}>Save changes</Button>
        </Card>

        {/* Appearance */}
        <Card reveal padding="lg">
          <div className="section-title">Appearance</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {['dark', 'light', 'system'].map((t) => (
              <button key={t} onClick={() => setMode(t)} className={`btn ${mode === t ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, textTransform: 'capitalize' }}>{t}</button>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card reveal padding="lg">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={18} /> Notifications</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {[
              { key: 'weeklyReport', label: 'Weekly performance report', desc: 'A summary of your KPIs every Monday' },
              { key: 'aiAlerts', label: 'AI alerts', desc: 'Real-time alerts when AI detects anomalies' },
              { key: 'budgetThreshold', label: 'Budget threshold warnings', desc: 'Notify when spend exceeds 90% of budget' },
              { key: 'productUpdates', label: 'Product updates', desc: 'New features and improvements' },
            ].map((item) => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 'var(--fs-sm)' }}>{item.label}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
                <label className="toggle"><input type="checkbox" checked={!!notif[item.key]} onChange={() => toggleNotif(item.key)} /><span className="toggle-slider" /></label>
              </div>
            ))}
          </div>
        </Card>

        {/* Integrations */}
        <Card reveal padding="lg">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plug size={18} /> Integrations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {data.integrations.map((int) => (
              <div key={int.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="insight-icon insight" style={{ width: 38, height: 38 }}><Plug size={18} /></span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{int.name}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: int.connected ? 'var(--success)' : 'var(--text-muted)' }}>{int.connected ? 'Connected' : 'Not connected'}</div>
                  </div>
                </div>
                {int.connected ? (
                  <span className="badge badge-success"><Check size={12} /> Active</span>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => toast.info(`Connecting ${int.name}…`)}>Connect</Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
