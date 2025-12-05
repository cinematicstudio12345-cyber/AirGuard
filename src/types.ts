
// WeatherAPI Types
export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    humidity: number;
    cloud: number;
    uv: number;
    vis_km: number;
    air_quality: {
      co: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      "us-epa-index": number;
      "gb-defra-index": number;
    };
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: { text: string; icon: string };
        avghumidity: number;
        maxwind_kph: number;
        uv: number;
      };
      astro: {
        sunrise: string;
        sunset: string;
      };
      hour: Array<{
        time: string;
        temp_c: number;
        condition: { text: string; icon: string };
        humidity: number;
        wind_kph: number;
        chance_of_rain: number;
      }>;
    }>;
  };
}

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lon: number;
  country: string;
}

export interface TrackingPoint {
  lat: number;
  lon: number;
  aqi: number;
  timestamp: number;
}

export interface TrackingSession {
  uid: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  distanceKm: number;
  avgAQI: number;
  maxAQI: number;
  samples: TrackingPoint[];
}

export enum Tab {
  DASHBOARD = 'DASHBOARD',
  WEATHER = 'WEATHER',
  MAP = 'MAP',
  AIR_INSIGHTS = 'AIR_INSIGHTS', 
  QUIZ = 'QUIZ',
  AEROBOT = 'AEROBOT',
  SETTINGS = 'SETTINGS',
  ALERTS = 'ALERTS',
  GUARDIAN = 'GUARDIAN'
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface DetectedSource {
  id: string;
  name: string;
  category: 'Factory' | 'Construction' | 'Traffic' | 'Power Plant' | 'Agricultural' | 'Waste Burning';
  distance: number; // km
  pollutants: string[]; // e.g., ["PM10", "SO2"]
  direction: string; // e.g., "NE"
}

export interface PollutantTrace {
  pollutant: string;
  likelySource: string;
  confidence: number;
  color: string;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  theme?: 'light' | 'dark';
}

export interface HealthCoachResponse {
  weakness_warning: string;
  breathing_exercise: string;
  immunity_food: string;
  avoidance_tip: string;
}

export interface PollutionPlanResponse {
  best_time: string;
  best_area: string;
  protective_plan: string;
  mode: string;
}

export interface PollutionSource {
  name: string;
  type: string;
  distance: string;
  pollutant: string;
}

// --- NEW HISTORICAL TYPES ---
export type TimeRange = '12H' | '24H' | '7D' | '30D';

export interface HistoricalPoint {
  timestamp: string; // ISO or label
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
}

export interface PredictionPoint {
  timeLabel: string;
  aqi: number;
  confidence: number;
}

export interface AirInsightsData {
  history: HistoricalPoint[];
  predictions: PredictionPoint[];
  minAQI: number;
  maxAQI: number;
  worstPollutant: string;
  bestHour: string;
}

export interface AccuracyResult {
  aqi: number;
  confidence: number;
  primarySource: string;
  sourcesUsed: number;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    o3: number;
    co: number;
  };
}

// --- NEW ALERT TYPES ---
export type AlertLevel = 'WARNING' | 'DANGER' | 'CRITICAL';
export interface CitizenAlert {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  level: AlertLevel;
  source: string; // e.g., "WAQI", "OpenAQ"
  action: string;
}

// --- AI GUARDIAN TYPES ---
export interface GuardianInsight {
  safetyScore: number; // 0-100
  prediction: string;
  travelAdvice: string;
  maskRequired: boolean;
}

// --- THEME CONTEXT ---
export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}