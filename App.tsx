
import React, { useState, useEffect } from 'react';
import { 
  Map as MapIcon, 
  Bot, 
  Home, 
  Settings as SettingsIcon,
  Brain,
  TrendingUp,
  Globe as GlobeIcon,
  CloudSun,
  Menu,
  X,
  Navigation,
  Bell,
  ShieldCheck
} from 'lucide-react';
import { fetchWeather } from './services/weather';
import { WeatherData, Tab, User } from './types';
import Dashboard from './components/Dashboard';
import LiveTrack from './components/LiveTrack'; 
import Quiz from './components/Quiz';
import AeroBot from './components/AeroBot';
import Settings from './components/Settings';
import AuthScreen from './components/Auth';
import Globe from './components/Globe';
import AirInsights from './components/AirInsights';
import WeatherTab from './components/WeatherTab';
import AlertsTab from './components/AlertsTab';
import AIGuardian from './components/AIGuardian';
import { AlertService } from './services/alerts';
import { ThemeProvider, useTheme } from './providers/ThemeProvider';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showGlobe, setShowGlobe] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [locating, setLocating] = useState(true);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const { isDark } = useTheme();
  
  // Initial Data Load - GPS FIRST
  useEffect(() => {
    if (user) {
      setLocating(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const data = await fetchWeather(`${latitude},${longitude}`);
              setWeather(data);
              
              // Check alerts
              const alerts = AlertService.checkTriggers(data);
              setUnreadAlerts(alerts.length);
            } catch (e) {
              console.error("GPS Weather Fetch Failed", e);
              const data = await fetchWeather("New York");
              setWeather(data);
            } finally {
              setLocating(false);
            }
          },
          async (error) => {
            console.warn("GPS Permission Denied", error);
            const data = await fetchWeather("New York");
            setWeather(data);
            setLocating(false);
          }
        );
      } else {
        fetchWeather("London").then(data => {
            setWeather(data);
            setLocating(false);
        });
      }
    }
  }, [user]);

  if (!user) return <AuthScreen onLogin={setUser} />;

  // Globe View
  if (showGlobe) {
    return (
      <div className="h-screen w-screen relative bg-black">
         <Globe onSelectLocation={(d) => { 
           setWeather(d); 
           setShowGlobe(false); 
           setActiveTab(Tab.DASHBOARD); 
         }} />
         <button 
           onClick={() => setShowGlobe(false)}
           className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full z-50 hover:bg-slate-800 transition-colors border border-slate-700"
         >
           <X size={24} />
         </button>
      </div>
    );
  }

  const handleNav = (tab: Tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return <Dashboard weather={weather} user={user} onNavigate={setActiveTab} />;
      case Tab.WEATHER:
        return <WeatherTab weather={weather} />;
      case Tab.MAP:
        return <LiveTrack weather={weather} onDataUpdate={setWeather} userId={user.email} />;
      case Tab.AIR_INSIGHTS: 
        return <AirInsights />;
      case Tab.QUIZ:
        return <Quiz />;
      case Tab.AEROBOT:
        return <AeroBot />;
      case Tab.ALERTS:
        return <AlertsTab weather={weather} />;
      case Tab.GUARDIAN:
        return <AIGuardian weather={weather} />;
      case Tab.SETTINGS:
        return <Settings user={user} onLogout={() => setUser(null)} />;
      default:
        return <Dashboard weather={weather} user={user} onNavigate={setActiveTab} />;
    }
  };

  const menuItems = [
    { id: Tab.DASHBOARD, icon: <Home size={20} />, label: "Dashboard" },
    { id: Tab.ALERTS, icon: <Bell size={20} />, label: "Citizen Alerts", badge: unreadAlerts },
    { id: Tab.GUARDIAN, icon: <ShieldCheck size={20} />, label: "AI Guardian" },
    { id: Tab.WEATHER, icon: <CloudSun size={20} />, label: "Weather & Atmospherics" },
    { id: Tab.AIR_INSIGHTS, icon: <TrendingUp size={20} />, label: "Air Insights & Trends" },
    { id: 'GLOBE_BTN', icon: <GlobeIcon size={20} />, label: "Global 3D Map", action: () => { setShowGlobe(true); setIsMenuOpen(false); } },
    { id: Tab.MAP, icon: <MapIcon size={20} />, label: "Live GPS Track" },
    { id: Tab.QUIZ, icon: <Brain size={20} />, label: "Eco Quiz" },
    { id: Tab.AEROBOT, icon: <Bot size={20} />, label: "AeroBot Chat" },
    { id: Tab.SETTINGS, icon: <SettingsIcon size={20} />, label: "Settings" },
  ];

  return (
    <div className={`h-[100dvh] flex flex-col overflow-hidden font-sans relative selection:bg-cyan-500/30 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* TOP HEADER BAR */}
      <header className={`h-16 flex items-center justify-between px-4 z-40 shrink-0 shadow-lg border-b transition-colors ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(true)} className={`p-2 rounded-lg transition-colors relative ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
            <Menu size={24} className="text-cyan-500" />
            {unreadAlerts > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
          </button>
          
          <div className="flex flex-col justify-center">
            {locating ? (
                <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">Locating...</span>
                </div>
            ) : (
                <>
                    <h1 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Location</h1>
                    <div className="flex items-center gap-1.5">
                    <Navigation size={12} className="text-cyan-500 fill-cyan-500/20" />
                    <span className={`font-bold text-base leading-none truncate max-w-[200px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {weather?.location.name || "Unknown"}
                    </span>
                    </div>
                </>
            )}
          </div>
        </div>
        
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20">
           <img src={user.avatar} className="w-full h-full rounded-full bg-slate-900 object-cover" alt="profile"/>
        </div>
      </header>

      {/* SIDEBAR DRAWER */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-50 flex">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          <div className={`relative w-72 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 border-r ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
             <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
               <span className={`text-xl font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                 <div className="w-6 h-6 bg-cyan-500 rounded-md"></div>
                 AirGuard
               </span>
               <button onClick={() => setIsMenuOpen(false)}><X size={24} className="text-slate-400 hover:text-cyan-500 transition-colors"/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto py-4">
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => item.action ? item.action() : handleNav(item.id as Tab)}
                    className={`w-full flex items-center justify-between px-6 py-4 transition-all group ${
                        activeTab === item.id 
                            ? isDark ? 'bg-slate-800/50 border-r-4 border-cyan-400 text-cyan-400' : 'bg-slate-100 border-r-4 border-cyan-500 text-cyan-700'
                            : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-cyan-500' : 'text-slate-400'}`}>{item.icon}</div>
                        <span className="font-bold text-sm tracking-wide">{item.label}</span>
                    </div>
                    {item.badge ? (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                    ) : null}
                  </button>
                ))}
             </div>
             
             <div className={`p-6 border-t ${isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50'}`}>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-center">v2.4.0 Pro</p>
             </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden scroll-smooth">
        {renderContent()}
      </main>

    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
