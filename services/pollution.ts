
import { DetectedSource, PollutantTrace, WeatherData } from '../types';

// Mock database of source templates to generate realistic data
const SOURCE_TEMPLATES = [
  { name: "Global Steel Works", category: "Factory", emits: ["PM10", "SO2", "NO2"] },
  { name: "City West Bypass", category: "Traffic", emits: ["NO2", "CO", "PM2.5"] },
  { name: "Metro Construction Site B", category: "Construction", emits: ["PM10", "Dust"] },
  { name: "Thermal Power Station", category: "Power Plant", emits: ["SO2", "CO2", "Mercury"] },
  { name: "Crop Burning Zone", category: "Agricultural", emits: ["PM2.5", "VOCs"] },
  { name: "Municipal Waste Dump", category: "Waste Burning", emits: ["Methane", "PM2.5", "Dioxins"] },
];

export class PollutionSourceService {
  
  /**
   * Generates detected sources based on location context (Simulated)
   * In a real app, this would query a GIS database or OpenAQ metadata.
   */
  static getDetectedSources(lat: number, lon: number, cityName: string): DetectedSource[] {
    // Seed random generator with lat/lon to make it consistent for location
    const seed = Math.abs(lat + lon);
    const count = 2 + (Math.floor(seed * 100) % 3); // 2 to 4 sources
    
    const sources: DetectedSource[] = [];
    
    for (let i = 0; i < count; i++) {
      const template = SOURCE_TEMPLATES[(Math.floor(seed * (i + 1) * 10)) % SOURCE_TEMPLATES.length];
      const distance = 1.2 + ((seed * (i + 1) * 100) % 130) / 10; // 1.2km to 14.2km
      
      sources.push({
        id: `source-${i}`,
        name: `${cityName} ${template.name}`,
        category: template.category as any,
        distance: parseFloat(distance.toFixed(1)),
        pollutants: template.emits,
        direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)]
      });
    }
    
    return sources.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Analyzes AQI data to trace pollutants to likely sources
   */
  static analyzeTraceability(weather: WeatherData): PollutantTrace[] {
    const aq = weather.current.air_quality;
    const traces: PollutantTrace[] = [];

    // Logic for traceability
    if (aq.no2 > 20) {
      traces.push({ pollutant: 'NO2', likelySource: 'Traffic Congestion', confidence: 85, color: 'text-red-400' });
    }
    if (aq.so2 > 10) {
      traces.push({ pollutant: 'SO2', likelySource: 'Industrial/Power', confidence: 70, color: 'text-yellow-400' });
    }
    if (aq.pm10 > 50) {
      traces.push({ pollutant: 'PM10', likelySource: 'Construction/Dust', confidence: 90, color: 'text-orange-400' });
    }
    if (aq.pm2_5 > 35) {
      traces.push({ pollutant: 'PM2.5', likelySource: 'Combustion/Smoke', confidence: 80, color: 'text-purple-400' });
    }
    if (aq.o3 > 60) {
        traces.push({ pollutant: 'O3', likelySource: 'Sunlight + Traffic', confidence: 60, color: 'text-blue-400' });
    }

    if (traces.length === 0) {
        traces.push({ pollutant: 'Clean', likelySource: 'None detected', confidence: 100, color: 'text-green-400' });
    }

    return traces;
  }
}
