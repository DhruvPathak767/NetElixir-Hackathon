/**
 * Reports.jsx — Report Generation and Download Center
 * Connected to reportApi.js (user-isolated localStorage-backed implementation)
 * Supports PDF and Excel report generation, search/filter, pagination, and file download.
 */
import { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet, Plus, Calendar, Trash2, RefreshCw } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { getReports, generateReport, deleteReport, downloadReportFile } from '../services/reportApi.js';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';

export default function Reports() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genOpen, setGenOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  // Search, filter, pagination states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form states
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [forecastId, setForecastId] = useState('default_forecast');

  const fetchReports = () => {
    setLoading(true);
    getReports({ search, type: filterType, page, limit: 10 })
      .then((data) => {
        setReports(data.items);
        setTotalPages(data.pages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to retrieve reports');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, [search, filterType, page]);

  const generate = () => {
    setGenLoading(true);
    const scenarioNames = {
      default_forecast: 'Baseline Forecast Scenario',
      optimistic_forecast: 'Optimistic Forecast Scenario',
      pessimistic_forecast: 'Pessimistic Forecast Scenario',
    };
    const scenarioName = scenarioNames[forecastId] || 'Baseline Forecast Scenario';

    generateReport({ reportType: selectedFormat, scenarioName })
      .then(() => {
        setGenLoading(false);
        setGenOpen(false);
        toast.success('Report generated successfully');
        setPage(1);
        fetchReports();
      })
      .catch((err) => {
        console.error(err);
        setGenLoading(false);
        toast.error('Error generating performance report');
      });
  };

  const handleDownload = (id, filename) => {
    toast.info(`Downloading ${filename}...`);
    downloadReportFile(id, filename).catch((err) => {
      console.error(err);
      toast.error('Download failed');
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteReport(id)
        .then(() => {
          toast.success('Report deleted successfully');
          fetchReports();
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to delete report');
        });
    }
  };

  return (
    <StaggerContainer>
      <StaggerItem className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-desc">Generate and download performance reports for your campaigns</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={fetchReports} leftIcon={<RefreshCw size={15} />}>
            Refresh
          </Button>
          <Button leftIcon={<Plus size={16} />} onClick={() => setGenOpen(true)}>Generate Report</Button>
        </div>
      </StaggerItem>

      <StaggerItem>
        <Card reveal padding="lg">
          {/* Filters Toolbar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search reports..."
              className="input"
              style={{ maxWidth: 260, height: 38 }}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              id="reports-search"
            />
            <select
              className="input"
              style={{ maxWidth: 160, height: 38 }}
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              id="reports-filter-type"
            >
              <option value="all">All Formats</option>
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel</option>
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              {reports.length} report{reports.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 48 }}>
              <div className="empty-state">
                <div className="empty-state-icon"><FileText size={24} /></div>
                <div className="empty-state-title">Loading reports...</div>
              </div>
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state" style={{ minHeight: '30vh' }}>
              <div className="empty-state-icon"><FileText size={28} /></div>
              <div className="empty-state-title">No reports yet</div>
              <div className="empty-state-desc">
                Generate your first report to download a summary of your campaign performance.
              </div>
              <Button style={{ marginTop: 12 }} leftIcon={<Plus size={16} />} onClick={() => setGenOpen(true)}>
                Generate Report
              </Button>
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {r.report_type === 'xlsx' ? (
                          <FileSpreadsheet size={16} style={{ color: '#10b981' }} />
                        ) : r.report_type === 'csv' ? (
                          <FileText size={16} style={{ color: '#f59e0b' }} />
                        ) : (
                          <FileText size={16} style={{ color: 'var(--brand-400)' }} />
                        )}
                        <span style={{ fontWeight: 500, fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                          {r.name || r.filename || `Report_${r.id}`}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} />
                          {r.date}
                        </div>
                      </td>
                      <td>
                        <span className="tag" style={{ textTransform: 'uppercase' }}>
                          {r.report_type}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.file_size}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="icon-btn"
                            style={{ width: 34, height: 34 }}
                            onClick={() => handleDownload(r.id, r.filename || r.name)}
                            aria-label="Download report"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="icon-btn"
                            style={{ width: 34, height: 34, color: '#ef4444' }}
                            onClick={() => handleDelete(r.id)}
                            aria-label="Delete report"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </StaggerItem>

      {/* Generate Report Modal */}
      <Modal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        title="Generate Report"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setGenOpen(false)}>Cancel</Button>
            <Button onClick={generate} loading={genLoading}>Generate</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Forecast Scenario</label>
            <select
              className="input"
              value={forecastId}
              onChange={(e) => setForecastId(e.target.value)}
              id="report-forecast-id"
            >
              <option value="default_forecast">Baseline Forecast Scenario</option>
              <option value="optimistic_forecast">Optimistic Forecast Scenario</option>
              <option value="pessimistic_forecast">Pessimistic Forecast Scenario</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Output Format</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={`btn btn-sm ${selectedFormat === 'pdf' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
                onClick={() => setSelectedFormat('pdf')}
                id="format-pdf"
              >
                <FileText size={14} style={{ marginRight: 6 }} />
                PDF
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedFormat === 'xlsx' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
                onClick={() => setSelectedFormat('xlsx')}
                id="format-xlsx"
              >
                <FileSpreadsheet size={14} style={{ marginRight: 6 }} />
                Excel
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedFormat === 'csv' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
                onClick={() => setSelectedFormat('csv')}
                id="format-csv"
              >
                <FileText size={14} style={{ marginRight: 6 }} />
                CSV
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </StaggerContainer>
  );
}
