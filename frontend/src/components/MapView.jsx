import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Mountain, Eye, RefreshCw, ZoomIn, AlertCircle } from 'lucide-react';
import { getRiskConfig, getRiskScoreColor, formatTimestamp } from '../utils/riskHelpers';

// Base Tile Layer Providers
const TILE_LAYERS = {
  terrain: {
    name: 'Topographic / Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (&copy; OSM contributors)',
    maxZoom: 17,
    description: 'Hillshading and topographic contours for mountain slope analysis'
  },
  satellite: {
    name: 'Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
    maxZoom: 18,
    description: 'High-resolution aerial satellite imagery'
  },
  street: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    description: 'Standard road and cartographic map'
  }
};

export default function MapView({ stations = [], onSelectStation }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});
  const circlesRef = useRef({});
  const [activeLayer, setActiveLayer] = useState('terrain');
  const [maptilerKey, setMaptilerKey] = useState('');
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const [showCriticalZones, setShowCriticalZones] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around Western Ghats monitoring cluster (11.5, 76.1)
      const map = L.map(mapContainerRef.current, {
        center: [11.52, 76.10],
        zoom: 11,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Default to Topographic terrain layer
      const defaultLayer = L.tileLayer(TILE_LAYERS.terrain.url, {
        attribution: TILE_LAYERS.terrain.attribution,
        maxZoom: TILE_LAYERS.terrain.maxZoom,
      }).addTo(map);

      tileLayerRef.current = defaultLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = TILE_LAYERS[activeLayer]?.url || TILE_LAYERS.terrain.url;
    let attr = TILE_LAYERS[activeLayer]?.attribution || TILE_LAYERS.terrain.attribution;
    let maxZ = TILE_LAYERS[activeLayer]?.maxZoom || 18;

    // Check if user provided custom MapTiler key
    if (activeLayer === 'maptiler' && maptilerKey) {
      url = `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${maptilerKey}`;
      attr = '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; OSM';
    }

    const newLayer = L.tileLayer(url, {
      attribution: attr,
      maxZoom: maxZ
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [activeLayer, maptilerKey]);

  // Update Markers when stations data updates
  useEffect(() => {
    if (!mapInstanceRef.current || !stations.length) return;
    const map = mapInstanceRef.current;

    stations.forEach(station => {
      const reading = station.latest_reading || {};
      const riskLevel = reading.risk_level || 'Safe';
      const riskScore = reading.risk_score ?? 0;
      const riskColor = getRiskScoreColor(riskScore);
      const isCritical = riskLevel === 'Critical';

      // Custom pulsing HTML marker
      const customHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isCritical ? `<div class="absolute w-10 h-10 rounded-full bg-red-500/40 pulse-ring"></div>` : ''}
          <div class="relative w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center font-bold text-xs text-white transition-transform transform group-hover:scale-110" style="background-color: ${riskColor}; box-shadow: 0 0 12px ${riskColor};">
            ${station.code.replace('STN-', '')}
          </div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[9px] font-mono text-slate-200 whitespace-nowrap shadow-md pointer-events-none">
            ${station.name.split(' ')[0]} (${riskScore.toFixed(0)})
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'sentinel-map-marker',
        html: customHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      // Popup HTML content
      const popupHtml = `
        <div class="p-3.5 min-w-[260px] text-slate-100 font-sans">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div>
              <span class="font-mono text-[10px] bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded">${station.code}</span>
              <h4 class="font-bold text-sm text-white mt-0.5">${station.name}</h4>
              <p class="text-[10px] text-slate-400">${station.location_name}</p>
            </div>
            <div class="text-right">
              <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style="background-color: ${riskColor}">
                ${riskLevel}
              </span>
              <div class="font-mono font-bold text-sm text-white mt-0.5">${riskScore.toFixed(1)}/100</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-xs mb-3">
            <div class="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span class="text-[10px] text-slate-400 block">Rainfall</span>
              <span class="font-mono font-semibold text-white">${reading.rainfall ?? '--'} mm/h</span>
            </div>
            <div class="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span class="text-[10px] text-slate-400 block">Soil Moisture</span>
              <span class="font-mono font-semibold text-white">${reading.soil_moisture ?? '--'}%</span>
            </div>
            <div class="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span class="text-[10px] text-slate-400 block">Pore Water Press.</span>
              <span class="font-mono font-semibold text-white">${reading.pore_water_pressure ?? '--'} kPa</span>
            </div>
            <div class="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span class="text-[10px] text-slate-400 block">Slope Angle</span>
              <span class="font-mono font-semibold text-white">${reading.slope_angle ?? station.slope_angle_base}°</span>
            </div>
          </div>

          ${reading.contributing_factors && reading.contributing_factors.length > 0 && riskLevel !== 'Safe' ? `
            <div class="mb-2 p-1.5 bg-red-950/40 border border-red-800/40 rounded text-[10px] text-red-200">
              <strong>Risk Factor:</strong> ${reading.contributing_factors[0].message}
            </div>
          ` : ''}

          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Elevation: ${station.elevation}m</span>
            <span>${formatTimestamp(reading.timestamp)}</span>
          </div>
        </div>
      `;

      if (markersRef.current[station.id]) {
        // Update existing marker icon and popup
        const marker = markersRef.current[station.id];
        marker.setIcon(customIcon);
        marker.setPopupContent(popupHtml);
      } else {
        // Create new marker
        const marker = L.marker([station.latitude, station.longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(popupHtml);
        markersRef.current[station.id] = marker;
      }
    });

    // Fit bounds once on first load
    if (Object.keys(markersRef.current).length === stations.length && !map._fitted) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.15));
      map._fitted = true;
    }

  }, [stations]);

  // Render critical zones as alert radius circles
  useEffect(() => {
    if (!mapInstanceRef.current || !stations.length) return;
    const map = mapInstanceRef.current;

    // Clear old circles
    Object.values(circlesRef.current).forEach(circle => map.removeLayer(circle));
    circlesRef.current = {};

    if (!showCriticalZones) return;

    // Add circles for critical/warning zones
    stations.forEach(station => {
      const reading = station.latest_reading || {};
      const riskLevel = reading.risk_level || 'Safe';
      
      if (riskLevel === 'Critical' || riskLevel === 'Warning') {
        const radiusKm = riskLevel === 'Critical' ? 5 : 3; // km
        const radiusM = radiusKm * 1000; // convert to meters

        const color = riskLevel === 'Critical' ? '#ef4444' : '#f97316';
        const circle = L.circle(
          [station.latitude, station.longitude],
          {
            radius: radiusM,
            color: color,
            weight: 2,
            opacity: 0.4,
            fill: true,
            fillColor: color,
            fillOpacity: riskLevel === 'Critical' ? 0.15 : 0.08,
            dashArray: riskLevel === 'Critical' ? '5, 5' : 'none'
          }
        ).addTo(map);

        // Add tooltip
        circle.bindTooltip(
          `<strong>${station.name}</strong><br/>${riskLevel} Zone (${radiusKm}km radius)`,
          { permanent: false }
        );

        circlesRef.current[station.id] = circle;
      }
    });

  }, [stations, showCriticalZones]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current || !Object.keys(markersRef.current).length) return;
    const group = L.featureGroup(Object.values(markersRef.current));
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.15));
  };

  return (
    <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0a0f1d]">
      
      {/* Map Target */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Header Control Bar */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2">
        
        {/* Layer Selector Pill */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-xl flex items-center gap-1">
          <button
            onClick={() => setActiveLayer('terrain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'terrain'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Terrain</span>
          </button>

          <button
            onClick={() => setActiveLayer('satellite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'satellite'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => setActiveLayer('street')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeLayer === 'street'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Streets</span>
          </button>
        </div>

        {/* Critical Zones Toggle */}
        <button
          onClick={() => setShowCriticalZones(!showCriticalZones)}
          title={showCriticalZones ? "Hide critical zones" : "Show critical zones"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showCriticalZones
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Alert Zones</span>
        </button>

        {/* Recenter button */}
        <button
          onClick={handleRecenter}
          title="Recenter camera on all monitoring stations"
          className="bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white p-2.5 rounded-xl shadow-xl hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl max-w-xs text-xs">
        <div className="font-bold text-slate-200 mb-2 flex items-center justify-between">
          <span>Terrain Hazard Legend</span>
          <span className="text-[10px] text-slate-400 font-mono">Live Stream</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300">Safe (&lt; 35)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span className="text-slate-300">Watch (35 - 59)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
            <span className="text-slate-300">Warning (60 - 74)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-sm shadow-red-500/50" />
            <span className="text-red-400 font-bold">Critical (&ge; 75)</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800 leading-tight">
          Hillshading indicates topographic relief. Click any station marker to inspect live geotechnical sensors and active alert status.
        </p>
      </div>

    </div>
  );
}
