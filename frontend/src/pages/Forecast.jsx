import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Target, Wallet, Play, Sliders, RotateCcw,
  Copy, Trash2, Calendar, ClipboardCheck, ArrowUpRight, Clock, Database, Cpu
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { getDatasetPreview, predictCampaignForecast, predictCampaignForecastConfidence, getModelStatus } from '../services/api.js';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import { useToast } from '../components/Toast.jsx';
import { ErrorCard, StatCard, LoadingCard } from '../components/ReusableWidgets.jsx';
import {
  ForecastConfidencePanel,
  ForecastSummaryCard,
  PredictionTimeline,
  ForecastMetricsGrid,
} from '../components/ForecastComponents.jsx';

const CAMPAIGN_TYPES = ['Awareness', 'Brand', 'Lead Generation', 'Performance', 'Remarketing', 'Shopping', 'Video'];
const REGIONS = ['Central', 'East', 'North', 'South', 'West'];

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    fontSize: 11,
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-md)',
  },
};

export default function Forecast() {
  const toast = useToast();

  // Historical dataset states
  const [historicalData, setHistoricalData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [availableChannels, setAvailableChannels] = useState(['Google_Spend', 'Meta_Spend', 'Microsoft_Spend']);
  const [hasDataset, setHasDataset] = useState(true);
  const [hasModel, setHasModel] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Point Predictor States
  const [formData, setFormData] = useState({
    Clicks:          1200,
    Impressions:     50000,
    Conversions:     80,
    Campaign_Type:   'Performance',
    Region:          'Central',
    Date:            new Date().toISOString().split('T')[0],
  });

  const [pointResult, setPointResult] = useState(null);
  const [pointLoading, setPointLoading] = useState(false);
  const [pointError, setPointError]   = useState(null);

  // Prediction History (persisted in localStorage)
  const [predictionHistory, setPredictionHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('forecast_history') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    const checkStatusAndLoad = async () => {
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
            setHasDataset(false);
            setInitializing(false);
            setHistoryLoading(false);
            return;
          }
        } catch (err) {
          setHasDataset(false);
          setInitializing(false);
          setHistoryLoading(false);
          return;
        }
      }

      try {
        setHistoryLoading(true);
        const status = await getModelStatus();
        setHasDataset(true);
        setHasModel(status.model_exists);
        
        if (status.model_exists) {
          const res = await getDatasetPreview();
          if (res) {
            if (res.preview?.last_10_rows) {
              setHistoricalData(res.preview.last_10_rows);
            }
            if (res.available_channels?.length > 0) {
              setAvailableChannels(res.available_channels);
            }
          }
        }
      } catch (err) {
        console.log('Failed to load dataset preview for chart:', err);
        if (err.response?.status === 404) {
          setHasDataset(false);
          localStorage.removeItem('forecastiq_uploaded');
        }
      } finally {
        setHistoryLoading(false);
        setInitializing(false);
      }
    };
    checkStatusAndLoad();
  }, []);

  useEffect(() => {
    if (availableChannels.length > 0) {
      setFormData(prev => {
        const next = { ...prev };
        availableChannels.forEach((ch, idx) => {
          if (next[ch] === undefined) {
            const defaults = [5000, 4000, 1000];
            next[ch] = defaults[idx] || 1000;
          }
        });
        return next;
      });
    }
  }, [availableChannels]);

  /* ---- Derived chart data (memoised) ---- */
  const actualSeries = useMemo(() =>
    historicalData.map((row) => ({
      label:    row.Date ? row.Date.substring(5) : '',
      actual:   Number(row.Revenue) || 0,
      forecast: null,
      lower:    null,
      upper:    null,
    })), [historicalData]);

  const intervalPercent = useMemo(() => {
    const m = pointResult?.confidence_interval?.match(/\d+/);
    return m ? parseInt(m[0], 10) / 100 : 0.16;
  }, [pointResult?.confidence_interval]);

  const lowerBound = useMemo(() =>
    pointResult ? pointResult.predicted_revenue * (1 - intervalPercent) : 0,
    [pointResult, intervalPercent]);

  const upperBound = useMemo(() =>
    pointResult ? pointResult.predicted_revenue * (1 + intervalPercent) : 0,
    [pointResult, intervalPercent]);

  const chartData = useMemo(() => {
    let data = [...actualSeries];
    if (pointResult && actualSeries.length > 0) {
      const lastIdx = actualSeries.length - 1;
      data[lastIdx] = {
        ...actualSeries[lastIdx],
        forecast: actualSeries[lastIdx].actual,
        lower:    actualSeries[lastIdx].actual,
        upper:    actualSeries[lastIdx].actual,
      };
      data.push({
        label:    formData.Date ? formData.Date.substring(5) : '',
        actual:   null,
        forecast: pointResult.predicted_revenue,
        lower:    lowerBound,
        upper:    upperBound,
      });
    }
    return data;
  }, [actualSeries, pointResult, lowerBound, upperBound, formData.Date]);

  /* ---- Handlers ---- */
  const handlePredictPoint = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPointError(null);
    setPointResult(null);

    const spends = availableChannels.map(ch => Number(formData[ch]) || 0);
    const totalSpend = spends.reduce((acc, v) => acc + v, 0);

    if (totalSpend <= 0) return toast.error('Total campaign spend must be greater than zero.');
    if (spends.some(v => v < 0))
      return toast.error('Campaign spends must be non-negative values.');
    if (Number(formData.Clicks) < 0 || Number(formData.Impressions) < 0 || Number(formData.Conversions) < 0)
      return toast.error('Clicks, impressions and conversions must be non-negative.');
    if (Number(formData.Clicks) > Number(formData.Impressions))
      return toast.error(`Clicks (${formData.Clicks}) cannot exceed impressions (${formData.Impressions}).`);
    if (Number(formData.Conversions) > Number(formData.Clicks))
      return toast.error(`Conversions (${formData.Conversions}) cannot exceed clicks (${formData.Clicks}).`);

    setPointLoading(true);
    try {
      const [forecastRes, confidenceRes] = await Promise.all([
        predictCampaignForecast(formData),
        predictCampaignForecastConfidence(formData),
      ]);
      const combined = {
        ...forecastRes,
        ...confidenceRes.data,
        model_metrics:       confidenceRes.data.model_metrics,
        confidence_score:    confidenceRes.data.confidence_score,
        confidence_level:    confidenceRes.data.confidence_level,
        confidence_interval: confidenceRes.data.confidence_interval,
        forecast_reliability: confidenceRes.data.forecast_reliability,
        generated_at:        confidenceRes.metadata?.generated_at     || new Date().toISOString(),
        api_version:         confidenceRes.metadata?.api_version       || 'v1',
        processing_time_ms:  confidenceRes.metadata?.processing_time_ms || 0,
      };
      setPointResult(combined);
      toast.success('Campaign revenue prediction generated successfully!');

      const item = {
        id:        Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        inputs:    { ...formData },
        results:   { ...combined },
      };
      const updated = [item, ...predictionHistory];
      setPredictionHistory(updated);
      localStorage.setItem('forecast_history', JSON.stringify(updated));
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Prediction failed';
      setPointError(msg);
      toast.error(msg);
    } finally {
      setPointLoading(false);
    }
  };

  const handleResetForm = () => {
    const resetData = {
      Clicks:          1200,
      Impressions:     50000,
      Conversions:     80,
      Campaign_Type:   'Performance',
      Region:          'Central',
      Date:            new Date().toISOString().split('T')[0],
    };
    availableChannels.forEach((ch, idx) => {
      const defaults = [5000, 4000, 1000];
      resetData[ch] = defaults[idx] || 1000;
    });
    setFormData(resetData);
    setPointResult(null);
    setPointError(null);
    toast.info('Campaign parameters reset to defaults.');
  };

  const handleRestoreHistory = (item) => {
    setFormData(item.inputs);
    setPointResult(item.results);
    setPointError(null);
    toast.success('Restored campaign inputs and prediction results!');
  };

  const handleDeleteHistory = (id) => {
    const updated = predictionHistory.filter((h) => h.id !== id);
    setPredictionHistory(updated);
    localStorage.setItem('forecast_history', JSON.stringify(updated));
    toast.info('Prediction history record deleted.');
  };

  const handleCopyPrediction = () => {
    if (!pointResult) return;
    const spendsText = availableChannels.map(ch => {
      const label = ch.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").replace(/^(.)/, l => l.toUpperCase());
      return `- ${label} Spend: $${(formData[ch] || 0).toLocaleString()}`;
    }).join('\n');

    const text = `Forecast Report Summary:
- Date: ${formData.Date}
- Campaign: ${formData.Campaign_Type} (${formData.Region})
${spendsText}
- Total Budget: $${totalSpend.toLocaleString()}
- Projected Revenue: $${Math.round(pointResult.predicted_revenue).toLocaleString()}
- Projected ROAS: ${pointResult.predicted_roas.toFixed(2)}x
- Confidence Score: ${pointResult.confidence_score}% (${pointResult.confidence_level})
- Confidence Interval: ${pointResult.confidence_interval}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied forecast summary to clipboard!');
  };

  const handleCopyJSON = () => {
    if (!pointResult) return;
    navigator.clipboard.writeText(JSON.stringify(pointResult, null, 2));
    toast.success('Copied raw API response JSON to clipboard!');
  };

  const totalSpend = useMemo(() => {
    return availableChannels.reduce((acc, ch) => acc + (formData[ch] || 0), 0);
  }, [formData, availableChannels]);

  /* ---- Render ---- */
  if (!hasDataset) {
    return (
      <StaggerContainer>
        <StaggerItem className="page-header">
          <div>
            <h1 className="page-title">Forecast Studio</h1>
            <p className="page-desc">AI-powered campaign revenue predictions and confidence intervals</p>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '45vh' }}>
            <div className="empty-state-icon"><Database size={28} /></div>
            <div className="empty-state-title">No dataset uploaded yet</div>
            <div className="empty-state-desc">Please upload a CSV dataset first to execute campaigns forecasting.</div>
            <Link to="/app/upload">
              <Button variant="primary" style={{ marginTop: 12 }}>Upload Dataset</Button>
            </Link>
          </div>
        </StaggerItem>
      </StaggerContainer>
    );
  }

  if (!hasModel) {
    return (
      <StaggerContainer>
        <StaggerItem className="page-header">
          <div>
            <h1 className="page-title">Forecast Studio</h1>
            <p className="page-desc">AI-powered campaign revenue predictions and confidence intervals</p>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="empty-state" style={{ minHeight: '45vh' }}>
            <div className="empty-state-icon"><Cpu size={28} style={{ color: 'var(--brand-400)' }} /></div>
            <div className="empty-state-title">No Trained Model Found</div>
            <div className="empty-state-desc">You must train a forecasting model before generating revenue predictions.</div>
            <Link to="/app/model-training">
              <Button variant="primary" style={{ marginTop: 12 }}>Train Model</Button>
            </Link>
          </div>
        </StaggerItem>
      </StaggerContainer>
    );
  }

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Forecast Studio</h1>
          <p className="page-desc">AI-powered campaign revenue predictions and confidence intervals</p>
        </div>
      </StaggerItem>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>

        {/* Campaign Parameters Form */}
        <StaggerItem>
          <Card reveal padding="lg" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="card-title" style={{ margin: 0 }}>
                <Sliders size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--brand-400)' }} />
                Campaign Parameters
              </div>
              <button
                type="button"
                onClick={handleResetForm}
                className="btn btn-ghost btn-xs"
                title="Reset to defaults"
                style={{ padding: 4 }}
                disabled={pointLoading}
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <form onSubmit={handlePredictPoint} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                {availableChannels.map((ch) => {
                  const label = ch.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").replace(/^(.)/, l => l.toUpperCase()) + " Spend ($)";
                  const value = formData[ch] !== undefined ? formData[ch] : 0;
                  return (
                    <div key={ch} className="input-group">
                      <label className="input-label">{label}</label>
                      <input
                        className="input" type="number" value={value}
                        onChange={(e) => setFormData({ ...formData, [ch]: +e.target.value })}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Clicks</label>
                  <input className="input" type="number" value={formData.Clicks}
                    onChange={(e) => setFormData({ ...formData, Clicks: +e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Impressions</label>
                  <input className="input" type="number" value={formData.Impressions}
                    onChange={(e) => setFormData({ ...formData, Impressions: +e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Conversions</label>
                  <input className="input" type="number" value={formData.Conversions}
                    onChange={(e) => setFormData({ ...formData, Conversions: +e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Campaign Type</label>
                  <select className="input" value={formData.Campaign_Type}
                    onChange={(e) => setFormData({ ...formData, Campaign_Type: e.target.value })}>
                    {CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Region</label>
                  <select className="input" value={formData.Region}
                    onChange={(e) => setFormData({ ...formData, Region: e.target.value })}>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Date</label>
                  <input className="input" type="date" value={formData.Date}
                    onChange={(e) => setFormData({ ...formData, Date: e.target.value })} />
                </div>
              </div>
              <Button type="submit" variant="primary" fullWidth loading={pointLoading}
                leftIcon={<Play size={16} />} style={{ marginTop: 8 }}>
                Run Campaign Forecast
              </Button>
            </form>
          </Card>
        </StaggerItem>

        {/* Results Panel */}
        <StaggerItem>
          {pointLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <LoadingCard lines={2} /><LoadingCard lines={2} /><LoadingCard lines={2} />
              </div>
              <LoadingCard lines={6} />
            </div>
          ) : pointError ? (
            <div style={{ minHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ErrorCard
                title="Prediction Calculation Failed"
                message={pointError}
                onRetry={handlePredictPoint}
              />
            </div>
          ) : pointResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* KPI row */}
              <ForecastMetricsGrid revenue={pointResult.predicted_revenue} roas={pointResult.predicted_roas} spend={totalSpend} />

              {/* Chart (left) + Confidence Panel (right) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
                <PredictionTimeline
                  chartData={chartData}
                  historyLoading={historyLoading}
                  pointResult={pointResult}
                  lowerBound={lowerBound}
                  upperBound={upperBound}
                />

                {/* ── Unified Forecast Confidence Panel ── */}
                <ForecastConfidencePanel
                  score={pointResult.confidence_score}
                  level={pointResult.confidence_level}
                  interval={pointResult.confidence_interval}
                  reliability={pointResult.forecast_reliability}
                  lowerBound={lowerBound}
                  upperBound={upperBound}
                  generatedAt={pointResult.generated_at}
                  processingTimeMs={pointResult.processing_time_ms}
                  apiVersion={pointResult.api_version}
                  modelVersion={pointResult.model_version}
                  modelMetrics={pointResult.model_metrics}
                />
              </div>

              {/* Bottom: Spend split + Summary + Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
                {/* Spend allocation bar chart */}
                <Card reveal padding="lg">
                  <div className="card-title" style={{ fontSize: 'var(--fs-sm)', marginBottom: 12 }}>
                    Spend Allocation Split
                  </div>
                  <div style={{ height: 110 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        layout="vertical"
                        data={availableChannels.map((ch, idx) => {
                          const label = ch.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").replace(/^(.)/, l => l.toUpperCase()) + " Ads";
                          const colors = ['var(--brand-500)', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];
                          return {
                            name: label,
                            spend: formData[ch] || 0,
                            fill: colors[idx % colors.length]
                          };
                        })}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name" type="category" axisLine={false} tickLine={false}
                          width={84} tick={{ fontSize: 9, fill: 'var(--chart-axis)' }}
                        />
                        <Tooltip formatter={(v) => `$${v.toLocaleString()}`} {...CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="spend" radius={[0, 4, 4, 0]} fill="var(--brand-400)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Summary + action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ForecastSummaryCard revenue={pointResult.predicted_revenue} spend={totalSpend} roas={pointResult.predicted_roas} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="secondary" size="sm" leftIcon={<Copy size={14} />}
                      onClick={handleCopyPrediction} disabled={pointLoading} style={{ flex: 1 }}>
                      Copy Summary
                    </Button>
                    <Button variant="secondary" size="sm" leftIcon={<ClipboardCheck size={14} />}
                      onClick={handleCopyJSON} disabled={pointLoading} style={{ flex: 1 }}>
                      Copy JSON
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty / default state */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <PredictionTimeline chartData={chartData} historyLoading={historyLoading} pointResult={null} />
              <Card reveal padding="lg" style={{ textAlign: 'center', padding: '30px 24px' }}>
                <Sliders size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>Ready to Predict</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 300, margin: '4px auto 0' }}>
                  Adjust channel spends on the left and click <strong>Run Campaign Forecast</strong> to overlay predicted revenues.
                </div>
              </Card>
            </div>
          )}
        </StaggerItem>
      </div>

      {/* ── Prediction History Table ── */}
      {predictionHistory.length > 0 ? (
        <StaggerItem>
          <Card reveal padding="lg" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="card-title" style={{ margin: 0 }}>Prediction Execution History</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Cached records of previous runs — stored locally in this browser
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPredictionHistory([]);
                  localStorage.removeItem('forecast_history');
                  toast.info('Cleared local execution history cache.');
                }}
                className="btn btn-ghost btn-xs"
                style={{ fontSize: 10, display: 'flex', gap: 6, alignItems: 'center', color: 'var(--error)' }}
              >
                <Trash2 size={12} /> Clear Cache
              </button>
            </div>

            <div className="table-container" style={{ maxHeight: 340, overflowY: 'auto' }}>
              <table className="table" style={{ minWidth: 700 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 2 }}>
                  <tr>
                    <th style={{ minWidth: 90 }}>Date</th>
                    <th style={{ minWidth: 120 }}>Campaign Type</th>
                    <th style={{ minWidth: 80 }}>Region</th>
                    <th style={{ minWidth: 100 }}>Total Spend</th>
                    <th style={{ minWidth: 120 }}>Revenue Projection</th>
                    <th style={{ minWidth: 70 }}>ROAS</th>
                    <th style={{ minWidth: 110 }}>Reliability</th>
                    <th style={{ minWidth: 110, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionHistory.map((item) => (
                    <tr key={item.id} style={{ verticalAlign: 'middle' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--fs-xs)', fontWeight: 500 }}>
                          <Calendar size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          {item.inputs.Date}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: 10 }}>{item.inputs.Campaign_Type}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--fs-xs)' }}>{item.inputs.Region}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                          ${Object.keys(item.inputs)
                            .filter(k => k.toLowerCase().endsWith('spend'))
                            .reduce((sum, k) => sum + (Number(item.inputs[k]) || 0), 0)
                            .toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--brand-400)', fontWeight: 700 }}>
                          ${Math.round(item.results.predicted_revenue).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                          {item.results.predicted_roas.toFixed(2)}x
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700 }}>{item.results.confidence_score}%</span>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>({item.results.confidence_level})</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => handleRestoreHistory(item)}
                            className="btn btn-xs btn-primary"
                            style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '3px 8px', fontSize: 10 }}
                          >
                            <ArrowUpRight size={12} /> Restore
                          </button>
                          <button
                            onClick={() => handleDeleteHistory(item.id)}
                            className="btn btn-xs btn-ghost"
                            style={{ padding: '3px 5px', color: 'var(--error)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </StaggerItem>
      ) : (
        /* History empty state */
        <StaggerItem>
          <Card reveal padding="lg" style={{ marginTop: 20, textAlign: 'center', padding: '24px' }}>
            <Clock size={20} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              No prediction history yet
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
              Run your first campaign forecast above to start building a history log.
            </div>
          </Card>
        </StaggerItem>
      )}
    </StaggerContainer>
  );
}
