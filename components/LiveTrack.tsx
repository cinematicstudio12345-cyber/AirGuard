
import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { fetchWeather } from '../services/weather';
import { WeatherData, TrackingPoint, TrackingSession } from '../types';
import { saveTrackingSession } from '../services/firebase';
import { Play, Square, Save, Navigation, Gauge, Layers } from 'lucide-react';
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
  
  const [isTracking, setIsTracking] = useState(false);
  const [sessionPoints, setSessionPoints] = useState<TrackingPoint[]>([]);
  const [distance, setDistance] = useState(0); 
  const [speed, setSpeed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
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

    // Tactical Dark Mode Tiles vs Light
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
    L.tileLayer(tileUrl, {
      maxZoom: 19, subdomains: 'abcd',
    }).addTo(map);

    polylineRef.current = L.polyline([], { color: '#06b6d4', weight: 4, opacity: 0.8 }).addTo(map);
    
    // Heatmap Layer Group
    heatmapLayerRef.current = L.layerGroup().addTo(map);

    // Custom Pulsing Marker
    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color:#06b6d4;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 15px #06b6d4;'></div>",
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
    markerRef.current = L.marker([0,0], { icon }).addTo(map);

    map.locate({ setView: true, maxZoom: 16 });
    map.on('locationfound', (e) => {
       if (markerRef.current) markerRef.current.setLatLng(e.latlng);
    });
  }, [isDark]);

  // Update Heatmap Visuals
  useEffect(() => {
     if (!heatmapLayerRef.current || !leafletMap.current) return;
     
     heatmapLayerRef.current.clearLayers();
     
     if (showHeatmap) {
         // Draw heatmap from actual tracking points
         sessionPoints.forEach(pt => {
             const color = pt.aqi < 50 ? 'green' : pt.aqi < 100 ? 'yellow' : pt.aqi < 150 ? 'orange' : 'red';
             L.circle([pt.lat, pt.lon], {
                 color: color,
                 fillColor: color,
                 fillOpacity: 0.3,
                 radius: 30, // Small radius for granular path
                 stroke: false
             }).addTo(heatmapLayerRef.current!);
         });

         // Add some mock circles if tracking hasn't started just to show UI
         if (sessionPoints.length === 0) {
            const heatData = [
               { lat: 40.71, lon: -74.00, color: 'green' },
               { lat: 28.61, lon: 77.20, color: 'red' },
               { lat: 35.67, lon: 139.65, color: 'yellow' },
            ];
            heatData.forEach(pt => {
                 L.circle([pt.lat, pt.lon], {
                     color: pt.color,
                     fillColor: pt.color,
                     fillOpacity: 0.4,
                     radius: 500000 
                 }).addTo(heatmapLayerRef.current!);
            });
         }
     }
  }, [sessionPoints, showHeatmap]);

  // Tracking Logic
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (isTracking) {
        setSessionPoints([]);
        setDistance(0);
        setSpeed(0);
        if (polylineRef.current) polylineRef.current.setLatLngs([]);

        intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude, speed: gpsSpeed } = pos.coords;
                const latLng = new L.LatLng(latitude, longitude);
                
                if (leafletMap.current) {
                    leafletMap.current.panTo(latLng);
                    if (markerRef.current) markerRef.current.setLatLng(latLng);
                }

                setSpeed(gpsSpeed ? gpsSpeed * 3.6 : 0);

                try {
                    const data = await fetchWeather(`${latitude},${longitude}`);
                    const aqi = data.current.air_quality["us-epa-index"] * 30;
                    if (onDataUpdate) onDataUpdate(data);

                    const newPoint: TrackingPoint = { lat: latitude, lon: longitude, aqi, timestamp: Date.now() };
                    
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
                } catch (e) { console.error(e); }
            }, null, { enableHighAccuracy: true });
        }, 5000); 
    }
    return () => clearInterval(intervalId);
  }, [isTracking]);

  const handleStop = async () => {
    setIsTracking(false);
    setSaving(true);
    if (sessionPoints.length > 0) {
        const avgAQI = sessionPoints.reduce((sum, p) => sum + p.aqi, 0) / sessionPoints.length;
        const maxAQI = Math.max(...sessionPoints.map(p => p.aqi));
        const session: TrackingSession = {
            uid: userId, startTime: Date.now(), endTime: Date.now(),
            durationMinutes: sessionPoints.length * 5 / 60,
            distanceKm: distance, avgAQI, maxAQI, samples: sessionPoints
        };
        await saveTrackingSession(session);
        alert("Session saved to Mission Log.");
    }
    setSaving(false);
  };

  const currentAQI = weather?.current.air_quality["us-epa-index"] ? weather.current.air_quality["us-epa-index"] * 30 : 0;

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Heatmap Toggle */}
      <div className="absolute top-4 right-4 z-[500]">
         <button 
           onClick={() => setShowHeatmap(!showHeatmap)}
           className={`p-3 rounded-full shadow-lg border transition-all ${showHeatmap ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
         >
            <Layers size={20} />
         </button>
      </div>

      {/* HUD */}
      <div className="absolute top-4 left-4 z-[500] pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded-xl flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full text-slate-700">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#06b6d4" strokeWidth="4" strokeDasharray={`${Math.min(speed, 20) * 5}, 100`} />
                  </svg>
                  <Gauge size={16} className="absolute text-cyan-400" />
              </div>
              <div>
                  <p className="text-2xl font-black text-white leading-none">{speed.toFixed(1)}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">km/h</p>
              </div>
          </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-6 left-4 right-4 z-[1000] flex flex-col gap-3">
         <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700 p-4 shadow-2xl flex justify-between items-center">
             <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${currentAQI < 50 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                 <div>
                    <h3 className="text-white font-bold text-lg leading-none">
                        {currentAQI.toFixed(0)} <span className="text-xs text-slate-400 font-normal">AQI</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Atmosphere</p>
                 </div>
             </div>
             <div className="text-right">
                <h3 className="text-white font-bold text-lg leading-none">{distance.toFixed(2)} <span className="text-sm font-normal">km</span></h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Traversed</p>
             </div>
         </div>

         <div className="flex gap-3 pointer-events-auto">
             {!isTracking ? (
                 <button 
                   onClick={() => setIsTracking(true)}
                   className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                 >
                    <Play size={20} fill="currentColor" /> INITIATE TRACK
                 </button>
             ) : (
                 <button 
                   onClick={handleStop}
                   disabled={saving}
                   className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                 >
                    {saving ? <Save size={20} className="animate-spin" /> : <Square size={20} fill="currentColor" />}
                    {saving ? 'SAVING...' : 'TERMINATE'}
                 </button>
             )}
             
             <button 
                onClick={() => leafletMap.current?.locate({setView: true})}
                className="w-14 bg-slate-800 text-cyan-400 rounded-xl flex items-center justify-center shadow-lg border border-slate-700"
             >
                 <Navigation size={24} />
             </button>
         </div>
      </div>
    </div>
  );
};

export default LiveTrack;
