import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function HazardMap({ sessions = [], currentCoords = null, onSelectSession }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = currentCoords?.lat || 12.9352;
      const initialLon = currentCoords?.lon || 77.6944;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([initialLat, initialLon], 14);

      // CartoDB Dark Matter tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // Map through sessions and add color-coded pulsing pins
    sessions.forEach((s) => {
      const lat = parseFloat(s.latitude) || 12.9352;
      const lon = parseFloat(s.longitude) || 77.6944;

      const isCritical = s.road_condition === 'CRITICAL' || s.road_condition === 'POOR';
      const isFair = s.road_condition === 'FAIR';
      
      // Electric Cyan for Good, Safety Amber for Fair, Crimson for Critical
      const pinColor = isCritical ? '#f43f5e' : (isFair ? '#f59e0b' : '#06b6d4');
      const pulseColor = isCritical ? 'rgba(244, 63, 94, 0.45)' : (isFair ? 'rgba(245, 158, 11, 0.45)' : 'rgba(6, 182, 212, 0.45)');

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: ${pulseColor}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 18px; height: 18px; border-radius: 50%; background: ${pinColor}; border: 2.5px solid #07090e; box-shadow: 0 0 12px ${pinColor}; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 9px;">
              ${s.total_defects || 0}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; background: #0c1017; color: #f1f5f9; padding: 12px; border-radius: 12px; border: 1px solid #1e293b; min-width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: ${pinColor}; text-transform: uppercase; letter-spacing: 0.5px;">${s.road_condition}</span>
            <span style="font-size: 10px; color: #94a3b8;">${s.created_at || 'Recent'}</span>
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">
            ${s.total_defects} Hazards Identified
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            Priority: ${s.repair_priority}/5 • Density: ${s.damage_density_pct || 0}%
          </div>
          <div style="font-size: 9px; font-family: monospace; color: #64748b;">
            GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayer.addLayer(marker);
    });

    if (currentCoords?.lat && currentCoords?.lon) {
      map.setView([currentCoords.lat, currentCoords.lon], 15);
    }
  }, [sessions, currentCoords]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 bg-[#0c1017] shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" />
      
      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-[#0c1017]/95 backdrop-blur-md border border-zinc-800 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-4 text-xs">
        <span className="font-bold text-slate-300">Hazard Scale:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
          <span className="text-slate-400">Critical / Severe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
          <span className="text-slate-400">Fair / Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]"></span>
          <span className="text-slate-400">Sound Asphalt</span>
        </div>
      </div>
    </div>
  );
}
