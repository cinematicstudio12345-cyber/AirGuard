
import { CitizenAlert, WeatherData } from '../types';

export class AlertService {
  static checkTriggers(weather: WeatherData): CitizenAlert[] {
    const alerts: CitizenAlert[] = [];
    const aq = weather.current.air_quality;
    const now = Date.now();

    // 1. Critical PM2.5
    if (aq.pm2_5 > 150) {
        alerts.push({
            id: `pm25-${now}`,
            title: "Hazardous PM2.5 Spike",
            message: `Fine particulate matter is critically high (${aq.pm2_5}). Immediate health risk.`,
            timestamp: now,
            level: 'CRITICAL',
            source: 'AccurateAQI',
            action: 'Wear N95 Mask immediately'
        });
    }

    // 2. High AQI
    const usIndex = aq["us-epa-index"];
    if (usIndex >= 4) {
         alerts.push({
            id: `aqi-${now}`,
            title: "Unhealthy Air Quality",
            message: "General air quality has deteriorated significantly.",
            timestamp: now,
            level: 'DANGER',
            source: 'WAQI',
            action: 'Avoid outdoor exercise'
         });
    }

    // 3. Weather Based
    if (weather.current.wind_kph < 5 && usIndex > 3) {
        alerts.push({
            id: `stag-${now}`,
            title: "Stagnant Air Warning",
            message: "Low wind speed is trapping pollutants.",
            timestamp: now,
            level: 'WARNING',
            source: 'WeatherAPI',
            action: 'Run air purifiers indoors'
        });
    }

    return alerts;
  }
}
