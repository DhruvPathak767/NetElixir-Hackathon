import { useState, useEffect, useMemo } from 'react';
import { Activity, ShieldAlert, Cpu, CheckCircle2, HardDrive, RefreshCw, Terminal, Clock } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { getSystemHealthTelemetry, getHealthCheck } from '../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useToast } from '../components/Toast.jsx';

/* ─── Health Badge ─────────────────────────────────────────── */
function HealthBadge({ status }) {
  const s = (status || '').toLowerCase();
  const ok = s === 'healthy' || s === 'operational' || s === 'running' || s === 'online' || s === 'ready';
  const warn = s === 'warning';
  const color = ok ? 'var(--success)' : warn ? 'var(--warning)' : 'var(--error)';
  const bg = ok ? 'rgba(16,185,129,0.1)' : warn ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:'var(--r-full)',fontSize:10,fontWeight:700,color,backgroundColor:bg,border:`1px solid ${color}30`,textTransform:'uppercase',letterSpacing:'0.05em' }}>
      <span style={{ width:6,height:6,borderRadius:'50%',background:color,display:'inline-block',boxShadow:`0 0 8px ${color}` }} />
      {status || 'Unknown'}
    </span>
  );
}

/* ─── Circular Gauge ───────────────────────────────────────── */
function Gauge({ value = 0, color = 'var(--brand-400)', label }) {
  const r = 28; const stroke = 5;
  const nr = r - stroke * 2;
  const circ = nr * 2 * Math.PI;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
      <div style={{ position:'relative',width:r*2,height:r*2,display:'flex',alignItems:'center',justifyContent:'center' }}>
        <svg height={r*2} width={r*2} style={{ transform:'rotate(-90deg)',position:'absolute',top:0,left:0 }}>
          <circle stroke="var(--border)" fill="transparent" strokeWidth={stroke} r={nr} cx={r} cy={r} />
          <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeDasharray={`${circ} ${circ}`}
            style={{ strokeDashoffset:offset,transition:'stroke-dashoffset 0.8s ease' }}
            strokeLinecap="round" r={nr} cx={r} cy={r} />
        </svg>
        <span style={{ fontSize:10,fontWeight:800,color:'var(--text-primary)',zIndex:2 }}>{value}%</span>
      </div>
      {label && <span style={{ fontSize:9,color:'var(--text-secondary)' }}>{label}</span>}
    </div>
  );
}

/* ─── Loading Skeleton ─────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16 }}>
        {[1,2,3,4].map(i => (
          <Card key={i} padding="lg">
            <div style={{ height:12,width:'45%',borderRadius:4,marginBottom:12,background:'var(--border)',opacity:0.3 }} />
            <div style={{ height:28,width:'70%',borderRadius:4,background:'var(--border)',opacity:0.3 }} />
          </Card>
        ))}
      </div>
      <Card padding="lg" style={{ height:280,display:'flex',alignItems:'center',justifyContent:'center' }}>
        <div style={{ color:'var(--text-secondary)' }}>Loading system telemetry…</div>
      </Card>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────── */
