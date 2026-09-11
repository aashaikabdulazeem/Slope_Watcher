import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StationCard from './components/StationCard';
import MapView from './components/MapView';
import TrendCharts from './components/TrendCharts';
import AlertFeed from './components/AlertFeed';
import AdminPanel from './components/AdminPanel';
import CommunicationHub from './components/CommunicationHub';
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 selection:bg-teal-600">
      
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
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-red-500/50 rounded-2xl p-4 shadow-2xl shadow-red-950/60 backdrop-blur-md animate-slide-up flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                {lastNotification.risk_level} ALERT
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Just now</span>
            </div>
            <p className="text-xs font-semibold text-white mt-1">
              {lastNotification.station_name}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              Risk increased to {lastNotification.risk_score.toFixed(1)}/100
            </p>
          </div>
          <button
            onClick={() => setActiveTab('alerts')}
            className="text-xs font-bold text-teal-400 hover:text-teal-300 underline self-center whitespace-nowrap ml-2"
          >
            View
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* KPI Summary Bar (Visible on Dashboard and Map) */}
        {(activeTab === 'dashboard' || activeTab === 'map') && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            
            {/* Total Stations */}
            <div className="bg-gradient-to-br from-blue-900/50 via-cyan-900/40 to-blue-950 border border-blue-500/40 rounded-2xl p-4 backdrop-blur-sm hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 scale-pop">
              <div className="flex items-center justify-between text-xs text-blue-300 mb-2">
                <span className="font-medium">Active Stations</span>
                <Radio className="w-3.5 h-3.5 text-cyan-400 spin-smooth" />
              </div>
              <div className="text-2xl font-bold font-mono bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                {totalStations} <span className="text-xs font-normal text-cyan-400 ml-1">📍</span>
              </div>
            </div>

            {/* Max Risk Score */}
            <div className="bg-gradient-to-br from-red-900/50 via-orange-900/40 to-red-950 border border-red-500/40 rounded-2xl p-4 backdrop-blur-sm hover:border-red-400/60 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 scale-pop">
              <div className="flex items-center justify-between text-xs text-red-300 mb-2">
                <span className="font-medium">Peak Risk</span>
                <Activity className="w-3.5 h-3.5 text-orange-400 pulse-glow" />
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: maxRiskScore >= 75 ? '#fbbf24' : maxRiskScore >= 50 ? '#fb923c' : '#34d399' }}>
                {maxRiskScore.toFixed(1)} <span className="text-xs text-orange-300 font-normal ml-1">⚡</span>
              </div>
            </div>

            {/* Active Warnings */}
            <div className="bg-gradient-to-br from-purple-900/50 via-pink-900/40 to-purple-950 border border-pink-500/40 rounded-2xl p-4 backdrop-blur-sm hover:border-pink-400/60 hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300 scale-pop">
              <div className="flex items-center justify-between text-xs text-pink-300 mb-2">
                <span className="font-medium">Alert Status</span>
                <ShieldAlert className="w-3.5 h-3.5 text-pink-400 animate-bounce" />
              </div>
              <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-2">
                <span>{criticalCount + warningCount}</span>
                {criticalCount > 0 && (
                  <span className="text-xs font-semibold text-red-300 flicker">({criticalCount}🔴)</span>
                )}
              </div>
            </div>

            {/* Avg Soil Moisture */}
            <div className="bg-gradient-to-br from-green-900/50 via-emerald-900/40 to-green-950 border border-green-500/40 rounded-2xl p-4 backdrop-blur-sm hover:border-green-400/60 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 scale-pop">
              <div className="flex items-center justify-between text-xs text-green-300 mb-2">
                <span className="font-medium">Avg Moisture</span>
                <Droplets className="w-3.5 h-3.5 text-green-400 wave-animation" />
              </div>
              <div className="text-2xl font-bold font-mono bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                {avgMoisture}<span className="text-xs text-green-400 ml-1">💧</span>
              </div>
            </div>

            {/* Avg Rainfall */}
            <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-yellow-900/50 via-amber-900/40 to-yellow-950 border border-yellow-500/40 rounded-2xl p-4 backdrop-blur-sm hover:border-yellow-400/60 hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-300 scale-pop">
              <div className="flex items-center justify-between text-xs text-yellow-300 mb-2">
                <span className="font-medium">Rainfall</span>
                <CloudRain className="w-3.5 h-3.5 text-yellow-400 bounce-smooth" />
              </div>
              <div className="text-2xl font-bold font-mono bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
                {totalRainfall}<span className="text-xs text-yellow-400 ml-1">🌧️</span>
              </div>
            </div>

          </div>
        )}

        {/* Tab 1: Live Overview & Station Cards */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent flex items-center gap-2 font-outfit pulse-glow hero-scale">
                  <span>📍 Monitoring Stations</span>
                </h2>
                <p className="text-sm bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent mt-1 font-light">
                  Real-time sensor data from 6 mountain monitoring locations
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('map')}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-blue-900/60 hover:from-purple-900/80 hover:to-blue-900/80 text-purple-300 border border-purple-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30"
                >
                  <Layers className="w-3.5 h-3.5 spin-smooth" />
                  <span>Map View</span>
                </button>
              </div>
            </div>

            {/* 6 Stations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent font-outfit pulse-glow hero-scale">🗺️ Mountain Terrain Map</h2>
              <p className="text-sm bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent mt-1 font-light">
                Visualize risk levels across the geographic area
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

        {/* Tab 5: Community Communication & Regional Alerts */}
        {activeTab === 'community' && (
          <CommunicationHub
            stations={stations}
            alerts={alerts}
          />
        )}

        {/* Tab 6: Admin & ML Configuration Panel */}
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
