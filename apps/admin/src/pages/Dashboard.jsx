import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getComplaints, getMetrics } from '../api/client.js';

const CATEGORY_COLORS = {
  'Pothole': '#f59e0b',
  'Garbage': '#ef4444',
  'Streetlight': '#eab308',
  'Broken streetlight': '#eab308',
  'Water leakage': '#06b6d4',
  'Drainage': '#3b82f6',
  'Road Damage': '#8b5cf6',
  'Electricity': '#ec4899',
  'Traffic': '#f97316',
  'Other': '#64748b',
};

const CATEGORY_ICONS = {
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

const CITY_COLORS = [
  '#137fec',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#64748b',
];

// Helper to extract city from address
function extractCity(address) {
  if (!address || typeof address !== 'string') return 'Unknown';
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return 'Unknown';
  
  // Look for common Indian city keywords
  const cityKeywords = ['Gwalior', 'Bhopal', 'Indore', 'Jabalpur', 'Delhi', 'Mumbai', 'Jaipur', 'Lucknow', 'Kanpur'];
  for (const part of parts) {
    for (const city of cityKeywords) {
      if (part.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
  }

  // If last part looks like a state or pincode, pick second to last
  const last = parts[parts.length - 1];
  if (/^\d{6}$/.test(last) || last.toLowerCase().includes('pradesh')) {
    return parts.length > 1 ? parts[parts.length - 2] : parts[0];
  }
  return last;
}

// Helper to extract locality / area
function extractLocality(address) {
  if (!address || typeof address !== 'string') return 'Central Zone';
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length > 0) {
    return parts[0];
  }
  return 'Central Zone';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeCategoryHover, setActiveCategoryHover] = useState(null);
  const [categoryViewMode, setCategoryViewMode] = useState('donut'); // 'donut' | 'bar'
  const [locationViewMode, setLocationViewMode] = useState('city'); // 'city' | 'locality'
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsData, complaintsData] = await Promise.all([
        getMetrics().catch(() => null),
        getComplaints().catch(() => []),
      ]);

      const rawList = Array.isArray(complaintsData)
        ? complaintsData
        : (complaintsData?.reports || complaintsData?.complaints || []);

      setReports(rawList);

      // Compute status counts from list for accuracy
      const totalCount = rawList.length;
      const submittedCount = rawList.filter(r => {
        const s = (r.status || '').toUpperCase();
        return s === 'SUBMITTED' || s === 'PENDING';
      }).length;
      const inProgressCount = rawList.filter(r => {
        const s = (r.status || '').toUpperCase();
        return s === 'IN_PROGRESS' || s === 'IN-PROGRESS';
      }).length;
      const resolvedCount = rawList.filter(r => {
        const s = (r.status || '').toUpperCase();
        return s === 'RESOLVED';
      }).length;
      const rejectedCount = rawList.filter(r => {
        const s = (r.status || '').toUpperCase();
        return s === 'REJECTED';
      }).length;

      // Prefer non-zero metrics or computed counts
      setStats({
        total: metricsData?.total && metricsData.total > 0 ? metricsData.total : totalCount,
        submitted: metricsData?.submitted || metricsData?.pending || submittedCount,
        inProgress: metricsData?.inProgress || metricsData?.in_progress || inProgressCount,
        resolved: metricsData?.resolved || resolvedCount,
        rejected: rejectedCount,
      });

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category Aggregation
  const categoryStats = useMemo(() => {
    const counts = {};
    reports.forEach((r) => {
      const cat = r.category || r.issue_type || 'Other';
      if (!counts[cat]) {
        counts[cat] = {
          name: cat,
          count: 0,
          submitted: 0,
          inProgress: 0,
          resolved: 0,
          color: CATEGORY_COLORS[cat] || '#64748b',
          icon: CATEGORY_ICONS[cat] || '📋',
        };
      }
      counts[cat].count += 1;
      const st = (r.status || '').toUpperCase();
      if (st === 'RESOLVED') counts[cat].resolved += 1;
      else if (st === 'IN_PROGRESS' || st === 'IN-PROGRESS') counts[cat].inProgress += 1;
      else counts[cat].submitted += 1;
    });

    const total = reports.length || 1;
    return Object.values(counts)
      .map(item => ({
        ...item,
        percentage: ((item.count / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  // Location / City Aggregation
  const locationStats = useMemo(() => {
    const isCity = locationViewMode === 'city';
    const counts = {};

    reports.forEach((r) => {
      const key = isCity ? extractCity(r.address) : extractLocality(r.address);
      if (!counts[key]) {
        counts[key] = {
          name: key,
          count: 0,
          submitted: 0,
          inProgress: 0,
          resolved: 0,
          topCategory: {},
        };
      }
      counts[key].count += 1;
      const st = (r.status || '').toUpperCase();
      if (st === 'RESOLVED') counts[key].resolved += 1;
      else if (st === 'IN_PROGRESS' || st === 'IN-PROGRESS') counts[key].inProgress += 1;
      else counts[key].submitted += 1;

      const cat = r.category || r.issue_type || 'Other';
      counts[key].topCategory[cat] = (counts[key].topCategory[cat] || 0) + 1;
    });

    const total = reports.length || 1;
    return Object.values(counts)
      .map((item, idx) => {
        // Find most frequent issue in this location
        let topIssue = 'General';
        let maxCount = 0;
        Object.entries(item.topCategory).forEach(([issue, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topIssue = issue;
          }
        });

        return {
          ...item,
          percentage: ((item.count / total) * 100).toFixed(1),
          color: CITY_COLORS[idx % CITY_COLORS.length],
          topIssue,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [reports, locationViewMode]);

  // Authenticity & Resolution Rates
  const authenticScore = useMemo(() => {
    const analyzed = reports.filter(r => r.ai_analysis && typeof r.ai_analysis.authenticity_score === 'number');
    if (analyzed.length === 0) return 92;
    const sum = analyzed.reduce((acc, r) => acc + (r.ai_analysis.authenticity_score || 0), 0);
    return Math.round((sum / analyzed.length) * 100);
  }, [reports]);

  const resolutionRate = useMemo(() => {
    if (!stats.total || stats.total === 0) return 0;
    return Math.round((stats.resolved / stats.total) * 100);
  }, [stats]);

  // SVG Donut calculations
  const donutSegments = useMemo(() => {
    const total = reports.length || 1;
    let accumulatedAngle = 0;
    const radius = 70;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;

    return categoryStats.map((cat) => {
      const fraction = cat.count / total;
      const strokeDasharray = `${fraction * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedAngle * circumference;
      accumulatedAngle += fraction;

      return {
        ...cat,
        strokeDasharray,
        strokeDashoffset,
        radius,
        strokeWidth,
      };
    });
  }, [categoryStats, reports.length]);

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="dashboard-header-container">
        <div>
          <div className="dashboard-badge-row">
            <span className="live-pulse-badge">
              <span className="pulse-dot"></span>
              Live Operations Monitoring
            </span>
            <span className="refresh-time">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <h2 className="dashboard-title">City Operations Console</h2>
          <p className="dashboard-subtitle">
            Real-time analytics, category breakdowns, and geographic incident distribution across urban zones
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-outline"
            title="Refresh analytics data"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className={`material-icons-outlined ${loading ? 'spin-icon' : ''}`} style={{ fontSize: 18 }}>
              refresh
            </span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          <Link to="/reports" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-icons-outlined" style={{ fontSize: 18 }}>list_alt</span>
            Incident Reports ({stats.total})
          </Link>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="stats-grid dashboard-stats-grid">
        <div className="stat-card stat-card-interactive" onClick={() => navigate('/reports')}>
          <div className="stat-card-header">
            <div className="stat-icon total">
              <span className="material-icons-outlined">folder</span>
            </div>
            <span className="stat-card-badge">Total</span>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Reports Logged</div>
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: '100%', background: '#137fec' }} />
          </div>
        </div>

        <div className="stat-card stat-card-interactive" onClick={() => navigate('/reports?status=SUBMITTED')}>
          <div className="stat-card-header">
            <div className="stat-icon submitted">
              <span className="material-icons-outlined">pending_actions</span>
            </div>
            <span className="stat-card-badge warning">Action Needed</span>
          </div>
          <div className="stat-value">{stats.submitted}</div>
          <div className="stat-label">Submitted / Pending Review</div>
          <div className="stat-progress-bar">
            <div
              className="stat-progress-fill"
              style={{
                width: `${stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0}%`,
                background: '#f59e0b',
              }}
            />
          </div>
        </div>

        <div className="stat-card stat-card-interactive" onClick={() => navigate('/reports?status=IN_PROGRESS')}>
          <div className="stat-card-header">
            <div className="stat-icon in-progress" style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <span className="material-icons-outlined">autorenew</span>
            </div>
            <span className="stat-card-badge info">Active</span>
          </div>
          <div className="stat-value">{stats.inProgress}</div>
          <div className="stat-label">In Progress / Assigned</div>
          <div className="stat-progress-bar">
            <div
              className="stat-progress-fill"
              style={{
                width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%`,
                background: '#3b82f6',
              }}
            />
          </div>
        </div>

        <div className="stat-card stat-card-interactive" onClick={() => navigate('/reports?status=RESOLVED')}>
          <div className="stat-card-header">
            <div className="stat-icon resolved">
              <span className="material-icons-outlined">check_circle</span>
            </div>
            <span className="stat-card-badge success">Complete</span>
          </div>
          <div className="stat-value">{stats.resolved}</div>
          <div className="stat-label">Successfully Resolved</div>
          <div className="stat-progress-bar">
            <div
              className="stat-progress-fill"
              style={{
                width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`,
                background: '#10b981',
              }}
            />
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="secondary-kpi-bar">
        <div className="secondary-kpi-item">
          <div className="kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <span className="material-icons-outlined">verified</span>
          </div>
          <div>
            <div className="secondary-kpi-val">{authenticScore}%</div>
            <div className="secondary-kpi-lbl">AI Authenticity Trust Score</div>
          </div>
        </div>

        <div className="secondary-kpi-divider" />

        <div className="secondary-kpi-item">
          <div className="kpi-icon-wrap" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <span className="material-icons-outlined">trending_up</span>
          </div>
          <div>
            <div className="secondary-kpi-val">{resolutionRate}%</div>
            <div className="secondary-kpi-lbl">Resolution Efficiency Rate</div>
          </div>
        </div>

        <div className="secondary-kpi-divider" />

        <div className="secondary-kpi-item">
          <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <span className="material-icons-outlined">location_city</span>
          </div>
          <div>
            <div className="secondary-kpi-val">{locationStats.length}</div>
            <div className="secondary-kpi-lbl">Active Geographic Zones</div>
          </div>
        </div>

        <div className="secondary-kpi-divider" />

        <div className="secondary-kpi-item">
          <div className="kpi-icon-wrap" style={{ background: '#f3e8ff', color: '#9333ea' }}>
            <span className="material-icons-outlined">category</span>
          </div>
          <div>
            <div className="secondary-kpi-val">{categoryStats.length}</div>
            <div className="secondary-kpi-lbl">Issue Categories Tracked</div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="dashboard-charts-grid">
        {/* Graph 1: Category-Wise Graph */}
        <div className="card chart-card">
          <div className="card-header chart-card-header">
            <div>
              <div className="chart-header-title">
                <span className="material-icons-outlined" style={{ color: '#137fec' }}>pie_chart</span>
                <h3>Incident Distribution by Category</h3>
              </div>
              <p className="chart-header-sub">Breakdown of reported civic issues by department classification</p>
            </div>

            <div className="chart-view-toggle">
              <button
                className={`toggle-btn ${categoryViewMode === 'donut' ? 'active' : ''}`}
                onClick={() => setCategoryViewMode('donut')}
                title="Donut Chart View"
              >
                <span className="material-icons-outlined">donut_large</span>
              </button>
              <button
                className={`toggle-btn ${categoryViewMode === 'bar' ? 'active' : ''}`}
                onClick={() => setCategoryViewMode('bar')}
                title="Bar Chart View"
              >
                <span className="material-icons-outlined">bar_chart</span>
              </button>
            </div>
          </div>

          <div className="card-body">
            {reports.length === 0 ? (
              <div className="chart-empty-state">
                <span className="material-icons-outlined">pie_chart_outline</span>
                <p>No category data available yet</p>
              </div>
            ) : categoryViewMode === 'donut' ? (
              <div className="donut-chart-layout">
                {/* SVG Donut */}
                <div className="donut-svg-wrapper">
                  <svg viewBox="0 0 200 200" className="donut-svg">
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="24"
                    />
                    {donutSegments.map((seg) => {
                      const isHovered = activeCategoryHover === seg.name;
                      return (
                        <circle
                          key={seg.name}
                          cx="100"
                          cy="100"
                          r={seg.radius}
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth={isHovered ? 28 : seg.strokeWidth}
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          transform="rotate(-90 100 100)"
                          className="donut-circle-segment"
                          onMouseEnter={() => setActiveCategoryHover(seg.name)}
                          onMouseLeave={() => setActiveCategoryHover(null)}
                          style={{
                            cursor: 'pointer',
                            transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                            opacity: activeCategoryHover && !isHovered ? 0.45 : 1,
                          }}
                        />
                      );
                    })}
                  </svg>

                  {/* Donut Center Info */}
                  <div className="donut-center-info">
                    {activeCategoryHover ? (
                      <>
                        <div className="donut-center-icon">
                          {CATEGORY_ICONS[activeCategoryHover] || '📋'}
                        </div>
                        <div className="donut-center-value">
                          {categoryStats.find(c => c.name === activeCategoryHover)?.count || 0}
                        </div>
                        <div className="donut-center-label">{activeCategoryHover}</div>
                      </>
                    ) : (
                      <>
                        <div className="donut-center-value">{reports.length}</div>
                        <div className="donut-center-label">Total Incidents</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Category Legend & Details */}
                <div className="category-legend-list">
                  {categoryStats.map((cat) => {
                    const isHovered = activeCategoryHover === cat.name;
                    return (
                      <div
                        key={cat.name}
                        className={`category-legend-item ${isHovered ? 'highlighted' : ''}`}
                        onMouseEnter={() => setActiveCategoryHover(cat.name)}
                        onMouseLeave={() => setActiveCategoryHover(null)}
                        onClick={() => navigate(`/reports?category=${encodeURIComponent(cat.name)}`)}
                      >
                        <div className="category-legend-left">
                          <span
                            className="category-color-dot"
                            style={{ background: cat.color }}
                          />
                          <span className="category-item-icon">{cat.icon}</span>
                          <span className="category-item-name">{cat.name}</span>
                        </div>

                        <div className="category-legend-right">
                          <div className="category-bar-pill">
                            <div
                              className="category-bar-fill"
                              style={{ width: `${cat.percentage}%`, background: cat.color }}
                            />
                          </div>
                          <span className="category-count-badge">{cat.count}</span>
                          <span className="category-percentage-text">{cat.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Bar Chart View */
              <div className="category-bars-layout">
                {categoryStats.map((cat) => (
                  <div
                    key={cat.name}
                    className="bar-chart-row"
                    onClick={() => navigate(`/reports?category=${encodeURIComponent(cat.name)}`)}
                  >
                    <div className="bar-row-header">
                      <div className="bar-row-title">
                        <span>{cat.icon}</span>
                        <strong>{cat.name}</strong>
                      </div>
                      <div className="bar-row-meta">
                        <span className="badge-count" style={{ background: `${cat.color}15`, color: cat.color }}>
                          {cat.count} {cat.count === 1 ? 'incident' : 'incidents'}
                        </span>
                        <span className="bar-row-percentage">{cat.percentage}%</span>
                      </div>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${cat.percentage}%`, background: cat.color }}
                      />
                    </div>
                    <div className="bar-status-breakdown">
                      <span className="status-dot-indicator submitted">
                        ● {cat.submitted} submitted
                      </span>
                      <span className="status-dot-indicator in-progress">
                        ● {cat.inProgress} in progress
                      </span>
                      <span className="status-dot-indicator resolved">
                        ● {cat.resolved} resolved
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-footer chart-card-footer">
            <span style={{ fontSize: 13, color: '#64748b' }}>
              💡 Click on any category to view and filter its incident reports
            </span>
            <Link to="/reports" className="link-action">
              View all in Reports →
            </Link>
          </div>
        </div>

        {/* Graph 2: Location-Wise / City-Wise Graph */}
        <div className="card chart-card">
          <div className="card-header chart-card-header">
            <div>
              <div className="chart-header-title">
                <span className="material-icons-outlined" style={{ color: '#10b981' }}>location_on</span>
                <h3>Geographic Distribution by {locationViewMode === 'city' ? 'City' : 'Locality'}</h3>
              </div>
              <p className="chart-header-sub">Incident concentration and resolution rates by geographic zone</p>
            </div>

            <div className="location-mode-pills">
              <button
                className={`location-mode-pill ${locationViewMode === 'city' ? 'active' : ''}`}
                onClick={() => setLocationViewMode('city')}
              >
                By City
              </button>
              <button
                className={`location-mode-pill ${locationViewMode === 'locality' ? 'active' : ''}`}
                onClick={() => setLocationViewMode('locality')}
              >
                By Locality
              </button>
            </div>
          </div>

          <div className="card-body">
            {reports.length === 0 ? (
              <div className="chart-empty-state">
                <span className="material-icons-outlined">map</span>
                <p>No location data available yet</p>
              </div>
            ) : (
              <div className="location-chart-layout">
                {/* Ranking bars */}
                <div className="location-bars-list">
                  {locationStats.map((loc, index) => {
                    const maxCount = locationStats[0]?.count || 1;
                    const relativeWidth = Math.max(12, Math.round((loc.count / maxCount) * 100));

                    return (
                      <div key={loc.name} className="location-bar-item">
                        <div className="location-item-top">
                          <div className="location-name-group">
                            <span className="location-rank-badge">#{index + 1}</span>
                            <span className="location-name">{loc.name}</span>
                            <span className="location-top-tag">
                              Most common: {loc.topIssue}
                            </span>
                          </div>

                          <div className="location-counts">
                            <span className="location-total-count">{loc.count} reports</span>
                            <span className="location-share-pct">{loc.percentage}%</span>
                          </div>
                        </div>

                        {/* Bar */}
                        <div className="location-bar-track">
                          <div
                            className="location-bar-fill"
                            style={{
                              width: `${relativeWidth}%`,
                              background: `linear-gradient(90deg, ${loc.color}, #38bdf8)`,
                            }}
                          />
                        </div>

                        {/* Status split for this location */}
                        <div className="location-status-split">
                          <div className="location-status-badge">
                            <span className="status-pip submitted"></span>
                            <span>{loc.submitted} Pending</span>
                          </div>
                          <div className="location-status-badge">
                            <span className="status-pip in-progress"></span>
                            <span>{loc.inProgress} In Progress</span>
                          </div>
                          <div className="location-status-badge">
                            <span className="status-pip resolved"></span>
                            <span>{loc.resolved} Resolved</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hotspot & Map Link Card */}
                <div className="location-quick-stats">
                  <div className="hotspot-card">
                    <div className="hotspot-card-icon">
                      <span className="material-icons-outlined">fmd_good</span>
                    </div>
                    <div>
                      <div className="hotspot-title">Top Civic Hub</div>
                      <div className="hotspot-val">{locationStats[0]?.name || 'N/A'}</div>
                      <div className="hotspot-sub">
                        {locationStats[0]?.count || 0} incidents ({locationStats[0]?.percentage || 0}% of all reports)
                      </div>
                    </div>
                  </div>

                  <Link to="/map" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="material-icons-outlined">map</span>
                    Open Full Incident Map
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="card-footer chart-card-footer">
            <span style={{ fontSize: 13, color: '#64748b' }}>
              📍 Visualizing incident density across monitored municipal zones
            </span>
            <Link to="/map" className="link-action">
              Inspect on Map →
            </Link>
          </div>
        </div>
      </div>

      {/* Resolution & Category Cross-Matrix */}
      <div className="card status-matrix-card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-icons-outlined" style={{ color: '#8b5cf6' }}>stacked_bar_chart</span>
              <h3>Resolution Pipeline by Category</h3>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              Status breakdown showing pending reviews, work in progress, and closed reports across categories
            </p>
          </div>
          <Link to="/reports" className="btn btn-outline btn-sm">
            Manage All Reports
          </Link>
        </div>

        <div className="card-body">
          <div className="matrix-table-container">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Reports</th>
                  <th>Pending Review</th>
                  <th>In Progress</th>
                  <th>Resolved</th>
                  <th>Resolution Progress</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((cat) => {
                  const resolvedPct = cat.count > 0 ? Math.round((cat.resolved / cat.count) * 100) : 0;
                  return (
                    <tr key={cat.name}>
                      <td>
                        <span className="category-cell">
                          <span style={{ fontSize: 18 }}>{cat.icon}</span>
                          <strong>{cat.name}</strong>
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#1e293b' }}>
                          {cat.count}
                        </span>
                      </td>
                      <td>
                        <span className="badge submitted" style={{ fontSize: 12 }}>
                          {cat.submitted}
                        </span>
                      </td>
                      <td>
                        <span className="badge in-progress" style={{ fontSize: 12 }}>
                          {cat.inProgress}
                        </span>
                      </td>
                      <td>
                        <span className="badge resolved" style={{ fontSize: 12 }}>
                          {cat.resolved}
                        </span>
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div className="matrix-progress-wrapper">
                          <div className="matrix-progress-track">
                            <div
                              className="matrix-progress-fill"
                              style={{ width: `${resolvedPct}%`, background: '#10b981' }}
                            />
                          </div>
                          <span className="matrix-pct-label">{resolvedPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
