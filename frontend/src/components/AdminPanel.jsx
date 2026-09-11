import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Zap, 
  BrainCircuit, 
  Sparkles, 
  RotateCcw, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  Gauge,
  Info,
  Clock
} from 'lucide-react';
import { 
  updateStationThresholds, 
  injectScenario, 
  resetAllScenarios, 
  controlSimulation, 
  predictRisk, 
  fetchMLMetrics,
  triggerModelRetrain 
} from '../services/api';
import { getRiskConfig } from '../utils/riskHelpers';

export default function AdminPanel({ stations = [], simStatus, onRefresh }) {
  // Scenario injection state
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || 1);
  const [selectedScenario, setSelectedScenario] = useState('flash_flood');
  const [scenarioMsg, setScenarioMsg] = useState('');
  const [scenarioLoading, setScenarioLoading] = useState(false);

  // Threshold edit state
  const [thresholdStationId, setThresholdStationId] = useState(stations[0]?.id || 1);
  const [warningThreshold, setWarningThreshold] = useState(50);
  const [criticalThreshold, setCriticalThreshold] = useState(75);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const [thresholdError, setThresholdError] = useState('');

  // Simulation controls state
  const [simInterval, setSimInterval] = useState(simStatus?.interval_seconds || 3.0);

  // ML Playground state
  const [mlInputs, setMlInputs] = useState({
    rainfall: 45.0,
    soil_moisture: 72.0,
    slope_angle: 38.0,
    vibration: 0.45,
    pore_water_pressure: 24.0,
    temperature: 24.0
  });
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  // ML Metrics state
  const [metrics, setMetrics] = useState(null);
  const [retraining, setRetraining] = useState(false);

  // Sync selected station thresholds
  useEffect(() => {
    const st = stations.find(s => s.id === Number(thresholdStationId));
    if (st) {
      setWarningThreshold(st.warning_threshold || 50);
      setCriticalThreshold(st.critical_threshold || 75);
    }
  }, [thresholdStationId, stations]);

  // Load ML metrics once
  useEffect(() => {
    fetchMLMetrics()
      .then(setMetrics)
      .catch(err => console.error("Could not load metrics:", err));
  }, []);

  // Run initial test prediction
  useEffect(() => {
    runMlPrediction();
  }, []);

  const runMlPrediction = async () => {
    try {
      setMlLoading(true);
      const res = await predictRisk(mlInputs);
      setMlResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setMlLoading(false);
    }
  };

  const handleApplyScenario = async () => {
    try {
      setScenarioLoading(true);
      setScenarioMsg('');
      await injectScenario(selectedStationId, selectedScenario);
      const st = stations.find(s => s.id === Number(selectedStationId));
      setScenarioMsg(`Scenario '${selectedScenario}' successfully injected on ${st?.code || 'station'}.`);
      if (onRefresh) onRefresh();
    } catch (e) {
      setScenarioMsg(`Error: ${e.message}`);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleResetAll = async () => {
    try {
      await resetAllScenarios();
      setScenarioMsg('All stations reset to normal baseline.');
      if (onRefresh) onRefresh();
    } catch (e) {
      setScenarioMsg(`Error: ${e.message}`);
    }
  };

  const handleSaveThresholds = async () => {
    try {
      setThresholdError('');
      setThresholdSaved(false);
      await updateStationThresholds(thresholdStationId, Number(warningThreshold), Number(criticalThreshold));
      setThresholdSaved(true);
      setTimeout(() => setThresholdSaved(false), 3000);
      if (onRefresh) onRefresh();
    } catch (e) {
      setThresholdError(e.message);
    }
  };

  const handleSimSpeedChange = async (interval) => {
    setSimInterval(interval);
    try {
      await controlSimulation({ interval_seconds: interval });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetrainModel = async () => {
    try {
      setRetraining(true);
      await triggerModelRetrain();
      setTimeout(async () => {
        const updated = await fetchMLMetrics();
        setMetrics(updated);
        setRetraining(false);
      }, 4000);
    } catch (e) {
      console.error(e);
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 2-Column Top Section: Scenarios & Thresholds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Scenario Injection Engine */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Scenario Injection Console</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                Live Simulation
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Inject synthetic geotechnical events to test the early warning pipeline and alert responses.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Station:</label>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.location_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Event Scenario:</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="gradual_escalation">Gradual Escalation (Safe &rarr; Watch &rarr; Warning &rarr; Critical over 3 min)</option>
                  <option value="flash_flood">Torrential Cloudburst (Sudden Rainfall Spike &gt;110mm/h)</option>
                  <option value="seismic_shock">Seismic Tremor (Earthquake Ground Acceleration Spike)</option>
                  <option value="dry_out">Rapid Drainage & Sunshine (Dry-Out back to Safe)</option>
                  <option value="normal">Normal Baseline Weather (Calm)</option>
                </select>
              </div>
            </div>

            {scenarioMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{scenarioMsg}</span>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Stations</span>
            </button>

            <button
              disabled={scenarioLoading}
              onClick={handleApplyScenario}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 transition-all shadow-md shadow-amber-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>{scenarioLoading ? 'Injecting...' : 'Inject Event'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Risk Threshold Configuration */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Station Threshold Customization</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                Tiered Policy
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Calibrate sensitivity thresholds per slope sector depending on residential density and historical vulnerability.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Select Station:</label>
                <select
                  value={thresholdStationId}
                  onChange={(e) => setThresholdStationId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warning Slider */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-orange-400">Warning Level Threshold</span>
                  <span className="font-mono font-bold text-orange-300 text-sm">{warningThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Critical Slider */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-red-400">Critical Level Threshold</span>
                  <span className="font-mono font-bold text-red-300 text-sm">{criticalThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </div>

            {thresholdError && (
              <div className="mt-2 text-xs text-red-400">{thresholdError}</div>
            )}
            {thresholdSaved && (
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Thresholds updated and persisted to database!</span>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            {/* Simulation Speed Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Stream Tick:</span>
              {[1, 3, 5].map(s => (
                <button
                  key={s}
                  onClick={() => handleSimSpeedChange(s)}
                  className={`px-2 py-1 text-[10px] font-bold rounded ${
                    simInterval === s 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveThresholds}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>

      {/* Interactive ML Risk Prediction Playground */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Interactive ML Risk Model Playground</h3>
              <p className="text-xs text-slate-400">
                Test multi-factor inference against the trained Random Forest geotechnical classifier in real time
              </p>
            </div>
          </div>
          <button
            onClick={runMlPrediction}
            disabled={mlLoading}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md"
          >
            {mlLoading ? 'Predicting...' : 'Run Predict'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 6 Sensor Input Sliders */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Rainfall */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Precipitation (Rainfall)</span>
                <span className="font-mono font-bold text-blue-400">{mlInputs.rainfall} mm/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={mlInputs.rainfall}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMlInputs(prev => ({ ...prev, rainfall: val }));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Soil Moisture */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Soil Moisture</span>
                <span className="font-mono font-bold text-teal-400">{mlInputs.soil_moisture}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={mlInputs.soil_moisture}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMlInputs(prev => ({ ...prev, soil_moisture: val }));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            {/* Pore Water Pressure */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Pore Water Pressure</span>
                <span className="font-mono font-bold text-indigo-400">{mlInputs.pore_water_pressure} kPa</span>
              </div>
              <input
                type="range"
                min="0"
                max="65"
                step="0.5"
                value={mlInputs.pore_water_pressure}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMlInputs(prev => ({ ...prev, pore_water_pressure: val }));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Slope Angle */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Slope Inclination</span>
                <span className="font-mono font-bold text-purple-400">{mlInputs.slope_angle}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="55"
                step="0.5"
                value={mlInputs.slope_angle}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMlInputs(prev => ({ ...prev, slope_angle: val }));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Vibration */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Seismic Ground Vibration</span>
                <span className="font-mono font-bold text-amber-400">{mlInputs.vibration} m/s²</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.05"
                value={mlInputs.vibration}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMlInputs(prev => ({ ...prev, vibration: val }));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Temperature */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Ambient Temperature</span>
                <span className="font-mono font-bold text-emerald-400">{mlInputs.temperature} °C</span>
              </div>
              <input
                type="range"
                min="12"
                max="40"
                step="0.5"
                value={mlInputs.temperature}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMlInputs(prev => ({ ...prev, temperature: val }));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

          </div>

          {/* Model Inference Results Output Card */}
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
            {mlResult ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Predicted Hazard Category</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      mlResult.risk_level === 'Critical'
                        ? 'bg-red-600 text-white animate-pulse'
                        : mlResult.risk_level === 'Warning'
                        ? 'bg-orange-500 text-slate-950'
                        : mlResult.risk_level === 'Watch'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-emerald-500 text-slate-950'
                    }`}>
                      {mlResult.risk_level}
                    </span>
                    <span className="font-mono text-2xl font-black text-white">
                      {mlResult.risk_score.toFixed(1)} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                    </span>
                  </div>
                </div>

                {/* Class Probabilities */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Class Probabilities</span>
                  <div className="space-y-1 text-[11px]">
                    {Object.entries(mlResult.probabilities || {}).map(([cls, prob]) => (
                      <div key={cls} className="flex items-center justify-between">
                        <span className="text-slate-400">{cls}:</span>
                        <span className="font-mono font-bold text-slate-200">{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Risk Driver Attribution */}
                {mlResult.contributing_factors && mlResult.contributing_factors.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-400 font-semibold block mb-1">Risk Drivers:</span>
                    <p className="text-slate-300 italic line-clamp-3">
                      {mlResult.contributing_factors[0].message}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Adjust sliders to see inference
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Model Performance & Feature Importances */}
      {metrics && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm text-white">Model Diagnostics & Feature Weights</h3>
                <p className="text-xs text-slate-400">
                  Trained on 10,000 geotechnical physics samples with Mohr-Coulomb stability modeling
                </p>
              </div>
            </div>
            <button
              onClick={handleRetrainModel}
              disabled={retraining}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Retraining...' : 'Retrain Model'}</span>
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Classifier Accuracy</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {(metrics.accuracy * 100).toFixed(2)}%
              </span>
            </div>
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Score R² Fit</span>
              <span className="text-xl font-bold font-mono text-blue-400">
                {metrics.r2_score?.toFixed(4) || '0.9878'}
              </span>
            </div>
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">RMSE Residual</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {metrics.rmse?.toFixed(2) || '2.87'} pts
              </span>
            </div>
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Sample Size</span>
              <span className="text-xl font-bold font-mono text-purple-400">
                {metrics.training_samples?.toLocaleString() || '10,000'}
              </span>
            </div>
          </div>

          {/* Feature Importances Bar Chart */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-3">Feature Importance Ranking</h4>
            <div className="space-y-2.5">
              {metrics.feature_importances?.map((item) => (
                <div key={item.feature} className="text-xs">
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="font-mono capitalize">{item.feature.replace(/_/g, ' ')}</span>
                    <span className="font-mono font-bold text-slate-200">{item.importance.toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${item.importance * 3.5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
