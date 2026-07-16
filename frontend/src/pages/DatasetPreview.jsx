import { useState, useEffect, useCallback } from 'react';
import { Database, FileSpreadsheet, Eye, Activity, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { PageLoader } from '../components/Loader.jsx';
import { getDatasetPreview } from '../services/api.js';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { motion } from 'framer-motion';

export default function DatasetPreview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewTab, setPreviewTab] = useState('first'); // 'first' or 'last'

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getDatasetPreview();
      setData(d);
    } catch (err) {
      if (err.response?.status === 404) {
        setData(null);
      } else {
        setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to load dataset preview');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  if (loading) {
    return <PageLoader label="Analyzing dataset structures..." />;
  }

  if (error) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
          <ShieldAlert size={28} />
        </div>
        <div className="empty-state-title">Calculation failed</div>
        <div className="empty-state-desc">{error}</div>
        <Button variant="primary" onClick={loadPreview} style={{ marginTop: 12 }}>Retry</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon"><Database size={28} /></div>
        <div className="empty-state-title">No dataset uploaded yet</div>
        <div className="empty-state-desc">Please upload a CSV dataset to view structural insights and preview your data.</div>
        <Link to="/app/upload">
          <Button variant="primary" style={{ marginTop: 12 }}>Upload Dataset</Button>
        </Link>
      </div>
    );
  }

  const { dataset_overview: overview, columns, quality, health, preview } = data;
  const previewRows = previewTab === 'first' ? preview.first_10_rows : preview.last_10_rows;

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Dataset Preview</h1>
          <p className="page-desc">Structural analysis, columns overview, and preview of the uploaded data</p>
        </div>
      </StaggerItem>

      {/* KPI stats */}
      <StaggerItem className="kpi-grid" style={{ marginBottom: 20 }}>
        <Card reveal className="kpi">
          <div className="kpi-top"><span className="kpi-label">Dataset File</span><span className="kpi-icon"><FileSpreadsheet size={18} /></span></div>
          <div className="kpi-value" style={{ fontSize: 'var(--fs-xl)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {overview.filename}
          </div>
          <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>Size: {overview.memory_usage}</div>
        </Card>
        <Card reveal className="kpi">
          <div className="kpi-top"><span className="kpi-label">Total Rows</span><span className="kpi-icon"><Database size={18} /></span></div>
          <div className="kpi-value">
            <AnimatedCounter value={overview.total_rows} decimals={0} />
          </div>
          <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>{overview.total_columns} columns total</div>
        </Card>
        <Card reveal className="kpi">
          <div className="kpi-top"><span className="kpi-label">Data Health</span><span className="kpi-icon"><Activity size={18} /></span></div>
          <div className="kpi-value">
            <AnimatedCounter value={health.health_score} suffix="%" decimals={0} />
          </div>
          <div className={`kpi-delta ${health.status === 'Excellent' || health.status === 'Good' ? 'up' : 'down'}`} style={{ textTransform: 'capitalize' }}>
            {health.status} Quality
          </div>
        </Card>
        <Card reveal className="kpi">
          <div className="kpi-top"><span className="kpi-label">Missing Values</span><span className="kpi-icon"><ShieldAlert size={18} /></span></div>
          <div className="kpi-value" style={{ color: quality.total_missing_values > 0 ? 'var(--warning)' : 'inherit' }}>
            <AnimatedCounter value={quality.total_missing_values} decimals={0} />
          </div>
          <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>
            {(quality.duplicate_percentage * 100).toFixed(2)}% duplicates
          </div>
        </Card>
      </StaggerItem>

      <div className="grid-dashboard" style={{ marginBottom: 20 }}>
        {/* Schema Definition */}
        <StaggerItem>
          <Card reveal padding="lg" style={{ height: '100%' }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Dataset Schema</div>
            <div className="card-subtitle" style={{ marginBottom: 16 }}>Detected fields, pandas types, and categorization</div>
            <div style={{ maxHeight: 350, overflowY: 'auto', paddingRight: 4 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Data Type</th>
                    <th>Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.column_names.map((col) => {
                    const isNumeric = columns.numeric_columns.includes(col);
                    return (
                      <tr key={col}>
                        <td style={{ fontWeight: 600 }}>{col}</td>
                        <td><code>{columns.data_types[col]}</code></td>
                        <td>
                          <span className={`badge ${isNumeric ? 'badge-info' : 'badge-muted'}`}>
                            {isNumeric ? 'Numeric' : 'Categorical'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </StaggerItem>

        {/* Quality Metrics */}
        <StaggerItem>
          <Card reveal padding="lg" style={{ height: '100%' }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Data Quality Check</div>
            <div className="card-subtitle" style={{ marginBottom: 16 }}>Null rates and duplication status</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>Health Quality Ratio</span>
                  <span style={{ color: 'var(--brand-400)', fontWeight: 600 }}>{health.health_score}%</span>
                </div>
                <div className="confidence-bar">
                  <motion.div
                    className="confidence-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${health.health_score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                  <span>Quality Signals</span>
                </div>
                <ul style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>· Duplicate rows: <strong>{quality.duplicate_rows}</strong> rows ({ (quality.duplicate_percentage * 100).toFixed(2) }%)</li>
                  <li>· Empty columns: <strong>{quality.empty_columns.length || 'None'}</strong></li>
                  <li>· Missing value rate: <strong>{quality.total_missing_values}</strong> entries</li>
                </ul>
              </div>

              <div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Missing values per column</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.keys(quality.missing_values_per_column).length === 0 ? (
                    <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--success)' }}>✓ No missing values detected in any column!</div>
                  ) : (
                    Object.entries(quality.missing_values_per_column).map(([col, val]) => (
                      <div key={col} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '4px 0', borderBottom: '1px solid var(--border-strong)' }}>
                        <span style={{ fontFamily: 'monospace' }}>{col}</span>
                        <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{val} missing</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </StaggerItem>
      </div>

      {/* Row preview table */}
      <StaggerItem>
        <Card reveal padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="card-title">Dataset Row Explorer</div>
              <div className="card-subtitle">Examine preview rows before training models</div>
            </div>
            
            <div style={{ display: 'flex', gap: 6, background: 'var(--bg-surface-2)', padding: 4, borderRadius: 'var(--r-md)' }}>
              <button onClick={() => setPreviewTab('first')} className={`btn btn-sm ${previewTab === 'first' ? 'btn-primary' : 'btn-ghost'}`} style={{ height: 32 }}>
                First 10 Rows
              </button>
              <button onClick={() => setPreviewTab('last')} className={`btn btn-sm ${previewTab === 'last' ? 'btn-primary' : 'btn-ghost'}`} style={{ height: 32 }}>
                Last 10 Rows
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  {columns.column_names.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={idx}>
                    {columns.column_names.map((col) => (
                      <td key={col}>
                        {typeof row[col] === 'number' && col !== 'IsWeekend' && col !== 'Month' && col !== 'DayOfWeek' ? (
                          row[col].toLocaleString()
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
