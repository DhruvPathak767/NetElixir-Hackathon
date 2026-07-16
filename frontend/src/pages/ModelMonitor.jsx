import { useState, useEffect, useMemo } from 'react';
import { Activity, ShieldAlert, Cpu, Heart, AlertTriangle, Zap, CheckCircle2, Award, Settings, Check, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { PageLoader } from '../components/Loader.jsx';
import { getModelMonitorDiagnostics } from '../services/api.js';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useToast } from '../components/Toast.jsx';

// ── HEALTH BADGE COMPONENT ──
function HealthBadge({ status }) {
  const isHealthy = status?.toLowerCase() === 'healthy' || status?.toLowerCase() === 'active' || status?.toLowerCase() === 'excellent' || status?.toLowerCase() === 'stable';
  const isWarning = status?.toLowerCase() === 'warning' || status?.toLowerCase() === 'good' || status?.toLowerCase() === 'average';
  const color = isHealthy ? 'var(--success)' : (isWarning ? 'var(--warning)' : 'var(--error)');
  const bg = isHealthy ? 'rgba(16,185,129,0.1)' : (isWarning ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)');

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700,
      color, backgroundColor: bg, border: `1px solid ${color}30`, textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 8px ${color}` }} />
      {status}
    </span>
  );
}

// ── SKELETON LOADER FOR MONITOR ──
function SkeletonMonitor() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <Card key={i} padding="lg">
            <div style={{ height: 12, width: '40%', background: 'var(--border)', borderRadius: 4, marginBottom: 12, opacity: 0.3 }} />
            <div style={{ height: 28, width: '60%', background: 'var(--border)', borderRadius: 4, opacity: 0.3 }} />
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        <Card padding="lg" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PageLoader label="Retrieving ML diagnostics..." />
        </Card>
        <Card padding="lg" style={{ height: 300 }} />
      </div>
    </div>
  );
}

export default function ModelMonitor() {
  const toast = useToast();
  const [monitor, setMonitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDiagnostics = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await getModelMonitorDiagnostics();
      if (res && res.success) {
        setMonitor(res.data);
        if (silent) {
          toast.success('ML Model status updated!');
        }
      } else {
        setError(res?.message || 'Model diagnostics check failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve diagnostics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const chartImportanceData = useMemo(() => {
    if (!monitor?.feature_importance) return [];
    return monitor.feature_importance.map(f => ({
      name: f.feature.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").replace(/_/g, " "),
      Importance: f.importance_percentage
    }));
  }, [monitor]);

  const chartLatencyData = useMemo(() => {
    if (!monitor?.prediction_statistics) return [];
    const stats = monitor.prediction_statistics;
    return [
      { name: 'Fastest', Latency: stats.fastest_prediction_ms, fill: '#10b981' },
      { name: 'Average', Latency: stats.average_prediction_time_ms, fill: 'var(--brand-400)' },
      { name: 'Slowest', Latency: stats.slowest_prediction_ms, fill: '#ef4444' }
    ];
  }, [monitor]);

  if (loading) {
    return (
      <StaggerContainer>
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="page-title">Model Monitor</h1>
            <p className="page-desc">ML Telemetry details and drift validation analytics</p>
          </div>
        </div>
        <SkeletonMonitor />
      </StaggerContainer>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
          <ShieldAlert size={28} />
        </div>
        <div className="empty-state-title">Diagnostics failed</div>
        <div className="empty-state-desc">{error}</div>
        <Button variant="primary" onClick={() => loadDiagnostics()} style={{ marginTop: 12 }}>Retry Check</Button>
      </div>
    );
  }

  const { model_information, dataset_information, performance_metrics, model_health, prediction_statistics, model_checks, recommendation, model_runtime, uptime, data_drift, monitoring_score } = monitor;

  return (
    <StaggerContainer>
      <StaggerItem className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Model Monitor</h1>
          <p className="page-desc">Telemetry metrics, data drift alerts, and runtime diagnostic check scores</p>
        </div>
        <Button variant="secondary" onClick={() => loadDiagnostics(true)} loading={refreshing} leftIcon={<RefreshCw size={16} />}>
          Refresh Diagnostics
        </Button>
      </StaggerItem>

      {/* KPI Grid */}
      <StaggerItem className="kpi-grid" style={{ marginBottom: 20 }}>
        <Card reveal className="kpi" glow>
          <div className="kpi-top"><span className="kpi-label">Health Score</span><span className="kpi-icon"><Heart size={18} /></span></div>
          <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AnimatedCounter value={model_health.score} suffix="%" decimals={0} />
            <HealthBadge status={model_health.rating} />
          </div>
          <div className="kpi-delta up">Operational state passing</div>
        </Card>
        <Card reveal className="kpi" glow>
          <div className="kpi-top"><span className="kpi-label">Monitor Score</span><span className="kpi-icon"><Award size={18} /></span></div>
          <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AnimatedCounter value={monitoring_score.score} suffix="%" decimals={0} />
            <HealthBadge status={monitoring_score.rating} />
          </div>
          <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>Uptime calls: {uptime.total_predictions} runs</div>
        </Card>
        <Card reveal className="kpi" glow>
          <div className="kpi-top"><span className="kpi-label">Data Drift Status</span><span className="kpi-icon"><Activity size={18} /></span></div>
          <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AnimatedCounter value={data_drift.score} suffix="%" decimals={0} />
            <HealthBadge status={data_drift.status} />
          </div>
          <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>Trained {uptime.days_since_training} days ago</div>
        </Card>
        <Card reveal className="kpi" glow>
          <div className="kpi-top"><span className="kpi-label">Validation check</span><span className="kpi-icon"><CheckCircle2 size={18} /></span></div>
          <div className="kpi-value">
            {model_checks.model_loaded && model_checks.dataset_loaded ? 'Passed' : 'Failed'}
          </div>
          <div className="kpi-delta up">Scale assets loaded</div>
        </Card>
      </StaggerItem>

      {/* Main dashboard body */}
      <div className="grid-dashboard" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Recommendation Banner */}
          <StaggerItem>
            <Card reveal padding="lg">
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div className="insight-icon opportunity" style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', flexShrink: 0, display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <CheckCircle2 size={22} style={{ color: 'var(--brand-400)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>Operational Status: {recommendation.status}</div>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4, marginBottom: 0 }}>
                    {recommendation.message} The LightGBM inference is performing normally in local memory buffers.
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* Model Information Table */}
          <StaggerItem>
            <Card reveal padding="lg">
              <div className="card-title" style={{ marginBottom: 12 }}>Model Metadata</div>
              <table className="table">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Model Key Name</td>
                    <td><code>{model_information.model_name}</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Algorithm Name</td>
                    <td>{model_information.algorithm}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Active Version</td>
                    <td><span className="badge badge-info">{model_information.model_version}</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Feature Columns Count</td>
                    <td>{dataset_information.features_used} active variables</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Trained Date</td>
                    <td>{model_information.last_trained}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Model Size</td>
                    <td>{model_runtime.model_size_mb} MB (on disk)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Memory Usage</td>
                    <td>{model_runtime.memory_usage_mb} MB (RSS RSS)</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </StaggerItem>

          {/* Model Checks Status Checklist */}
          <StaggerItem>
            <Card reveal padding="lg">
              <div className="card-title" style={{ marginBottom: 12 }}>Model Assets checks</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {Object.entries(model_checks).map(([check, val]) => (
                  <div key={check} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-xs)' }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: val ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      display: 'flex', alignItems: 'center', justify: 'center'
                    }}>
                      <Check size={10} style={{ color: val ? 'var(--success)' : 'var(--error)' }} />
                    </div>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {check.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </StaggerItem>
        </div>

        {/* Feature Importance charts */}
        <StaggerItem style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card reveal padding="lg" style={{ flex: 1, minHeight: 320 }}>
            <div className="card-title" style={{ marginBottom: 4 }}>Dynamic Feature Importance</div>
            <div className="card-subtitle" style={{ marginBottom: 16 }}>Relevance percentage calculated from trees split metrics</div>
            <div style={{ height: 260, width: '100%' }}>
              {chartImportanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartImportanceData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                    <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} unit="%" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} formatter={(v) => `${v}%`} />
                    <Bar dataKey="Importance" fill="var(--brand-400)" radius={[0, 3, 3, 0]}>
                      {chartImportanceData.map((entry, index) => {
                        const colors = ['var(--brand-400)', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];
                        return <Cell key={index} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No feature importance calculations available.
                </div>
              )}
            </div>
          </Card>
        </StaggerItem>
      </div>

      {/* Latency statistics & charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Latency Comparison Bar Chart */}
        <StaggerItem>
          <Card reveal padding="lg" style={{ minHeight: 280 }}>
            <div className="card-title" style={{ marginBottom: 4 }}>Prediction Latency breakdown</div>
            <div className="card-subtitle" style={{ marginBottom: 16 }}>Execution speeds comparing min, average, and max runtimes</div>
            <div style={{ height: 180, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartLatencyData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} unit=" ms" />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} formatter={(v) => `${v} ms`} />
                  <Bar dataKey="Latency" radius={[3, 3, 0, 0]}>
                    {chartLatencyData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </StaggerItem>

        {/* Model validation performance statistics */}
        <StaggerItem>
          <Card reveal padding="lg" style={{ height: '100%' }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Model Validation Metrics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>Coefficient of Determination (R²)</span>
                <strong style={{ color: 'var(--brand-400)' }}>{performance_metrics.r2.toFixed(4)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>Mean Absolute Error (MAE)</span>
                <strong>${performance_metrics.mae.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>Root Mean Squared Error (RMSE)</span>
                <strong>${performance_metrics.rmse.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>Mean Absolute Percentage Error (MAPE)</span>
                <strong style={{ color: 'var(--warning)' }}>{performance_metrics.mape.toFixed(2)}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>Cross-Validation Mean R²</span>
                <strong>{monitor.cross_validation.mean_r2.toFixed(4)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>Uptime calls today</span>
                <strong>{uptime.predictions_today} runs</strong>
              </div>
            </div>
          </Card>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}
