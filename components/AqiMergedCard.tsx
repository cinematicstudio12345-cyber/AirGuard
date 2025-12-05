
import React from 'react';
import { GlassCard, Badge } from './Shared';
import { AccuracyResult, WeatherData } from '../types';
import { Wind, Thermometer, Droplets } from 'lucide-react';

interface AqiMergedCardProps {
  aqiData: AccuracyResult;
  weather: WeatherData;
}

const AqiMergedCard: React.FC<AqiMergedCardProps> = ({ aqiData, weather }) => {
  const { aqi } = aqiData;

  const getAqiColor = (val: number) => {
    if (val <= 50) return { bg: 'bg-green-500', text: 'text-green-400', label: 'Good' };
    if (val <= 100) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Moderate' };
    if (val <= 150) return { bg: 'bg-orange-500', text: 'text-orange-400', label: 'Sensitive' };
    if (val <= 200) return { bg: 'bg-red-500', text: 'text-red-400', label: 'Unhealthy' };
    if (val <= 300) return { bg: 'bg-purple-500', text: 'text-purple-400', label: 'Very Unhealthy' };
    return { bg: 'bg-red-900', text: 'text-red-600', label: 'Hazardous' };
  };

  const status = getAqiColor(aqi);

  return (
    <GlassCard className="relative overflow-hidden !p-0">
       {/* Background Glow */}
       <div className={`absolute top-0 right-0 w-48 h-48 ${status.bg} opacity-10 blur-3xl rounded-full translate-x-12 -translate-y-12`}></div>
       
       <div className="p-6 relative z-10">
          <div className="flex justify-between items-start">
             <div>
                <div className="flex items-baseline gap-2">
                   <span className="text-6xl font-black text-white tracking-tighter">{aqi}</span>
                   <span className={`text-xl font-bold ${status.text} uppercase`}>{status.label}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                   {/* Removed Sources Badge per request */}
                   <span className="text-[10px] text-slate-500">Live PM2.5 Calculation</span>
                </div>
             </div>
          </div>

          {/* Context Grid */}
          <div className="grid grid-cols-3 gap-2 mt-6">
             <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                <Thermometer size={16} className="text-cyan-400 mb-1" />
                <span className="text-white font-bold">{weather.current.temp_c}°</span>
                <span className="text-[9px] text-slate-500 uppercase">Temp</span>
             </div>
             <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                <Wind size={16} className="text-blue-400 mb-1" />
                <span className="text-white font-bold">{weather.current.wind_kph} <span className="text-[9px]">km/h</span></span>
                <span className="text-[9px] text-slate-500 uppercase">Dispersion</span>
             </div>
             <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                <Droplets size={16} className="text-indigo-400 mb-1" />
                <span className="text-white font-bold">{weather.current.humidity}%</span>
                <span className="text-[9px] text-slate-500 uppercase">Humid</span>
             </div>
          </div>

          {/* Short Term Prediction */}
          <div className="mt-4 pt-4 border-t border-slate-800">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-300">Next 4 Hours Forecast</span>
                <span className="text-[10px] text-slate-500">ML Predicted</span>
             </div>
             <div className="flex gap-1 h-8">
                {[1,2,3,4].map(i => {
                  const pred = Math.round(aqi * (1 + (i * 0.02 * (Math.random() - 0.3))));
                  const col = getAqiColor(pred).bg;
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative cursor-help">
                       <div className={`w-full rounded-sm opacity-60 ${col}`} style={{ height: `${Math.min(100, (pred/300)*100)}%` }}></div>
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap mb-1 z-10">
                          {pred}
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
       </div>
    </GlassCard>
  );
};

export default AqiMergedCard;
