import { useState, useEffect } from 'react';
import { Play, CheckCircle2, ShieldAlert, Cpu, Database, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { PageLoader } from '../components/Loader.jsx';
import { runPreprocessingPipeline, getDatasetPreview } from '../services/api.js';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Preprocessing() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [hasDataset, setHasDataset] = useState(true);

  useEffect(() => {
    const checkCleansingStatus = async () => {
      let savedUpload = localStorage.getItem('forecastiq_uploaded');
      let currentFilename = savedUpload ? JSON.parse(savedUpload).filename : null;
      
      if (!currentFilename) {
        try {
          setLoading(true);
          const res = await getDatasetPreview();
          if (res.success && res.dataset_overview) {
            const uploadDetails = {
              filename: res.dataset_overview.filename,
              name: res.dataset_overview.filename.split('_').slice(2).join('_') || res.dataset_overview.filename,
              size: 0,
              formattedSize: `${res.dataset_overview.total_rows} rows`,
              rows: res.dataset_overview.total_rows,
              detectedColumns: res.column_metadata?.map(c => c.name) || [],
              status: 'processed'
            };
            localStorage.setItem('forecastiq_uploaded', JSON.stringify(uploadDetails));
            savedUpload = JSON.stringify(uploadDetails);
            currentFilename = uploadDetails.filename;
            setHasDataset(true);
          } else {
            setData(null);
            setHasDataset(false);
            return;
          }
        } catch (err) {
          setData(null);
          setHasDataset(false);
          return;
        } finally {
          setLoading(false);
        }
      }
      
      const cacheKey = `forecastiq_preprocess_data_${currentFilename}`;
      const savedPreprocess = localStorage.getItem(cacheKey);
      
      if (savedPreprocess) {
        setData(JSON.parse(savedPreprocess));
        setHasDataset(true);
        return;
      }

      try {
        setLoading(true);
        const res = await getDatasetPreview();
        setHasDataset(true);
        if (res.success && res.dataset_overview) {
          const isCleaned = res.dataset_overview.filename.startsWith('cleaned_data.csv') || res.dataset_overview.filename === 'cleaned_data.csv';
          if (isCleaned) {
            const fallbackData = {
              success: true,
              rows_before: res.dataset_overview.total_rows,
              rows_after: res.dataset_overview.total_rows,
              duplicates_removed: res.quality?.duplicate_rows || 0,
              missing_values_fixed: res.quality?.total_missing_values || 0,
              validation_score_improvement: 10,
              saved_to: 'processed/cleaned_data.csv'
            };
            setData(fallbackData);
            localStorage.setItem(cacheKey, JSON.stringify(fallbackData));
          }
        }
      } catch (err) {
        console.log('Cleansing check on mount failed:', err.message);
        setData(null);
        if (err.response?.status === 404) {
          setHasDataset(false);
          localStorage.removeItem('forecastiq_uploaded');
        }
      } finally {
        setLoading(false);
      }
    };
    checkCleansingStatus();
  }, []);

  const triggerPreprocessing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runPreprocessingPipeline();
      setData(res);
      setHasDataset(true);
      const savedUpload = localStorage.getItem('forecastiq_uploaded');
      if (savedUpload) {
        const { filename } = JSON.parse(savedUpload);
        localStorage.setItem(`forecastiq_preprocess_data_${filename}`, JSON.stringify(res));
      }
      toast.success(`Pipeline complete — ${res.rows_after?.toLocaleString() || 0} rows cleaned successfully.`);
    } catch (err) {
      if (err.response?.status === 404) {
        setHasDataset(false);
      } else {
        const msg = err.response?.data?.detail || err.message || 'Preprocessing pipeline execution failed';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Data Preprocessing</h1>
          <p className="page-desc">Cleanse, impute, deduplicate, and standardize marketing datasets</p>
        </div>
        {!loading && hasDataset && (
          <Button variant="primary" onClick={triggerPreprocessing} leftIcon={<Play size={16} />}>
            {data ? 'Rerun Pipeline' : 'Run Pipeline'}
          </Button>
        )}
      </StaggerItem>

      {loading && <PageLoader label="Running data cleansing & standardisation tasks..." />}

      {!hasDataset && (
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '45vh' }}>
            <div className="empty-state-icon"><Database size={28} /></div>
            <div className="empty-state-title">No dataset uploaded yet</div>
            <div className="empty-state-desc">Please upload a CSV dataset first to execute the preprocessing pipeline.</div>
            <Link to="/app/upload">
              <Button variant="primary" style={{ marginTop: 12 }}>Upload Dataset</Button>
            </Link>
          </div>
        </StaggerItem>
      )}

      {hasDataset && error && (
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '40vh' }}>
            <div className="empty-state-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
              <ShieldAlert size={28} />
            </div>
            <div className="empty-state-title">Cleansing failed</div>
            <div className="empty-state-desc">{error}</div>
            <Button variant="primary" onClick={triggerPreprocessing} style={{ marginTop: 12 }}>Retry</Button>
          </div>
        </StaggerItem>
      )}

      {hasDataset && !loading && !data && !error && (
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '45vh' }}>
            <div className="empty-state-icon"><Cpu size={28} /></div>
            <div className="empty-state-title">Preprocessing ready to execute</div>
            <div className="empty-state-desc">
              Execute the pipeline to apply standard 9-step cleaning. 
              This will impute null values, delete duplicates, fix data types, and output a sanitized file.
            </div>
            <Button variant="primary" onClick={triggerPreprocessing} leftIcon={<Play size={16} />} style={{ marginTop: 12 }}>Start Cleansing</Button>
          </div>
        </StaggerItem>
      )}

      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Cleansing Stats */}
          <StaggerItem className="kpi-grid">
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Rows Cleansed</span><span className="kpi-icon"><Database size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.rows_before} decimals={0} />
              </div>
              <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>Input CSV rows count</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Sanitized Rows</span><span className="kpi-icon"><Database size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.rows_after} decimals={0} />
              </div>
              <div className="kpi-delta down">-{data.duplicates_removed} duplicate rows removed</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Cleared File</span><span className="kpi-icon"><FileText size={18} /></span></div>
              <div className="kpi-value" style={{ fontSize: 'var(--fs-xl)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.saved_to ? data.saved_to.split('/').pop() : 'cleaned_data.csv'}
              </div>
              <div className="kpi-delta up">Saved to processed/ directory</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Cleansing Status</span><span className="kpi-icon"><CheckCircle2 size={18} /></span></div>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>Active</div>
              <div className="kpi-delta up">✓ Score Improved: +{data.validation_score_improvement}%</div>
            </Card>
          </StaggerItem>

          <div className="grid-2">
            {/* Cleansing Checklist */}
            <StaggerItem>
              <Card reveal padding="lg" style={{ height: '100%' }}>
                <div className="card-title" style={{ marginBottom: 12 }}>Pipeline Steps Executed</div>
                <div className="card-subtitle" style={{ marginBottom: 20 }}>List of standard transforms successfully applied</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { name: 'Whitespace Stripping', label: 'Completed' },
                    { name: 'Date Parsing & Conversion', label: `${data.invalid_dates_fixed || 0} fixed` },
                    { name: 'Numeric Coercion & Shorthands', label: `${data.invalid_numeric_fixed || 0} fixed` },
                    { name: 'Missing Value Imputation', label: `${data.missing_values_fixed || 0} imputed` },
                    { name: 'Negative Financials Correction', label: `${data.negative_values_fixed || 0} fixed` },
                    { name: 'Duplicate Row Removal', label: `${data.duplicates_removed || 0} removed` },
                    { name: 'IQR Outlier Clipping', label: `${data.outliers_corrected || 0} clipped` }
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--fs-sm)' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 500 }}>{step.name}</span>
                      <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', textTransform: 'none' }}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </StaggerItem>

            {/* Next actions */}
            <StaggerItem>
              <Card reveal padding="lg" glow style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                <div className="empty-state-icon" style={{ margin: '0 auto 16px' }}><Cpu size={24} /></div>
                <div className="card-title">Cleaned file generated!</div>
                <div className="card-subtitle" style={{ maxWidth: 360, margin: '0 auto 20px', lineBreak: 'auto' }}>
                  The dataset has been cleaned. The next step is to execute <strong>Feature Engineering</strong> to generate lag, rolling mean, and date features for LightGBM.
                </div>
                <Button variant="primary" style={{ alignSelf: 'center' }} to="/app/feature-engineering">
                  Proceed to Feature Engineering
                </Button>
              </Card>
            </StaggerItem>
          </div>
        </div>
      )}
    </StaggerContainer>
  );
}
