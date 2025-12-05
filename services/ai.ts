
import { GoogleGenAI } from "@google/genai";
import { HealthCoachResponse, PollutionPlanResponse, PollutionSource, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const chatWithAeroBot = async (history: ChatMessage[], newMessage: string, weatherContext?: any): Promise<string> => {
  try {
    const context = weatherContext 
      ? `Current Context: Location ${weatherContext.location.name}, Temp ${weatherContext.current.temp_c}C, AQI ${weatherContext.current.air_quality["us-epa-index"]}.` 
      : '';

    const systemInstruction = `You are AeroBot, an expert environmental AI assistant. 
    You help users with air quality, weather, health safety, and pollution advice.
    Keep answers concise, friendly, and scientifically accurate.
    ${context}`;

    // Convert history to Gemini format if using a chat session, 
    // but for simple single-turn or manual history management we can just use generateContent for now
    // or use the chat API. Let's use chat API for better context.
    
    // We will just use a direct prompt for simplicity in this stateless example, 
    // but typically you'd map the history.
    const prompt = `
      ${systemInstruction}
      
      User: ${newMessage}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "I'm having trouble connecting to the atmospheric sensors.";
  } catch (error) {
    console.error("AeroBot Error", error);
    return "Connection error. Please try again.";
  }
};

export const generateHealthAdvice = async (
  weather: any, 
  exposure: any
): Promise<HealthCoachResponse | null> => {
  try {
    const prompt = `
      Act as a preventive health coach. Analyze this data:
      Location: ${weather.location.name}
      Current PM2.5: ${weather.current.air_quality.pm2_5}
      Temperature: ${weather.current.temp_c}C
      User exposure (tracked): ${exposure.totalMinutes} mins.
      Cigarette equivalent: ${exposure.cigarettes.toFixed(2)}.
      
      Provide a JSON response with these exact keys:
      {
        "weakness_warning": "Specific body part risk (e.g., lungs, skin, eyes)",
        "breathing_exercise": "A short 1-sentence breathing exercise",
        "immunity_food": "1 specific food recommendation",
        "avoidance_tip": "1 specific behavioral tip"
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json" 
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text) as HealthCoachResponse;
    }
    return null;
  } catch (error) {
    console.error("Health Coach AI Error", error);
    return null;
  }
};

export const generateSafeTime = async (weather: any): Promise<string> => {
  try {
    const prompt = `
      Based on PM2.5 ${weather.current.air_quality.pm2_5} and Temp ${weather.current.temp_c}C in ${weather.location.name},
      how many minutes can a sensitive person stay outdoors? 
      Return ONLY the number (integer). If it's safe all day, return 999.
    `;
    const response = await ai.models.generateContent({ 
      model: MODEL_NAME, 
      contents: prompt 
    });
    return response.text?.trim() || "0";
  } catch (e) {
    return "0";
  }
};

export const generatePollutionPlan = async (weather: any): Promise<PollutionPlanResponse | null> => {
   try {
    const pm25 = weather.current.air_quality.pm2_5;
    const prompt = `
      Generate a pollution shield plan for ${weather.location.name}.
      PM2.5 Level: ${pm25}.
      
      If PM2.5 > 50, mode is "HIGH ALERT", otherwise "SAFE MODE".

      JSON format:
      {
        "best_time": "Time range (e.g., 6AM - 8AM)",
        "best_area": "General type of area (e.g., Near large parks)",
        "protective_plan": "Brief 20 word plan for next 48 hours",
        "mode": "HIGH ALERT" or "SAFE MODE"
      }
    `;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json" 
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text) as PollutionPlanResponse;
    }
    return null;
   } catch (e) {
     console.error("Pollution Plan AI Error", e);
     return null;
   }
}

export const identifyPollutionSources = async (location: string): Promise<PollutionSource[]> => {
  try {
    const prompt = `
      Identify 3 likely pollution sources near ${location} (e.g., specific industrial zones, major highways, power plants).
      If the city is small, invent realistic sounding ones based on typical geography.
      
      Return JSON:
      [
        { "name": "Source Name", "type": "INDUSTRY" or "TRAFFIC" or "NATURAL", "distance": "5km East", "pollutant": "PM2.5/NOx" }
      ]
    `;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    if (response.text) {
      return JSON.parse(response.text) as PollutionSource[];
    }
    return [];
  } catch (e) {
    return [];
  }
}
