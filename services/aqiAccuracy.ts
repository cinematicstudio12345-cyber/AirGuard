
import { WeatherData, AccuracyResult } from '../types';

interface SourceData {
  name: string;
  aqi: number;
  distanceKm: number;
  freshnessMin: number; // minutes since update
  completeness: number; // 0-1 score
}

/**
 * AccurateAQIService
 * Implements strict PM2.5 to AQI conversion.
 * Adjusted to handle High Density pollution events (common in Asia) without clamping too early.
 */
export class AccurateAQIService {

  static calculate(weather: WeatherData): AccuracyResult {
    const aq = weather.current.air_quality;
    
    // Use raw PM2.5 for calculation as it is the most reliable metric for global comparison
    const realAQI = this.calculatePM25AQI(aq.pm2_5);
    
    // Simulate reliability score
    // In a real multi-source app, this would compare API variances.
    // Here we assume WeatherAPI's raw PM2.5 is our "Ground Truth".
    
    return {
      aqi: Math.round(realAQI),
      confidence: 90, 
      primarySource: "WeatherAPI (PM2.5)",
      sourcesUsed: 1,
      pollutants: {
        pm25: aq.pm2_5,
        pm10: aq.pm10,
        no2: aq.no2,
        so2: aq.so2,
        o3: aq.o3,
        co: aq.co
      }
    };
  }

  // Strict PM2.5 to AQI Calculation
  // Does not smooth high values.
  private static calculatePM25AQI(pm25: number): number {
    if (pm25 < 0) return 0;
    
    // Good (0-50)
    if (pm25 <= 12.0) return this.linear(50, 0, 12.0, 0, pm25);
    
    // Moderate (51-100)
    if (pm25 <= 35.4) return this.linear(100, 51, 35.4, 12.1, pm25);
    
    // Unhealthy for Sensitive (101-150)
    if (pm25 <= 55.4) return this.linear(150, 101, 55.4, 35.5, pm25);
    
    // Unhealthy (151-200)
    if (pm25 <= 150.4) return this.linear(200, 151, 150.4, 55.5, pm25);
    
    // Very Unhealthy (201-300)
    if (pm25 <= 250.4) return this.linear(300, 201, 250.4, 150.5, pm25);
    
    // Hazardous (300-400)
    if (pm25 <= 350.4) return this.linear(400, 301, 350.4, 250.5, pm25);

    // Severe (400-500+) - Extrapolated for extreme events (Gurgaon/Delhi winters)
    if (pm25 <= 500.4) return this.linear(500, 401, 500.4, 350.5, pm25);

    // Beyond Index (Extreme)
    return 500 + (pm25 - 500); 
  }

  private static linear(Ihi: number, Ilo: number, Bhi: number, Blo: number, C: number): number {
      return Math.round(((Ihi - Ilo) / (Bhi - Blo)) * (C - Blo) + Ilo);
  }
}
