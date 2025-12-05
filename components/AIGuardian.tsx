
import React, { useEffect, useState, useRef } from 'react';
import { WeatherData, GuardianInsight } from '../types';
import { GuardianService } from '../services/aiGuardian';
import { ShieldCheck, Brain, Map, Download, Loader2 } from 'lucide-react';
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

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        useCORS: true
      });
      
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

  return (
    <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto h-full flex flex-col">
       {/* Printable Area Ref */}
       <div ref={reportRef} className={`p-4 rounded-xl ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
           <div className="text-center py-6">
              <div className="relative w-24 h-24 mx-auto mb-4">
                 <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
                 <ShieldCheck size={96} className="relative z-10 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-black">AI Guardian</h1>
              <p className="text-cyan-400 font-mono text-sm">SYSTEM ACTIVE • MONITORING</p>
              <p className="text-xs text-slate-500 mt-2">{new Date().toLocaleString()}</p>
           </div>

           <div className="grid grid-cols-2 gap-4 mb-4">
               <div className={`p-4 rounded-xl text-center border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-slate-400 text-xs uppercase">Safety Score</p>
                  <p className={`text-4xl font-black ${insight.safetyScore > 70 ? 'text-green-400' : 'text-red-400'}`}>
                     {insight.safetyScore}%
                  </p>
               </div>
               <div className={`p-4 rounded-xl text-center border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-slate-400 text-xs uppercase">Mask Status</p>
                  <p className={`text-xl font-bold mt-2 ${insight.maskRequired ? 'text-red-400' : 'text-green-400'}`}>
                     {insight.maskRequired ? "REQUIRED" : "OPTIONAL"}
                  </p>
               </div>
           </div>

           <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="font-bold uppercase tracking-wider text-sm text-cyan-500 mb-4">Strategic Analysis</h3>
              <div className="space-y-4">
                 <div className="flex gap-3">
                    <Brain className="text-purple-400 shrink-0" />
                    <div>
                       <h4 className="font-bold text-sm">Prediction Model</h4>
                       <p className="text-slate-500 text-sm leading-relaxed">{insight.prediction}</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <Map className="text-orange-400 shrink-0" />
                    <div>
                       <h4 className="font-bold text-sm">Mobility Advice</h4>
                       <p className="text-slate-500 text-sm leading-relaxed">{insight.travelAdvice}</p>
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
          {generating ? 'Generating PDF...' : 'Download Full Report'}
       </button>
    </div>
  );
};

export default AIGuardian;
