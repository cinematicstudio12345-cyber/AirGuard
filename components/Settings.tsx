
import React from 'react';
import { LogOut, Bell, Moon, Sun, Database } from 'lucide-react';
import { GlassCard } from './Shared';
import { User as UserType } from '../types';
import { useTheme } from '../providers/ThemeProvider';

interface SettingsProps {
  user: UserType;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 space-y-6">
      <h1 className={`text-2xl font-black px-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h1>

      <GlassCard className="!p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500">
           <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
        </div>
        <div>
           <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</h2>
           <p className="text-slate-400 text-sm">{user.email}</p>
        </div>
      </GlassCard>

      <div className="space-y-3">
         {/* THEME TOGGLE */}
         <button 
           onClick={toggleTheme}
           className={`w-full p-4 rounded-xl flex items-center justify-between border transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
         >
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                  {isDark ? <Moon size={20}/> : <Sun size={20} />}
               </div>
               <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Appearance</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
               {isDark ? 'Dark Mode' : 'Light Mode'}
            </div>
         </button>
         
         <button className={`w-full p-4 rounded-xl flex items-center justify-between border transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}><Bell size={20}/></div>
               <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Notifications</span>
            </div>
            <div className="w-10 h-6 bg-cyan-600 rounded-full relative">
               <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
         </button>

         <button className={`w-full p-4 rounded-xl flex items-center justify-between border transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}><Database size={20}/></div>
               <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Data Sources</span>
            </div>
            <span className="text-xs text-slate-500">WeatherAPI</span>
         </button>
      </div>

      <div className="pt-8">
         <button 
           onClick={onLogout}
           className="w-full py-4 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
         >
           <LogOut size={20} /> Sign Out
         </button>
         <p className="text-center text-[10px] text-slate-600 mt-4 uppercase tracking-widest">AirGuard Pro v2.4.0</p>
      </div>
    </div>
  );
};

export default Settings;
