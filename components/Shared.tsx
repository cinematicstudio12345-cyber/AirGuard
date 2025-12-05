import React, { ReactNode, HTMLAttributes } from 'react';
import { useTheme } from '../providers/ThemeProvider';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  title?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, ...props }) => {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-xl p-5 shadow-lg border transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-900/75 border-slate-700 backdrop-blur-md' 
        : 'bg-white/80 border-slate-200 backdrop-blur-md shadow-slate-200'
    } ${className}`} {...props}>
      {title && <h3 className={`font-bold mb-3 uppercase tracking-wider text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{title}</h3>}
      {children}
    </div>
  );
};

export const Skeleton = ({ className = "h-4 w-full" }: { className?: string }) => {
  const { isDark } = useTheme();
  return (
    <div className={`animate-pulse rounded ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'} ${className}`}></div>
  );
};

export const StatBox = ({ label, value, loading, unit = '' }: { label: string; value: string | number; loading: boolean; unit?: string }) => {
  const { isDark } = useTheme();
  return (
    <div className="flex flex-col">
      <span className={`text-xs uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <span className={`text-2xl font-bold ${isDark ? 'text-white neon-text' : 'text-slate-800'}`}>
          {value}<span className={`text-sm ml-1 ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`}>{unit}</span>
        </span>
      )}
    </div>
  );
};

export const Badge = ({ children, type = 'neutral' }: { children?: ReactNode; type?: 'danger' | 'safe' | 'warning' | 'neutral' }) => {
  const { isDark } = useTheme();
  const colors = isDark ? {
    danger: 'bg-red-500/20 text-red-300 border-red-500/50',
    safe: 'bg-green-500/20 text-green-300 border-green-500/50',
    warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    neutral: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
  } : {
    danger: 'bg-red-100 text-red-700 border-red-200',
    safe: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs border ${colors[type]}`}>
      {children}
    </span>
  );
};