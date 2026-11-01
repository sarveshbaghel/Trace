import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getComplaints, getMetrics, getFullImageUrl } from '../api/client.js';

const CATEGORIES = [
  '',
  'Pothole',
  'Garbage',
  'Streetlight',
  'Broken streetlight',
  'Water leakage',
  'Drainage',
  'Road Damage',
  'Electricity',
  'Traffic',
  'Other'
];

const STATUSES = [
  '',
  'SUBMITTED',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED'
];

const categoryIcons = {
  'Pothole': '🕳️',
  'Garbage': '🗑️',
  'Streetlight': '💡',
  'Broken streetlight': '💡',
  'Water leakage': '💧',
  'Drainage': '🌊',
  'Road Damage': '🚧',
  'Electricity': '⚡',
  'Traffic': '🚦',
  'Other': '📋',
};

export default function ReportsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, submitted: 0, inProgress: 0, resolved: 0 });

  // Sync state if URL search params change
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const st = searchParams.get('status') || '';
    if (cat !== categoryFilter) setCategoryFilter(cat);
    if (st !== statusFilter) setStatusFilter(st);
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch metrics
      const metricsData = await getMetrics().catch(() => null);

      // Fetch complaints
      const params = { page, page_size: pageSize };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await getComplaints(params);
      const rawList = Array.isArray(data) ? data : (data.reports || data.complaints || []);
      
      // Filter client-side if API returned un-paginated array
      let filtered = [...rawList];
      if (categoryFilter) {
        filtered = filtered.filter(r => (r.category || r.issue_type) === categoryFilter);
      }
      if (statusFilter) {
        filtered = filtered.filter(r => (r.status?.toUpperCase()) === statusFilter.toUpperCase());
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(r => 
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.address && r.address.toLowerCase().includes(q)) ||
          (r.category && r.category.toLowerCase().includes(q)) ||
          (r.user?.name && r.user.name.toLowerCase().includes(q))
        );
      }

      setReports(filtered);
      setTotal(data.total || filtered.length);

      const computedSubmitted = rawList.filter(r => r.status === 'SUBMITTED' || r.status === 'pending').length;
      const computedInProgress = rawList.filter(r => r.status === 'IN_PROGRESS' || r.status === 'in_progress').length;
      const computedResolved = rawList.filter(r => r.status === 'RESOLVED' || r.status === 'resolved').length;

      setStats({
        total: metricsData?.total && metricsData.total > 0 ? metricsData.total : rawList.length,
        submitted: metricsData?.submitted || metricsData?.pending || computedSubmitted,
        inProgress: metricsData?.inProgress || metricsData?.in_progress || computedInProgress,
        resolved: metricsData?.resolved || computedResolved,
      });
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, categoryFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Incident Reports Management</h2>
          <p>Triage citizen reports, inspect AI authenticity verdicts, and update resolution lifecycle</p>
        </div>
        <Link to="/" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-icons-outlined" style={{ fontSize: 18 }}>dashboard</span>
          Back to Dashboard
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <span className="material-icons-outlined">folder</span>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <span className="material-icons-outlined">pending_actions</span>
          </div>
          <div className="stat-value">{stats.submitted}</div>
          <div className="stat-label">Submitted / Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon in-progress" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <span className="material-icons-outlined">autorenew</span>
          </div>
          <div className="stat-value">{stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon resolved">
            <span className="material-icons-outlined">check_circle</span>
          </div>
          <div className="stat-value">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="card-header">
          <h3>Incident Reports</h3>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{total} total records</span>
        </div>
        <div className="card-body">
          <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <span className="material-icons-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 18 }}>
                search
              </span>
              <input
                type="text"
                placeholder="Search description, address, reporter..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  outline: 'none',
                  background: '#ffffff',
                }}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.filter(Boolean).map(c => (
                <option key={c} value={c}>{categoryIcons[c] || '📋'} {c}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              {STATUSES.filter(Boolean).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {(categoryFilter || statusFilter || searchQuery) && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setCategoryFilter('');
                  setStatusFilter('');
                  setSearchQuery('');
                  setPage(1);
                  setSearchParams({});
                }}
                style={{ padding: '0 12px', height: 38 }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              Loading incident records...
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <span className="material-icons-outlined">inbox</span>
              <p>No reports found matching your criteria</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Location</th>
                      <th>AI Verification</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => {
                      const category = report.category || report.issue_type || 'Other';
                      const status = (report.status || 'SUBMITTED').toUpperCase();
                      const statusClass = status.toLowerCase().replace('_', '-');
                      const aiVerdict = report.ai_analysis?.verdict;
                      const authScore = report.ai_analysis?.authenticity_score;

                      return (
                        <tr key={report.id}>
                          <td>
                            {report.image_url ? (
                              <img
                                src={getFullImageUrl(report.image_url)}
                                alt="Report"
                                className="report-thumb"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <span className="material-icons-outlined" style={{ color: '#cbd5e1' }}>image</span>
                            )}
                          </td>
                          <td>
                            <span className="issue-type-label">
                              {categoryIcons[category] || '📋'} {category}
                            </span>
                          </td>
                          <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {report.description}
                          </td>
                          <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {report.address || (report.latitude && report.longitude ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}` : 'N/A')}
                          </td>
                          <td>
                            {aiVerdict === 'FAKE' ? (
                              <span style={{
                                background: '#fef2f2', color: '#dc2626', padding: '3px 8px',
                                borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #fecaca',
                                display: 'inline-flex', alignItems: 'center', gap: 4
                              }}>
                                ⚠️ FAKE / AI
                              </span>
                            ) : aiVerdict === 'SUSPICIOUS' ? (
                              <span style={{
                                background: '#fef3c7', color: '#b45309', padding: '3px 8px',
                                borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #fde68a',
                                display: 'inline-flex', alignItems: 'center', gap: 4
                              }}>
                                ⚠️ SUSPICIOUS
                              </span>
                            ) : typeof authScore === 'number' ? (
                              <span style={{
                                background: authScore >= 0.7 ? '#ecfdf5' : '#fef3c7',
                                color: authScore >= 0.7 ? '#047857' : '#b45309',
                                border: authScore >= 0.7 ? '1px solid #a7f3d0' : '1px solid #fde68a',
                                padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                display: 'inline-flex', alignItems: 'center', gap: 4
                              }}>
                                {authScore >= 0.7 ? '🛡️' : '⚠️'} {Math.round(authScore * 100)}% authentic
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: 12 }}>Unscanned</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${statusClass}`}>
                              {status}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                            {new Date(report.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </td>
                          <td>
                            <Link to={`/reports/${report.id}`} className="btn btn-outline btn-sm">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        className={page === pageNum ? 'active' : ''}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
