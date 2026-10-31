import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getComplaints } from '../api/client.js';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

export default function MapView() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      const data = await getComplaints({ page: 1, page_size: 500 });
      const list = Array.isArray(data) ? data : (data.reports || data.complaints || []);
      // Filter those with valid coordinates
      const valid = list.filter(r => typeof r.latitude === 'number' && typeof r.longitude === 'number');
      setReports(valid);
    } catch (err) {
      console.error('Failed to fetch reports for map:', err);
    } finally {
      setLoading(false);
    }
  };

  // Center on reports or default coordinates (Gwalior / Delhi default)
  const center = reports.length > 0
    ? [reports[0].latitude, reports[0].longitude]
    : [26.2183, 78.1828];

  return (
    <>
      <div className="page-header">
        <h2>Geographic Incident Map</h2>
        <p>Live spatial distribution of citizen reports across the jurisdiction</p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          Loading map coordinates...
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="map-container" style={{ height: '75vh', width: '100%' }}>
              <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%', minHeight: 500 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {reports.map((report) => {
                  const category = report.category || report.issue_type || 'Other';
                  const status = (report.status || 'SUBMITTED').toUpperCase();
                  const statusClass = status.toLowerCase().replace('_', '-');

                  return (
                    <Marker key={report.id} position={[report.latitude, report.longitude]}>
                      <Popup>
                        <div style={{ minWidth: 220, padding: 4 }}>
                          <strong style={{ fontSize: 14 }}>
                            {categoryIcons[category] || '📋'} {category}
                          </strong>
                          <p style={{ fontSize: 13, margin: '6px 0', color: '#334155' }}>
                            {report.description?.slice(0, 100)}...
                          </p>
                          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                            📍 {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                          </p>
                          <span className={`badge ${statusClass}`} style={{ marginBottom: 10, display: 'inline-block' }}>
                            {status}
                          </span>
                          <br />
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => navigate(`/reports/${report.id}`)}
                          >
                            Inspect Details
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
