import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import * as Icons from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { PageLoader } from '../components/Loader.jsx';
import { useToast } from '../components/Toast.jsx';
import { getDashboardSummary } from '../services/api.js';
import { KPI_META } from '../constants/index.js';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary().then((d) => { setData(d); setLoading(false); }).catch(() => { toast.error('Failed to load dashboard'); setLoading(false); });
  }, []);

  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (!data) return null;

  const kpiEntries = Object.entries(data.kpis);

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Welcome back, Alex 👋</h1>
          <p className="page-desc">Your marketing performance at a glance</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" leftIcon={<Icons.Download size={16} />}>Export</Button>
          <Button to="/app/upload" leftIcon={<Icons.UploadCloud size={16} />}>Upload Data</Button>
        </div>
      </StaggerItem>

      {/* KPIs */}
      <StaggerItem className="kpi-grid" style={{ marginBottom: 20 }}>
        {kpiEntries.map(([key, kpi]) => {
          const meta = KPI_META[key] || { label: key, format: (v) => v, icon: 'Circle' };
          const Icon = Icons[meta.icon] || Icons.Circle;
          const up = kpi.delta >= 0;
          return (
            <Card key={key} hover reveal className="kpi">
              <div className="kpi-top">
                <span className="kpi-label">{meta.label}</span>
                <span className="kpi-icon"><Icon size={18} /></span>
              </div>
              <div className="kpi-value">
                {typeof kpi.value === 'number' ? (
                  <AnimatedCounter 
                    value={kpi.value} 
                    prefix={meta.format(0).startsWith('$') ? '$' : ''} 
                    suffix={meta.format(0).endsWith('%') ? '%' : ''} 
                    decimals={meta.format(1.1).includes('.') ? 1 : 0} 
                  />
                ) : (
                  meta.format(kpi.value)
                )}
              </div>
              <div className="kpi-delta" style={{ color: up ? 'var(--success)' : 'var(--error)' }}>
                {up ? <Icons.TrendingUp size={14} /> : <Icons.TrendingDown size={14} />}
                {up ? '+' : ''}
                <AnimatedCounter value={Math.abs(kpi.delta)} decimals={1} suffix="% vs last period" />
              </div>
            </Card>
          );
        })}
      </StaggerItem>

      {/* Charts row */}
      <StaggerItem className="grid-dashboard" style={{ marginBottom: 20 }}>
        <Card reveal padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div className="card-title">Spend vs Revenue</div>
              <div className="card-subtitle">Last 12 months</div>
            </div>
            <span className="badge badge-info">Monthly</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.spendVsRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              <Area type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} fill="url(#spendGrad)" name="Spend" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card reveal padding="lg">
          <div className="card-title">Channel Split</div>
          <div className="card-subtitle" style={{ marginBottom: 16 }}>Spend distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.channelSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} strokeWidth={0}>
                {data.channelSplit.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </StaggerItem>

      {/* Recent uploads + AI alerts */}
      <StaggerItem className="grid-dashboard">
        <Card reveal padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title">Recent Uploads</div>
            <Link to="/app/upload" className="footer-link" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>View all</Link>
          </div>
          <table className="table">
            <thead><tr><th>File</th><th>Date</th><th>Rows</th><th>Status</th></tr></thead>
            <tbody>
              {data.recentUploads.map((u) => (
                <tr key={u.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icons.FileText size={15} style={{ color: 'var(--text-muted)' }} />
                    {u.name}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.date}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.rows.toLocaleString()}</td>
                  <td><span className={`badge ${u.status === 'processed' ? 'badge-success' : 'badge-warning'}`}>{u.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 16 }}>AI Alerts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.aiAlerts.map((a) => {
              const Icon = a.type === 'opportunity' ? Icons.Sparkles : a.type === 'warning' ? Icons.AlertTriangle : Icons.Lightbulb;
              const color = a.type === 'opportunity' ? 'var(--success)' : a.type === 'warning' ? 'var(--warning)' : 'var(--info)';
              return (
                <div key={a.id} className="insight-card" style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                  <span className="insight-icon" style={{ background: `${color}22`, color, width: 36, height: 36 }}><Icon size={18} /></span>
                  <div className="insight-body">
                    <div className="insight-title">{a.title}</div>
                    <div className="insight-desc">{a.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/app/ai-insights" style={{ display: 'block', marginTop: 16 }}>
            <Button variant="outline" fullWidth rightIcon={<Icons.ArrowRight size={16} />}>View all insights</Button>
          </Link>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
