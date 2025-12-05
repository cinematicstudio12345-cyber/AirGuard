
import React from 'react';
import { WeatherData } from '../types';
import { GlassCard, Skeleton } from './Shared';
import { Sun, Cloud, Wind, Droplets, Umbrella, Eye, Sunrise, Sunset } from 'lucide-react';

interface WeatherTabProps {
  weather: WeatherData | null;
}

const WeatherTab: React.FC<WeatherTabProps> = ({ weather }) => {
  if (!weather || !weather.forecast) return <div className="p-6"><Skeleton className="h-40 w-full mb-4" /><Skeleton className="h-20 w-full" /></div>;

  const current = weather.current;
  const today = weather.forecast.forecastday[0];
  const nextDays = weather.forecast.forecastday.slice(1);
  const hourly = today.hour.filter((_, i) => i % 3 === 0); // Every 3 hours for cleaner UI

  // Helper for Bezier Chart
  const getPath = (values: number[], height: number, width: number) => {
    const max = Math.max(...values, 40);
    const min = Math.min(...values, 0);
    const stepX = width / (values.length - 1);
    
    const points = values.map((val, i) => ({
      x: i * stepX,
      y: height - ((val - min) / (max - min)) * height
    }));

    if(points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for(let i=0; i<points.length-1; i++){
        const p0 = points[i];
        const p1 = points[i+1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp2x = p1.x - (p1.x - p0.x) / 2;
        d += ` C ${cp1x} ${p0.y}, ${cp2x} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto h-full overflow-y-auto">
      <h1 className="text-2xl font-black text-white">Atmospherics</h1>
      
      {/* Current Weather Hero */}
      <GlassCard className="relative overflow-hidden">
         <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl"></div>
         <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
               <h2 className="text-4xl font-black text-white">{current.temp_c}°</h2>
               <p className="text-slate-400 text-sm mt-1">Feels like {Math.round(current.temp_c + 2)}°</p>
            </div>
            <div className="text-right">
               <img src={current.condition.icon} className="w-16 h-16 inline-block" alt="icon" />
               <p className="text-white font-bold">{current.condition.text}</p>
            </div>
         </div>
         
         <div className="grid grid-cols-4 gap-2 text-center relative z-10">
            <div className="bg-slate-900/40 p-2 rounded-xl">
               <Wind size={16} className="text-blue-400 mx-auto mb-1" />
               <p className="text-xs font-bold text-white">{current.wind_kph} <span className="text-[9px]">km/h</span></p>
            </div>
            <div className="bg-slate-900/40 p-2 rounded-xl">
               <Droplets size={16} className="text-indigo-400 mx-auto mb-1" />
               <p className="text-xs font-bold text-white">{current.humidity}%</p>
            </div>
            <div className="bg-slate-900/40 p-2 rounded-xl">
               <Sun size={16} className="text-orange-400 mx-auto mb-1" />
               <p className="text-xs font-bold text-white">UV {current.uv}</p>
            </div>
            <div className="bg-slate-900/40 p-2 rounded-xl">
               <Eye size={16} className="text-cyan-400 mx-auto mb-1" />
               <p className="text-xs font-bold text-white">{current.vis_km}km</p>
            </div>
         </div>
      </GlassCard>

      {/* 24h Forecast Curve */}
      <GlassCard title="24h Temperature Trend">
         <div className="h-24 w-full mt-4 relative">
             <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                 <path 
                   d={getPath(hourly.map(h => h.temp_c), 100, 300)} 
                   fill="none" 
                   stroke="#f59e0b" 
                   strokeWidth="3" 
                   strokeLinecap="round" 
                 />
                 {/* Dots */}
                 {hourly.map((h, i) => {
                    // Re-calculate pos
                    const values = hourly.map(h => h.temp_c);
                    const max = Math.max(...values, 40);
                    const min = Math.min(...values, 0);
                    const x = i * (300 / (values.length - 1));
                    const y = 100 - ((h.temp_c - min) / (max - min)) * 100;
                    return (
                        <circle key={i} cx={x} cy={y} r="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                    );
                 })}
             </svg>
             <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                {hourly.map((h, i) => (
                    <span key={i}>{h.time.split(' ')[1]}</span>
                ))}
             </div>
         </div>
      </GlassCard>

      {/* Sunrise Sunset Arc */}
      <GlassCard className="relative">
          <div className="flex justify-between items-center mb-8">
             <div className="text-center">
                <Sunrise size={20} className="text-yellow-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-white">{today.astro.sunrise}</p>
             </div>
             <div className="text-center">
                <Sunset size={20} className="text-orange-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-white">{today.astro.sunset}</p>
             </div>
          </div>
          {/* Arc Graphic */}
          <div className="relative h-20 w-full overflow-hidden">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 border-2 border-dashed border-slate-600 rounded-full flex items-start justify-center pt-2">
                 <Sun size={24} className="text-yellow-400 animate-pulse bg-slate-900 rounded-full" />
             </div>
             <div className="absolute bottom-0 w-full h-px bg-slate-700"></div>
          </div>
      </GlassCard>

      {/* 2-Day Forecast */}
      <div className="space-y-2">
         <h3 className="font-bold text-white text-sm uppercase tracking-wide">Next 2 Days</h3>
         {nextDays.map((day, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="w-16 font-bold text-slate-300">{new Date(day.date).toLocaleDateString('en-US', {weekday: 'long'})}</span>
                <div className="flex items-center gap-2">
                   <img src={day.day.condition.icon} className="w-8 h-8" alt="icon" />
                   <div className="flex flex-col">
                      <span className="text-xs text-slate-400">Max Wind</span>
                      <span className="text-xs font-bold text-cyan-400">{day.day.maxwind_kph} km/h</span>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-lg font-bold text-white">{Math.round(day.day.maxtemp_c)}°</span>
                   <span className="text-sm text-slate-500 ml-2">{Math.round(day.day.mintemp_c)}°</span>
                </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default WeatherTab;
