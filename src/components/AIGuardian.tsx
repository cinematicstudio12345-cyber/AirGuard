
import React, { useEffect, useState, useRef } from 'react';
import { WeatherData, GuardianInsight } from '../types';
import { GuardianService } from '../services/aiGuardian';
import { ShieldCheck, Brain, Map, Download, Loader2, Thermometer, Wind, Droplets } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';

interface GuardianProps {
  weather: WeatherData | null;
}

const AIGuardian: React.FC<GuardianProps> = ({ weather }) => {
  const [insight, setInsight] = useState<GuardianInsight | null>(null);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (weather) {
       setInsight(GuardianService.analyze(weather));
    }
  }, [weather]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !weather) return;
    setGenerating(true);
    
    try {
      // Access libraries via window global to bypass Babel/ESM issues
      const html2canvas = (window as any).html2canvas;
      const jsPDF = (window as any).jspdf ? (window as any).jspdf.jsPDF : (window as any).jsPDF;

      if (!html2canvas || !jsPDF) {
        alert("PDF libraries not loaded. Please refresh.");
        return;
      }

      // Force white background for PDF capture regardless of current theme
      const prevBg = reportRef.current.style.backgroundColor;
      const prevColor = reportRef.current.style.color;
      
      // Temporarily style for print
      reportRef.current.style.backgroundColor = '#ffffff';
      reportRef.current.style.color = '#0f172a';

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff', // Force white background in canvas
        useCORS: true,
        logging: false
      });
      
      // Restore styles
      reportRef.current.style.backgroundColor = prevBg;
      reportRef.current.style.color = prevColor;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AirGuard_Report_${weather.location.name}_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF Gen Error", err);
      alert("Failed to generate PDF. Check console.");
    } finally {
      setGenerating(false);
    }
  };

  if (!weather || !insight) return <div className="p-6 text-center text-slate-500">Analyzing environment...</div>;

  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200';

  return (
    <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto h-full flex flex-col">
       {/* Printable Area Ref */}
       <div ref={reportRef} className={`p-6 rounded-3xl ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
           <div className="text-center py-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                 <ShieldCheck size={32} className="text-cyan-500" />
                 <h1 className={`text-2xl font-black ${textColor}`}>AirGuard Report</h1>
              </div>
              <p className={`text-xs ${subTextColor}`}>Generated on {new Date().toLocaleString()}</p>
              <p className={`font-bold text-lg mt-2 ${textColor}`}>{weather.location.name}, {weather.location.country}</p>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-2 gap-4 mb-6">
               <div className={`p-4 rounded-2xl text-center border ${cardBg}`}>
                  <p className={`text-xs uppercase ${subTextColor}`}>Overall AQI</p>
                  <p className={`text-5xl font-black my-2 ${insight.safetyScore > 70 ? 'text-green-500' : 'text-red-500'}`}>
                     {weather.current.air_quality["us-epa-index"] * 30 /* approx */}
                  </p>
                  <p className={`text-xs font-bold ${insight.safetyScore > 70 ? 'text-green-600' : 'text-red-500'}`}>
                     {insight.safetyScore > 70 ? 'SAFE' : 'HAZARDOUS'}
                  </p>
               </div>
               
               <div className="flex flex-col gap-2">
                   <div className={`flex-1 p-3 rounded-xl border flex items-center justify-between ${cardBg}`}>
                      <Thermometer size={16} className="text-orange-400"/>
                      <span className={`font-bold ${textColor}`}>{weather.current.temp_c}°C</span>
                   </div>
                   <div className={`flex-1 p-3 rounded-xl border flex items-center justify-between ${cardBg}`}>
                      <Wind size={16} className="text-blue-400"/>
                      <span className={`font-bold ${textColor}`}>{weather.current.wind_kph} kph</span>
                   </div>
                   <div className={`flex-1 p-3 rounded-xl border flex items-center justify-between ${cardBg}`}>
                      <Droplets size={16} className="text-indigo-400"/>
                      <span className={`font-bold ${textColor}`}>{weather.current.humidity}%</span>
                   </div>
               </div>
           </div>

           {/* Breakdown */}
           <div className="mb-6">
              <h3 className={`font-bold uppercase text-xs mb-2 ${subTextColor}`}>Pollutant Breakdown</h3>
              <div className="grid grid-cols-4 gap-2">
                 {['pm2_5', 'pm10', 'no2', 'so2'].map(p => (
                    <div key={p} className={`p-2 rounded-lg text-center border ${cardBg}`}>
                       <span className={`text-[10px] uppercase block ${subTextColor}`}>{p.replace('_', '.')}</span>
                       <span className={`font-bold text-sm ${textColor}`}>{(weather.current.air_quality as any)[p]}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div className={`p-5 rounded-2xl border ${cardBg}`}>
              <h3 className="font-bold uppercase tracking-wider text-sm text-cyan-500 mb-4">AI Safety Analysis</h3>
              <div className="space-y-4">
                 <div className="flex gap-3">
                    <Brain className="text-purple-400 shrink-0" />
                    <div>
                       <h4 className={`font-bold text-sm ${textColor}`}>Prediction Model</h4>
                       <p className={`text-sm leading-relaxed ${subTextColor}`}>{insight.prediction}</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <Map className="text-orange-400 shrink-0" />
                    <div>
                       <h4 className={`font-bold text-sm ${textColor}`}>Mobility Advice</h4>
                       <p className={`text-sm leading-relaxed ${subTextColor}`}>{insight.travelAdvice}</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${insight.maskRequired ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                        <ShieldCheck size={12} />
                     </div>
                     <div>
                        <h4 className={`font-bold text-sm ${textColor}`}>Mask Recommendation</h4>
                        <p className={`text-sm leading-relaxed ${subTextColor}`}>
                           {insight.maskRequired ? "N95 Mask Recommended outdoors." : "No mask needed at this time."}
                        </p>
                     </div>
                 </div>
              </div>
           </div>
       </div>
       
       <button 
         onClick={handleDownloadPDF}
         disabled={generating}
         className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
       >
          {generating ? <Loader2 className="animate-spin" /> : <Download size={20} />}
          {generating ? 'Generating PDF...' : 'Download Full PDF Report'}
       </button>
    </div>
  );
};

export default AIGuardian;
