
import React, { useEffect, useState } from 'react';
import { WeatherData, CitizenAlert } from '../types';
import { AlertService } from '../services/alerts';
import { GlassCard } from './Shared';
import { AlertTriangle, Bell, ShieldAlert, CheckCircle } from 'lucide-react';

interface AlertsTabProps {
  weather: WeatherData | null;
}

const AlertsTab: React.FC<AlertsTabProps> = ({ weather }) => {
  const [alerts, setAlerts] = useState<CitizenAlert[]>([]);

  useEffect(() => {
    if (weather) {
       const newAlerts = AlertService.checkTriggers(weather);
       setAlerts(newAlerts);
    }
  }, [weather]);

  if (!weather) return <div className="p-6 text-center text-slate-500">Loading data...</div>;

  return (
    <div className="p-4 space-y-4 pb-24 max-w-lg mx-auto">
       <h1 className="text-2xl font-black text-white flex items-center gap-2">
         <Bell className="text-cyan-400" /> Citizen Alerts
       </h1>
       <p className="text-sm text-slate-400">Real-time environmental hazard warnings.</p>

       {alerts.length === 0 ? (
           <div className="p-8 border border-green-500/30 bg-green-500/10 rounded-2xl flex flex-col items-center text-center">
               <CheckCircle size={48} className="text-green-400 mb-4" />
               <h3 className="text-xl font-bold text-white">All Clear</h3>
               <p className="text-green-200 text-sm mt-2">No active hazards detected in your area.</p>
           </div>
       ) : (
           <div className="space-y-4">
              {alerts.map(alert => (
                  <div key={alert.id} className={`relative p-5 rounded-2xl border overflow-hidden ${
                      alert.level === 'CRITICAL' ? 'bg-red-900/40 border-red-500/50' :
                      alert.level === 'DANGER' ? 'bg-orange-900/40 border-orange-500/50' :
                      'bg-yellow-900/40 border-yellow-500/50'
                  }`}>
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                              <ShieldAlert className={
                                  alert.level === 'CRITICAL' ? 'text-red-400' :
                                  alert.level === 'DANGER' ? 'text-orange-400' : 'text-yellow-400'
                              } />
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  alert.level === 'CRITICAL' ? 'bg-red-500 text-white' :
                                  alert.level === 'DANGER' ? 'bg-orange-500 text-black' : 'bg-yellow-500 text-black'
                              }`}>{alert.level}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mb-1">{alert.title}</h3>
                      <p className="text-sm text-slate-300 mb-4">{alert.message}</p>
                      
                      <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Recommended Action</p>
                          <p className="text-sm font-bold text-cyan-300">{alert.action}</p>
                      </div>
                  </div>
              ))}
           </div>
       )}
    </div>
  );
};

export default AlertsTab;
