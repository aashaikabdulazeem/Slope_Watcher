import React, { useState } from 'react';
import { 
  CloudRain, 
  Droplets, 
  Compass, 
  Activity, 
  Gauge, 
  Thermometer, 
  AlertTriangle, 
  Flame, 
  Zap, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { getRiskConfig, formatTimestamp } from '../utils/riskHelpers';
import { injectScenario } from '../services/api';

export default function StationCard({ station, onSelectStation }) {
  const reading = station.latest_reading || {};
  const riskLevel = reading.risk_level || 'Safe';
  const riskScore = reading.risk_score ?? 0;
  const riskConfig = getRiskConfig(riskLevel);
  const [injecting, setInjecting] = useState(false);

  const handleScenarioChange = async (scenario) => {
    try {
      setInjecting(true);
      await injectScenario(station.id, scenario);
    } catch (e) {
      console.error(e);
    } finally {
      setInjecting(false);
    }
  };

  // Helper for sensor card items
  const renderSensorItem = (Icon, label, value, unit, isWarning = false) => (
    <div className={`p-2.5 rounded-lg border transition-all hover:shadow-md ${
      isWarning 
        ? 'bg-gradient-to-br from-red-600/30 to-orange-600/20 border-red-500/50 text-red-300 shadow-md shadow-red-900/20' 
        : 'bg-gradient-to-br from-slate-900/70 to-slate-800/60 border-slate-700/50 text-slate-300 hover:border-slate-600/70'
    }`}>
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
        <span className="flex items-center gap-1">
          <Icon className={`w-3.5 h-3.5 ${isWarning ? 'text-orange-400 pulse-glow' : 'text-slate-500'}`} />
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-base font-bold font-mono tracking-tight text-white">
          {value !== undefined ? value : '--'}
        </span>
        <span className="text-[10px] text-slate-400 font-sans">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className={`relative rounded-2xl border transition-all duration-300 backdrop-blur-sm overflow-hidden flex flex-col justify-between ${
      riskLevel === 'Critical'
        ? 'bg-gradient-to-br from-red-950/60 via-orange-950/40 to-red-950/50 border-red-500/60 shadow-xl shadow-red-900/40 glow-border'
        : riskLevel === 'Warning'
        ? 'bg-gradient-to-br from-orange-950/50 via-amber-950/40 to-orange-950/40 border-orange-500/50 shadow-lg shadow-orange-900/30'
        : riskLevel === 'Watch'
        ? 'bg-gradient-to-br from-amber-950/30 via-yellow-950/20 to-amber-950/30 border-amber-500/40 shadow-md shadow-amber-900/20'
        : 'bg-gradient-to-br from-blue-950/30 via-slate-900/50 to-cyan-950/30 border-blue-600/30 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/20'
    }`}>
      
      {/* Critical Ribbon / Top highlight */}
      {riskLevel === 'Critical' && (
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse" />
      )}
      {riskLevel === 'Warning' && (
        <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
      )}

      <div className="p-5">
        
        {/* Header: Station Code, Name & Risk Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg bg-slate-800/60 text-teal-300 border border-slate-700/50">
                {station.code}
              </span>
              {station.code === 'STN-003' && (
                <span className="text-[10px] px-2 py-1 rounded-lg font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  ⚡ Demo
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-1 line-clamp-1 font-outfit" title={station.name}>
              {station.name}
            </h3>
            <p className="text-[11px] text-slate-400 line-clamp-1 font-light" title={station.location_name}>
              {station.location_name} • {station.elevation}m
            </p>
          </div>

          {/* Risk Level Badge */}
          <div className="flex flex-col items-end gap-1">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-md ${
              riskLevel === 'Critical'
                ? 'bg-red-600 text-white animate-pulse'
                : riskLevel === 'Warning'
                ? 'bg-orange-500 text-white'
                : riskLevel === 'Watch'
                ? 'bg-amber-400 text-slate-900'
                : 'bg-emerald-500 text-white'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
              {riskLevel}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {formatTimestamp(reading.timestamp)}
            </span>
          </div>
        </div>

        {/* Risk Score Progress Gauge */}
        <div className="my-3 bg-gradient-to-br from-slate-950/70 to-slate-900/50 p-3 rounded-xl border border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Activity className={`w-3.5 h-3.5 ${riskScore > 50 ? 'text-orange-400 pulse-glow' : 'text-emerald-400'}`} />
              Risk Score
            </span>
            <span className="font-mono font-bold text-sm" style={{ color: riskConfig.hex }}>
              {riskScore.toFixed(1)}<span className="text-xs text-slate-500 font-normal ml-0.5">/ 100</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/30 shadow-inner">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, riskScore))}%`,
                backgroundColor: riskConfig.hex,
                boxShadow: `0 0 10px ${riskConfig.hex}80`
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
            <span>0 Safe</span>
            <span>50 Watch</span>
            <span>75⚠️</span>
            <span>100 🔴</span>
          </div>
        </div>

        {/* 6 Sensor Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {renderSensorItem(
            CloudRain, 
            'Rainfall', 
            reading.rainfall, 
            'mm/h', 
            (reading.rainfall || 0) > 50
          )}
          {renderSensorItem(
            Droplets, 
            'Moisture', 
            reading.soil_moisture, 
            '%', 
            (reading.soil_moisture || 0) > 80
          )}
          {renderSensorItem(
            Gauge, 
            'Pore Press.', 
            reading.pore_water_pressure, 
            'kPa', 
            (reading.pore_water_pressure || 0) > 30
          )}
          {renderSensorItem(
            Compass, 
            'Slope', 
            reading.slope_angle, 
            '°', 
            (reading.slope_angle || 0) > 40
          )}
          {renderSensorItem(
            Activity, 
            'Vibration', 
            reading.vibration, 
            'm/s²', 
            (reading.vibration || 0) > 1.2
          )}
          {renderSensorItem(
            Thermometer, 
            'Temp', 
            reading.temperature, 
            '°C'
          )}
        </div>

        {/* Key Contributing Factor Pill if elevated */}
        {reading.contributing_factors && reading.contributing_factors.length > 0 && riskLevel !== 'Safe' && (
          <div className="mt-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
            <div className="flex items-center gap-1 text-slate-400 font-medium mb-0.5">
              <Info className="w-3 h-3 text-blue-400" />
              <span>Primary Risk Driver:</span>
            </div>
            <p className="text-slate-300 line-clamp-1 italic">
              {reading.contributing_factors[0].message}
            </p>
          </div>
        )}

      </div>

      {/* Footer Actions: Scenario Injector & Inspect */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-950/80 via-purple-950/40 to-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-2 hover:bg-gradient-to-r hover:from-slate-950 hover:via-purple-900/60 hover:to-slate-950 transition-all">
        {/* Scenario Injection Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Sim:</span>
          <select
            disabled={injecting}
            value={station.scenario_mode || 'normal'}
            onChange={(e) => handleScenarioChange(e.target.value)}
            className="text-[11px] bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer hover:border-slate-600 transition-all"
          >
            <option value="normal">Normal Baseline</option>
            <option value="gradual_escalation">Gradual Escalation (3 min)</option>
            <option value="flash_flood">Torrential Cloudburst</option>
            <option value="seismic_shock">Seismic Tremor</option>
            <option value="dry_out">Drainage / Dry-Out</option>
          </select>
        </div>

        {/* Inspect Trend Button */}
        <button
          onClick={() => onSelectStation && onSelectStation(station.id)}
          className="flex items-center gap-1 text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-lg hover:from-blue-500 hover:to-purple-500 shadow-md hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200"
        >
          <span>Trends</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
