
import { WeatherData } from '../types';

const API_KEY = '4bc366b8816c439288950959252411';
const BASE_URL = 'https://api.weatherapi.com/v1';

const MOCK_OCEAN_DATA: WeatherData = {
  location: { 
    name: "Open Ocean", 
    region: "International", 
    country: "International Waters", 
    lat: 0, 
    lon: 0, 
    localtime: new Date().toISOString() 
  },
  current: { 
    last_updated: new Date().toISOString(), 
    temp_c: 20, 
    temp_f: 68, 
    is_day: 1, 
    condition: { 
      text: "Clear (At Sea)", 
      icon: "//cdn.weatherapi.com/weather/64x64/day/113.png", 
      code: 1000 
    },
    wind_mph: 15, 
    wind_kph: 24.1, 
    wind_degree: 0,
    wind_dir: "N", 
    pressure_mb: 1013, 
    humidity: 85, 
    cloud: 10, 
    uv: 5,
    vis_km: 10,
    air_quality: { 
      co: 200, 
      no2: 1, 
      o3: 40, 
      so2: 1, 
      pm2_5: 5, 
      pm10: 10, 
      "us-epa-index": 1, 
      "gb-defra-index": 1 
    }
  }
};

const MOCK_FALLBACK_DATA: WeatherData = {
  ...MOCK_OCEAN_DATA,
  location: {
    ...MOCK_OCEAN_DATA.location,
    name: "Offline Mode",
    region: "Cached",
    country: "System"
  },
  current: {
    ...MOCK_OCEAN_DATA.current,
    condition: {
      text: "Data Unavailable",
      icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
      code: 1000
    },
    temp_c: 25,
    air_quality: {
      ...MOCK_OCEAN_DATA.current.air_quality,
      "us-epa-index": 2,
      pm2_5: 15
    }
  }
};

export const fetchWeather = async (query: string): Promise<WeatherData> => {
  if (!query || query.trim() === '' || query.includes('NaN')) {
    console.error("Invalid weather query:", query);
    return MOCK_FALLBACK_DATA;
  }

  try {
    const safeQuery = encodeURIComponent(query);
    // Fetch 3 days to support "2-Day Forecast" tab + today
    const url = `${BASE_URL}/forecast.json?key=${API_KEY}&q=${safeQuery}&aqi=yes&days=3`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 400) {
        console.warn(`Weather API 400 for ${query} - Likely Open Ocean or Invalid Location.`);
        const [lat, lon] = query.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lon)) {
           return {
             ...MOCK_OCEAN_DATA,
             location: { ...MOCK_OCEAN_DATA.location, lat, lon }
           };
        }
        return MOCK_FALLBACK_DATA;
      }
      console.warn(`Weather API Error: ${response.status} ${response.statusText}`);
      return MOCK_FALLBACK_DATA;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch weather data for query:", query, error);
    // Return mock data instead of throwing to prevent app crash
    return MOCK_FALLBACK_DATA;
  }
};
