
import React from 'react';
import { AccuracyResult } from '../types';
import { GlassCard } from './Shared';
import { useTheme } from '../providers/ThemeProvider';

interface PollutantBreakdownProps {
  data: AccuracyResult;
}

const PollutantBreakdown: React.FC<PollutantBreakdownProps> = ({ data }) => {
  const p = data.pollutants;
  const { isDark } = useTheme();
  
  const items = [
      { label: 'PM2.5', val: p.pm25, color: '#ef4444', limit: 60 },
      { label: 'PM10', val: p.pm10, color: '#f97316', limit: 100 },
      { label: 'NO2', val: p.no2, color: '#eab308', limit: 40 },
      { label: 'O3', val: p.o3, color: '#3b82f6', limit: 100 },
  ];

  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <GlassCard title="Pollutant Composition">
       <div className="grid grid-cols-4 gap-2 mt-2">
          {items.map((item) => {
              const pct = Math.min(100, (item.val / item.limit) * 100);
              return (
                  <div key={item.label} className="flex flex-col items-center">
                      <div className="relative w-14 h-14 flex items-center justify-center transition-all hover:scale-105">
                          <svg className="w-full h-full transform -rotate-90">
                              <circle cx="28" cy="28" r="24" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="4" fill="none" />
                              <circle 
                                cx="28" cy="28" r="24" 
                                stroke={item.color} 
                                strokeWidth="4" 
                                fill="none" 
                                strokeDasharray="150" 
                                strokeDashoffset={150 - (150 * pct) / 100}
                                strokeLinecap="round"
                              />
                          </svg>
                          <span className={`absolute text-[10px] font-bold ${textColor}`}>
                             {Math.round(item.val)}
                          </span>
                      </div>
                      <span className={`text-[10px] font-bold mt-1 ${subTextColor}`}>{item.label}</span>
                  </div>
              );
          })}
       </div>

       {/* Mini 6H Sparkline (Simulated) */}
       <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
           <div className="flex justify-between items-center mb-2">
               <span className={`text-[10px] uppercase font-bold ${subTextColor}`}>6H Trend</span>
               <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                  ↑ Rising
               </span>
           </div>
           <div className="h-8 flex items-end gap-1">
               {[...Array(20)].map((_, i) => (
                   <div 
                     key={i} 
                     className="flex-1 rounded-t-sm transition-all hover:bg-cyan-400" 
                     style={{ 
                         height: `${20 + Math.random() * 60}%`, 
                         opacity: (i+1)/20,
                         backgroundColor: '#06b6d4'
                     }}
                   ></div>
               ))}
           </div>
       </div>
    </GlassCard>
  );
};

export default PollutantBreakdown;
