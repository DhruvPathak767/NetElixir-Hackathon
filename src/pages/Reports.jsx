import { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet, Plus, Calendar } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { getReports } from '../services/api.js';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';

export default function Reports() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genOpen, setGenOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    getReports().then((r) => { setReports(r); setLoading(false); });
  }, []);

  const generate = () => {
    setGenLoading(true);
    setTimeout(() => {
      setGenLoading(false);
      setGenOpen(false);
      const newReport = { id: Date.now(), name: 'Custom Report — ' + new Date().toLocaleDateString(), date: new Date().toISOString().split('T')[0], type: 'pdf', size: '1.5 MB' };
      setReports((r) => [newReport, ...r]);
      toast.success('Report generated');
    }, 1500);
  };

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-desc">Generate and download performance reports</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setGenOpen(true)}>Generate Report</Button>
      </StaggerItem>

      <StaggerItem>
        <Card reveal padding="lg">
        {loading ? (
          <div style={{ padding: 40 }}><div className="empty-state"><div className="empty-state-icon"><FileText size={24} /></div><div className="empty-state-title">Loading reports…</div></div></div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={24} /></div>
            <div className="empty-state-title">No reports yet</div>
            <div className="empty-state-desc">Generate your first report to download a summary of your marketing performance.</div>
            <Button style={{ marginTop: 8 }} leftIcon={<Plus size={16} />} onClick={() => setGenOpen(true)}>Generate Report</Button>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Report</th><th>Date</th><th>Type</th><th>Size</th><th></th></tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {r.type === 'xlsx' ? <FileSpreadsheet size={16} style={{ color: 'var(--accent-400)' }} /> : <FileText size={16} style={{ color: 'var(--brand-400)' }} />}
                    {r.name}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={13} /> {r.date}</td>
                  <td><span className="tag" style={{ textTransform: 'uppercase' }}>{r.type}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.size}</td>
                  <td><button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => toast.info(`Downloading ${r.name}…`)} aria-label="Download"><Download size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </Card>
      </StaggerItem>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate Report"
        footer={<><Button variant="ghost" onClick={() => setGenOpen(false)}>Cancel</Button><Button onClick={generate} loading={genLoading}>Generate</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Report type</label>
            <select className="input" defaultValue="summary">
              <option value="summary">Performance Summary</option>
              <option value="channel">Channel Efficiency Analysis</option>
              <option value="budget">Budget Optimization Plan</option>
              <option value="forecast">Forecast Report</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Date range</label>
            <select className="input" defaultValue="30">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="12">Last 12 months</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Format</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>PDF</button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Excel</button>
            </div>
          </div>
        </div>
      </Modal>
    </StaggerContainer>
  );
}
