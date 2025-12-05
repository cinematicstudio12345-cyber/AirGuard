
import React, { useEffect, useState, useMemo } from 'react';
import { GlassCard, Skeleton } from './Shared';
import { TrendingUp, ArrowDown, ArrowUp, Calendar, Zap, AlertTriangle, Wind } from 'lucide-react';
import { WeatherData, AirInsightsData, TimeRange } from '../types';
import { HistoricalService } from '../services/historical';
import { fetchWeather } from '../services/weather';

// --- SVG GRAPH HELPERS ---
const GRAPH_HEIGHT = 150;
const GRAPH_WIDTH = 350; // Viewbox width

const getCoordinates = (values: number[], width: number, height: number, startX: number = 0) => {
  const max = Math.max(...values, 100);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  return values.map((val, i) => ({
    x: startX + i * stepX,
    y: height - ((val - min) / range) * (height * 0.8) - (height * 0.1) // Padding top/bottom
  }));
};

const generateBezierPath = (values: number[], width: number, height: number, startX: number = 0) => {
  if (values.length === 0) return "";
  const points = getCoordinates(values, width, height, startX);
  
  // Start
  let d = `M ${points[0].x} ${points[0].y}`;

  // Curves
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    
    // Control points for smooth bezier
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p1.x - (p1.x - p0.x) / 2;
    const cp2y = p1.y;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  return d;
};

