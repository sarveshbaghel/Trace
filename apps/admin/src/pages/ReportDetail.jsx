import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getComplaint,
  updateComplaintStatus,
  escalateComplaint,
  resolveComplaint,
  declineComplaint,
  postToX,
  analyzeComplaintTrufor,
  getFullImageUrl
} from '../api/client.js';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DECLINE_REASONS = [
  'Fake report / AI generated',
  'Duplicate report',
  'Invalid evidence / Blur image',
  'Not a civic issue',
  'Insufficient information',
  'Other',
];

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState(null);

  // TruFor AI state
  const [analyzingTrufor, setAnalyzingTrufor] = useState(false);
  const [imageViewMode, setImageViewMode] = useState('original'); // 'original' | 'heatmap' | 'split'

  // Resolve workflow state
  const [resolveImage, setResolveImage] = useState(null);
  const [resolveImagePreview, setResolveImagePreview] = useState(null);
  const [resolvedNote, setResolvedNote] = useState('');
  const fileInputRef = useRef(null);

  // Decline workflow state
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState(DECLINE_REASONS[0]);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const data = await getComplaint(id);
      setReport(data);
      setAdminNote(data.admin_note || '');
      if (data.ai_analysis?.heatmap_url) {
        setImageViewMode('heatmap');
      }
    } catch (err) {
      console.error('Failed to fetch report detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTrufor = async () => {
    setAnalyzingTrufor(true);
    setMessage(null);
    try {
      const result = await analyzeComplaintTrufor(id);
      const updatedReport = result.complaint || {
        ...report,
        ai_analysis: result.analysis,
      };
      setReport(updatedReport);
      if (result.analysis?.heatmap_url) {
        setImageViewMode('heatmap');
      }
      const scorePct = typeof result.analysis?.authenticity_score === 'number'
        ? `${Math.round(result.analysis.authenticity_score * 100)}%`
        : '';
      setMessage({
        type: 'success',
        text: `✅ TruFor AI analysis completed! Authenticity: ${scorePct} (${result.analysis?.verdict || 'DONE'})`,
      });
    } catch (err) {
      console.error('TruFor analysis failed:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'TruFor analysis failed to complete.',
      });
    } finally {
      setAnalyzingTrufor(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    setActionLoading(status);
    setMessage(null);
    try {
      const updated = await updateComplaintStatus(id, status, adminNote || undefined);
      setReport(prev => ({ ...prev, ...(updated.complaint || updated), status }));
      setMessage({ type: 'success', text: `Report status updated to ${status}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setActionLoading('');
    }
  };

  const handleEscalate = async () => {
    setActionLoading('escalate');
    setMessage(null);
    try {
      const result = await escalateComplaint(id);
      setMessage({ type: 'success', text: result.message || 'Report escalated to municipal authorities' });
      await fetchReport();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Escalation failed' });
    } finally {
      setActionLoading('');
    }
  };

  const handlePostToX = async () => {
    setActionLoading('x');
    setMessage(null);
    try {
      const result = await postToX(id);
      setMessage({ type: 'success', text: result.message || 'Complaint broadcasted to X' });
      await fetchReport();
    } catch (err) {
      // Fallback: open Twitter web intent
      const category = report?.category || 'Civic Issue';
      const text = `🚨 Civic Issue Reported: ${category} at ${report?.address || 'City Location'}. Action required by municipal authorities. #TraceApp #CivicAction`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
      setMessage({ type: 'success', text: 'Opened X (Twitter) broadcast composer' });
    } finally {
      setActionLoading('');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolveImage(file);
      setResolveImagePreview(URL.createObjectURL(file));
    }
  };

  const handleResolve = async () => {
    if (!resolveImage) {
      setMessage({ type: 'error', text: 'Please upload a resolution photo before resolving.' });
      return;
    }
    setActionLoading('resolving');
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('image', resolveImage);
      if (resolvedNote) {
        formData.append('resolved_note', resolvedNote);
      }
      const result = await resolveComplaint(id, formData);
      setReport(result.complaint || result.report || { ...report, status: 'RESOLVED', resolved_note: resolvedNote });
      setMessage({ type: 'success', text: '✅ Complaint marked as resolved!' });
      setResolveImage(null);
      setResolveImagePreview(null);
      setResolvedNote('');
    } catch (err) {
      // Fallback if endpoint is simulated
      await handleUpdateStatus('RESOLVED');
      setMessage({ type: 'success', text: '✅ Marked complaint as RESOLVED' });
    } finally {
      setActionLoading('');
    }
  };

  const handleDecline = async () => {
    setShowDeclineDialog(false);
    setActionLoading('declining');
    setMessage(null);
    try {
      const result = await declineComplaint(id, declineReason);
      setReport(result.complaint || result.report || { ...report, status: 'REJECTED', decline_reason: declineReason });
      setMessage({ type: 'success', text: '❌ Report declined and marked rejected.' });
    } catch (err) {
      await handleUpdateStatus('REJECTED');
      setMessage({ type: 'success', text: '❌ Marked complaint as REJECTED' });
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading complaint details...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="empty-state">
        <span className="material-icons-outlined">error_outline</span>
        <p>Complaint not found</p>
        <button className="btn btn-outline" onClick={() => navigate('/reports')}>
          Back to Reports
        </button>
      </div>
    );
  }

  const category = report.category || report.issue_type || 'Civic Issue';
  const status = (report.status || 'SUBMITTED').toUpperCase();
  const statusClass = status.toLowerCase().replace('_', '-');
  const isFinal = status === 'RESOLVED' || status === 'REJECTED';
  const mapsUrl = `https://maps.google.com/?q=${report.latitude},${report.longitude}`;
  const ai = report.ai_analysis;

  return (
    <>
      <a className="back-link" onClick={() => navigate(-1)}>
        <span className="material-icons-outlined" style={{ fontSize: 18 }}>arrow_back</span>
        Back to incident list
      </a>

      <div className="page-header">
        <h2>Incident Details</h2>
        <p>Reference ID: {report.id}</p>
      </div>

      {message && (
        <div
          className="error-msg"
          style={{
            background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: message.type === 'success' ? '#047857' : '#dc2626',
            borderColor: message.type === 'success' ? '#a7f3d0' : '#fecaca',
            borderWidth: 1,
            borderStyle: 'solid',
            marginBottom: 20,
          }}
        >
          {message.text}
        </div>
      )}

      <div className="detail-grid">
        {/* Left Column: Media & Map */}
        <div>
          {/* Evidence Card with Interactive TruFor Heatmap Switch */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>📸 Evidence Photo</h3>
                {ai?.heatmap_url && (
                  <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
                    <button
                      type="button"
                      onClick={() => setImageViewMode('original')}
                      className={`btn btn-sm ${imageViewMode === 'original' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '3px 10px', fontSize: 12, height: 'auto', borderRadius: 6 }}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageViewMode('heatmap')}
                      className={`btn btn-sm ${imageViewMode === 'heatmap' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '3px 10px', fontSize: 12, height: 'auto', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      🔥 Heatmap
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageViewMode('split')}
                      className={`btn btn-sm ${imageViewMode === 'split' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '3px 10px', fontSize: 12, height: 'auto', borderRadius: 6 }}
                    >
                      🔀 Split
                    </button>
                  </div>
                )}
              </div>

              {ai?.verdict === 'FAKE' ? (
                <span style={{
                  background: '#fef2f2', color: '#dc2626', padding: '4px 10px',
                  borderRadius: 6, fontSize: 12, fontWeight: 700, border: '1px solid #fecaca'
                }}>
                  ⚠️ AI FLAG: TAMPERED / FAKE
                </span>
              ) : ai?.verdict === 'SUSPICIOUS' ? (
                <span style={{
                  background: '#fef3c7', color: '#b45309', padding: '4px 10px',
                  borderRadius: 6, fontSize: 12, fontWeight: 700, border: '1px solid #fde68a'
                }}>
                  ⚠️ SUSPICIOUS ANOMALY
                </span>
              ) : ai ? (
                <span style={{
                  background: '#ecfdf5', color: '#047857', padding: '4px 10px',
                  borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid #a7f3d0'
                }}>
                  ✅ Camera Sensor Verified
                </span>
              ) : (
                <span style={{
                  background: '#f8fafc', color: '#64748b', padding: '4px 10px',
                  borderRadius: 6, fontSize: 12, fontWeight: 500, border: '1px solid #e2e8f0'
                }}>
                  Unverified
                </span>
              )}
            </div>

            <div className="detail-image" style={{ position: 'relative', overflow: 'hidden' }}>
              {!report.image_url ? (
                <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                  <span className="material-icons-outlined" style={{ fontSize: 48, color: '#cbd5e1' }}>image</span>
                </div>
              ) : imageViewMode === 'split' && ai?.heatmap_url ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: '#0f172a' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={getFullImageUrl(report.image_url)}
                      alt="Original Evidence"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <span style={{
                      position: 'absolute', bottom: 8, left: 8,
                      background: 'rgba(0,0,0,0.7)', color: 'white',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                    }}>
                      Original
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={getFullImageUrl(ai.heatmap_url)}
                      alt="TruFor Heatmap"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <span style={{
                      position: 'absolute', bottom: 8, left: 8,
                      background: 'rgba(239, 68, 68, 0.85)', color: 'white',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                    }}>
                      TruFor Anomaly Heatmap
                    </span>
                  </div>
                </div>
              ) : imageViewMode === 'heatmap' && ai?.heatmap_url ? (
                <div>
                  <img
                    src={getFullImageUrl(ai.heatmap_url)}
                    alt="TruFor Forensic Heatmap"
                    style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'contain', background: '#0f172a' }}
                  />
                  <div style={{
                    padding: '8px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12
                  }}>
                    <span style={{ color: '#3b82f6', fontWeight: 600 }}>🔵 Camera Sensor Noise</span>
                    <div style={{
                      height: 8, width: 140, borderRadius: 4,
                      background: 'linear-gradient(90deg, #0000ff 0%, #00ffff 30%, #ffff00 70%, #ff0000 100%)'
                    }} />
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>🔴 Manipulated / AI Area</span>
                  </div>
                </div>
              ) : (
                <img
                  src={getFullImageUrl(report.image_url)}
                  alt="Incident Evidence"
                  style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'contain', background: '#0f172a' }}
                />
              )}
            </div>
          </div>

          {/* Location Card */}
          <div className="card">
            <div className="card-header">
              <h3>📍 Incident Location</h3>
              {report.latitude && report.longitude && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                  <span className="material-icons-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                  Google Maps
                </a>
              )}
            </div>
            <div className="card-body">
              <div className="detail-field">
                <div className="label">Address / Landmark</div>
                <div className="value">{report.address || 'Address not resolved'}</div>
              </div>
              <div className="detail-field">
                <div className="label">Coordinates</div>
                <div className="value">
                  {report.latitude && report.longitude
                    ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
                    : 'N/A'}
                </div>
              </div>
              {report.latitude && report.longitude && (
                <div style={{ height: 220, width: '100%', marginTop: 16, borderRadius: 8, overflow: 'hidden' }}>
                  <MapContainer
                    center={[report.latitude, report.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[report.latitude, report.longitude]} />
                  </MapContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Info & Actions */}
        <div>
          {/* Information Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3>Incident Overview</h3>
              <span className={`badge ${statusClass}`}>{status}</span>
            </div>
            <div className="card-body">
              <div className="detail-field">
                <div className="label">Category</div>
                <div className="value" style={{ fontSize: 18, fontWeight: 700, color: '#137fec' }}>
                  {category}
                </div>
              </div>
              <div className="detail-field">
                <div className="label">Description</div>
                <div className="value" style={{ lineHeight: 1.6 }}>{report.description}</div>
              </div>
              <div className="detail-field">
                <div className="label">Submitted Date & Time</div>
                <div className="value">
                  {new Date(report.created_at).toLocaleString('en-US', {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
              {report.user && (
                <div className="detail-field">
                  <div className="label">Reported By</div>
                  <div className="value">
                    {report.user.name || 'Anonymous User'}
                    {report.user.phone ? ` (${report.user.phone})` : ''}
                    {report.user.email ? ` • ${report.user.email}` : ''}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Verification Analysis (TruFor Integration) */}
          <div className="card" style={{
            marginBottom: 20,
            borderColor: ai?.verdict === 'FAKE' ? '#fecaca' : '#e2e8f0',
            borderWidth: ai?.verdict === 'FAKE' ? 2 : 1
          }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>🛡️ TruFor AI & Forgery Analysis</h3>
                {ai?.model_version && (
                  <span style={{
                    fontSize: 11, background: '#f1f5f9', color: '#64748b',
                    padding: '2px 8px', borderRadius: 12, fontWeight: 500
                  }}>
                    {ai.model_version}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleRunTrufor}
                disabled={analyzingTrufor}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  borderColor: '#3b82f6', color: '#2563eb'
                }}
              >
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>
                  {analyzingTrufor ? 'sync' : 'auto_fix_high'}
                </span>
                {analyzingTrufor ? 'Analyzing image...' : (ai ? '🔄 Re-scan TruFor' : '⚡ Run TruFor Scan')}
              </button>
            </div>

            <div className="card-body">
              {ai ? (
                <>
                  {/* Authenticity Progress Gauge */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>Camera Sensor Authenticity</span>
                      <span style={{
                        fontWeight: 700,
                        color: ai.authenticity_score >= 0.70 ? '#10b981' : (ai.authenticity_score >= 0.40 ? '#f59e0b' : '#ef4444')
                      }}>
                        {typeof ai.authenticity_score === 'number' ? `${Math.round(ai.authenticity_score * 100)}%` : 'N/A'}
                      </span>
                    </div>
                    <div style={{ height: 10, width: '100%', background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round((ai.authenticity_score || 0) * 100)}%`,
                        background: ai.authenticity_score >= 0.70
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : (ai.authenticity_score >= 0.40
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : 'linear-gradient(90deg, #ef4444, #dc2626)'),
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      }} />
                    </div>
                  </div>

                  {/* 3 Metric Columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Authenticity</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginTop: 2 }}>
                        {typeof ai.authenticity_score === 'number' ? `${Math.round(ai.authenticity_score * 100)}%` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Manipulation</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: (ai.manipulation_score || 0) > 0.4 ? '#ef4444' : '#64748b', marginTop: 2 }}>
                        {typeof ai.manipulation_score === 'number' ? `${Math.round(ai.manipulation_score * 100)}%` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Generated</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: (ai.ai_generated_probability || 0) > 0.5 ? '#dc2626' : '#64748b', marginTop: 2 }}>
                        {typeof ai.ai_generated_probability === 'number' ? `${Math.round(ai.ai_generated_probability * 100)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Model Verdict & Timestamp */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12, color: '#64748b' }}>
                    <div>
                      Verdict:{' '}
                      <strong style={{
                        color: ai.verdict === 'FAKE' ? '#dc2626' : (ai.verdict === 'SUSPICIOUS' ? '#b45309' : '#047857')
                      }}>
                        {ai.verdict === 'FAKE' ? 'TAMPERED / AI FAKE' : (ai.verdict === 'SUSPICIOUS' ? 'SUSPICIOUS ARTIFACTS' : 'AUTHENTIC HARDWARE CAPTURE')}
                      </strong>
                    </div>
                    {ai.analyzed_at && (
                      <span>
                        Scanned: {new Date(ai.analyzed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Tampered Warning + Quick Reject Button */}
                  {(ai.verdict === 'FAKE' || (ai.manipulation_score || 0) >= 0.65) && (
                    <div style={{
                      marginTop: 16, padding: 12, borderRadius: 8,
                      background: '#fef2f2', border: '1px solid #fecaca',
                      display: 'flex', flexDirection: 'column', gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#991b1b', fontSize: 13 }}>
                        <span className="material-icons-outlined" style={{ fontSize: 20, color: '#dc2626' }}>warning</span>
                        <div>
                          <strong>High Forgery Risk Detected:</strong> TruFor pixel anomaly detection identified localized synthetic artifacts or sensor noise tampering.
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setDeclineReason('Fake report / AI generated');
                            setShowDeclineDialog(true);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <span className="material-icons-outlined" style={{ fontSize: 16 }}>block</span>
                          Decline as Fake / AI Generated
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '24px 12px', textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
                  <span className="material-icons-outlined" style={{ fontSize: 36, color: '#94a3b8' }}>verified</span>
                  <p style={{ color: '#475569', fontSize: 14, margin: '8px 0 12px 0' }}>
                    No AI integrity scan has been performed on this incident evidence yet.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleRunTrufor}
                    disabled={analyzingTrufor}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <span className="material-icons-outlined" style={{ fontSize: 16 }}>auto_fix_high</span>
                    {analyzingTrufor ? 'Analyzing with TruFor...' : 'Run TruFor Integrity Scan'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3>🛠️ Admin Actions</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="admin-note">Internal Admin Note</label>
                <textarea
                  id="admin-note"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Record department notes, priority reasoning, or assignment..."
                  rows={3}
                />
              </div>

              <div className="action-bar" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  disabled={!!actionLoading || status === 'IN_PROGRESS'}
                >
                  {actionLoading === 'IN_PROGRESS' ? 'Updating...' : '🔄 Mark In Progress'}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleEscalate}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'escalate' ? 'Escalating...' : '⚡ Escalate to Authority'}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handlePostToX}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'x' ? 'Posting...' : '𝕏 Broadcast to X'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowDeclineDialog(true)}
                  disabled={!!actionLoading || status === 'REJECTED'}
                >
                  ❌ Decline / Fake
                </button>
              </div>
            </div>
          </div>

          {/* Resolve Section */}
          {!isFinal && (
            <div className="card" style={{
              border: '2px solid #10b981',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              marginBottom: 20
            }}>
              <div className="card-header">
                <h3>✅ Complete Resolution</h3>
              </div>
              <div className="card-body">
                <p style={{ color: '#047857', marginBottom: 16, fontSize: 14 }}>
                  Attach photographic proof of the completed work to mark this incident officially resolved.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <button
                  className="btn btn-outline"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', padding: '10px', marginBottom: 12, background: 'white' }}
                >
                  <span className="material-icons-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 8 }}>upload</span>
                  {resolveImage ? 'Change Resolution Photo' : 'Upload Verification Photo'}
                </button>

                {resolveImagePreview && (
                  <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 12, border: '2px solid #10b981' }}>
                    <img
                      src={resolveImagePreview}
                      alt="Resolution preview"
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Resolution Summary</label>
                  <textarea
                    value={resolvedNote}
                    onChange={(e) => setResolvedNote(e.target.value)}
                    placeholder="Briefly describe the repairs performed..."
                    rows={2}
                  />
                </div>

                <button
                  className="btn btn-success"
                  onClick={handleResolve}
                  disabled={!!actionLoading || !resolveImage}
                  style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700 }}
                >
                  {actionLoading === 'resolving' ? 'Resolving...' : '✅ Confirm & Close Incident'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decline Dialog Modal */}
      {showDeclineDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: 440, padding: 24 }}>
            <h3 style={{ color: '#dc2626', marginBottom: 12 }}>Reject Report</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
              Select the reason for rejecting or marking this incident report as invalid:
            </p>
            <div className="form-group">
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                {DECLINE_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setShowDeclineDialog(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDecline} disabled={!!actionLoading}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
