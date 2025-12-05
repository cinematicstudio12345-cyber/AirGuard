import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { fetchWeather } from '../services/weather';
import { WeatherData } from '../types';

interface TrackerProps {
  onDataUpdate: (data: WeatherData) => void;
  weather: WeatherData | null;
}

const Tracker: React.FC<TrackerProps> = ({ onDataUpdate, weather }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Initialize Map
    const map = L.map(mapRef.current, {
        zoomControl: false, 
        attributionControl: false
    }).setView([20, 0], 2);
    
    leafletMap.current = map;

    // Dark Map Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Mock Heatmap Layer (Circles for demo)
    const heatData = [
       { lat: 40.71, lon: -74.00, color: 'green' },
       { lat: 28.61, lon: 77.20, color: 'red' },
       { lat: 35.67, lon: 139.65, color: 'yellow' },
       { lat: 51.50, lon: -0.12, color: 'green' },
       { lat: 19.07, lon: 72.87, color: 'orange' },
    ];

    heatData.forEach(pt => {
        L.circle([pt.lat, pt.lon], {
            color: pt.color,
            fillColor: pt.color,
            fillOpacity: 0.4,
            radius: 500000 
        }).addTo(map);
    });

    // Locate Button Logic
    map.on('locationfound', async (e) => {
        setTracking(true);
        L.marker(e.latlng).addTo(map)
          .bindPopup("You are here")
          .openPopup();
        
        // Add pulse effect circle
        L.circle(e.latlng, {
            radius: e.accuracy / 2,
            color: '#06b6d4',
            fillOpacity: 0.1
        }).addTo(map);

        try {
            const data = await fetchWeather(`${e.latlng.lat},${e.latlng.lng}`);
            onDataUpdate(data);
        } catch (err) {
            console.error(err);
        }
    });

    map.on('locationerror', () => {
        alert("Location access denied. Please enable GPS.");
        setTracking(false);
    });

    return () => {
        map.remove();
        leafletMap.current = null;
    };
  }, []);

  const handleLocate = () => {
     leafletMap.current?.locate({ setView: true, maxZoom: 10 });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {/* Overlay Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
         <button 
           onClick={handleLocate}
           className="bg-slate-900/90 text-white p-3 rounded-full shadow-lg border border-cyan-500/30 hover:bg-cyan-500/20 transition-all active:scale-95"
         >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
         </button>
      </div>

      <div className="absolute bottom-6 left-4 right-4 z-[1000]">
         <div className="bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700 p-4 shadow-xl">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${tracking ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></span>
                    Live Monitor
                </h3>
                <span className="text-[10px] text-slate-400">{weather ? weather.location.localtime : 'Waiting for GPS...'}</span>
            </div>
            
            {weather ? (
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-3xl font-black text-white">{weather.current.air_quality["us-epa-index"] * 30 /* Mock conversion for demo */}</p>
                        <p className="text-[10px] text-slate-400 uppercase">Current AQI</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-orange-400">{weather.current.air_quality.pm2_5} <span className="text-xs">µg/m³</span></p>
                        <p className="text-[10px] text-slate-400 uppercase">PM2.5 Conc.</p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-2">
                    <button onClick={handleLocate} className="text-cyan-400 text-sm font-bold hover:underline">Tap to activate GPS</button>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Tracker;