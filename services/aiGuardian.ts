
import { WeatherData, GuardianInsight } from '../types';

export class GuardianService {
  static analyze(weather: WeatherData): GuardianInsight {
     const aq = weather.current.air_quality;
     const usIndex = aq["us-epa-index"];
     
     // Base Score
     let score = 100 - (usIndex * 15);
     if (weather.current.wind_kph < 5) score -= 10;
     if (weather.current.humidity > 70) score -= 5;
     score = Math.max(0, Math.min(100, score));

     let prediction = "Stable conditions.";
     if (weather.current.wind_kph < 5 && usIndex > 3) prediction = "Pollution likely to accumulate due to low wind.";
     if (usIndex <= 2) prediction = "Good air quality expected to continue.";

     return {
        safetyScore: score,
        prediction,
        travelAdvice: score > 70 ? "Safe to travel." : "Avoid congestion zones.",
        maskRequired: score < 60
     };
  }
}
