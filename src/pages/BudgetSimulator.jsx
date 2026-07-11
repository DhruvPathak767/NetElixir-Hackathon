import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { SlidersHorizontal, Sparkles, RotateCcw, TrendingUp, DollarSign, Target } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { PageLoader } from '../components/Loader.jsx';
import { useToast } from '../components/Toast.jsx';
import { runBudgetSimulation, defaultAllocation } from '../services/api.js';
import { CHANNELS } from '../constants/index.js';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function BudgetSimulator() {
  const toast = useToast();
  const [budget, setBudget] = useState(100000);
  const [allocation, setAllocation] = useState(() => defaultAllocation(100000));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalAlloc = allocation.reduce((s, a) => s + a.budget, 0);

  const runSim = async () => {
    setLoading(true);
    try {
      const res = await runBudgetSimulation({ totalBudget: totalAlloc, allocation });
      setResult(res);
      toast.success('Simulation complete');
    } catch {
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runSim(); }, []);

  const updateBudget = (val) => {
    const v = Math.max(10000, Math.min(500000, val));
    setBudget(v);
    setAllocation(defaultAllocation(v));
    setResult(null);
  };

  const setChannelBudget = (idx, val) => {
    setAllocation((prev) => prev.map((a, i) => i === idx ? { ...a, budget: Math.max(0, val) } : a));
    setResult(null);
  };

  const reset = () => { setBudget(100000); setAllocation(defaultAllocation(100000)); setResult(null); };

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Budget Simulator</h1>
          <p className="page-desc">Model different budget allocations and see projected outcomes</p>
        </div>
        <Button variant="secondary" leftIcon={<RotateCcw size={16} />} onClick={reset}>Reset</Button>
      </StaggerItem>

      <StaggerItem className="grid-dashboard">
        {/* Controls */}
        <Card reveal padding="lg">
          <div style={{ marginBottom: 24 }}>
            <div className="input-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Total Budget</span><span style={{ color: 'var(--brand-400)', fontWeight: 700, fontSize: 'var(--fs-base)' }}>${budget.toLocaleString()}</span>
            </div>
            <input type="range" min="10000" max="500000" step="5000" value={budget} onChange={(e) => updateBudget(+e.target.value)} className="range-slider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
              <span>$10k</span><span>$500k</span>
            </div>
          </div>

          <div className="section-title">Channel Allocation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {allocation.map((a, i) => (
              <div key={a.channel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: a.color }} />
                    {a.label}
                  </span>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    ${a.budget.toLocaleString()} · {((a.budget / totalAlloc) * 100).toFixed(0)}%
                  </span>
                </div>
                <input type="range" min="0" max={budget} step="500" value={a.budget} onChange={(e) => setChannelBudget(i, +e.target.value)} className="range-slider" style={{ accentColor: a.color }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 12, borderRadius: 'var(--r-md)', background: 'var(--bg-surface-2)', fontSize: 'var(--fs-sm)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Allocated</span>
            <span style={{ fontWeight: 700 }}>${totalAlloc.toLocaleString()} / ${budget.toLocaleString()}</span>
          </div>
          <Button fullWidth size="lg" style={{ marginTop: 16 }} loading={loading} onClick={runSim} leftIcon={<SlidersHorizontal size={18} />}>
            Run Simulation
          </Button>
        </Card>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence mode="wait">
            {loading && !result ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card padding="lg"><PageLoader label="Simulating…" /></Card>
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card reveal padding="lg" glow>
                <div className="card-subtitle" style={{ marginBottom: 4 }}>Projected Revenue</div>
                <div style={{ fontSize: 'var(--fs-3xl)', fontWeight: 700, color: 'var(--brand-400)' }}>
                  <AnimatedCounter value={result.totalRevenue} prefix="$" />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Blended ROAS</div>
                    <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
                      <AnimatedCounter value={result.totalROAS} decimals={2} suffix="x" />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Conversions</div>
                    <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
                      <AnimatedCounter value={result.projectedConversions} />
                    </div>
                  </div>
                </div>
              </Card>
              <Card reveal padding="lg">
                <div className="card-title" style={{ marginBottom: 16 }}>Channel-level ROAS</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={result.breakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${v}x`} />
                    <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={90} />
                    <Tooltip formatter={(v) => `${v}x`} />
                    <Bar dataKey="roas" radius={[0, 6, 6, 0]}>
                      {result.breakdown.map((b, i) => <Cell key={i} fill={b.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card reveal padding="lg">
                <div className="card-title" style={{ marginBottom: 12 }}>Revenue by Channel</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.breakdown.map((b) => (
                    <div key={b.channel}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', marginBottom: 4 }}>
                        <span>{b.label}</span><span style={{ fontWeight: 600 }}>${b.revenue.toLocaleString()}</span>
                      </div>
                      <div className="confidence-bar"><div className="confidence-fill" style={{ width: `${(b.revenue / result.totalRevenue) * 100}%`, background: b.color }} /></div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card padding="lg"><div className="empty-state"><div className="empty-state-icon"><Sparkles size={24} /></div><div className="empty-state-title">Run a simulation</div><div className="empty-state-desc">Adjust the sliders and click "Run Simulation" to see projected outcomes.</div></div></Card>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}