const AirInsights: React.FC = () => {
  const [range, setRange] = useState<TimeRange>('24H');
  const [data, setData] = useState<AirInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);

  // Load Data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const weather = await fetchWeather("London");
        setCurrentWeather(weather);
        const insights = await HistoricalService.getInsightsData(weather, range);
        setData(insights);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  // Derived Graph Data (History)
  const graphPath = useMemo(() => {
    if (!data) return "";
    return generateBezierPath(data.history.map(h => h.aqi), GRAPH_WIDTH * 0.7, GRAPH_HEIGHT);
  }, [data]);

  const fillPath = useMemo(() => {
     if (!graphPath) return "";
     return `${graphPath} L ${GRAPH_WIDTH * 0.7} ${GRAPH_HEIGHT} L 0 ${GRAPH_HEIGHT} Z`;
  }, [graphPath]);

  // Derived Prediction Path (Future)
  const predictionPath = useMemo(() => {
    if (!data) return "";
    // We need to connect the last historical point to the first prediction point
    const lastHistory = data.history[data.history.length - 1].aqi;
    const predValues = [lastHistory, ...data.predictions.map(p => p.aqi)];
    
    // Start drawing from where history ended
    const startX = GRAPH_WIDTH * 0.7; // 70% of width is history
    const width = GRAPH_WIDTH * 0.3;  // 30% of width is prediction
    
    return generateBezierPath(predValues, width, GRAPH_HEIGHT, startX);
  }, [data]);

  if (loading || !data || !currentWeather) {
    return <div className="p-6"><Skeleton className="h-64 w-full rounded-3xl" /><Skeleton className="h-32 w-full mt-4 rounded-xl" /></div>;
  }

  return (
    <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto h-full overflow-y-auto">
      
      {/* Header & Range Selector */}
      <header className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-black text-white">Air Insights</h1>
           <p className="text-xs text-slate-400">Historical Analysis & Predictions</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-1 flex gap-1 border border-slate-700">
           {(['12H', '24H', '7D', '30D'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${range === r ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                {r}
              </button>
           ))}
        </div>
      </header>

      {/* MAIN GRAPH CARD */}
      <GlassCard className="relative overflow-hidden !p-0 pb-4">
         <div className="p-5 pb-0 flex justify-between items-end mb-4">
            <div>
               <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Current Trend</p>
               <h2 className="text-3xl font-black text-white flex items-center gap-2">
                 {data.history[data.history.length -1].aqi} 
                 <span className="text-sm px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">AQI</span>
               </h2>
            </div>
            <div className="text-right">
               <div className="flex items-center gap-1 text-green-400 text-sm font-bold justify-end">
                  <ArrowDown size={14} /> 12%
               </div>
               <p className="text-[10px] text-slate-500">vs last period</p>
            </div>
         </div>

         {/* SVG Chart */}
         <div className="relative h-[160px] w-full">
            <svg viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`} className="w-full h-full overflow-visible px-4">
               <defs>
                  <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                     <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                     <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                     <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                     </feMerge>
                  </filter>
               </defs>
               
               {/* Grid Lines */}
               <line x1="0" y1={GRAPH_HEIGHT * 0.25} x2={GRAPH_WIDTH} y2={GRAPH_HEIGHT * 0.25} stroke="#334155" strokeDasharray="4 4" strokeWidth="0.5" />
               <line x1="0" y1={GRAPH_HEIGHT * 0.50} x2={GRAPH_WIDTH} y2={GRAPH_HEIGHT * 0.50} stroke="#334155" strokeDasharray="4 4" strokeWidth="0.5" />
               <line x1="0" y1={GRAPH_HEIGHT * 0.75} x2={GRAPH_WIDTH} y2={GRAPH_HEIGHT * 0.75} stroke="#334155" strokeDasharray="4 4" strokeWidth="0.5" />
               
               {/* Separator Line for Prediction */}
               <line x1={GRAPH_WIDTH * 0.7} y1="0" x2={GRAPH_WIDTH * 0.7} y2={GRAPH_HEIGHT} stroke="#334155" strokeWidth="1" />
               <text x={GRAPH_WIDTH * 0.7 + 5} y="10" fill="#94a3b8" fontSize="8">FORECAST</text>

               {/* History Fill */}
               <path d={fillPath} fill="url(#graphGradient)" />

               {/* History Stroke */}
               <path d={graphPath} fill="none" stroke="#06b6d4" strokeWidth="3" filter="url(#glow)" strokeLinecap="round" strokeLinejoin="round" />
               
               {/* Prediction Stroke (Dashed) */}
               <path d={predictionPath} fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="5,5" filter="url(#glow)" strokeLinecap="round" strokeLinejoin="round" />

               {/* Last Point Dot */}
               {data.history.length > 0 && (() => {
                  const pts = getCoordinates(data.history.map(h => h.aqi), GRAPH_WIDTH * 0.7, GRAPH_HEIGHT);
                  const last = pts[pts.length - 1];
                  return <circle cx={last.x} cy={last.y} r="4" fill="white" stroke="#06b6d4" strokeWidth="2" />;
               })()}
            </svg>
         </div>

         {/* X-Axis Labels */}
         <div className="flex justify-between px-6 text-[10px] text-slate-500 uppercase font-medium">
             <span>{data.history[0].timestamp}</span>
             <span>Now</span>
             <span className="text-purple-400">+24H</span>
         </div>
      </GlassCard>

      {/* MIN / MAX STATS */}
      <div className="grid grid-cols-2 gap-4">
         <GlassCard className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><ArrowUp size={48} /></div>
            <p className="text-slate-400 text-xs uppercase mb-1">Period Max</p>
            <p className="text-2xl font-black text-red-400">{data.maxAQI}</p>
            <p className="text-[10px] text-slate-500 mt-2">Worst Pollutant: <span className="text-white font-bold">{data.worstPollutant}</span></p>
         </GlassCard>

         <GlassCard className="relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10"><ArrowDown size={48} /></div>
             <p className="text-slate-400 text-xs uppercase mb-1">Period Min</p>
             <p className="text-2xl font-black text-green-400">{data.minAQI}</p>
             <p className="text-[10px] text-slate-500 mt-2">Cleanest Time: <span className="text-white font-bold">{data.bestHour}</span></p>
         </GlassCard>
      </div>

      {/* PREDICTION ENGINE CARD */}
      <GlassCard title="Pollution Predictor (Next 24h)">
         <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-500/20 p-3 rounded-xl border border-purple-500/30">
               <Zap size={24} className="text-purple-400" />
            </div>
            <div>
               <p className="text-sm font-bold text-white">AI Forecast Model</p>
               <p className="text-xs text-slate-400">Dashed line in graph represents future trend.</p>
            </div>
         </div>
         
         <div className="relative h-24 w-full border-l border-b border-slate-700">
             {/* Simple visual representation of prediction */}
             <div className="absolute bottom-0 left-0 right-0 h-full flex items-end px-2 gap-2">
                {data.predictions.map((p, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center group relative">
                      <div 
                        className={`w-full rounded-t opacity-50 transition-all group-hover:opacity-100 ${p.aqi > 100 ? 'bg-red-500' : 'bg-cyan-500'}`} 
                        style={{ height: `${Math.min(p.aqi, 100)}%` }}
                      ></div>
                      <span className="text-[9px] text-slate-500 mt-1">{p.timeLabel}</span>
                   </div>
                ))}
             </div>
         </div>
         
         <div className="mt-4 flex gap-2">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-[10px] text-yellow-300 flex items-center gap-1 flex-1">
               <AlertTriangle size={12} /> High Risk: 6 PM
            </div>
            <div className="bg-slate-800 border border-slate-700 p-2 rounded text-[10px] text-slate-300 flex items-center gap-1 flex-1">
               <Wind size={12} /> Wind: {currentWeather.current.wind_dir} {currentWeather.current.wind_kph}kph
            </div>
         </div>
      </GlassCard>
    </div>
  );
};

export default AirInsights;