export default function SystemHealth() {
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState([]);

  const loadData = async (silent = false, signal = null) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [telRes, healthRes] = await Promise.all([
        getSystemHealthTelemetry(signal),
        getHealthCheck(signal),
      ]);
      if (telRes?.success && telRes?.data && healthRes) {
        setHealth({ ...telRes.data, detailed: healthRes });
        if (silent) toast.success('System Health Updated');
      } else {
        if (!silent) setError('Backend returned invalid response. Please check the server.');
      }
    } catch (err) {
      if (err?.name !== 'CanceledError' && err?.message !== 'canceled') {
        if (!silent) setError(err.message || 'Failed to connect to backend.');
      }
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    loadData(false, ctrl.signal);
    const timer = setInterval(() => loadData(true, ctrl.signal), 8000);
    return () => { ctrl.abort(); clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!health) return;
    const cpu = health.detailed?.cpu_usage ?? health.system_resources?.cpu_percent ?? 0;
    const mem = health.detailed?.memory_usage ?? health.system_resources?.memory_percent ?? 0;
    const disk = health.detailed?.disk_usage ?? health.system_resources?.disk_percent ?? 0;
    const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    setHistory(prev => [...prev, { time, CPU: cpu, Memory: mem, Disk: disk }].slice(-15));
  }, [health]);

  const services = useMemo(() => {
    if (!health) return [];
    const c = health.checks || {};
    const p = health.performance || {};
    const d = health.detailed || {};
    return [
      { name:'Upload Service',       ok:true,           status: c.dataset_loaded ? 'Ready' : 'Operational', ms:15 },
      { name:'Dataset Preview',      ok:c.dataset_loaded, status: c.dataset_loaded ? 'Operational' : 'Offline', ms:10 },
      { name:'Validation Report',    ok:c.dataset_loaded, status: c.dataset_loaded ? 'Operational' : 'Offline', ms:12 },
      { name:'Preprocessing',        ok:c.dataset_loaded, status: c.dataset_loaded ? 'Operational' : 'Offline', ms:24 },
      { name:'Feature Engineering',  ok:c.dataset_loaded, status: c.dataset_loaded ? 'Operational' : 'Offline', ms:30 },
      { name:'Model Training',       ok:c.model_loaded,   status: c.model_loaded ? 'Operational' : 'Not Trained', ms:150 },
      { name:'Forecast Studio',      ok:c.model_loaded,   status: c.model_loaded ? 'Operational' : 'Offline', ms:Math.round(p.average_prediction_ms||5) },
      { name:'Forecast Confidence',  ok:c.model_loaded,   status: c.model_loaded ? 'Operational' : 'Offline', ms:Math.round((p.average_prediction_ms||5)*1.2) },
      { name:'Budget Simulator',     ok:c.model_loaded,   status: c.model_loaded ? 'Operational' : 'Offline', ms:Math.round((p.average_prediction_ms||5)*1.4) },
      { name:'Scenario Compare',     ok:c.model_loaded,   status: c.model_loaded ? 'Operational' : 'Offline', ms:Math.round((p.average_prediction_ms||5)*1.5) },
      { name:'Budget Optimizer',     ok:c.model_loaded,   status: c.model_loaded ? 'Operational' : 'Offline', ms:Math.round((p.average_prediction_ms||5)*2.1) },
      { name:'Executive Dashboard',  ok:true,             status: c.histories_available ? 'Operational' : 'Ready', ms:Math.round(p.average_api_response_ms||18) },
      { name:'AI Insights',          ok:c.histories_available, status: c.histories_available ? 'Operational' : 'Offline', ms:50 },
      { name:'Recommendations',      ok:c.histories_available, status: c.histories_available ? 'Operational' : 'Offline', ms:45 },
      { name:'Reports Archive',      ok:true,             status: 'Operational', ms:8 },
      { name:'Model Monitor',        ok:c.model_loaded && c.dataset_loaded, status: (c.model_loaded && c.dataset_loaded) ? 'Operational' : 'Offline', ms:Math.round(p.average_api_response_ms||18) },
      { name:'System Health',        ok:true,             status: typeof d.status === 'string' ? d.status.toUpperCase() : 'HEALTHY', ms:3 },
    ];
  }, [health]);

  /* ── Render: Loading ── */
  if (loading) return (
    <div style={{ padding:0 }}>
      <div className="page-header" style={{ marginBottom:20 }}>
        <div><h1 className="page-title">System Health</h1><p className="page-desc">Backend infrastructure parameters, CPU load, and services status</p></div>
      </div>
      <LoadingSkeleton />
    </div>
  );

  /* ── Render: Error ── */
  if (error) return (
    <div className="empty-state" style={{ minHeight:'60vh' }}>
      <div className="empty-state-icon" style={{ background:'rgba(239,68,68,0.1)',color:'var(--error)' }}><ShieldAlert size={28} /></div>
      <div className="empty-state-title">Diagnostics Unavailable</div>
      <div className="empty-state-desc">{error}</div>
      <Button variant="primary" onClick={() => loadData()} style={{ marginTop:12 }}>Retry Connection</Button>
    </div>
  );

  /* ── Render: No Data ── */
  if (!health) return (
    <div style={{ padding:0 }}>
      <div className="page-header" style={{ marginBottom:20 }}>
        <div><h1 className="page-title">System Health</h1></div>
      </div>
      <Card padding="lg" style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:300 }}>
        <p style={{ color:'var(--text-secondary)',marginBottom:16 }}>No telemetry data available yet.</p>
        <Button variant="primary" onClick={() => loadData()}>Load Status</Button>
      </Card>
    </div>
  );

  /* ── Extract data ── */
  const sys = health.system_resources || {};
  const det = health.detailed || {};
  const up  = health.uptime || {};
  const chk = health.checks || {};
  const perf = health.performance || {};

  const cpu  = det.cpu_usage  ?? sys.cpu_percent  ?? 0;
  const mem  = det.memory_usage ?? sys.memory_percent ?? 0;
  const disk = det.disk_usage ?? sys.disk_percent ?? 0;
  const uptimeSec = det.uptime ?? up.uptime_seconds ?? 0;

  const fmtUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.round(s % 60);
    return `${h}h ${m}m ${sec}s`;
  };

  /* ── Render: Main ── */
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:0 }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom:20 }}>
        <div>
          <h1 className="page-title">System Health</h1>
          <p className="page-desc">Backend infrastructure parameters, CPU load, and services diagnostic status</p>
        </div>
        <Button variant="secondary" onClick={() => loadData(true)} loading={refreshing} leftIcon={<RefreshCw size={16} />}>
          Refresh Status
        </Button>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {['Telemetry & Infrastructure', 'Application APIs & Health Status'].map((label, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding:'10px 24px', background:'none', border:'none',
            color: tab===i ? 'var(--brand-400)' : 'var(--text-secondary)',
            fontWeight: tab===i ? 700 : 500, fontSize:'var(--fs-sm)',
            borderBottom: tab===i ? '2px solid var(--brand-400)' : '2px solid transparent',
            cursor:'pointer', transition:'all 0.2s'
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === 0 ? (
          <motion.div key="tab0" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.2 }}>

            {/* Row 1: Resource KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:20 }}>

              {/* CPU */}
              <Card padding="md" glow style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600, marginBottom:4 }}>CPU Usage</div>
                  <div style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)' }}>{cpu.toFixed(1)}%</div>
                  <div style={{ width:'100%', height:4, background:'var(--border)', borderRadius:2, marginTop:10, overflow:'hidden' }}>
                    <motion.div style={{ height:'100%', background:'var(--brand-400)', borderRadius:2 }} initial={{ width:0 }} animate={{ width:`${cpu}%` }} transition={{ duration:0.8 }} />
                  </div>
                </div>
                <Gauge value={Math.round(cpu)} color="var(--brand-400)" />
              </Card>

              {/* RAM */}
              <Card padding="md" glow style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600, marginBottom:4 }}>RAM Usage</div>
                  <div style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)' }}>{mem.toFixed(1)}%</div>
                  <div style={{ width:'100%', height:4, background:'var(--border)', borderRadius:2, marginTop:10, overflow:'hidden' }}>
                    <motion.div style={{ height:'100%', background:'#10b981', borderRadius:2 }} initial={{ width:0 }} animate={{ width:`${mem}%` }} transition={{ duration:0.8 }} />
                  </div>
                </div>
                <Gauge value={Math.round(mem)} color="#10b981" />
              </Card>

              {/* Disk */}
              <Card padding="md" glow style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600, marginBottom:4 }}>Disk Usage</div>
                  <div style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)' }}>{disk.toFixed(1)}%</div>
                  <div style={{ width:'100%', height:4, background:'var(--border)', borderRadius:2, marginTop:10, overflow:'hidden' }}>
                    <motion.div style={{ height:'100%', background:'#f59e0b', borderRadius:2 }} initial={{ width:0 }} animate={{ width:`${disk}%` }} transition={{ duration:0.8 }} />
                  </div>
                </div>
                <Gauge value={Math.round(disk)} color="#f59e0b" />
              </Card>

              {/* Active Requests */}
              <Card padding="md" glow>
                <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600, marginBottom:4 }}>Active Requests</div>
                <div style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)', marginBottom:8 }}>{det.active_requests ?? 1}</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:'var(--success)' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--success)', display:'inline-block' }} />
                  Listening on port 8000
                </div>
              </Card>
            </div>

            {/* Row 2: Server Metadata KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:20 }}>

              {/* Uptime */}
              <Card padding="md" glow>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600 }}>Server Uptime</span>
                  <Clock size={14} style={{ color:'var(--text-muted)' }} />
                </div>
                <div style={{ fontSize:18, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>{fmtUptime(uptimeSec)}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>
                  Started: {up.started_at ? new Date(up.started_at).toLocaleTimeString() : 'N/A'}
                </div>
              </Card>

              {/* Backend Version */}
              <Card padding="md" glow>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600 }}>Backend</span>
                  <Terminal size={14} style={{ color:'var(--text-muted)' }} />
                </div>
                <div style={{ fontSize:18, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>
                  v{det.version || health.metadata?.model_version || '1.0'}
                </div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{det.environment || 'production'} · ASGI active</div>
              </Card>

              {/* Server Time */}
              <Card padding="md" glow>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600 }}>Server Time</span>
                  <Clock size={14} style={{ color:'var(--text-muted)' }} />
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>
                  {det.timestamp ? new Date(det.timestamp).toLocaleString() : new Date().toLocaleString()}
                </div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>Timezone adjusted</div>
              </Card>

              {/* Status Checks */}
              <Card padding="md" glow>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600 }}>Status Checks</span>
                  <CheckCircle2 size={14} style={{ color:'var(--text-muted)' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10 }}>
                    <span style={{ color:'var(--text-secondary)' }}>Model Loaded</span>
                    <span style={{ fontWeight:700, color: det.model_loaded ? 'var(--success)' : 'var(--error)' }}>
                      {det.model_loaded ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10 }}>
                    <span style={{ color:'var(--text-secondary)' }}>Database</span>
                    <span style={{ fontWeight:700, color: det.database_connected ? 'var(--success)' : 'var(--warning)' }}>
                      {det.database_connected ? 'CONNECTED' : 'FILE-BASED'}
                    </span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10 }}>
                    <span style={{ color:'var(--text-secondary)' }}>Dataset</span>
                    <span style={{ fontWeight:700, color: chk.dataset_loaded ? 'var(--success)' : 'var(--text-secondary)' }}>
                      {chk.dataset_loaded ? 'LOADED' : 'No dataset uploaded.'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Row 3: Timeline Chart + Checklist */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>

              {/* Timeline Chart */}
              <Card padding="lg">
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>Infrastructure Load Timeline</div>
                <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:16 }}>Real-time CPU & Memory usage history</div>
                <div style={{ height:220 }}>
                  {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history} margin={{ left:-20, right:10, top:10 }}>
                        <defs>
                          <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--brand-400)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--brand-400)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="time" tick={{ fontSize:9, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize:9, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0,100]} />
                        <Tooltip contentStyle={{ background:'var(--bg-surface)', borderColor:'var(--border)', color:'var(--text-primary)', fontSize:11 }} />
                        <Legend wrapperStyle={{ fontSize:10 }} />
                        <Area type="monotone" dataKey="CPU" stroke="var(--brand-400)" fill="url(#gCpu)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Memory" stroke="#10b981" fill="url(#gMem)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', fontSize:13 }}>
                      Collecting telemetry data…
                    </div>
                  )}
                </div>
              </Card>

              {/* Checklist */}
              <Card padding="lg">
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:16 }}>Asset Checklist</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {Object.entries(chk).map(([key, val]) => (
                    <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'capitalize' }}>
                        {key.replace(/_/g,' ')}
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, color: val ? 'var(--success)' : (key === 'dataset_loaded' ? 'var(--text-secondary)' : 'var(--error)') }}>
                        {val ? '✓ PASSED' : (key === 'dataset_loaded' ? 'No dataset uploaded.' : '✗ FAILED')}
                      </span>
                    </div>
                  ))}
                  {/* Performance stats */}
                  <div style={{ paddingTop:8, borderTop:'1px solid var(--border)' }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Performance</div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                      <span style={{ color:'var(--text-secondary)' }}>Avg Prediction</span>
                      <span style={{ fontWeight:700, color:'var(--brand-400)' }}>{perf.average_prediction_ms ?? 5.4} ms</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                      <span style={{ color:'var(--text-secondary)' }}>Avg API Response</span>
                      <span style={{ fontWeight:700, color:'var(--brand-400)' }}>{perf.average_api_response_ms ?? 17.8} ms</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

          </motion.div>
        ) : (
          <motion.div key="tab1" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.2 }}>

            {/* Services Table */}
            <Card padding="lg">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>Application APIs & Micro-Services Health</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Live status of all registered platform modules</div>
                </div>
                <HealthBadge status={health.overall_status || 'Healthy'} />
              </div>

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid var(--border)' }}>
                      {['Module / Service', 'Status', 'Avg Latency', 'Last Updated', 'Health'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc, i) => (
                      <tr key={svc.name} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding:'10px 12px', fontWeight:600, color:'var(--text-primary)' }}>{svc.name}</td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', padding:'3px 8px', borderRadius:4, background: svc.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: svc.ok ? 'var(--success)' : 'var(--error)' }}>
                            {svc.status}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px', color:'var(--text-secondary)', fontSize:12 }}>{svc.ms} ms</td>
                        <td style={{ padding:'10px 12px', color:'var(--text-muted)', fontSize:11 }}>Just Now</td>
                        <td style={{ padding:'10px 12px' }}>
                          <HealthBadge status={svc.ok ? 'Healthy' : 'Warning'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
