import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from '../components/Card.jsx';
import { PageLoader } from '../components/Loader.jsx';
import { getChannelAnalytics } from '../services/api.js';
import { CHANNELS } from '../constants/index.js';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';

export default function ChannelAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('all');

  useEffect(() => {
    setLoading(true);
    getChannelAnalytics(selected).then((d) => { setData(d); setLoading(false); });
  }, [selected]);

  if (loading) return <PageLoader label="Loading channel data…" />;
  if (!data) return null;
  const channels = Array.isArray(data) ? data : [data];

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Channel Analytics</h1>
          <p className="page-desc">Deep-dive into each marketing channel's performance</p>
        </div>
      </StaggerItem>

      {/* Channel selector */}
      <StaggerItem style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button className={`btn btn-sm ${selected === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelected('all')}>All channels</button>
        {CHANNELS.map((c) => (
          <button key={c.key} className={`btn btn-sm ${selected === c.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelected(c.key)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
            {c.label}
          </button>
        ))}
      </StaggerItem>

      {/* Channel cards */}
      <StaggerItem style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {channels.map((ch) => (
          <Card key={ch.key} reveal padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: ch.color }} />
                <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>{ch.label}</h3>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <Metric label="Spend" value={`$${ch.spend.toLocaleString()}`} />
                <Metric label="Revenue" value={`$${ch.revenue.toLocaleString()}`} />
                <Metric label="ROAS" value={`${ch.roas.toFixed(2)}x`} accent />
                <Metric label="CPA" value={`$${ch.cpa.toFixed(2)}`} />
                <Metric label="CTR" value={`${ch.ctr.toFixed(2)}%`} />
                <Metric label="Conversions" value={ch.conversions.toLocaleString()} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ch.trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `$${Math.round(v).toLocaleString()}`} />
                <Line type="monotone" dataKey="value" stroke={ch.color} strokeWidth={2.5} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        ))}
      </StaggerItem>
    </StaggerContainer>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: accent ? 'var(--brand-400)' : 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
