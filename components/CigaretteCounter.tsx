
import React, { useState, useEffect } from 'react';
import { Cigarette, Plus, Minus, AlertTriangle, History } from 'lucide-react';
import { GlassCard } from './Shared';

interface CigaretteCounterProps {
  initialCount: number;
}

const CigaretteCounter: React.FC<CigaretteCounterProps> = ({ initialCount }) => {
  const [count, setCount] = useState(initialCount);
  // Animate smoke based on count
  const smokeIntensity = Math.min(count * 0.1 + 0.2, 1);
  
  return (
    <div className="p-4 max-w-lg mx-auto pb-24 space-y-6">
      <header>
        <h1 className="text-2xl font-black text-white">Cigarette Tracker</h1>
        <p className="text-slate-400 text-sm">Monitor your intake & estimated pollution equivalent.</p>
      </header>

      {/* 3D Animation Area */}
      <div className="relative h-64 w-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
         {/* Procedural Smoke Particles */}
         <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i}
                className="absolute bg-slate-400 rounded-full blur-xl opacity-20 animate-pulse"
                style={{
                   width: `${Math.random() * 50 + 20}px`,
                   height: `${Math.random() * 50 + 20}px`,
                   bottom: '40%',
                   left: '50%',
                   transform: `translate(-50%, -${i * 10}px)`,
                   animationDuration: `${2 + Math.random()}s`,
                   opacity: smokeIntensity * 0.5
                }}
              />
            ))}
         </div>

         {/* Cigarette Graphic */}
         <div className="relative z-10 transform rotate-12 transition-transform duration-500 hover:rotate-0">
             {/* Filter */}
             <div className="w-4 h-16 bg-orange-300 rounded-sm border-r-2 border-orange-400/50"></div>
             {/* Body */}
             <div className="w-4 h-32 bg-white absolute top-16 left-0 border-r-2 border-slate-200"></div>
             {/* Ash/Burn */}
             <div 
               className="w-4 absolute left-0 bg-gradient-to-b from-gray-800 to-red-500 animate-pulse"
               style={{ 
                 top: `${16 + 32}px`, 
                 height: `${Math.min(count * 2, 20)}px`,
                 opacity: count > 0 ? 1 : 0
               }}
             ></div>
             {/* Smoke Stream */}
             {count > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-20 bg-gradient-to-b from-gray-400/50 to-transparent blur-sm"></div>
             )}
         </div>
      </div>

      <div className="flex items-center justify-center gap-8">
        <button 
          onClick={() => setCount(Math.max(0, count - 1))}
          className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-slate-700 active:scale-95 transition-all"
        >
          <Minus size={24} />
        </button>
        
        <div className="text-center">
           <span className="block text-6xl font-black text-white neon-text">{count}</span>
           <span className="text-xs text-slate-500 uppercase tracking-widest">Today</span>
        </div>

        <button 
          onClick={() => setCount(count + 1)}
          className="w-16 h-16 rounded-2xl bg-cyan-500 flex items-center justify-center text-slate-900 hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="text-center">
           <AlertTriangle className="mx-auto text-orange-500 mb-2" size={24} />
           <p className="text-2xl font-bold text-white">{(count * 11).toFixed(0)}m</p>
           <p className="text-[10px] text-slate-400 uppercase">Life Lost (Est)</p>
        </GlassCard>
        <GlassCard className="text-center">
           <History className="mx-auto text-purple-500 mb-2" size={24} />
           <p className="text-2xl font-bold text-white">${(count * 0.50).toFixed(2)}</p>
           <p className="text-[10px] text-slate-400 uppercase">Cost Today</p>
        </GlassCard>
      </div>

      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
         <h4 className="text-red-400 font-bold mb-1 text-sm">Health Warning</h4>
         <p className="text-xs text-slate-300">
           Carbon monoxide levels in your blood drop to normal 12 hours after stopping smoking.
         </p>
      </div>
    </div>
  );
};

export default CigaretteCounter;
