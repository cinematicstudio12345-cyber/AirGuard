import React, { useState, useEffect } from 'react';
import { GlassCard } from './Shared';
import { AccuracyResult, WeatherData } from '../types';
import { Wind, Thermometer, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';

interface AqiMergedCardProps {
  aqiData: AccuracyResult;
  weather: WeatherData;
}

const AqiMergedCard: React.FC<AqiMergedCardProps> = ({ aqiData, weather }) => {
  const { aqi } = aqiData;
  const { isDark } = useTheme();
  const [animate, setAnimate] = useState(false);

  // Micro-animation on data change
  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(t);
  }, [aqi]);

  const getAqiColor = (val: number) => {
    if (val <= 50) return { bg: 'bg-green-500', text: 'text-green-600', darkText: 'text-green-400', label: 'Good' };
    if (val <= 100) return { bg: 'bg-yellow-500', text: 'text-yellow-600', darkText: 'text-yellow-400', label: 'Moderate' };
    if (val <= 150) return { bg: 'bg-orange-500', text: 'text-orange-600', darkText: 'text-orange-400', label: 'Sensitive' };
    if (val <= 200) return { bg: 'bg-red-500', text: 'text-red-600', darkText: 'text-red-400', label: 'Unhealthy' };
    if (val <= 300) return { bg: 'bg-purple-500', text: 'text-purple-600', darkText: 'text-purple-400', label: 'Very Unhealthy' };
    return { bg: 'bg-red-900', text: 'text-red-800', darkText: 'text-red-500', label: 'Hazardous' };
  };

  const status = getAqiColor(aqi);
  
  // Simulated Trend Logic
  const trend = aqi > 100 ? 'worsening' : aqi < 50 ? 'improving' : 'stable';
  
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const gridBg = isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white/60 border-slate-200 shadow-sm';

  return (
    <GlassCard className="relative overflow-hidden !p-0 transition-all duration-300">
       {/* Background Glow */}
       <div className={`absolute top-0 right-0 w-64 h-64 ${status.bg} opacity-10 blur-[80px] rounded-full translate-x-12 -translate-y-12`}></div>
       
       <div className="p-6 relative z-10">
          <div className="flex justify-between items-start">
             <div className="w-full">
                <div className="flex items-center gap-4">
                   {/* Main AQI Number with Pulse */}
                   <div className={`relative transition-transform duration-500 ${animate ? 'scale-105' : 'scale-100'}`}>
                      <span className={`text-7xl font-black tracking-tighter ${textColor} drop-shadow-lg`}>{aqi}</span>
                   </div>
                   
                   <div className="flex flex-col justify-center">
                      <span className={`text-2xl font-black uppercase tracking-tight ${isDark ? status.darkText : status.text}`}>
                        {status.label}
                      </span>
                      
                      {/* Dynamic Trend Indicator */}
                      <div className={`flex items-center gap-1.5 text-sm font-bold mt-1 px-2 py-0.5 rounded-full w-fit ${
                          trend === 'worsening' 
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                            : trend === 'improving' 
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                              : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                          }`}>
                            {trend === 'worsening' ? <TrendingUp size={12} /> : trend === 'improving' ? <TrendingDown size={12} /> : <Minus size={12} />}
                            {trend.charAt(0).toUpperCase() + trend.slice(1)}
                      </div>
                   </div>
                </div>
                
                {/* Context Grid */}
                <div className={`grid grid-cols-3 gap-2 mt-8 p-3 rounded-xl border ${gridBg}`}>
                    <div className="flex flex-col items-center">
                        <Thermometer size={16} className="text-cyan-500 mb-1" />
                        <span className={`font-bold ${textColor}`}>{weather.current.temp_c}°</span>
                        <span className={`text-[10px] uppercase ${subTextColor}`}>Temp</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-slate-200 dark:border-slate-700">
                        <Wind size={16} className="text-blue-500 mb-1" />
                        <span className={`font-bold ${textColor}`}>{weather.current.wind_kph}</span>
                        <span className={`text-[10px] uppercase ${subTextColor}`}>Wind</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-slate-200 dark:border-slate-700">
                        <Droplets size={16} className="text-indigo-500 mb-1" />
                        <span className={`font-bold ${textColor}`}>{weather.current.humidity}%</span>
                        <span className={`text-[10px] uppercase ${subTextColor}`}>Humid</span>
                    </div>
                </div>

                {/* Prediction Text */}
                <div className="mt-4 flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold ${subTextColor}`}>4H Forecast</span>
                    <span className={`text-xs font-bold ${trend === 'worsening' ? 'text-red-500' : 'text-green-500'}`}>
                        {trend === 'worsening' ? '+15 AQI Expected' : 'Conditions Clearing'}
                    </span>
                </div>
             </div>
          </div>
       </div>
    </GlassCard>
  );
};

export default AqiMergedCard;