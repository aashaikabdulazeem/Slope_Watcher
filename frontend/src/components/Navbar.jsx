import React from 'react';
import { 
  Mountain, 
  Radio, 
  AlertTriangle, 
  Flame, 
  RotateCcw, 
  Zap, 
  BarChart3, 
  MapPin, 
  LayoutDashboard, 
  SlidersHorizontal, 
  ShieldAlert,
  Pause,
  Play
} from 'lucide-react';
import { resetAllScenarios, injectScenario, controlSimulation } from '../services/api';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  wsStatus, 
  stations = [], 
  alerts = [],
  simStatus,
  onRefresh
}) {
  const criticalCount = stations.filter(s => s.latest_reading?.risk_level === 'Critical').length;
  const warningCount = stations.filter(s => s.latest_reading?.risk_level === 'Warning').length;

  const handleReset = async () => {
    try {
      await resetAllScenarios();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickEscalate = async () => {
    try {
      // Station 3 is Meppadi Escarpment
      await injectScenario(3, 'gradual_escalation');
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSimulation = async () => {
    try {
      const isRunning = simStatus?.is_running ?? true;
      await controlSimulation({ is_running: !isRunning });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c1222]/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Top Banner if Critical Alert */}
      {criticalCount > 0 && (
        <div className="bg-red-600/90 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 animate-bounce" />
            <span>CRITICAL LANDSLIDE HAZARD DETECTED: Immediate geotechnical alert active for {criticalCount} station(s). Evacuation protocols advised.</span>
          </div>
          <button 
            onClick={() => setActiveTab('alerts')} 
            className="underline text-white hover:text-red-100 font-bold ml-4 whitespace-nowrap"
          >
            View Emergency Response &rarr;
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent">
                  LandSlide Sentinel
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  AI-EWS v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Early Warning & Geotechnical Slope Risk Monitoring System
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'map'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Terrain Map</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'charts'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'alerts'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Alerts</span>
              {(criticalCount > 0 || warningCount > 0) && (
                <span className={`w-2 h-2 rounded-full ${criticalCount > 0 ? 'bg-red-500 animate-ping' : 'bg-orange-400'}`} />
              )}
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Admin & ML</span>
            </button>
          </nav>

          {/* Quick Controls & Status */}
          <div className="flex items-center gap-2">
            
            {/* Simulation Quick Play/Pause */}
            <button
              onClick={handleToggleSimulation}
              title={simStatus?.is_running ? "Pause sensor simulation" : "Resume sensor simulation"}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {simStatus?.is_running ? (
                <Pause className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>

            {/* Quick Demo Escalate */}
            <button
              onClick={handleQuickEscalate}
              title="Escalate Station 3 (Meppadi) Safe -> Critical over 3 min"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 transition-all shadow-sm"
            >
              <Zap className="w-3 h-3 text-orange-400 fill-orange-400" />
              <span>Escalate Demo</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              title="Reset all stations to calm conditions"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>

            {/* WS Live Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-900 border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${
                wsStatus === 'CONNECTED' 
                  ? 'bg-emerald-400 animate-pulse' 
                  : wsStatus === 'CONNECTING' 
                  ? 'bg-amber-400' 
                  : 'bg-red-400'
              }`} />
              <span className="text-slate-300 font-medium hidden sm:inline">
                {wsStatus === 'CONNECTED' ? 'LIVE' : wsStatus}
              </span>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
