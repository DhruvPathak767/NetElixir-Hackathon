import { useState, useEffect } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Target, Wallet, Download } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { PageLoader } from '../components/Loader.jsx';
import { getForecast } from '../services/api.js';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { motion } from 'framer-motion';

const SCENARIOS = [
  { key: 'baseline', label: 'Baseline' },
  { key: 'optimistic', label: 'Optimistic' },
  { key: 'pessimistic', label: 'Pessimistic' },
];

export default function Forecast() {
  const [scenario, setScenario] = useState('baseline');
  const [horizon, setHorizon] = useState(6);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getForecast({ horizon, scenario }).then((d) => { setData(d); setLoading(false); });
  }, [horizon, scenario]);

  const chartData = data ? [...data.actual.map((a) => ({ ...a, actual: a.value })), ...data.forecast.map((f) => ({ ...f, forecast: f.value, lower: f.lower, upper: f.upper }))] : [];

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Forecast</h1>
          <p className="page-desc">AI-powered revenue & ROAS predictions</p>
        </div>
        <Button variant="secondary" leftIcon={<Download size={16} />}>Export forecast</Button>
      </StaggerItem>

      {/* Controls */}
      <StaggerItem>
        <Card reveal padding="lg" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div className="input-label" style={{ marginBottom: 8 }}>Scenario</div>
            <div style={{ display: 'flex', gap: 6, background: 'var(--bg-surface-2)', padding: 4, borderRadius: 'var(--r-md)' }}>
              {SCENARIOS.map((s) => (
                <button key={s.key} onClick={() => setScenario(s.key)} className={`btn btn-sm ${scenario === s.key ? 'btn-primary' : 'btn-ghost'}`} style={{ height: 34 }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="input-label" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Forecast horizon</span><span style={{ color: 'var(--brand-400)', fontWeight: 600 }}>{horizon} months</span>
            </div>
            <input type="range" min="3" max="12" value={horizon} onChange={(e) => setHorizon(+e.target.value)} className="range-slider" />
          </div>
        </div>
        </Card>
      </StaggerItem>

      {loading || !data ? <PageLoader label="Running forecast model…" /> : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {/* Metrics */}
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Projected Revenue</span><span className="kpi-icon"><TrendingUp size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.metrics.projectedRevenue / 1000} prefix="$" suffix="k" decimals={0} />
              </div>
              <div className="kpi-delta up"><TrendingUp size={14} /> {horizon}-month projection</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Projected ROAS</span><span className="kpi-icon"><Target size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.metrics.projectedROAS} suffix="x" decimals={2} />
              </div>
              <div className="kpi-delta up"><TrendingUp size={14} /> vs 4.32x current</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Projected Spend</span><span className="kpi-icon"><Wallet size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.metrics.projectedSpend / 1000} prefix="$" suffix="k" decimals={0} />
              </div>
              <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>Planned budget</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Model Confidence</span><span className="kpi-icon"><Target size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.confidence * 100} suffix="%" decimals={0} />
              </div>
              <div className="confidence-bar" style={{ marginTop: 6 }}>
                <motion.div 
                  className="confidence-fill" 
                  initial={{ width: 0 }}
                  animate={{ width: `${data.confidence * 100}%` }} 
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </Card>
          </div>

          {/* Chart */}
          <Card reveal padding="lg">
            <div className="card-title" style={{ marginBottom: 4 }}>Revenue Forecast</div>
            <div className="card-subtitle" style={{ marginBottom: 20 }}>Actuals + {horizon}-month projection with confidence band</div>
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => v != null ? `$${Math.round(v).toLocaleString()}` : '-'} />
                <Legend />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#fcGrad)" name="Upper bound" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="var(--bg-surface)" name="Lower bound" />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Actual" />
                <Line type="monotone" dataKey="forecast" stroke="#22d3ee" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} name="Forecast" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}
    </StaggerContainer>
  );
}
