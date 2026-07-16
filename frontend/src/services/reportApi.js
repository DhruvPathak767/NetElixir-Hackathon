/**
 * reportApi.js — Real backend-connected report service
 * Calls POST /reports/generate, GET /reports, GET /reports/download/{id}, DELETE /reports/{id}
 * All responses are user-isolated at the backend via JWT authentication.
 */
import axiosClient from './axios.js';

/**
 * Fetch paginated and filtered report history for the authenticated user.
 */
export async function getReports({ search, type, page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  if (type && type !== 'all') params.type = type;

  const res = await axiosClient.get('/reports', { params });
  // Backend returns: { success, data: { items, total, page, pages } }
  return res.data.data || res.data;
}

export async function generateReport({ reportType = 'txt', scenarioName = 'Baseline Forecast Scenario' } = {}) {
  const res = await axiosClient.post('/reports/generate', {
    report_type: reportType,
    scenario_name: scenarioName
  });
  return res.data.data || res.data;
}

/**
 * Delete a report by its string ID.
 */
export async function deleteReport(id) {
  const res = await axiosClient.delete(`/reports/${id}`);
  return res.data;
}

/**
 * Downloads a report file from the backend via blob streaming.
 */
export async function downloadReportFile(id, filename) {
  const res = await axiosClient.get(`/reports/download/${id}`, {
    responseType: 'blob'
  });

  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `report_${id}`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
}
