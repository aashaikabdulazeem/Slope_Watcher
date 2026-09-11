import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Send, 
  Check, 
  Filter, 
  FileText, 
  MapPin, 
  Info,
  PhoneCall,
  Mail
} from 'lucide-react';
import { acknowledgeAlert, resolveAlert } from '../services/api';
import { getRiskConfig, formatDateTime } from '../utils/riskHelpers';

export default function AlertFeed({ alerts = [], onAlertUpdated }) {
  const [filter, setFilter] = useState('all'); // all, active, acknowledged, resolved
  const [actionLoading, setActionLoading] = useState(null);

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const handleAcknowledge = async (alertId) => {
    try {
      setActionLoading(alertId);
      await acknowledgeAlert(alertId);
      if (onAlertUpdated) onAlertUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      setActionLoading(alertId);
      await resolveAlert(alertId);
      if (onAlertUpdated) onAlertUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Feed Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Emergency Incident Feed & Alert Log</h2>
            <p className="text-xs text-slate-400">
              Automated multi-factor hazard detection and dispatched early warnings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          {[
            { id: 'all', label: 'All Incidents' },
            { id: 'active', label: 'Active Alerts' },
            { id: 'acknowledged', label: 'Acknowledged' },
            { id: 'resolved', label: 'Resolved' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-white">No {filter !== 'all' ? filter : ''} alerts found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All active monitoring stations are currently reporting stable slope conditions or alerts have been resolved.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alert => {
            const isCritical = alert.risk_level === 'Critical';
            const riskConfig = getRiskConfig(alert.risk_level);

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border transition-all p-5 backdrop-blur-sm ${
                  alert.status === 'active'
                    ? isCritical
                      ? 'bg-red-950/20 border-red-500/50 shadow-lg shadow-red-950/40 ring-1 ring-red-500/30'
                      : 'bg-orange-950/20 border-orange-500/50 shadow-md shadow-orange-950/30'
                    : alert.status === 'acknowledged'
                    ? 'bg-amber-950/10 border-amber-500/30'
                    : 'bg-slate-900/40 border-slate-800 opacity-75'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
                  
                  {/* Station Code, Title & Risk Badge */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      isCritical ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {isCritical ? <Flame className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                          {alert.station_code || `Station #${alert.station_id}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-slate-950'
                        }`}>
                          {alert.risk_level} ALERT
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          Score: {alert.risk_score.toFixed(1)}/100
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {alert.station_name || 'Monitoring Station Hazard Alert'}
                      </h4>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      alert.status === 'active'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : alert.status === 'acknowledged'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span className="capitalize">{alert.status}</span>
                    </span>

                    {/* Action buttons */}
                    {alert.status === 'active' && (
                      <button
                        disabled={actionLoading === alert.id}
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}

                    {alert.status !== 'resolved' && (
                      <button
                        disabled={actionLoading === alert.id}
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>

                </div>

                {/* Trigger Factors & Recommended Action */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* Left: Factors Breakdown */}
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-2">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Contributing Trigger Factors:</span>
                    </div>
                    <pre className="font-sans text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {alert.trigger_factors}
                    </pre>
                  </div>

                  {/* Right: Geotechnical Action Protocol */}
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Recommended Emergency Action:</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed font-medium">
                        {alert.recommended_action}
                      </p>
                    </div>

                    {/* Dispatch log receipt */}
                    {alert.dispatch_log && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
                        <Send className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{alert.dispatch_log}</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer Timestamps */}
                <div className="mt-3 pt-2 border-t border-slate-800/50 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Triggered at: {formatDateTime(alert.timestamp)}</span>
                  <div className="flex gap-4">
                    {alert.acknowledged_at && (
                      <span>Ack: {formatDateTime(alert.acknowledged_at)}</span>
                    )}
                    {alert.resolved_at && (
                      <span>Resolved: {formatDateTime(alert.resolved_at)}</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
