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
  Play,
  Users,
  Sparkles
} from 'lucide-react';
import SpidermanLogo from './SpidermanLogo';
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
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-950 via-purple-950/60 to-slate-950 backdrop-blur-xl border-b border-purple-500/30 shadow-2xl shadow-purple-900/50">
      {/* Top Banner if Critical Alert */}
      {criticalCount > 0 && (
        <div className="bg-gradient-to-r from-red-700 via-orange-600 to-red-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 animate-bounce" />
            <span>⚠️  CRITICAL HAZARD - Station at Risk. Evacuation advisable for {criticalCount} location(s).</span>
          </div>
          <button 
            onClick={() => setActiveTab('alerts')} 
            className="underline text-white hover:text-orange-100 font-semibold ml-4 whitespace-nowrap"
          >
            → Details
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-red-500/50 transform group-hover:scale-110 transition-transform duration-300 float-animation">
              <SpidermanLogo />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-normal bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent font-outfit pulse-glow">
                  🕷️ Slope Watcher
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-pink-300 border border-pink-500/50 font-mono">
                  v2.0 AI+WEB
                </span>
              </div>
              <p className="text-[11px] bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-light">
                Real-time Landslide Monitoring System
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-2 bg-gradient-to-r from-slate-900/40 via-purple-900/40 to-slate-900/40 p-1.5 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-blue-600/50 scale-pop'
                  : 'text-slate-300 hover:text-white hover:bg-purple-800/30'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                activeTab === 'map'
                  ? 'bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-green-600/50 scale-pop'
                  : 'text-slate-300 hover:text-white hover:bg-green-800/30'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                activeTab === 'charts'
                  ? 'bg-gradient-to-r from-orange-600 via-yellow-600 to-red-600 text-white shadow-lg shadow-orange-600/50 scale-pop'
                  : 'text-slate-300 hover:text-white hover:bg-orange-800/30'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                activeTab === 'alerts'
                  ? 'bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 text-white shadow-lg shadow-red-600/50 scale-pop'
                  : 'text-slate-300 hover:text-white hover:bg-red-800/30'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Alerts</span>
              {(criticalCount > 0 || warningCount > 0) && (
                <span className={`w-2 h-2 rounded-full animate-pulse ${criticalCount > 0 ? 'bg-red-300 animate-bounce' : 'bg-orange-300'}`} />
              )}
            </button>

            <button
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                activeTab === 'community'
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-purple-600/50 scale-pop'
                  : 'text-slate-300 hover:text-white hover:bg-purple-800/30'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Community</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white shadow-lg shadow-cyan-600/50 scale-pop'
                  : 'text-slate-300 hover:text-white hover:bg-cyan-800/30'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Tools</span>
            </button>
          </nav>

          {/* Quick Controls & Status */}
          <div className="flex items-center gap-2">
            
            {/* Simulation Quick Play/Pause */}
            <button
              onClick={handleToggleSimulation}
              title={simStatus?.is_running ? "Pause sensors" : "Resume sensors"}
              className="p-1.5 rounded-lg border border-purple-500/50 bg-gradient-to-br from-purple-900/60 to-indigo-900/60 hover:from-purple-900/80 hover:to-indigo-900/80 text-slate-300 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/40"
            >
              {simStatus?.is_running ? (
                <Pause className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-400 bounce-smooth" />
              )}
            </button>

            {/* Quick Demo Escalate */}
            <button
              onClick={handleQuickEscalate}
              title="Trigger escalation demo on Meppadi station"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-orange-500/60 bg-gradient-to-r from-orange-600/20 to-red-600/20 text-orange-300 hover:from-orange-600/40 hover:to-red-600/40 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/40"
            >
              <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400 pulse-glow" />
              <span>Trigger Alert</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              title="Reset all stations"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/50 bg-gradient-to-br from-cyan-900/60 to-blue-900/60 text-cyan-300 hover:from-cyan-900/80 hover:to-blue-900/80 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/40"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400 spin-smooth" />
              <span>Reset</span>
            </button>

            {/* WS Live Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono bg-gradient-to-r from-slate-900/70 via-purple-900/50 to-slate-900/70 border border-purple-500/40 glow-border">
              <span className={`w-2.5 h-2.5 rounded-full ${
                wsStatus === 'CONNECTED' 
                  ? 'bg-emerald-400 animate-pulse' 
                  : wsStatus === 'CONNECTING' 
                  ? 'bg-amber-400 flicker' 
                  : 'bg-red-400 pulse-glow'
              }`} />
              <span className="text-slate-300 font-medium hidden sm:inline">
                {wsStatus === 'CONNECTED' ? '🟢 Live' : wsStatus}
              </span>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
