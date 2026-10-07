import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { CampusZoneActivity } from '../../types';
import { itemService } from '../../services/itemService';
import {
  MapPin,
  Shield,
  Layers,
  Map as MapIcon,
  Navigation,
  ExternalLink,
  Compass,
  CheckCircle,
  Calendar,
} from 'lucide-react';

// Lovely Professional University, Phagwara, Punjab geographic center
const LPU_CENTER: [number, number] = [31.2536, 75.7037];

export const CampusMapVisualizer: React.FC = () => {
  const [zones, setZones] = useState<CampusZoneActivity[]>([]);
  const [selectedZone, setSelectedZone] = useState<CampusZoneActivity | null>(null);
  const [viewMode, setViewMode] = useState<'leaflet' | 'schematic'>('leaflet');
  const [filterMode, setFilterMode] = useState<'all' | 'safe_only' | 'active_only'>('all');
  const [loading, setLoading] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const data = await itemService.getCampusZonesActivity();
      setZones(data);
      if (data.length > 0) setSelectedZone(data[0]);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (viewMode !== 'leaflet' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map instance centered on LPU Phagwara
      const map = L.map(mapContainerRef.current, {
        center: LPU_CENTER,
        zoom: 16,
        minZoom: 14,
        maxZoom: 19,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • Lovely Professional University, Phagwara',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Filter zones
    const filtered = zones.filter((z) => {
      if (filterMode === 'safe_only') return z.is_meeting_point;
      if (filterMode === 'active_only') return z.total_activity > 0;
      return true;
    });

    // Add markers for filtered LPU locations
    filtered.forEach((zone) => {
      const lat = zone.latitude || 31.2536;
      const lng = zone.longitude || 75.7037;

      // Custom HTML Marker Icon
      const isSafe = zone.is_meeting_point;
      const count = zone.total_activity;
      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          background: ${isSafe ? '#059669' : '#0284c7'};
          color: white;
          padding: 4px 8px;
          border-radius: 9999px;
          font-family: system-ui, sans-serif;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          border: 2px solid white;
          white-space: nowrap;
          cursor: pointer;
        ">
          ${isSafe ? '🛡️' : '📍'}
          <span>${zone.name.split('(')[0].trim()}</span>
          ${count > 0 ? `<span style="background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 9999px; font-size: 10px;">${count}</span>` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'lpu-custom-marker',
        html: markerHtml,
        iconSize: [120, 28],
        iconAnchor: [60, 14],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedZone(zone);
        map.flyTo([lat, lng], 17, { duration: 1.0 });
      });

      markersRef.current[zone.id] = marker;
    });

    // Cleanup
    return () => {
      // Keep map initialized across re-renders
    };
  }, [viewMode, zones, filterMode]);

  const handleFlyTo = (zone: CampusZoneActivity) => {
    setSelectedZone(zone);
    if (mapInstanceRef.current && zone.latitude && zone.longitude) {
      mapInstanceRef.current.flyTo([zone.latitude, zone.longitude], 17, {
        duration: 1.2,
      });
    }
  };

  const getHeatColor = (total: number) => {
    if (total >= 10) return 'bg-rose-500 text-white border-rose-600 ring-rose-200';
    if (total >= 5) return 'bg-amber-500 text-white border-amber-600 ring-amber-200';
    if (total >= 1) return 'bg-sky-500 text-white border-sky-600 ring-sky-200';
    return 'bg-emerald-500 text-white border-emerald-600 ring-emerald-200';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
      {/* Map Control Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded-md tracking-wider uppercase">
              Lovely Professional University • Phagwara, Punjab
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-sky-600" />
            LPU Campus Lost & Found Map
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jalandhar - Delhi G.T. Road, Phagwara (31.2536° N, 75.7037° E) • Predefined safe handover points
          </p>
        </div>

        {/* View mode toggle & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('leaflet')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'leaflet'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-sky-600" />
              Live Campus Map
            </button>
            <button
              onClick={() => setViewMode('schematic')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'schematic'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Schematic Plan
            </button>
          </div>

          {/* Quick Filters */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium outline-none focus:border-sky-500"
          >
            <option value="all">All LPU Locations</option>
            <option value="safe_only">Designated Safe Points Only (🛡️)</option>
            <option value="active_only">Active Lost/Found Hotspots</option>
          </select>
        </div>
      </div>

      {/* Quick Jump Landmark Navigation Strip */}
      <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-shrink-0">
          Quick Jump:
        </span>
        {zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => handleFlyTo(zone)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0 transition border ${
              selectedZone?.id === zone.id
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-sky-400'
            }`}
          >
            {zone.is_meeting_point && '🛡️ '}
            {zone.name.split('(')[0].trim()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Interactive Map Area */}
        <div className="lg:col-span-2 relative min-h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          {viewMode === 'leaflet' ? (
            <div
              ref={mapContainerRef}
              className="w-full h-[500px] rounded-2xl z-0"
              style={{ background: '#f8fafc' }}
            />
          ) : (
            /* Visual Zone Schematic Plan for LPU Phagwara */
            <div className="relative w-full h-[500px] bg-slate-900 rounded-2xl p-4 flex items-center justify-center overflow-hidden">
              <svg
                className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="lpu-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#lpu-grid)" />
                {/* G.T. Road highway */}
                <path d="M 0,60 L 800,60" stroke="#f59e0b" strokeWidth="8" />
                {/* Internal LPU Main Boulevards */}
                <path d="M 400,60 L 400,450" stroke="#0284c7" strokeWidth="6" strokeDasharray="8,8" />
                <path d="M 200,180 Q 400,220 600,180" stroke="#0284c7" strokeWidth="4" />
                <path d="M 150,300 L 650,300" stroke="#0284c7" strokeWidth="4" />
              </svg>

              {/* LPU G.T. Road Tag */}
              <div className="absolute top-3 left-6 px-3 py-1 bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold rounded border border-amber-500/40">
                JALANDHAR - DELHI G.T. ROAD (HIGHWAY FRONTAGE)
              </div>

              {/* Render interactive buttons */}
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  style={{
                    left: `${zone.map_x}%`,
                    top: `${zone.map_y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group transition-transform duration-200 hover:scale-110 focus:outline-none z-10"
                >
                  <div
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border ring-4 transition ${getHeatColor(
                      zone.total_activity
                    )} ${
                      selectedZone?.id === zone.id
                        ? 'scale-110 ring-white'
                        : 'ring-transparent opacity-90'
                    }`}
                  >
                    {zone.is_meeting_point && <Shield className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span>{zone.name.split('(')[0].trim()}</span>
                    <span className="bg-black/25 px-1.5 py-0.5 rounded-full text-[10px]">
                      {zone.total_activity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Location Inspector */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
          {selectedZone ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  LPU Zone • {selectedZone.zone_code}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  {selectedZone.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {selectedZone.description || 'Lovely Professional University campus facility.'}
                </p>
                {selectedZone.latitude && selectedZone.longitude && (
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                    GPS: {selectedZone.latitude.toFixed(4)}° N, {selectedZone.longitude.toFixed(4)}° E
                  </span>
                )}
              </div>

              {selectedZone.is_meeting_point ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                  <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      Designated LPU Safe Handover Point
                    </h4>
                    <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">
                      Monitored university common area with security cameras and regular campus security presence. Recommended for scheduling handover meetings.
                    </p>
                    <Link
                      to="/dashboard"
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book Meeting in Active Case &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600">
                  Academic / Laboratory Block. For item handovers, prefer official meeting points such as <strong>Central Library</strong>, <strong>UniMall</strong>, or <strong>Unipolis</strong>.
                </div>
              )}

              {/* Activity Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Lost Reports in Area
                  </span>
                  <span className="text-2xl font-extrabold text-rose-600">
                    {selectedZone.active_lost_count}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Found Reports in Area
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-600">
                    {selectedZone.active_found_count}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select any LPU location to view report counts and safe handover guidelines.
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Campus Security & Handover Safety
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Always inspect distinguishing marks and exchange the 6-digit OTP code before concluding handovers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
