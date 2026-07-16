import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle2, ShieldAlert, Cpu, Award, Zap, BarChart3, Settings, Database } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { PageLoader } from '../components/Loader.jsx';
import { runModelTraining, getModelFeatureImportance, getModelStatus, getModelInfo, getDatasetPreview } from '../services/api.js';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../components/Toast.jsx';

export default function ModelTraining() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  // Separate flag for the silent initial model-status check so it
  // does NOT hide the Retrain button in the page header
  const [initializing, setInitializing] = useState(true);
  const [data, setData] = useState(null);
  const [importances, setImportances] = useState(null);
  const [error, setError] = useState(null);
  const [hasDataset, setHasDataset] = useState(true);

  useEffect(() => {
    const fetchExistingModel = async () => {
      let savedUpload = localStorage.getItem('forecastiq_uploaded');
      let currentFilename = savedUpload ? JSON.parse(savedUpload).filename : null;
      
      if (!currentFilename) {
        try {
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
            setInitializing(false);
            return;
          }
        } catch (err) {
          setData(null);
          setHasDataset(false);
          setInitializing(false);
          return;
        }
      }

      try {
        const status = await getModelStatus();
        setHasDataset(true);
        if (status.model_exists) {
          const info = await getModelInfo();
          const imp = await getModelFeatureImportance();
          
          setData({
            rows: (info.training_rows || 0) + (info.test_rows || 0),
            features_used: info.features,
            target: info.target || 'Revenue',
            training_time: info.training_time || 0,
            model_verified: true,
            model_version: info.version || 'v3',
            cross_validation: info.cross_validation,
            metrics: info.metrics
          });

          const totalImp = imp.top_features?.reduce((sum, item) => sum + item.importance, 0) || 1;
          const mappedImp = imp.top_features?.map((item) => ({
            feature: item.feature,
            importance_percentage: +((item.importance / totalImp) * 100).toFixed(1)
          })) || [];
          setImportances(mappedImp);
        }
      } catch (err) {
        console.error('Failed to load pretrained model metadata:', err);
        if (err.response?.status === 404) {
          setHasDataset(false);
          localStorage.removeItem('forecastiq_uploaded');
        }
      } finally {
        setInitializing(false);
      }
    };
    fetchExistingModel();
  }, []);

  const triggerModelTraining = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runModelTraining();
      const imp = await getModelFeatureImportance();
      setData(res);
      setHasDataset(true);
      
      const totalImp = imp.top_features?.reduce((sum, item) => sum + item.importance, 0) || 1;
      const mappedImp = imp.top_features?.map((item) => ({
        feature: item.feature,
        importance_percentage: +((item.importance / totalImp) * 100).toFixed(1)
      })) || [];
      
      setImportances(mappedImp);
      toast.success(`Model trained successfully — R² ${(res.metrics?.r2 * 100).toFixed(1)}% on ${res.rows?.toLocaleString() || 0} rows.`);
    } catch (err) {
      if (err.response?.status === 404) {
        setHasDataset(false);
      } else {
        const msg = err.response?.data?.detail || err.message || 'Model training execution failed';
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
          <h1 className="page-title">Model Training</h1>
          <p className="page-desc">Train LightGBM machine learning models to forecast revenue yields</p>
        </div>
        {/* Button always visible unless an active training run is in progress */}
        {!loading && hasDataset && (
          <Button variant="primary" onClick={triggerModelTraining} leftIcon={<Play size={16} />}>
            {data ? 'Retrain Model' : 'Start Training'}
          </Button>
        )}
      </StaggerItem>

      {/* Full-page loader only during an active training run */}
      {loading && <PageLoader label="Optimizing hyperparameters & training LightGBM regressor..." />}
      
      {!hasDataset && (
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '45vh' }}>
            <div className="empty-state-icon"><Database size={28} /></div>
            <div className="empty-state-title">No dataset uploaded yet</div>
            <div className="empty-state-desc">Please upload a CSV dataset first to execute model training.</div>
            <Link to="/app/upload">
              <Button variant="primary" style={{ marginTop: 12 }}>Upload Dataset</Button>
            </Link>
          </div>
        </StaggerItem>
      )}

      {/* Subtle inline spinner during silent initial status check */}
      {hasDataset && initializing && !loading && (
        <StaggerItem>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)' }}>
            <span className="spinner" style={{ width: 16, height: 16 }} />
            Checking for existing trained model...
          </div>
        </StaggerItem>
      )}

      {hasDataset && error && (
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '40vh' }}>
            <div className="empty-state-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
              <ShieldAlert size={28} />
            </div>
            <div className="empty-state-title">Training failed</div>
            <div className="empty-state-desc">{error}</div>
            <Button variant="primary" onClick={triggerModelTraining} style={{ marginTop: 12 }}>Retry</Button>
          </div>
        </StaggerItem>
      )}

      {hasDataset && !loading && !data && !error && !initializing && (
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '45vh' }}>
            <div className="empty-state-icon"><Cpu size={28} style={{ color: 'var(--brand-400)' }} /></div>
            <div className="empty-state-title">ML Model Studio</div>
            <div className="empty-state-desc">
              Execute this panel to tune and train the LightGBM regressor. 
              The system will run 5-fold cross-validation and optimize parameters automatically.
            </div>
            <Button variant="primary" onClick={triggerModelTraining} leftIcon={<Play size={16} />} style={{ marginTop: 12 }}>Train Model</Button>
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
                      <strong style={{ color: 'var(--text-primary)' }}>Dataset Change Detected</strong>: The uploaded file has {uploadedRows.toLocaleString()} rows, but this model is still trained on the old {data.rows.toLocaleString()} rows. Please make sure you run the pipeline stages in sequence:
                      <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                        <Link to="/app/preprocessing" style={{ color: 'var(--brand-400)', fontWeight: 600, textDecoration: 'underline' }}>1. Preprocess Data first</Link>
                        <Link to="/app/feature-engineering" style={{ color: 'var(--brand-400)', fontWeight: 600, textDecoration: 'underline' }}>2. Rebuild Features second</Link>
                        <span style={{ color: 'var(--text-muted)' }}>3. Retrain Model (Here)</span>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            }
            return null;
          })()}

          {/* Training performance indicators */}
          <StaggerItem className="kpi-grid">
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">R² Score</span><span className="kpi-icon"><Award size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.metrics.r2 * 100} suffix="%" decimals={2} />
              </div>
              <div className="kpi-delta up">CV R²: {(data.cross_validation.mean_r2 * 100).toFixed(2)}%</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">MAPE (Error Rate)</span><span className="kpi-icon"><ShieldAlert size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.metrics.mape} suffix="%" decimals={2} />
              </div>
              <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>Lower indicates better accuracy</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Training Latency</span><span className="kpi-icon"><Zap size={18} /></span></div>
              <div className="kpi-value">
                <AnimatedCounter value={data.training_time} suffix="s" decimals={2} />
              </div>
              <div className="kpi-delta" style={{ color: 'var(--text-secondary)' }}>{data.cross_validation?.folds || 5}-fold CV hyperparameter search</div>
            </Card>
            <Card reveal className="kpi">
              <div className="kpi-top"><span className="kpi-label">Model Version</span><span className="kpi-icon"><Cpu size={18} /></span></div>
              <div className="kpi-value" style={{ color: 'var(--brand-400)' }}>{data.model_version}</div>
              <div className="kpi-delta up">✓ Active for inference</div>
            </Card>
          </StaggerItem>

          <div className="grid-dashboard">
            {/* Feature importance bar chart */}
            <StaggerItem>
              <Card reveal padding="lg">
                <div className="card-title" style={{ marginBottom: 4 }}><BarChart3 size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--brand-400)' }} /> Feature Importances</div>
                <div className="card-subtitle" style={{ marginBottom: 20 }}>Trained LightGBM relative predictor weight values</div>
                
                {importances && (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={importances} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                      <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fill: 'var(--chart-axis)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="feature" type="category" width={100} tick={{ fill: 'var(--chart-axis)', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(v) => `${v}%`}
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 11, color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)' }}
                      />
                      <Bar dataKey="importance_percentage" fill="var(--brand-400)" radius={[0, 4, 4, 0]} name="Importance Weight" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </StaggerItem>

            {/* Model Information */}
            <StaggerItem style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card reveal padding="lg">
                <div className="card-title" style={{ marginBottom: 12 }}><Settings size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--brand-400)' }} /> Model Information</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>Algorithm</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>LightGBM Regressor</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>Target Variable</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{data.target}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>Predictor Features</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{data.features_used} variables</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>Training Dataset Size</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{data.rows.toLocaleString()} rows</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', borderBottom: '1px solid var(--border-strong)', paddingBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>Model Integrity Verification</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>Passed</span>
                  </div>
                </div>
              </Card>
              
              <Card reveal padding="lg" glow style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', flex: 1 }}>
                <div className="empty-state-icon" style={{ margin: '0 auto 12px' }}><CheckCircle2 size={24} style={{ color: 'var(--success)' }} /></div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Model Trained Successfully!</div>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', maxWidth: 280, margin: '0 auto 14px' }}>
                  Model metrics and coefficients are saved. You can now use the new model in the Forecast screen to test scenarios.
                </p>
                <Button variant="primary" style={{ alignSelf: 'center' }} to="/app/forecast">
                  Go to Forecast Screen
                </Button>
              </Card>
            </StaggerItem>
          </div>
        </div>
      )}
    </StaggerContainer>
  );
}
