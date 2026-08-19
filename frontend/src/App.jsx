import React, { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1/telemetry';

const fallback = [
  { 
    id: 1001, 
    serviceName: 'transaction-ledger', 
    errorCode: 'HIKARI_POOL_CONTENTION', 
    severity: 'CRITICAL', 
    timestamp: new Date().toISOString(), 
    financialRiskPerMinute: 5760, 
    transactionVolumeAtRisk: 72000, 
    aiConfidence: 98.4, 
    rootCause: 'Database connection pool saturation is blocking payment workflows.', 
    remediation: 'Increase pool capacity and route new traffic to healthy replicas.', 
    stackTrace: 'HikariPool.getConnection: line 712\nConnection is not available after 30000ms', 
    status: 'ACTIVE' 
  },
  { 
    id: 1002, 
    serviceName: 'session-cache', 
    errorCode: 'REDIS_FAILOVER_DELAY', 
    severity: 'WARNING', 
    timestamp: new Date(Date.now() - 180000).toISOString(), 
    financialRiskPerMinute: 1080, 
    transactionVolumeAtRisk: 36000, 
    aiConfidence: 98.4, 
    rootCause: 'Primary cache failover is increasing session lookup latency.', 
    remediation: 'Trip the circuit breaker and reroute cache reads to the replica.', 
    stackTrace: 'ReplicaSelector.route: line 241\nPrimary node transition exceeded 1200ms', 
    status: 'ACTIVE' 
  },
];

const money = (value) => `$${Math.round(value || 0).toLocaleString()}`;
const time = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [online, setOnline] = useState(false);
  const [throughput, setThroughput] = useState(1.48);
  const [remediating, setRemediating] = useState(false);
  const [message, setMessage] = useState('');

  const loadIncidents = async () => {
    try { 
      const response = await fetch(`${API}/incidents`); 
      if (!response.ok) throw new Error(); 
      setIncidents(await response.json()); 
      setOnline(true); 
    } catch { 
      setIncidents(fallback); 
      setOnline(false); 
    }
  };

  useEffect(() => { 
    loadIncidents(); 
    const refresh = setInterval(loadIncidents, 5000); 
    const tick = setInterval(() => setThroughput((value) => +(value + (Math.random() * .04 - .02)).toFixed(2)), 1800); 
    return () => { clearInterval(refresh); clearInterval(tick); }; 
  }, []);

  const exposure = useMemo(() => 
    incidents.filter((item) => item.status !== 'REMEDIATED').reduce((sum, item) => sum + (item.financialRiskPerMinute || 0), 0), 
    [incidents]
  );

  const remediate = async () => {
    if (!selected?.id || !online) { 
      setMessage('Connect to the telemetry service to dispatch this action.'); 
      return; 
    }
    setRemediating(true);
    try { 
      const response = await fetch(`${API}/remediate/${selected.id}`, { method: 'POST' }); 
      const updated = await response.json(); 
      setIncidents((items) => items.map((item) => item.id === updated.id ? updated : item)); 
      setSelected(updated); 
      setMessage('Remediation dispatched and acknowledged by the control plane.'); 
    } catch { 
      setMessage('Remediation dispatch failed. Review service connectivity.'); 
    } finally { 
      setRemediating(false); 
    }
  };

  const exportReport = () => { 
    const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), incidents }, null, 2)], { type: 'application/json' }); 
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(blob); 
    link.download = 'executive-telemetry-audit.json'; 
    link.click(); 
    URL.revokeObjectURL(link.href); 
  };

  return (
    <div style={styles.appShell}>
      {/* Top Header */}
      <header style={styles.topBar}>
        <div style={styles.brandSection}>
          <div style={styles.brandIcon}></div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={styles.appTitle}>Enterprise Telemetry Control Plane</span>
              <span style={styles.envTag}>PRODUCTION</span>
            </div>
            <span style={styles.appSub}>Autonomous AI Observability Engine</span>
          </div>
        </div>

        <div style={styles.headerActions}>
          <div style={online ? styles.statusPillLive : styles.statusPillDemo}>
            <span style={online ? styles.statusDotLive : styles.statusDotDemo}></span>
            <span style={styles.statusLabel}>{online ? 'STREAM LIVE' : 'DEMO STREAM'}</span>
          </div>
          <button style={styles.auditBtn} onClick={exportReport}>
            ⇩ Export Executive Audit
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={styles.mainContent}>
        {/* KPI Ribbons */}
        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiTitle}>Live Ingestion Velocity</span>
              <span style={styles.badgeGreen}>+14.2%</span>
            </div>
            <div style={styles.kpiValueRow}>
              <span style={styles.kpiNum}>{throughput}M</span>
              <span style={styles.kpiUnit}>events / sec</span>
            </div>
            <p style={styles.kpiFootnote}>Nominal payload ingestion rate</p>
          </div>

          <div style={{ ...styles.kpiCard, borderTop: '2px solid #f87171' }}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiTitle}>At-Risk Financial Exposure</span>
              <span style={styles.badgeRed}>Critical Risk</span>
            </div>
            <div style={styles.kpiValueRow}>
              <span style={{ ...styles.kpiNum, color: '#f87171' }}>{money(exposure)}</span>
              <span style={styles.kpiUnit}>/ minute</span>
            </div>
            <p style={styles.kpiFootnote}>
              {incidents.filter((item) => item.status !== 'REMEDIATED').length} active risk signals
            </p>
          </div>

          <div style={{ ...styles.kpiCard, borderTop: '2px solid #34d399' }}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiTitle}>AI RCA Resolution Time</span>
              <span style={styles.badgeGreen}>99.2% Acc.</span>
            </div>
            <div style={styles.kpiValueRow}>
              <span style={{ ...styles.kpiNum, color: '#34d399' }}>84ms</span>
              <span style={styles.kpiUnit}>median speed</span>
            </div>
            <p style={styles.kpiFootnote}>Autonomous root-cause isolation</p>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiTitle}>System Heartbeat SLA</span>
              <span style={styles.badgeBlue}>Operational</span>
            </div>
            <div style={styles.kpiValueRow}>
              <span style={styles.kpiNum}>99.99%</span>
              <span style={styles.kpiUnit}>uptime</span>
            </div>
            <p style={styles.kpiFootnote}>Predictive anomaly trajectory active</p>
          </div>
        </div>

        {/* Live Anomaly Table */}
        <section style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.tableTitle}>Operational Risk Signals</h2>
              <p style={styles.tableSub}>Real-time telemetry event stream filtered by anomaly classification</p>
            </div>
            <div style={styles.indexerBadge}>
              {incidents.length} Signals Indexed
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Incident ID</th>
                  <th style={styles.th}>Microservice Target</th>
                  <th style={styles.th}>Pattern Classification</th>
                  <th style={styles.th}>Severity</th>
                  <th style={styles.th}>Financial Risk</th>
                  <th style={styles.th}>Observed</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.tdInc}>INC-{String(item.id).padStart(5, '0')}</td>
                    <td style={styles.tdService}>{item.serviceName || 'core-payment-engine'}</td>
                    <td style={styles.tdPattern}>{item.errorCode || 'ANOMALY_PATTERN'}</td>
                    <td style={styles.td}>
                      <span style={item.severity === 'CRITICAL' ? styles.tagCritical : styles.tagWarning}>
                        {item.severity || 'WARNING'}
                      </span>
                    </td>
                    <td style={styles.tdRisk}>
                      {money(item.financialRiskPerMinute)} <span style={{ fontSize: '10px', color: '#6b7280' }}>/ min</span>
                    </td>
                    <td style={styles.tdTime}>{time(item.timestamp)}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button 
                        style={styles.aiBtn} 
                        onClick={() => { setSelected(item); setMessage(''); }}
                      >
                        ⚡ AI Diagnosis
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Service Fabric Status Ribbon */}
        <section style={styles.fabricStrip}>
          <span style={styles.fabricTitle}>SERVICE FABRIC STATUS:</span>
          <div style={styles.fabricList}>
            <Status name="Core Payment Gateway" state="nominal" />
            <Status name="Distributed Ledger" state="nominal" />
            <Status name="Identity Verifier" state="degraded" />
            <Status name="Session Cache" state="nominal" />
          </div>
        </section>
      </main>

      {/* AI Diagnosis Drawer Overlay */}
      {selected && (
        <div style={styles.drawerBackdrop} onClick={() => setSelected(null)}>
          <aside style={styles.drawerBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerTop}>
              <div>
                <span style={styles.drawerTag}>AUTONOMOUS RCA ENGINE</span>
                <h3 style={styles.drawerTitle}>Incident Analysis</h3>
                <p style={styles.drawerSub}>INC-{String(selected.id).padStart(5, '0')} · {selected.serviceName}</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={styles.drawerBody}>
              <div style={styles.confidenceRow}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Model Diagnostics Confidence</span>
                <span style={styles.confidenceBadge}>{selected.aiConfidence || 98.4}%</span>
              </div>

              <div style={styles.sectionBlock}>
                <h4 style={styles.sectionHeader}>Identified Root Cause</h4>
                <p style={styles.sectionText}>{selected.rootCause || selected.description || 'No root cause available.'}</p>
              </div>

              <div style={styles.sectionBlock}>
                <h4 style={styles.sectionHeader}>Stack Trace Evidence</h4>
                <pre style={styles.codeSnippet}>{selected.stackTrace || 'No stack trace attached to this signal.'}</pre>
              </div>

              <div style={styles.sectionBlock}>
                <h4 style={styles.sectionHeader}>Business Risk Assessment</h4>
                <p style={styles.riskText}>
                  <strong>{money(selected.financialRiskPerMinute)}</strong> estimated exposure per minute across {Math.round(selected.transactionVolumeAtRisk || 0).toLocaleString()} at-risk transactions.
                </p>
              </div>

              <div style={styles.sectionBlock}>
                <h4 style={styles.sectionHeader}>Recommended Action</h4>
                <p style={styles.sectionText}>{selected.remediation}</p>
              </div>

              {message && <div style={styles.dispatchMessage}>{message}</div>}

              <button 
                style={selected.status === 'REMEDIATED' ? styles.remediatedBtn : styles.dispatchBtn} 
                disabled={remediating || selected.status === 'REMEDIATED'} 
                onClick={remediate}
              >
                {selected.status === 'REMEDIATED' ? '✓ Remediation Acknowledged' : remediating ? 'Dispatching Control Action...' : 'Execute Autonomous Remediation'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Status({ name, state }) {
  const isNominal = state === 'nominal';
  return (
    <span style={styles.servicePill}>
      <span style={isNominal ? styles.dotGreen : styles.dotAmber}></span>
      <span style={{ color: '#d1d5db' }}>{name}</span>
      <span style={isNominal ? styles.stateNominal : styles.stateDegraded}>{state.toUpperCase()}</span>
    </span>
  );
}

// Minimal Enterprise Dark Mode Styling Rules
const styles = {
  appShell: { backgroundColor: '#090d16', color: '#f3f4f6', minHeight: '100vh', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', backgroundColor: '#0d1322', borderBottom: '1px solid #1f293d' },
  brandSection: { display: 'flex', alignItems: 'center', gap: '12px' },
  brandIcon: { width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' },
  appTitle: { fontSize: '15px', fontWeight: '700', color: '#f9fafb' },
  envTag: { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px' },
  appSub: { fontSize: '11px', color: '#6b7280', display: 'block' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '16px' },
  statusPillLive: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '20px' },
  statusPillDemo: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '6px 12px', borderRadius: '20px' },
  statusDotLive: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' },
  statusDotDemo: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' },
  statusLabel: { fontSize: '11px', fontWeight: '700', color: '#e5e7eb', letterSpacing: '0.5px' },
  auditBtn: { backgroundColor: '#161e2e', border: '1px solid #2d3748', color: '#e5e7eb', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  mainContent: { maxWidth: '1440px', margin: '0 auto', padding: '28px 32px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' },
  kpiCard: { backgroundColor: '#0d1322', border: '1px solid #1f293d', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  kpiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  kpiTitle: { fontSize: '12px', fontWeight: '600', color: '#9ca3af' },
  badgeGreen: { fontSize: '10px', fontWeight: '700', color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '2px 6px', borderRadius: '4px' },
  badgeRed: { fontSize: '10px', fontWeight: '700', color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.1)', padding: '2px 6px', borderRadius: '4px' },
  badgeBlue: { fontSize: '10px', fontWeight: '700', color: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.1)', padding: '2px 6px', borderRadius: '4px' },
  kpiValueRow: { display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' },
  kpiNum: { fontSize: '28px', fontWeight: '800', color: '#f9fafb', letterSpacing: '-0.5px' },
  kpiUnit: { fontSize: '12px', color: '#6b7280' },
  kpiFootnote: { fontSize: '11px', color: '#6b7280', margin: 0 },
  tableCard: { backgroundColor: '#0d1322', border: '1px solid #1f293d', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  tableTitle: { fontSize: '16px', fontWeight: '700', margin: 0, color: '#f9fafb' },
  tableSub: { fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' },
  indexerBadge: { fontSize: '11px', fontWeight: '600', color: '#6b7280', backgroundColor: '#161e2e', padding: '6px 12px', borderRadius: '6px', border: '1px solid #2d3748' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { borderBottom: '1px solid #1f293d' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #161e2e' },
  tdInc: { padding: '14px', fontSize: '12px', fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' },
  tdService: { padding: '14px', fontSize: '13px', fontWeight: '600', color: '#e5e7eb' },
  tdPattern: { padding: '14px', fontSize: '12px', fontFamily: 'monospace', color: '#9ca3af' },
  tdRisk: { padding: '14px', fontSize: '13px', fontWeight: '700', color: '#f87171' },
  tdTime: { padding: '14px', fontSize: '12px', color: '#6b7280' },
  td: { padding: '14px' },
  tagCritical: { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' },
  tagWarning: { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' },
  aiBtn: { backgroundColor: '#1d283a', color: '#60a5fa', border: '1px solid #2b3952', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
  fabricStrip: { backgroundColor: '#0d1322', border: '1px solid #1f293d', borderRadius: '10px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px' },
  fabricTitle: { fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px' },
  fabricList: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  servicePill: { backgroundColor: '#161e2e', border: '1px solid #2d3748', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
  dotGreen: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' },
  dotAmber: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' },
  stateNominal: { fontSize: '10px', fontWeight: '800', color: '#10b981' },
  stateDegraded: { fontSize: '10px', fontWeight: '800', color: '#f59e0b' },
  drawerBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 },
  drawerBox: { backgroundColor: '#0d1322', borderLeft: '1px solid #2b3952', width: '100%', maxWidth: '480px', height: '100vh', padding: '24px', overflowY: 'auto', boxSizing: 'border-box' },
  drawerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  drawerTag: { fontSize: '10px', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.5px' },
  drawerTitle: { fontSize: '20px', fontWeight: '700', margin: '4px 0 0 0', color: '#f9fafb' },
  drawerSub: { fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0', fontFamily: 'monospace' },
  closeBtn: { background: 'none', border: 'none', color: '#6b7280', fontSize: '20px', cursor: 'pointer' },
  drawerBody: { display: 'flex', flexDirection: 'column', gap: '18px' },
  confidenceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161e2e', padding: '10px 14px', borderRadius: '6px', border: '1px solid #2d3748' },
  confidenceBadge: { fontSize: '12px', fontWeight: '800', color: '#34d399' },
  sectionBlock: { display: 'flex', flexDirection: 'column', gap: '6px' },
  sectionHeader: { fontSize: '11px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', margin: 0 },
  sectionText: { fontSize: '13px', color: '#d1d5db', lineHeight: '1.5', margin: 0 },
  riskText: { fontSize: '13px', color: '#f87171', margin: 0 },
  codeSnippet: { backgroundColor: '#090d16', padding: '12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#f87171', border: '1px solid #1f293d', margin: 0, overflowX: 'auto' },
  dispatchMessage: { backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '10px', borderRadius: '6px', fontSize: '12px' },
  dispatchBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
  remediatedBtn: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'default', marginTop: '10px' }
};