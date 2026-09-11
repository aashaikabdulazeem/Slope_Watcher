const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchStations() {
  const res = await fetch(`${API_BASE}/stations`);
  if (!res.ok) throw new Error(`Failed to fetch stations: ${res.statusText}`);
  return res.json();
}

export async function fetchStationDetail(id) {
  const res = await fetch(`${API_BASE}/stations/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch station: ${res.statusText}`);
  return res.json();
}

export async function updateStationThresholds(id, warning_threshold, critical_threshold) {
  const res = await fetch(`${API_BASE}/stations/${id}/thresholds`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ warning_threshold, critical_threshold })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to update thresholds: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchReadings(stationId = null, limit = 60) {
  const url = stationId 
    ? `${API_BASE}/stations/${stationId}/readings?limit=${limit}`
    : `${API_BASE}/readings?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch readings: ${res.statusText}`);
  return res.json();
}

export async function fetchAlerts(status = null, stationId = null, limit = 50) {
  let url = `${API_BASE}/alerts?limit=${limit}`;
  if (status) url += `&status=${status}`;
  if (stationId) url += `&station_id=${stationId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`);
  return res.json();
}

export async function fetchAlertSummary() {
  const res = await fetch(`${API_BASE}/alerts/summary`);
  if (!res.ok) throw new Error(`Failed to fetch alert summary: ${res.statusText}`);
  return res.json();
}

export async function acknowledgeAlert(alertId) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to acknowledge alert: ${res.statusText}`);
  return res.json();
}

export async function resolveAlert(alertId) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to resolve alert: ${res.statusText}`);
  return res.json();
}

export async function fetchMLMetrics() {
  const res = await fetch(`${API_BASE}/ml/metrics`);
  if (!res.ok) throw new Error(`Failed to fetch ML metrics: ${res.statusText}`);
  return res.json();
}

export async function predictRisk(sensorData) {
  const res = await fetch(`${API_BASE}/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sensorData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Prediction failed');
  }
  return res.json();
}

export async function triggerModelRetrain() {
  const res = await fetch(`${API_BASE}/ml/train`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger training: ${res.statusText}`);
  return res.json();
}

export async function injectScenario(stationId, scenario) {
  const res = await fetch(`${API_BASE}/simulation/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ station_id: stationId, scenario })
  });
  if (!res.ok) throw new Error(`Failed to inject scenario: ${res.statusText}`);
  return res.json();
}

export async function resetAllScenarios() {
  const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to reset scenarios: ${res.statusText}`);
  return res.json();
}

export async function controlSimulation(options) {
  const res = await fetch(`${API_BASE}/simulation/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  if (!res.ok) throw new Error(`Failed to control simulation: ${res.statusText}`);
  return res.json();
}

export async function fetchSimulationStatus() {
  const res = await fetch(`${API_BASE}/simulation/status`);
  if (!res.ok) throw new Error(`Failed to fetch simulation status: ${res.statusText}`);
  return res.json();
}
