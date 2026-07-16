import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { PageLoader } from '../components/Loader.jsx';
import { getValidationReport, runPreprocessingPipeline } from '../services/api.js';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { useToast } from '../components/Toast.jsx';

export default function ValidationReport() {
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (showPageLoader = true) => {
    if (showPageLoader) setLoading(true);
    setError(null);
    try {
      const res = await getValidationReport();
      setReport(res);
    } catch (err) {
      if (err.response?.status === 404) {
        setReport(null);
      } else {
        setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to generate validation report');
      }
    } finally {
      if (showPageLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(true);
  }, []);

  const handleAutoClean = async () => {
    setCleaning(true);
    try {
      const res = await runPreprocessingPipeline();
      if (res.success) {
        toast.success('Dataset preprocessed and cleaned successfully!');
        await fetchReport(false);
      } else {
        throw new Error(res.message || 'Auto-clean failed');
      }
    } catch (err) {
      toast.error(err.message || 'Auto-clean failed — please try again');
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return <PageLoader label="Generating dataset validation report..." />;
  }

  if (error) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
          <ShieldAlert size={28} />
        </div>
        <div className="empty-state-title">Validation failed</div>
        <div className="empty-state-desc">{error}</div>
        <Button variant="primary" onClick={() => fetchReport(true)} style={{ marginTop: 12 }}>Retry</Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon"><ShieldCheck size={28} /></div>
        <div className="empty-state-title">No validation report generated yet</div>
        <div className="empty-state-desc">Please upload a CSV dataset to run the validation rules pipeline.</div>
        <Link to="/app/upload">
          <Button variant="primary" style={{ marginTop: 12 }}>Upload Dataset</Button>
        </Link>
      </div>
    );
  }

  const { summary, missing_values, duplicates, negative_values, invalid_dates, invalid_numeric_values, empty_columns, required_columns, recommendations } = report;

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Validation Report</h1>
          <p className="page-desc">System integrity checks and diagnostic metrics for the active dataset</p>
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()} leftIcon={<RefreshCw size={16} />}>Re-run check</Button>
      </StaggerItem>

      {/* Overview Cards */}
      <StaggerItem className="kpi-grid" style={{ marginBottom: 20 }}>
        <Card reveal className="kpi">
          <div className="kpi-top"><span className="kpi-label">Validation Score</span><span className="kpi-icon"><ShieldCheck size={18} /></span></div>
          <div className="kpi-value">
            <AnimatedCounter value={summary.validation_score} suffix="%" decimals={0} />
          </div>
          <div className={`kpi-delta ${summary.status === 'Good' || summary.status === 'Excellent' ? 'up' : 'down'}`}>
            {summary.status} Rating
          </div>
        </Card>
        <Card reveal className="kpi">
          <div className="kpi-top"><span className="kpi-label">Issues Found</span><span className="kpi-icon"><ShieldAlert size={18} /></span></div>
          <div className="kpi-value" style={{ color: summary.issues_found > 0 ? 'var(--error)' : 'inherit' }}>
            <AnimatedCounter value={summary.issues_found} decimals={0} />
          </div>
          <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>Across all 7 rules</div>
        </Card>
        <Card reveal className="kpi">
          <div className="kpi-top"><span className="kpi-label">Dataset Specs</span><span className="kpi-icon"><HelpCircle size={18} /></span></div>
          <div className="kpi-value">
            <AnimatedCounter value={summary.rows} decimals={0} />
          </div>
          <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>{summary.columns} columns detected</div>
        </Card>
        <Card reveal className="kpi">
          <div className="kpi-top"><span className="kpi-label">Required Columns</span><span className="kpi-icon"><CheckCircle2 size={18} /></span></div>
          <div className="kpi-value">
            {required_columns.all_present ? '100%' : `${required_columns.present.length}/${required_columns.required.length}`}
          </div>
          <div className="kpi-delta up">{required_columns.all_present ? 'All fields found' : `${required_columns.missing.length} missing`}</div>
        </Card>
      </StaggerItem>

      <div className="grid-dashboard" style={{ marginBottom: 20 }}>
        {/* Validation Details */}
        <StaggerItem style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Required columns */}
          <Card reveal padding="lg">
            <div className="card-title" style={{ marginBottom: 12 }}>Required Columns Check</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {required_columns.required.map((col) => {
                const isPresent = required_columns.present.includes(col);
                return (
                  <span key={col} className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'none' }}>
                    {col} {isPresent ? '✓' : '✗'}
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              {required_columns.all_present 
                ? 'All mandatory columns for AI forecasting are present in the dataset.'
                : `Missing fields: ${required_columns.missing.join(', ')}. Please update your spreadsheet.`}
            </div>
          </Card>

          {/* Validation Logs Table */}
          <Card reveal padding="lg">
            <div className="card-title" style={{ marginBottom: 12 }}>System Diagnostics Log</div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Diagnostic Rule</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Missing values */}
                  <tr>
                    <td style={{ fontWeight: 600 }}>Missing values check</td>
                    <td>
                      <span className={`badge ${missing_values.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                        {missing_values.length > 0 ? 'Warnings' : 'Passed'}
                      </span>
                    </td>
                    <td>
                      {missing_values.length === 0 
                        ? 'Zero null values found.' 
                        : `${missing_values.map(m => `${m.column} (${m.missing})`).join(', ')}`}
                    </td>
                  </tr>
                  {/* Duplicates */}
                  <tr>
                    <td style={{ fontWeight: 600 }}>Duplicate rows check</td>
                    <td>
                      <span className={`badge ${duplicates.duplicate_count > 0 ? 'badge-warning' : 'badge-success'}`}>
                        {duplicates.duplicate_count > 0 ? 'Warnings' : 'Passed'}
                      </span>
                    </td>
                    <td>
                      {duplicates.duplicate_count === 0 
                        ? 'No duplicate rows.' 
                        : `${duplicates.duplicate_count} duplicate rows found (${duplicates.duplicate_percentage.toFixed(2)}%)`}
                    </td>
                  </tr>
                  {/* Negative values */}
                  <tr>
                    <td style={{ fontWeight: 600 }}>Negative financial fields</td>
                    <td>
                      <span className={`badge ${negative_values.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                        {negative_values.length > 0 ? 'Warnings' : 'Passed'}
                      </span>
                    </td>
                    <td>
                      {negative_values.length === 0 
                        ? 'No negative metrics.' 
                        : `${negative_values.length} cells with negative amounts found (e.g. Row ${negative_values[0].row} col ${negative_values[0].column}: ${negative_values[0].value})`}
                    </td>
                  </tr>
                  {/* Invalid dates */}
                  <tr>
                    <td style={{ fontWeight: 600 }}>Date parsing format</td>
                    <td>
                      <span className={`badge ${invalid_dates.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                        {invalid_dates.length > 0 ? 'Warnings' : 'Passed'}
                      </span>
                    </td>
                    <td>
                      {invalid_dates.length === 0 
                        ? 'All dates valid.' 
                        : `${invalid_dates.length} invalid date rows (e.g. Row ${invalid_dates[0].row} value "${invalid_dates[0].value}")`}
                    </td>
                  </tr>
                  {/* Invalid numeric */}
                  <tr>
                    <td style={{ fontWeight: 600 }}>Numeric format check</td>
                    <td>
                      <span className={`badge ${invalid_numeric_values.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                        {invalid_numeric_values.length > 0 ? 'Warnings' : 'Passed'}
                      </span>
                    </td>
                    <td>
                      {invalid_numeric_values.length === 0 
                        ? 'All numbers parsed.' 
                        : `${invalid_numeric_values.length} invalid rows (e.g. Row ${invalid_numeric_values[0].row} col ${invalid_numeric_values[0].column}: "${invalid_numeric_values[0].value}")`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </StaggerItem>

        {/* Recommendations & Actions */}
        <StaggerItem>
          <Card reveal padding="lg" style={{ height: '100%' }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Suggested Actions</div>
            <div className="card-subtitle" style={{ marginBottom: 20 }}>Recommended fixes to achieve 100% database health</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recommendations.map((rec, i) => (
                <div key={i} className="insight-card card" style={{ padding: 16 }}>
                  <div className="insight-icon opportunity" style={{ width: 32, height: 32, borderRadius: 'var(--r-md)' }}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className="insight-body">
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {rec}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', gap: 12 }}>
              <Button variant="primary" style={{ flex: 1 }} loading={cleaning} onClick={handleAutoClean}>Auto-Clean Dataset</Button>
              <Button variant="secondary" onClick={() => fetchReport(false)}>Refresh</Button>
            </div>
          </Card>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}
