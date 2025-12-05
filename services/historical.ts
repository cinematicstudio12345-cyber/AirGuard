
import { AirInsightsData, HistoricalPoint, PredictionPoint, TimeRange, WeatherData } from '../types';

export class HistoricalService {
  
  /**
   * Fetches/Generates historical data based on the selected range.
   * Since historical API access often requires paid keys, this service 
   * simulates realistic historical curves based on current conditions + diurnal patterns.
   */
  static async getInsightsData(currentWeather: WeatherData, range: TimeRange): Promise<AirInsightsData> {
    
    // Base values from current weather
    const currentAQI = (currentWeather.current.air_quality["us-epa-index"] || 1) * 35; // approx raw value
    const pm25 = currentWeather.current.air_quality.pm2_5;
    
    const history: HistoricalPoint[] = [];
    const pointsCount = range === '12H' ? 12 : range === '24H' ? 24 : range === '7D' ? 7 : 30;
    
    const now = new Date();
    
    // Generate History
    for (let i = pointsCount; i > 0; i--) {
      let timeLabel = '';
      let variance = 0;
      
      if (range === '12H' || range === '24H') {
        // Hourly logic
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        timeLabel = `${d.getHours()}:00`;
        
        // Diurnal pattern: Pollution often higher in morning (8-10am) and evening (6-9pm)
        const hour = d.getHours();
        const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 21);
        const isNight = hour >= 1 && hour <= 5;
        
        variance = isRushHour ? 1.2 : isNight ? 0.7 : 1.0;
      } else {
        // Daily logic
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        timeLabel = `${d.getDate()}/${d.getMonth() + 1}`;
        variance = 0.8 + Math.random() * 0.4; // Random daily fluctuation
      }

      // Add noise
      const noise = (Math.random() - 0.5) * 10;
      const baseAQI = currentAQI * variance + noise;
      
      history.push({
        timestamp: timeLabel,
        aqi: Math.max(10, Math.round(baseAQI)),
        pm25: Math.max(5, Math.round(pm25 * variance + noise/2)),
        pm10: Math.max(10, Math.round(pm25 * 1.5 * variance)),
        no2: Math.max(5, Math.round(20 * variance)),
        o3: Math.max(10, Math.round(30 * (variance === 0.7 ? 0.5 : 1.2))) // Ozone drops at night
      });
    }

    // Generate Predictions (Next 24 Hours)
    const predictions: PredictionPoint[] = [];
    for (let i = 1; i <= 6; i++) {
       const d = new Date(now.getTime() + i * 4 * 60 * 60 * 1000); // Every 4 hours
       const hour = d.getHours();
       // Simple prediction model based on "Rush Hour" logic
       const predictedFactor = (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 21) ? 1.15 : 0.85;
       
       predictions.push({
         timeLabel: `${hour}:00`,
         aqi: Math.round(currentAQI * predictedFactor),
         confidence: 85 - (i * 5) // Confidence drops over time
       });
    }

    // Stats
    const aqiValues = history.map(h => h.aqi);
    const minAQI = Math.min(...aqiValues);
    const maxAQI = Math.max(...aqiValues);
    
    // Determine Worst Pollutant (Simplified logic)
    // In reality, this would compare relative indices
    const worstPollutant = currentAQI > 100 ? 'PM2.5' : 'Ozone';
    
    // Best Hour (Lowest AQI in history)
    const bestPoint = history.reduce((prev, curr) => curr.aqi < prev.aqi ? curr : prev);

    return {
      history,
      predictions,
      minAQI,
      maxAQI,
      worstPollutant,
      bestHour: bestPoint.timestamp
    };
  }
}
