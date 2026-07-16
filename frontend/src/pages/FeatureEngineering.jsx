import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle2, ShieldAlert, Sparkles, Database, FileText } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { PageLoader } from '../components/Loader.jsx';
import { runFeatureEngineering, getModelStatus, getDatasetPreview } from '../services/api.js';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { useToast } from '../components/Toast.jsx';

export default function FeatureEngineering() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [hasDataset, setHasDataset] = useState(true);

  useEffect(() => {
    const checkFeaturesStatus = async () => {
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
      
      const cacheKey = `forecastiq_features_data_${currentFilename}`;
      const savedFeatures = localStorage.getItem(cacheKey);
      
      if (savedFeatures) {
        setData(JSON.parse(savedFeatures));
        setHasDataset(true);
        return;
      }

      try {
        setLoading(true);
        const status = await getModelStatus();
        setHasDataset(true);
        if (status.model_exists) {
          // Use backend-provided feature count only; do NOT hardcode rows
          const fallbackData = {
            success: true,
            rows: status.training_rows || 0,
            original_columns: 10,
            new_columns: status.feature_count || 14,
            features_created: ['IsWeekend', 'Month', 'DayOfWeek', 'ROAS', 'Clicks_Per_Impression'],
            saved_to: 'processed/features.csv'
          };
          setData(fallbackData);
          localStorage.setItem(cacheKey, JSON.stringify(fallbackData));
        }
      } catch (err) {
        console.log('Features check on mount failed:', err.message);
        setData(null);
        if (err.response?.status === 404) {
          setHasDataset(false);
          localStorage.removeItem('forecastiq_uploaded');
        }
      } finally {
        setLoading(false);
      }
    };
    checkFeaturesStatus();
  }, []);

  const triggerFeatureEngineering = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runFeatureEngineering();
      setData(res);
      setHasDataset(true);
      const savedUpload = localStorage.getItem('forecastiq_uploaded');
      if (savedUpload) {
        const { filename } = JSON.parse(savedUpload);
        localStorage.setItem(`forecastiq_features_data_${filename}`, JSON.stringify(res));
      }
      toast.success(`Feature engineering complete — ${res.features_created?.length || 0} predictors constructed.`);
    } catch (err) {
      if (err.response?.status === 404) {
        setHasDataset(false);
      } else {
        const msg = err.response?.data?.detail || err.message || 'Feature engineering failed';
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
          <h1 className="page-title">Feature Engineering</h1>
          <p className="page-desc">Construct lag variables, rolling window statistics, and time components</p>
        </div>
        {!loading && hasDataset && (
          <Button variant="primary" onClick={triggerFeatureEngineering} leftIcon={<Play size={16} />}>
            {data ? 'Rerun Generator' : 'Run Generator'}
          </Button>
        )}
      </StaggerItem>

      {loading && <PageLoader label="Generating prediction features (lags, rolling aggregates, holiday filters)..." />}

      {!hasDataset && (
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '45vh' }}>
            <div className="empty-state-icon"><Database size={28} /></div>
            <div className="empty-state-title">No dataset uploaded yet</div>
            <div className="empty-state-desc">Please upload a CSV dataset first to execute the feature engineering engine.</div>
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
            <div className="empty-state-title">Generation failed</div>
            <div className="empty-state-desc">{error}</div>
            <Button variant="primary" onClick={triggerFeatureEngineering} style={{ marginTop: 12 }}>Retry</Button>
          </div>
        </StaggerItem>
      )}

      {hasDataset && !loading && !data && !error && (
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '45vh' }}>
            <div className="empty-state-icon"><Sparkles size={28} style={{ color: 'var(--brand-400)' }} /></div>
            <div className="empty-state-title">Feature Engineering Engine</div>
            <div className="empty-state-desc">
              Execute this module to generate 14 predictive features. Time-series lags (Lag1, Lag7) 
              and rolling mean aggregates (Revenue 7d, Spend 7d) will be added to the input set.
            </div>
            <Button variant="primary" onClick={triggerFeatureEngineering} leftIcon={<Play size={16} />} style={{ marginTop: 12 }}>Build Features</Button>
          </div>
        </StaggerItem>
      )}

      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(() => {
            const savedUpload = localStorage.getItem('forecastiq_uploaded');
            const uploadedRows = savedUpload ? JSON.parse(savedUpload).rows : null;
            if (uploadedRows && data.rows !== uploadedRows) {
              return (
                <StaggerItem>
                  <div style={{ display: 'flex', gap: 12, padding: 16, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--r-md)' }}>
                    <ShieldAlert size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Dataset Change Detected</strong>: The uploaded file has {uploadedRows.toLocaleString()} rows, but these features are still built on the old {data.rows.toLocaleString()} rows. Please make sure you run the pipeline stages in sequence:
                      <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                        <Link to="/app/preprocessing" style={{ color: 'var(--brand-400)', fontWeight: 600, textDecoration: 'underline' }}>1. Preprocess Data first</Link>
                        <span style={{ color: 'var(--text-muted)' }}>2. Rebuild Features (Here)</span>
                        <Link to="/app/model-training" style={{ color: 'var(--brand-400)', fontWeight: 600, textDecoration: 'underline' }}>3. Retrain ML Model next</Link>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            }
            return null;
          })()}

          {/* Engine Output Summary */}
          <StaggerItem className="kpi-grid">
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Features Generated</span><span className="kpi-icon"><Sparkles size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.features_created ? data.features_created.length : 0} decimals={0} />
              </div>
              <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>Calculated predictors count</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Output CSV File</span><span className="kpi-icon"><FileText size={18} /></span></div>
              <div className="kpi-value" style={{ fontSize: 'var(--fs-xl)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.saved_to ? data.saved_to.split('/').pop() : 'features.csv'}
              </div>
              <div className="kpi-delta up">Ready in processed/ folder</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Data Dimension</span><span className="kpi-icon"><Database size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.rows} decimals={0} />
              </div>
              <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>Total dataset records</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Total Columns</span><span className="kpi-icon"><CheckCircle2 size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.new_columns} decimals={0} />
              </div>
              <div className="kpi-delta up">+{data.new_columns - data.original_columns} engineered variables</div>
            </Card>
          </StaggerItem>

          <div className="grid-2">
            {/* Features list */}
            <StaggerItem>
              <Card reveal padding="lg" style={{ height: '100%' }}>
                <div className="card-title" style={{ marginBottom: 12 }}>Constructed Predictors</div>
                <div className="card-subtitle" style={{ marginBottom: 20 }}>Time, Lag, and Rolling variables engineered</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.features_created?.map((feat, i) => (
                    <span key={i} className="tag" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.1), transparent)', border: '1px solid var(--border-brand)' }}>
                      {feat}
                    </span>
                  ))}
                </div>
              </Card>
            </StaggerItem>

            {/* Next actions */}
            <StaggerItem>
              <Card reveal padding="lg" glow style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                <div className="empty-state-icon" style={{ margin: '0 auto 16px' }}><Play size={24} /></div>
                <div className="card-title">Features constructed!</div>
                <div className="card-subtitle" style={{ maxWidth: 360, margin: '0 auto 20px', lineBreak: 'auto' }}>
                  The features dataset has been successfully saved. You can now proceed to <strong>Model Training</strong> to train and evaluate the LightGBM estimator.
                </div>
                <Button variant="primary" style={{ alignSelf: 'center' }} to="/app/model-training">
                  Proceed to Model Training
                </Button>
              </Card>
            </StaggerItem>
          </div>
        </div>
      )}
    </StaggerContainer>
  );
}
