
import React from 'react';
import { MapPin, Navigation, Lock, AlertTriangle, Settings } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';

interface LocationPermissionModalProps {
  onEnable: () => void;
  status: 'prompt' | 'denied';
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ onEnable, status }) => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center border transition-all scale-100 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        {status === 'denied' ? (
           <div className="w-24 h-24 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-500/20">
               <Lock size={48} className="text-red-500" />
           </div>
        ) : (
           <div className="w-24 h-24 mx-auto bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 relative ring-4 ring-cyan-500/20">
               <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"></div>
               <MapPin size={48} className="text-cyan-500 relative z-10" />
           </div>
        )}

        <h2 className="text-3xl font-black mb-3 tracking-tight">
            {status === 'denied' ? 'Permission Required' : 'Precise Location'}
        </h2>
        
        <p className={`text-base mb-8 leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {status === 'denied' 
            ? "AirLens has been denied access to your GPS. Accurate Air Quality Index (AQI) data cannot be determined without it."
            : "AirLens requires precise GPS access to calculate the exact Air Quality Index (AQI) and wind patterns for your immediate surroundings."}
        </p>

        {status === 'denied' ? (
            <div className="space-y-4">
                <div className={`p-4 rounded-xl text-sm font-bold flex items-start gap-3 text-left ${isDark ? 'bg-red-900/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                    <span>Please open your browser settings or system settings and allow location access for this site.</span>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                    I have enabled it, Try Again
                </button>
            </div>
        ) : (
            <button 
                onClick={onEnable}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
            >
                <Navigation size={22} fill="currentColor" /> Allow Location Access
            </button>
        )}
      </div>
    </div>
  );
};

export default LocationPermissionModal;
