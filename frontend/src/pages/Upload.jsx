import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, FileSpreadsheet, Database } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../components/Toast.jsx';
import { uploadFile, getDatasetPreview } from '../services/api.js';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';

export default function Upload() {
  const toast = useToast();
  const [dragover, setDragover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(() => {
    const saved = localStorage.getItem('forecastiq_uploaded');
    return saved ? JSON.parse(saved) : null;
  });
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('forecastiq_uploaded');
    if (!saved) {
      const fetchStatus = async () => {
        try {
          const res = await getDatasetPreview();
          if (res.success && res.dataset_overview) {
            const originalName = res.dataset_overview.filename.includes('_') 
              ? res.dataset_overview.filename.split('_').slice(2).join('_') 
              : res.dataset_overview.filename;
            const uploadDetails = {
              filename: res.dataset_overview.filename,
              name: originalName || 'uploaded_data.csv',
              size: 0,
              formattedSize: res.dataset_overview.memory_usage,
              rows: res.dataset_overview.total_rows,
              detectedColumns: res.columns.column_names,
              status: 'processed'
            };
            setUploaded(uploadDetails);
            localStorage.setItem('forecastiq_uploaded', JSON.stringify(uploadDetails));
          }
        } catch (err) {
          console.log('No active uploaded file found in backend:', err.message);
        }
      };
      fetchStatus();
    }
  }, []);

  const handleFiles = async (files) => {
    if (uploading) return;
    const file = files?.[0];
    if (!file) return;
    const ok = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (!ok) return toast.error('Only CSV or Excel files are supported');
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadFile(file, (p) => setProgress(p));
      if (res.success) {
        const uploadDetails = {
          filename: res.filename,
          name: res.original_filename,
          size: file.size,
          formattedSize: res.file_size,
          rows: res.dataset?.rows || 0,
          detectedColumns: res.dataset?.column_names || [],
          status: 'processed'
        };
        setUploaded(uploadDetails);
        localStorage.setItem('forecastiq_uploaded', JSON.stringify(uploadDetails));
        toast.success(`${file.name} uploaded successfully`);
      } else {
        throw new Error(res.message || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed — please try again');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (uploading) return;
    setDragover(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Upload Data</h1>
          <p className="page-desc">Import your marketing spend & performance data</p>
        </div>
      </StaggerItem>

      <StaggerItem className="grid-2">
        <Card reveal padding="lg">
          <div className="card-title" style={{ marginBottom: 4 }}>Drop your file here</div>
          <div className="card-subtitle" style={{ marginBottom: 20 }}>CSV or Excel — up to 50MB</div>
          <div
            className={`dropzone ${dragover ? 'dragover' : ''} ${uploading ? 'disabled' : ''}`}
            onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={onDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            style={{ pointerEvents: uploading ? 'none' : 'auto', opacity: uploading ? 0.7 : 1 }}
          >
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" hidden disabled={uploading} onChange={(e) => handleFiles(e.target.files)} />
            <div className="dropzone-icon">
              {uploading ? <span className="spinner" style={{ width: 28, height: 28 }} /> : <UploadCloud size={28} />}
            </div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {uploading ? 'Uploading…' : 'Click to browse or drag & drop'}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              Supports CSV, XLSX — columns auto-detected
            </div>
          </div>

          {uploading && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', marginBottom: 6 }}>
                <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Uploading file...</span>
                <span style={{ color: 'var(--brand-400)', fontWeight: 600 }}>{progress}%</span>
              </div>
              <div className="confidence-bar">
                <div className="confidence-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {uploaded && (
            <div style={{ marginTop: 20, padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: 600 }}>{uploaded.name}</span>
                <span className="badge badge-success" style={{ marginLeft: 'auto' }}>{uploaded.status}</span>
              </div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 12 }}>
                {uploaded.rows.toLocaleString()} rows · {uploaded.formattedSize}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detected columns</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {uploaded.detectedColumns.map((c) => <span key={c} className="tag">{c}</span>)}
              </div>
              <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <Button variant="primary" size="sm" to="/app/dataset-preview">Explore Dataset</Button>
                <Button variant="secondary" size="sm" to="/app/validation-report">Validation Report</Button>
              </div>
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card reveal padding="lg">
            <div className="card-title" style={{ marginBottom: 12 }}>Supported formats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="insight-icon insight" style={{ width: 36, height: 36 }}><FileText size={18} /></span>
                <div><div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>CSV</div><div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>UTF-8, comma-separated</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="insight-icon opportunity" style={{ width: 36, height: 36 }}><FileSpreadsheet size={18} /></span>
                <div><div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>Excel (XLSX)</div><div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Single or multi-sheet</div></div>
              </div>
            </div>
          </Card>
          <Card reveal padding="lg">
            <div className="card-title" style={{ marginBottom: 12 }}>Required columns</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {['date', 'channel', 'spend', 'impressions', 'clicks', 'conversions', 'revenue'].map((c) => <span key={c} className="tag">{c}</span>)}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              Missing columns? We'll auto-map common variations during processing.
            </div>
          </Card>
          <Card reveal padding="lg" glow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="insight-icon opportunity" style={{ width: 40, height: 40 }}><Database size={20} /></span>
              <div>
                <div style={{ fontWeight: 600 }}>Connect a data source</div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>Auto-sync from Google Ads, Meta, TikTok & more</div>
              </div>
            </div>
            <Button variant="outline" fullWidth style={{ marginTop: 14 }}>Browse integrations</Button>
          </Card>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}
