import React, { useState, useCallback } from 'react';
import { 
  MessageSquare, 
  Users, 
  Send, 
  Phone, 
  AlertTriangle,
  MapPin,
  Copy,
  Bell,
  Radio,
  CheckCircle2,
  Clock,
  Smartphone,
  Mail,
  Megaphone,
  Shield,
  Edit2,
  Trash2
} from 'lucide-react';
import { getRiskConfig } from '../utils/riskHelpers';

export default function CommunicationHub({ stations = [], alerts = [] }) {
  const [activeTab, setActiveTab] = useState('people'); // people, broadcast, critical-zones
  const [people, setPeople] = useState(() => {
    const stored = localStorage.getItem('alertPeople');
    return stored ? JSON.parse(stored) : [];
  });
  const [newPerson, setNewPerson] = useState({ name: '', phone: '', email: '', zone: '', radius: 5 });
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendStatus, setSendStatus] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Get critical zones based on station risk levels
  const criticalZones = stations
    .filter(s => (s.latest_reading?.risk_level === 'Warning' || s.latest_reading?.risk_level === 'Critical'))
    .map(s => ({
      id: s.id,
      name: s.name,
      location: s.location_name,
      lat: s.latitude,
      lng: s.longitude,
      riskLevel: s.latest_reading?.risk_level || 'Safe',
      riskScore: s.latest_reading?.risk_score ?? 0,
      elevation: s.elevation,
      radius: 3 // km radius of alert zone
    }));

  // Add new person to alert list
  const handleAddPerson = () => {
    if (!newPerson.name || !newPerson.phone || !newPerson.zone) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedPeople = editingId 
      ? people.map(p => p.id === editingId ? { ...newPerson, id: editingId } : p)
      : [...people, { ...newPerson, id: Date.now() }];
    
    setPeople(updatedPeople);
    localStorage.setItem('alertPeople', JSON.stringify(updatedPeople));
    setNewPerson({ name: '', phone: '', email: '', zone: '', radius: 5 });
    setEditingId(null);
  };

  // Edit person
  const handleEditPerson = (person) => {
    setNewPerson(person);
    setEditingId(person.id);
  };

  // Delete person
  const handleDeletePerson = (id) => {
    const updated = people.filter(p => p.id !== id);
    setPeople(updated);
    localStorage.setItem('alertPeople', JSON.stringify(updated));
  };

  // Send broadcast to alert zone
  const handleBroadcastAlert = async (zone) => {
    if (!broadcastMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    // Find people in this zone
    const peopleInZone = people.filter(p => p.zone === zone.name);
    
    if (peopleInZone.length === 0) {
      alert('No people registered for this zone');
      return;
    }

    setSendStatus({ state: 'sending', count: 0 });

    // Simulate sending notifications
    for (let i = 0; i < peopleInZone.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setSendStatus({ state: 'sending', count: i + 1 });
    }

    setSendStatus({ state: 'success', count: peopleInZone.length });
    setTimeout(() => setSendStatus(null), 3000);
    setBroadcastMessage('');
  };

  // Get people in zone
  const getPeopleInZone = (zoneName) => {
    return people.filter(p => p.zone === zoneName);
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('people')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'people'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            People in Alert Areas
          </button>

          <button
            onClick={() => setActiveTab('critical-zones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'critical-zones'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-300 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            Critical Zones
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-300 hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Regional Alerts
          </button>
        </div>
      </div>

      {/* Tab 1: People Management */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          
          {/* Add/Edit Person Form */}
          <div className="bg-slate-900/70 border border-slate-700/40 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-teal-400" />
              {editingId ? 'Edit Person' : 'Register Person for Alerts'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                className="px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
              <input
                type="tel"
                placeholder="Mobile Number (+91...)"
                value={newPerson.phone}
                onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                className="px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newPerson.email}
                onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                className="px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
              <select
                value={newPerson.zone}
                onChange={(e) => setNewPerson({ ...newPerson, zone: e.target.value })}
                className="px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white focus:outline-none focus:border-teal-500/50"
              >
                <option value="">Select Zone/Station</option>
                {stations.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddPerson}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-600/30 transition-all"
              >
                <Send className="w-4 h-4" />
                {editingId ? 'Update' : 'Register'}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setNewPerson({ name: '', phone: '', email: '', zone: '', radius: 5 });
                    setEditingId(null);
                  }}
                  className="px-6 py-2 bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-lg font-semibold hover:bg-slate-700/60 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* People List */}
          {people.length > 0 ? (
            <div className="bg-slate-900/70 border border-slate-700/40 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">Registered Contacts ({people.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {people.map(person => (
                  <div key={person.id} className="bg-slate-800/60 border border-slate-700/30 rounded-xl p-4 flex items-start justify-between hover:border-teal-600/40 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{person.name}</span>
                        <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-xs rounded-full font-medium">
                          {person.zone}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-teal-400" />
                          {person.phone}
                        </span>
                        {person.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-teal-400" />
                            {person.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditPerson(person)}
                        className="p-2 rounded-lg bg-slate-700/40 text-slate-300 hover:bg-slate-600/60 hover:text-white transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePerson(person.id)}
                        className="p-2 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-900/50 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <p className="text-slate-400">No contacts registered yet. Add people to receive alerts in their zones.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Critical Zones */}
      {activeTab === 'critical-zones' && (
        <div className="space-y-4">
          {criticalZones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criticalZones.map(zone => {
                const riskConfig = getRiskConfig(zone.riskLevel);
                const peopleCount = getPeopleInZone(zone.name).length;
                
                return (
                  <div 
                    key={zone.id}
                    className={`rounded-2xl border p-5 transition-all cursor-pointer ${
                      zone.riskLevel === 'Critical'
                        ? 'bg-red-950/30 border-red-500/50 hover:shadow-lg hover:shadow-red-900/20'
                        : 'bg-orange-950/25 border-orange-500/40 hover:shadow-lg hover:shadow-orange-900/15'
                    }`}
                    onClick={() => setSelectedZone(selectedZone?.id === zone.id ? null : zone)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-white text-base">{zone.name}</h4>
                        <p className="text-sm text-slate-400">{zone.location}</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full font-bold text-white text-sm ${
                        zone.riskLevel === 'Critical' ? 'bg-red-600 animate-pulse' : 'bg-orange-500'
                      }`}>
                        {zone.riskLevel}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 rounded-lg p-3 mb-3 space-y-2 text-sm">
                      <div className="flex justify-between text-slate-300">
                        <span>Risk Score:</span>
                        <span className="font-mono font-bold" style={{ color: riskConfig.hex }}>
                          {zone.riskScore.toFixed(1)}/100
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Alert Radius:</span>
                        <span className="font-mono">{zone.radius} km</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Elevation:</span>
                        <span className="font-mono">{zone.elevation}m</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-700/30">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-teal-400" />
                          People Registered:
                        </span>
                        <span className="font-bold text-teal-300">{peopleCount} contacts</span>
                      </div>
                    </div>

                    {selectedZone?.id === zone.id && peopleCount > 0 && (
                      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-xs font-semibold text-slate-300 mb-2">People in this zone:</p>
                        <div className="space-y-1 text-xs">
                          {getPeopleInZone(zone.name).map(p => (
                            <div key={p.id} className="flex items-center gap-2 text-slate-400">
                              <Phone className="w-3 h-3 text-teal-400" />
                              <span>{p.name}</span>
                              <span className="text-slate-500">({p.phone})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
              <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
              <p className="text-slate-400">All zones are safe. No critical zones detected.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Broadcast Alerts */}
      {activeTab === 'broadcast' && (
        <div className="space-y-4">
          {criticalZones.length > 0 ? (
            criticalZones.map(zone => (
              <div key={zone.id} className={`rounded-2xl border p-5 ${
                zone.riskLevel === 'Critical'
                  ? 'bg-red-950/30 border-red-500/50'
                  : 'bg-orange-950/25 border-orange-500/40'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-white text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-400" />
                      {zone.name} - {zone.riskLevel} Zone
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">
                      {getPeopleInZone(zone.name).length} people will receive this alert
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full font-bold text-white ${
                    zone.riskLevel === 'Critical' ? 'bg-red-600' : 'bg-orange-500'
                  }`}>
                    {zone.riskLevel}
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea
                    placeholder="Type your alert message here... (e.g., 'Landslide risk escalating. Prepare to evacuate.')"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 text-sm min-h-24 resize-none"
                  />
                  
                  <button
                    onClick={() => handleBroadcastAlert(zone)}
                    disabled={!broadcastMessage.trim() || getPeopleInZone(zone.name).length === 0}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Megaphone className="w-5 h-5" />
                    Send Alert to {getPeopleInZone(zone.name).length} People
                  </button>

                  {sendStatus && (
                    <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      sendStatus.state === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {sendStatus.state === 'success' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Alert sent to {sendStatus.count} contacts ✓
                        </>
                      ) : (
                        <>
                          <Radio className="w-4 h-4 animate-pulse" />
                          Sending to {sendStatus.count} contacts...
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
              <Megaphone className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <p className="text-slate-400">No critical zones to broadcast alerts for.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
