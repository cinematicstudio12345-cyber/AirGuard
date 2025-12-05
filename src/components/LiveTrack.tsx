
import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { fetchWeather } from '../services/weather';
import { WeatherData, TrackingPoint, TrackingSession } from '../types';
import { saveTrackingSession } from '../services/firebase';
import { Play, Square, Save, Navigation, Gauge, Layers, Wind, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';

interface LiveTrackProps {
  weather?: WeatherData | null;
  onDataUpdate?: (data: WeatherData) => void;
  userId?: string;
}

const LiveTrack: React.FC<LiveTrackProps> = ({ weather, onDataUpdate, userId = 'guest' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const windLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [isTracking, setIsTracking] = useState(false);
  const [sessionPoints, setSessionPoints] = useState<TrackingPoint[]>([]);
  const [distance, setDistance] = useState(0); 
  const [speed, setSpeed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const { isDark } = useTheme();

  // Map Init
  useEffect(() => {
    if (!mapRef.current) return;
    if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: false }).setView([20, 0], 2);
    leafletMap.current = map;

    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
    L.tileLayer(tileUrl, {
      maxZoom: 19, subdomains: 'abcd',
    }).addTo(map);

    polylineRef.current = L.polyline([], { color: '#06b6d4', weight: 4, opacity: 0.8 }).addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);
    windLayerRef.current = L.layerGroup().addTo(map);

    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color:#06b6d4;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 15px #06b6d4;'></div>",
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
    markerRef.current = L.marker([0,0], { icon }).addTo(map);

    // Initial Center on user location if available via parent weather prop
    if (weather) {
        map.setView([weather.location.lat, weather.location.lon], 16);
        markerRef.current.setLatLng([weather.location.lat, weather.location.lon]);
    }
  }, [isDark]);

  // Update Visuals
  useEffect(() => {
     if (!heatmapLayerRef.current || !windLayerRef.current || !leafletMap.current) return;
     
     heatmapLayerRef.current.clearLayers();
     windLayerRef.current.clearLayers();
     
     if (showHeatmap) {
         sessionPoints.forEach(pt => {
             const color = pt.aqi < 50 ? 'green' : pt.aqi < 100 ? 'yellow' : pt.aqi < 150 ? 'orange' : 'red';
             L.circle([pt.lat, pt.lon], { color, fillColor: color, fillOpacity: 0.3, radius: 30, stroke: false }).addTo(heatmapLayerRef.current!);
         });
         
         // Demo data if empty
         if (sessionPoints.length === 0) {
             const heatData = [
               { lat: 40.71, lon: -74.00, color: 'green' },
               { lat: 28.61, lon: 77.20, color: 'red' },
               { lat: 35.67, lon: 139.65, color: 'yellow' },
            ];
            heatData.forEach(pt => {
                 L.circle([pt.lat, pt.lon], { color: pt.color, fillColor: pt.color, fillOpacity: 0.4, radius: 50000 }).addTo(heatmapLayerRef.current!);
            });
         }
     }

     if (showWind && weather?.current?.wind_degree !== undefined) {
         const windDir = weather.current.wind_degree;
         const center = leafletMap.current.getCenter();
         const gridSize = 0.01;
         for (let lat = center.lat - 0.05; lat < center.lat + 0.05; lat += gridSize) {
             for (let lon = center.lng - 0.05; lon < center.lng + 0.05; lon += gridSize) {
                 if (Math.random() > 0.8) continue; 
                 const icon = L.divIcon({
                     className: 'wind-arrow',
                     html: `<div style="transform: rotate(${windDir}deg); opacity: 0.5;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isDark ? 'cyan' : '#0ea5e9'}" stroke-width="2"><path d="M5 12l14 0" /><path d="M13 18l6 -6" /><path d="M13 6l6 6" /></svg></div>`,
                     iconSize: [20, 20],
                     iconAnchor: [10, 10]
                 });
                 L.marker([lat, lon], { icon }).addTo(windLayerRef.current!);
             }
         }
     }
  }, [sessionPoints, showHeatmap, showWind, weather, isDark]);

  // High Accuracy Watcher Logic
  useEffect(() => {
    let watchId: number | null = null;

    if (isTracking) {
        setSessionPoints([]);
        setDistance(0);
        setSpeed(0);
        if (polylineRef.current) polylineRef.current.setLatLngs([]);

        // Watch Position for Live Updates
        watchId = navigator.geolocation.watchPosition(
            async (pos) => {
                const { latitude, longitude, speed: gpsSpeed } = pos.coords;
                const latLng = new L.LatLng(latitude, longitude);
                
                if (leafletMap.current) {
                    leafletMap.current.panTo(latLng);
                    if (markerRef.current) markerRef.current.setLatLng(latLng);
                }

                setSpeed(gpsSpeed ? gpsSpeed * 3.6 : 0);

                const newPoint: TrackingPoint = { 
                    lat: latitude, 
                    lon: longitude, 
                    aqi: weather?.current.air_quality["us-epa-index"] ? weather.current.air_quality["us-epa-index"] * 30 : 0,
                    timestamp: Date.now() 
                };
                    
                setSessionPoints(prev => {
                    const updated = [...prev, newPoint];
                    if (polylineRef.current) polylineRef.current.setLatLngs(updated.map(p => [p.lat, p.lon]));
                    if (updated.length > 1) {
                        const last = updated[updated.length - 2];
                        const d = L.latLng(last.lat, last.lon).distanceTo(latLng) / 1000;
                        setDistance(prevDist => prevDist + d);
                    }
                    return updated;
                });
            }, 
            (err) => console.error(err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
    } else {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    }

    return () => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking]);

  const handleStop = async () => {
    setIsTracking(false);
    setSaving(true);
    if (sessionPoints.length > 0) {
        await saveTrackingSession({
            uid: userId, startTime: Date.now(), endTime: Date.now(),
            durationMinutes: sessionPoints.length * 5 / 60,
            distanceKm: distance, avgAQI: 50, maxAQI: 100, samples: sessionPoints
        });
        alert("Session saved.");
    }
    setSaving(false);
  };

  const currentAQI = weather?.current.air_quality["us-epa-index"] ? weather.current.air_quality["us-epa-index"] * 30 : 0;
  
  const controlBg = isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="relative w-full h-full font-sans">
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Toggles */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col items-end gap-2">
         <button 
           onClick={() => setShowHeatmap(!showHeatmap)}
           className={`p-3 rounded-full shadow-lg border transition-all ${
             showHeatmap 
               ? 'bg-cyan-500 text-white border-cyan-400' 
               : isDark ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'
           }`}
         >
            {showHeatmap ? <Eye size={20} /> : <EyeOff size={20} />}
         </button>
         
         <button 
           onClick={() => setShowWind(!showWind)}
           className={`p-3 rounded-full shadow-lg border transition-all ${
             showWind
               ? 'bg-blue-500 text-white border-blue-400' 
               : isDark ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'
           }`}
         >
            <Wind size={20} />
         </button>
      </div>

      {/* HUD */}
      <div className="absolute top-4 left-4 z-[500] pointer-events-none">
          <div className={`backdrop-blur border p-3 rounded-xl flex items-center gap-3 shadow-xl ${controlBg}`}>
              <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className={`w-full h-full ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#06b6d4" strokeWidth="4" strokeDasharray={`${Math.min(speed, 20) * 5}, 100`} />
                  </svg>
                  <Gauge size={16} className="absolute text-cyan-500" />
              </div>
              <div>
                  <p className={`text-2xl font-black leading-none ${textColor}`}>{speed.toFixed(1)}</p>
                  <p className={`text-[9px] uppercase font-bold ${subTextColor}`}>km/h</p>
              </div>
          </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-6 left-4 right-4 z-[1000] flex flex-col gap-3">
         <div className={`backdrop-blur-md rounded-2xl border p-4 shadow-2xl flex justify-between items-center ${controlBg}`}>
             <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${currentAQI < 50 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                 <div>
                    <h3 className={`font-bold text-lg leading-none ${textColor}`}>
                        {currentAQI.toFixed(0)} <span className={`text-xs font-normal ${subTextColor}`}>AQI</span>
                    </h3>
                    <p className={`text-[10px] uppercase tracking-wider ${subTextColor}`}>Atmosphere</p>
                 </div>
             </div>
             <div className="text-right">
                <h3 className={`font-bold text-lg leading-none ${textColor}`}>{distance.toFixed(2)} <span className="text-sm font-normal">km</span></h3>
                <p className={`text-[10px] uppercase tracking-wider ${subTextColor}`}>Traversed</p>
             </div>
         </div>

         <div className="flex gap-3 pointer-events-auto">
             {!isTracking ? (
                 <button onClick={() => setIsTracking(true)} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"><Play size={20} fill="currentColor" /> INITIATE TRACK</button>
             ) : (
                 <button onClick={handleStop} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">{saving ? <Save size={20} className="animate-spin" /> : <Square size={20} fill="currentColor" />}{saving ? 'SAVING...' : 'TERMINATE'}</button>
             )}
             <button onClick={() => leafletMap.current?.locate({setView: true})} className={`w-14 rounded-xl flex items-center justify-center shadow-lg border transition-all ${isDark ? 'bg-slate-800 text-cyan-400 border-slate-700' : 'bg-white text-cyan-600 border-slate-200'}`}><Navigation size={24} /></button>
         </div>
      </div>
    </div>
  );
};

export default LiveTrack;
