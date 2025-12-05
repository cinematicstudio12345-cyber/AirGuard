
import { GeocodeResult } from '../types';

export class GeocodeService {
  async searchCity(query: string): Promise<GeocodeResult[]> {
    if (!query || query.length < 3) return [];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'AirLensApp/1.0'
          }
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      
      return data.map((item: any) => ({
        displayName: item.display_name.split(',')[0], // Simplified name
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        country: item.address?.country || ''
      }));
    } catch (error) {
      console.error("Geocoding failed", error);
      return [];
    }
  }
}
