
import React from 'react';

interface CigaretteAnimProps {
  aqi?: number;
}

const CigaretteAnim: React.FC<CigaretteAnimProps> = ({ aqi = 0 }) => {
  const normalizedAqi = Math.min(aqi, 300) / 300; // 0 to 1
  
  // Calculate Colors: Shift from Grey to Black/Brown
  const r = Math.round(200 - (160 * normalizedAqi));
  const g = Math.round(200 - (170 * normalizedAqi));
  const b = Math.round(200 - (180 * normalizedAqi));
  const smokeColor = `rgb(${r}, ${g}, ${b})`;
  
  // Opacity & Speed
  const opacity = 0.4 + (0.6 * normalizedAqi);
  const animSpeed = 2.5 - (1.5 * normalizedAqi); 

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-visible">
      {/* Cigarette Body - HORIZONTAL SLEEPING LINE */}
      <div className="relative w-20 h-2 bg-white rounded-sm border border-slate-400 shadow-xl flex items-center">
        {/* Filter (Left) */}
        <div className="w-6 h-full bg-gradient-to-r from-orange-200 to-orange-400 rounded-l-sm border-r border-orange-500/50"></div>
        
        {/* Burning Tip (Right) */}
        <div 
           className="absolute right-0 h-full bg-gradient-to-l from-red-600 to-gray-900 animate-pulse rounded-r-sm"
           style={{ 
             width: `${4 + (normalizedAqi * 10)}px`,
             boxShadow: `2px 0 ${8 + (normalizedAqi * 20)}px ${normalizedAqi > 0.6 ? 'red' : 'orange'}` 
           }}
        ></div>
        
        {/* Smoke Particles - Rising from Right Tip */}
        <div className="absolute right-0 bottom-full pointer-events-none">
            {[...Array(6)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute rounded-full blur-md animate-ping mix-blend-screen"
                  style={{ 
                    backgroundColor: smokeColor,
                    width: `${10 + (normalizedAqi * 20)}px`,
                    height: `${10 + (normalizedAqi * 20)}px`,
                    opacity: opacity * (1 - (i * 0.15)),
                    animationDuration: `${animSpeed}s`,
                    animationDelay: `${i * 0.3}s`,
                    bottom: `${i * 12}px`,
                    right: `${(Math.sin(i * 2) * 8)}px`
                  }}
                ></div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CigaretteAnim;
