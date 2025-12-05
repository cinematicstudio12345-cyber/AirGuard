
import React, { useEffect, useState } from 'react';
import { WeatherData, User, Tab, DetectedSource, PollutantTrace, AccuracyResult } from '../types';
import { GlassCard, Skeleton } from './Shared';
import { Wind, ShieldAlert, ArrowUpRight, Cigarette } from 'lucide-react';
import { PollutionSourceService } from '../services/pollution';
import { AccurateAQIService } from '../services/accurateAqi';
import AqiMergedCard from './AqiMergedCard';
import CigaretteAnim from './CigaretteAnim';
import PollutantBreakdown from './PollutantBreakdown';

interface DashboardProps {
  weather: WeatherData | null;
  user: User;
  onNavigate: (tab: Tab) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ weather, user, onNavigate }) => {
  const [sources, setSources] = useState<DetectedSource[]>([]);
  const [traces, setTraces] = useState<PollutantTrace[]>([]);
  const [accurateAqi, setAccurateAqi] = useState<AccuracyResult | null>(null);

  useEffect(() => {
    if (weather) {
      const accurate = AccurateAQIService.calculate(weather);
      setAccurateAqi(accurate);

      const detected = PollutionSourceService.getDetectedSources(
        weather.location.lat, 
        weather.location.lon, 
        weather.location.name
      );
      setSources(detected);

      const analyzedTraces = PollutionSourceService.analyzeTraceability(weather);
      setTraces(analyzedTraces);
    }
  }, [weather]);

  if (!weather || !accurateAqi) return <div className="p-4 space-y-4"><Skeleton className="h-80 rounded-3xl" /><Skeleton className="h-40 rounded-xl" /></div>;

  const aqiValue = accurateAqi.aqi;
  const cigaretteCount = Math.max(0, (aqiValue / 22));

  // Health Logic
  const getLungStress = (val: number) => {
    if (val < 50) return { label: 'LOW', color: 'text-green-400' };
    if (val < 100) return { label: 'MODERATE', color: 'text-yellow-400' };
    if (val < 150) return { label: 'HIGH', color: 'text-orange-400' };
    return { label: 'CRITICAL', color: 'text-red-500' };
  };

  const lungStress = getLungStress(aqiValue);

  return (
    <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto">
      
      {/* CITY NAME HEADER */}
      <div className="text-center pb-2">
         <h2 className="text-3xl font-black text-white">{weather.location.name}</h2>
         <p className="text-sm text-slate-400">{weather.location.region}, {weather.location.country}</p>
      </div>

      {/* MERGED AQI + WEATHER CARD */}
      <AqiMergedCard aqiData={accurateAqi} weather={weather} />

      {/* POLLUTANT BREAKDOWN GRAPH */}
      <PollutantBreakdown data={accurateAqi} />

      {/* CIGARETTE EQUIVALENCE CARD (HORIZONTAL) */}
      <GlassCard className="flex flex-col gap-4 relative overflow-hidden">
         <div className="flex justify-between items-center z-10">
             <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-2">
                    <Cigarette size={14} /> Equivalence
                </h3>
                <p className="text-white text-3xl font-black">
                    {cigaretteCount.toFixed(1)} <span className="text-lg font-normal text-slate-400">cigs</span>
                </p>
                <p className="text-[10px] text-slate-500">Inhaled over 24h</p>
             </div>
             <div className="w-32 h-12">
                 <CigaretteAnim aqi={aqiValue} />
             </div>
         </div>
      </GlassCard>

      {/* Health Impact Widget */}
      <GlassCard title="Health Impact Analysis" className="space-y-4">
         <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-full ${lungStress.color.replace('text', 'bg')}/20`}>
                 <ShieldAlert className={lungStress.color} size={20} />
               </div>
               <div>
                  <p className="text-slate-400 text-xs">Lung Stress Level</p>
                  <p className={`font-black text-xl ${lungStress.color}`}>{lungStress.label}</p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-slate-400 text-xs">Safe Exposure</p>
               <p className="font-bold text-white text-lg">{aqiValue > 150 ? '< 30 mins' : aqiValue > 100 ? '2 Hours' : 'Unlimited'}</p>
            </div>
         </div>
         <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-2">
               <ShieldAlert size={16} className={aqiValue > 100 ? 'text-red-400' : 'text-green-400'} />
               <div>
                  <p className="text-[10px] text-slate-500 uppercase">Mask Rec.</p>
                  <p className="text-xs font-bold text-white">{aqiValue > 100 ? 'Wear N95' : 'None Needed'}</p>
               </div>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-2">
               <Wind size={16} className={aqiValue > 100 ? 'text-orange-400' : 'text-blue-400'} />
               <div>
                  <p className="text-[10px] text-slate-500 uppercase">Ventilation</p>
                  <p className="text-xs font-bold text-white">{aqiValue > 100 ? 'Close Windows' : 'Open Windows'}</p>
               </div>
            </div>
         </div>
      </GlassCard>

      {/* Detected Sources */}
      <div className="space-y-3">
         <h3 className="text-white font-bold flex items-center gap-2">
            <ShieldAlert size={16} className="text-orange-400"/> Detected Sources (15km)
         </h3>
         {sources.length > 0 ? (
           sources.map((source) => (
             <div key={source.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex justify-between items-start">
                <div>
                   <h4 className="font-bold text-white text-sm">{source.name}</h4>
                   <p className="text-xs text-slate-400 mt-1">{source.category} • {source.distance} km {source.direction}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                   {source.pollutants.map(p => (
                      <span key={p} className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-300 rounded border border-red-500/20">{p}</span>
                   ))}
                </div>
             </div>
           ))
         ) : (
            <div className="p-4 bg-slate-900 rounded-xl text-center text-slate-500 text-sm">Scanning area...</div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;
