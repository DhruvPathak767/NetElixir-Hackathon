import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, FileSpreadsheet, Database } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../components/Toast.jsx';
import { uploadFile } from '../services/api.js';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';

export default function Upload() {
  const toast = useToast();
  const [dragover, setDragover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    const ok = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (!ok) return toast.error('Only CSV or Excel files are supported');
    setUploading(true);
    try {
      const res = await uploadFile(file);
      setUploaded(res);
      toast.success(`${file.name} uploaded & processed`);
    } catch {
      toast.error('Upload failed — please try again');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
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
            className={`dropzone ${dragover ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => handleFiles(e.target.files)} />
            <div className="dropzone-icon">
              {uploading ? <span className="spinner" style={{ width: 28, height: 28 }} /> : <UploadCloud size={28} />}
            </div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {uploading ? 'Processing…' : 'Click to browse or drag & drop'}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              Supports CSV, XLSX — columns auto-detected
            </div>
          </div>

          {uploaded && (
            <div style={{ marginTop: 20, padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: 600 }}>{uploaded.name}</span>
                <span className="badge badge-success" style={{ marginLeft: 'auto' }}>{uploaded.status}</span>
              </div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 12 }}>
                {uploaded.rows.toLocaleString()} rows · {(uploaded.size / 1024).toFixed(0)} KB
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detected columns</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {uploaded.detectedColumns.map((c) => <span key={c} className="tag">{c}</span>)}
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
