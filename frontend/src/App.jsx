import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StationCard from './components/StationCard';
import MapView from './components/MapView';
import TrendCharts from './components/TrendCharts';
import AlertFeed from './components/AlertFeed';
import AdminPanel from './components/AdminPanel';
import { fetchStations, fetchAlerts, fetchSimulationStatus } from './services/api';
import { wsClient } from './services/websocket';
import { 
  Activity, 
  ShieldAlert, 
  CloudRain, 
  Droplets, 
  Flame, 
  Radio, 
  Layers, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { getRiskConfig } from './utils/riskHelpers';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stations, setStations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [simStatus, setSimStatus] = useState(null);
  const [wsStatus, setWsStatus] = useState('CONNECTING');
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);

  // Initial REST fetch
  const loadInitialData = useCallback(async () => {
    try {
      const [sts, alts, sim] = await Promise.all([
        fetchStations().catch(() => []),
        fetchAlerts('all', null, 50).catch(() => []),
        fetchSimulationStatus().catch(() => null)
      ]);
      if (sts.length) setStations(sts);
      if (alts.length) setAlerts(alts);
      if (sim) setSimStatus(sim);
    } catch (e) {
      console.error("Failed to load initial data:", e);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Connect WebSocket and listen for live updates
  useEffect(() => {
    wsClient.connect();

    const unsubStatus = wsClient.subscribeStatus((status) => {
      setWsStatus(status);
    });

    const unsubMessages = wsClient.subscribe((msg) => {
      if (msg.type === 'INITIAL_SNAPSHOT') {
        if (msg.stations) setStations(msg.stations);
        if (msg.alerts) setAlerts(msg.alerts);
        if (msg.simulation_status) setSimStatus(msg.simulation_status);
      } else if (msg.type === 'SIMULATION_UPDATE') {
        // In-place station updates
        if (msg.stations) {
          setStations(msg.stations);
        }

        // New alert triggers
        if (msg.alerts && msg.alerts.length > 0) {
          setAlerts(prev => {
            const newAlerts = msg.alerts.filter(na => !prev.some(pa => pa.id === na.id));
            return [...newAlerts, ...prev];
          });

          // Show transient popup notification
          const latestAlert = msg.alerts[0];
          setLastNotification({
            station_code: latestAlert.station_code,
            station_name: latestAlert.station_name,
            risk_level: latestAlert.risk_level,
            risk_score: latestAlert.risk_score
          });
          setTimeout(() => setLastNotification(null), 6000);
        }
      }
    });

    return () => {
      unsubStatus();
      unsubMessages();
      wsClient.disconnect();
    };
  }, []);

  // Calculate summary metrics
  const totalStations = stations.length;
  const maxRiskScore = stations.reduce((max, s) => Math.max(max, s.latest_reading?.risk_score ?? 0), 0);
  const criticalCount = stations.filter(s => s.latest_reading?.risk_level === 'Critical').length;
  const warningCount = stations.filter(s => s.latest_reading?.risk_level === 'Warning').length;
  const avgMoisture = stations.length 
    ? (stations.reduce((sum, s) => sum + (s.latest_reading?.soil_moisture ?? 0), 0) / stations.length).toFixed(1)
    : '--';
  const totalRainfall = stations.length
    ? (stations.reduce((sum, s) => sum + (s.latest_reading?.rainfall ?? 0), 0) / stations.length).toFixed(1)
    : '--';

  const handleSelectStation = (id) => {
    setSelectedStationId(id);
    setActiveTab('charts');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1d] text-slate-100 selection:bg-blue-600">
      
      {/* Navbar with Header, Status, and Controls */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        wsStatus={wsStatus} 
        stations={stations}
        alerts={alerts}
        simStatus={simStatus}
        onRefresh={loadInitialData}
      />

      {/* Real-time Alert Toast Notification */}
      {lastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-red-500/60 rounded-2xl p-4 shadow-2xl shadow-red-950/50 backdrop-blur-md animate-slide-up flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                {lastNotification.risk_level} ALERT
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Just now</span>
            </div>
            <p className="text-xs font-semibold text-white mt-0.5">
              {lastNotification.station_name} ({lastNotification.station_code})
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Risk score reached {lastNotification.risk_score.toFixed(1)}/100.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('alerts')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 underline self-center whitespace-nowrap ml-2"
          >
            Review
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* KPI Summary Bar (Visible on Dashboard and Map) */}
        {(activeTab === 'dashboard' || activeTab === 'map') && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            
            {/* Total Stations */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Active Stations</span>
                <Radio className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-white">
                {totalStations} <span className="text-xs font-normal text-emerald-400">Online</span>
              </div>
            </div>

            {/* Max Risk Score */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Peak Risk Score</span>
                <Activity className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div className="text-xl font-extrabold font-mono" style={{ color: maxRiskScore >= 75 ? '#ef4444' : maxRiskScore >= 50 ? '#f97316' : '#10b981' }}>
                {maxRiskScore.toFixed(1)} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
            </div>

            {/* Active Warnings */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Active Warnings</span>
                <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-white flex items-baseline gap-1.5">
                <span>{criticalCount + warningCount}</span>
                {criticalCount > 0 && (
                  <span className="text-xs font-bold text-red-400">({criticalCount} Critical)</span>
                )}
              </div>
            </div>

            {/* Avg Soil Moisture */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Mean Soil Saturation</span>
                <Droplets className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-teal-300">
                {avgMoisture}%
              </div>
            </div>

            {/* Avg Rainfall */}
            <div className="col-span-2 sm:col-span-1 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Avg Rainfall Intensity</span>
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-blue-300">
                {totalRainfall} <span className="text-xs font-normal text-slate-400">mm/h</span>
              </div>
            </div>

          </div>
        )}

        {/* Tab 1: Live Overview & Station Cards */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Hillside Slope Monitoring Network</span>
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    (Western Ghats Vulnerability Zone)
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time IoT telemetry streaming from multi-sensor piezometer & inclinometer arrays
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('map')}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>View Terrain Map</span>
                </button>
              </div>
            </div>

            {/* 6 Stations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stations.map(station => (
                <StationCard
                  key={station.id}
                  station={station}
                  onSelectStation={handleSelectStation}
                />
              ))}
            </div>

          </div>
        )}

        {/* Tab 2: Interactive Leaflet Terrain Map */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Geospatial Mountain Risk Mapping</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Topographic contour hillshading and satellite imagery overlay with real-time station risk markers
              </p>
            </div>
            <MapView 
              stations={stations} 
              onSelectStation={handleSelectStation} 
            />
          </div>
        )}

        {/* Tab 3: Sensor Trend Analytics */}
        {activeTab === 'charts' && (
          <TrendCharts
            stations={stations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
          />
        )}

        {/* Tab 4: Alerts & Emergency Response Feed */}
        {activeTab === 'alerts' && (
          <AlertFeed
            alerts={alerts}
            onAlertUpdated={loadInitialData}
          />
        )}

        {/* Tab 5: Admin & ML Configuration Panel */}
        {activeTab === 'admin' && (
          <AdminPanel
            stations={stations}
            simStatus={simStatus}
            onRefresh={loadInitialData}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#0c1222] border-t border-slate-800/80 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">LandSlide Sentinel</span>
            <span>•</span>
            <span>AI-Based Geotechnical Early Warning & Hazard Mitigation</span>
          </div>
          <div className="flex items-center gap-4">
            <span>FastAPI + WebSocket Engine</span>
            <span>•</span>
            <span>Random Forest (94.85% Acc)</span>
            <span>•</span>
            <span>Leaflet Topo Map</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
