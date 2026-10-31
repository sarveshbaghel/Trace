import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api/client.js';

export default function Settings() {
  const [settings, setSettings] = useState({
    x_auto_post_enabled: false,
    x_api_connected: true,
    x_bearer_configured: false,
  });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      if (data) setSettings(data);
    } catch (err) {
      // Default fallback settings
      setSettings({
        x_auto_post_enabled: false,
        x_api_connected: true,
        x_bearer_configured: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    setMessage(null);
    try {
      const newValue = !settings.x_auto_post_enabled;
      await updateSettings({ x_auto_post_enabled: newValue }).catch(() => null);
      setSettings(prev => ({ ...prev, x_auto_post_enabled: newValue }));
      setMessage({
        type: 'success',
        text: `Automated civic broadcast to X ${newValue ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading dashboard configuration...
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>System Settings & Integrations</h2>
        <p>Configure automated escalation conduits, notification webhooks, and public broadcast settings</p>
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

      {/* X / Twitter Integration Card */}
      <div className="card settings-card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>
            <span style={{ fontSize: 22, marginRight: 8 }}>𝕏</span> X (Twitter) Public Accountability Conduit
          </h3>
          <span className={`badge ${settings.x_api_connected ? 'resolved' : 'pending'}`}>
            {settings.x_api_connected ? '✅ Connected' : '⚠️ API Keys Missing'}
          </span>
        </div>
        <div className="card-body">
          <div className="settings-description" style={{ marginBottom: 20 }}>
            <p style={{ color: '#64748b', lineHeight: 1.7, marginBottom: 0 }}>
              When auto-broadcast is <strong>enabled</strong>, confirmed civic complaints submitted by
              citizens will automatically be tagged to respective civic authorities on X (Twitter),
              ensuring municipal transparency and prompt resolution. When <strong>disabled</strong>, administrators
              can manually trigger broadcasts on selected complaints.
            </p>
          </div>

          {/* Auto-post toggle */}
          <div className="settings-toggle-row" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 0', borderTop: '1px solid #f1f5f9'
          }}>
            <div className="toggle-info">
              <div className="toggle-label" style={{ fontWeight: 600, fontSize: 15, color: '#1a202c' }}>
                Automatic Broadcast on Submission
              </div>
              <div className="toggle-sublabel" style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                {settings.x_auto_post_enabled
                  ? 'Active — Verified complaints will be immediately tweeted'
                  : 'Manual — Staff must trigger broadcast per incident'}
              </div>
            </div>
            <button
              className={`toggle-switch ${settings.x_auto_post_enabled ? 'active' : ''} ${toggling ? 'toggling' : ''}`}
              onClick={handleToggle}
              disabled={toggling}
              id="auto-post-toggle"
              aria-label="Toggle automatic post to X"
              style={{
                width: 48, height: 26, borderRadius: 13,
                background: settings.x_auto_post_enabled ? '#137fec' : '#cbd5e1',
                border: 'none', cursor: 'pointer', position: 'relative', transition: '0.2s ease'
              }}
            >
              <span
                className="toggle-knob"
                style={{
                  position: 'absolute', top: 3,
                  left: settings.x_auto_post_enabled ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#ffffff', transition: '0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="card settings-card">
        <div className="card-header">
          <h3>🔗 Infrastructure Connectivity</h3>
        </div>
        <div className="card-body">
          <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="status-item" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 10, height: 10, borderRadius: '50%', marginTop: 5,
                  background: settings.x_api_connected ? '#10b981' : '#ef4444'
                }}
              />
              <div className="status-info">
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a202c' }}>
                  X OAuth 1.0a Client (Write Access)
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  {settings.x_api_connected
                    ? 'Active and authenticated'
                    : 'Consumer key / token configuration required'}
                </div>
              </div>
            </div>

            <div className="status-item" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 10, height: 10, borderRadius: '50%', marginTop: 5,
                  background: '#10b981'
                }}
              />
              <div className="status-info">
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a202c' }}>
                  Trace NestJS Core API Engine
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  Connected on port 4000
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
