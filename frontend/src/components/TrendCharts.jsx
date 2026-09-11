import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  CloudRain, 
  Droplets, 
  Gauge, 
  Activity, 
  TrendingUp, 
  Calendar, 
  Filter,
  Layers
} from 'lucide-react';
import { fetchReadings } from '../services/api';
import { formatTimestamp, getRiskScoreColor } from '../utils/riskHelpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs">
        <p className="text-slate-400 font-mono mb-2 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value} {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendCharts({ stations = [], selectedStationId, onSelectStation }) {
  const [stationId, setStationId] = useState(selectedStationId || (stations[0]?.id || 1));
  const [dataPoints, setDataPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartRange, setChartRange] = useState(50); // limit 30, 50, 100

  // Sync prop changes
  useEffect(() => {
    if (selectedStationId && selectedStationId !== stationId) {
      setStationId(selectedStationId);
    }
  }, [selectedStationId]);

  // Fetch readings when station or limit changes
  const loadHistory = async () => {
    if (!stationId) return;
    try {
      setLoading(true);
      const readings = await fetchReadings(stationId, chartRange);
      const formatted = readings.map(r => ({
        ...r,
        timeFormatted: formatTimestamp(r.timestamp),
      }));
      setDataPoints(formatted);
    } catch (e) {
      console.error("Failed to load readings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [stationId, chartRange]);

  // Merge live updates into chart data if matching currently selected station
  useEffect(() => {
    const currentStation = stations.find(s => s.id === Number(stationId));
    if (currentStation && currentStation.latest_reading) {
      const latest = currentStation.latest_reading;
      setDataPoints(prev => {
        if (!prev.length) return prev;
        const lastItem = prev[prev.length - 1];
        // If same timestamp, ignore
        if (lastItem.timestamp === latest.timestamp) return prev;

        const newPoint = {
          ...latest,
          timeFormatted: formatTimestamp(latest.timestamp)
        };
        const next = [...prev, newPoint];
        if (next.length > chartRange) {
          return next.slice(next.length - chartRange);
        }
        return next;
      });
    }
  }, [stations, stationId, chartRange]);

  const selectedStationObj = stations.find(s => s.id === Number(stationId)) || stations[0] || {};
  const currentRisk = selectedStationObj.latest_reading?.risk_score ?? 0;

  return (
    <div className="space-y-6">
      
      {/* Control Header & Filters */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-300">Station Monitor:</span>
          </div>
          <select
            value={stationId}
            onChange={(e) => {
              const newId = Number(e.target.value);
              setStationId(newId);
              if (onSelectStation) onSelectStation(newId);
            }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {stations.map(st => (
              <option key={st.id} value={st.id}>
                {st.code} - {st.name} {st.code === 'STN-003' ? '(Escalating Demo)' : ''}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">
            {selectedStationObj.location_name} • Base Slope: {selectedStationObj.slope_angle_base}°
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">History Window:</span>
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            {[30, 60, 100].map(cnt => (
              <button
                key={cnt}
                onClick={() => setChartRange(cnt)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  chartRange === cnt
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cnt} pts
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of 3 Diagnostic Trend Charts */}
      <div className="grid grid-cols-1 gap-6">

        {/* Chart 1: Landslide Risk Score & Warning Thresholds */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm text-white">AI Landslide Risk Index (0 - 100)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time multi-factor prediction with tiered alert threshold boundaries
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-0.5 bg-amber-400 border border-dashed border-amber-400" />
                Watch (35)
              </span>
              <span className="flex items-center gap-1.5 text-orange-400">
                <span className="w-3 h-0.5 bg-orange-400 border border-dashed border-orange-400" />
                Warning ({selectedStationObj.warning_threshold || 50})
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-3 h-0.5 bg-red-500 border border-dashed border-red-500" />
                Critical ({selectedStationObj.critical_threshold || 75})
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getRiskScoreColor(currentRisk)} stopOpacity={0.6}/>
                    <stop offset="95%" stopColor={getRiskScoreColor(currentRisk)} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="timeFormatted" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={35} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Watch', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                <ReferenceLine y={selectedStationObj.warning_threshold || 50} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Warning', fill: '#f97316', fontSize: 10, position: 'right' }} />
                <ReferenceLine y={selectedStationObj.critical_threshold || 75} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                <Area 
                  type="monotone" 
                  dataKey="risk_score" 
                  name="Risk Score" 
                  stroke={getRiskScoreColor(currentRisk)} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#riskGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Rainfall Rate (mm/h) vs Soil Moisture (%) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Precipitation & Soil Moisture Dynamics</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Correlation between rainfall intensity and groundwater moisture saturation
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-3 h-0.5 bg-blue-400" /> Rainfall (mm/h)
              </span>
              <span className="flex items-center gap-1.5 text-teal-400">
                <span className="w-3 h-0.5 bg-teal-400" /> Soil Moisture (%)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="timeFormatted" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#14b8a6" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="left" type="monotone" dataKey="rainfall" name="Rainfall (mm/h)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="soil_moisture" name="Soil Moisture (%)" stroke="#14b8a6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Pore Water Pressure (kPa) & Ground Vibration (m/s^2) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Pore Water Pressure & Seismic Acceleration</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sub-surface hydraulic pressure vs dynamic bedrock tremors
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-3 h-0.5 bg-indigo-400" /> Pore Pressure (kPa)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-0.5 bg-amber-400" /> Vibration (m/s²)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="timeFormatted" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis yAxisId="pwp" stroke="#818cf8" fontSize={10} tickLine={false} />
                <YAxis yAxisId="vib" orientation="right" stroke="#f59e0b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="pwp" type="monotone" dataKey="pore_water_pressure" name="Pore Pressure (kPa)" stroke="#818cf8" strokeWidth={2} dot={false} />
                <Line yAxisId="vib" type="monotone" dataKey="vibration" name="Vibration (m/s²)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
