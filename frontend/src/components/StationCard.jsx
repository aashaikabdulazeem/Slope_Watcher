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
    <div className={`p-2.5 rounded-lg border transition-all ${
      isWarning 
        ? 'bg-red-500/10 border-red-500/30 text-red-300' 
        : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
    }`}>
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
        <span className="flex items-center gap-1">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
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
        ? 'bg-red-950/20 border-red-500/60 shadow-lg shadow-red-900/30 ring-1 ring-red-500/40'
        : riskLevel === 'Warning'
        ? 'bg-orange-950/20 border-orange-500/50 shadow-md shadow-orange-900/20'
        : riskLevel === 'Watch'
        ? 'bg-amber-950/10 border-amber-500/40'
        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
    }`}>
      
      {/* Critical Ribbon / Top highlight */}
      {riskLevel === 'Critical' && (
        <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse" />
      )}

      <div className="p-4 sm:p-5">
        
        {/* Header: Station Code, Name & Risk Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                {station.code}
              </span>
              {station.code === 'STN-003' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Escalating Demo
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-white mt-1 line-clamp-1" title={station.name}>
              {station.name}
            </h3>
            <p className="text-[11px] text-slate-400 line-clamp-1" title={station.location_name}>
              {station.location_name} • Elev: {station.elevation}m
            </p>
          </div>

          {/* Risk Level Badge */}
          <div className="flex flex-col items-end">
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
              riskLevel === 'Critical'
                ? 'bg-red-600 text-white animate-pulse'
                : riskLevel === 'Warning'
                ? 'bg-orange-500 text-slate-950'
                : riskLevel === 'Watch'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-emerald-500 text-slate-950'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                riskLevel === 'Critical' ? 'bg-white' : 'bg-slate-900'
              }`} />
              {riskLevel}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1">
              Updated {formatTimestamp(reading.timestamp)}
            </span>
          </div>
        </div>

        {/* Risk Score Progress Gauge */}
        <div className="my-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              AI Geotechnical Risk Score
            </span>
            <span className="font-mono font-bold text-sm" style={{ color: riskConfig.hex }}>
              {riskScore.toFixed(1)} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, riskScore))}%`,
                backgroundColor: riskConfig.hex
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>0 Safe</span>
            <span>50 Watch</span>
            <span>75 Warning</span>
            <span>100 Critical</span>
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
      <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {/* Scenario Injection Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Sim:</span>
          <select
            disabled={injecting}
            value={station.scenario_mode || 'normal'}
            onChange={(e) => handleScenarioChange(e.target.value)}
            className="text-[11px] bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
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
          className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>Trends</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
