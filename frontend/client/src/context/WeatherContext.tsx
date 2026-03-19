import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useField } from "./FieldContext";
import { apiFetch } from "@/lib/api";

export interface WeatherCurrent {
  temp: number | string;
  condition: string;
  humidity: number;
  wind: number;
  icon?: string;
}

export interface WeatherForecastItem {
  dt: number;
  main: { temp: number; humidity: number };
  weather: { main: string; description: string; icon: string }[];
  wind: { speed: number };
}

interface WeatherContextValue {
  weather: WeatherCurrent | null;
  forecast: WeatherForecastItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const WeatherContext = createContext<WeatherContextValue>({
  weather: null,
  forecast: [],
  loading: true,
  error: null,
  refetch: () => {},
});

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { selectedField } = useField();
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [forecast, setForecast] = useState<WeatherForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get field coordinates
      let coordEndpoint = "/field/coord";
      if (selectedField) coordEndpoint += `?field_id=${selectedField.id}`;
      
      let coordData = null;
      try {
        coordData = await apiFetch<any>(coordEndpoint);
      } catch (e) {
        console.log("Could not fetch field coordinates, using fallback location.");
      }
      
      const coord = coordData?.coord || coordData?.location || null;

      let lon: number | undefined;
      let lat: number | undefined;

      if (Array.isArray(coord)) {
        [lon, lat] = coord;
      } else if (coord && typeof coord === "object") {
        lon = coord.lon ?? coord.x;
        lat = coord.lat ?? coord.y;
      }

      if (lat === undefined || lon === undefined) {
        // Use browser geolocation as fallback
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 300000, // Cache for 5 min
            });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch {
          // If geolocation also fails, use a sensible default (India center)
          lat = 20.5937;
          lon = 78.9629;
        }
      }

      // Step 2: Fetch weather using resolved coordinates
      const weatherData = await apiFetch<any>(
        `/field/weather?lat=${lat}&lon=${lon}`
      );

      const current = weatherData.current;
      setWeather({
        temp: Math.round(current.main.temp),
        condition: current.weather?.[0]?.main || "Clear",
        humidity: current.main.humidity,
        wind: Math.round(current.wind.speed * 3.6),
        icon: current.weather?.[0]?.icon,
      });
      setForecast(weatherData.forecast?.slice(0, 8) || []);
    } catch (err: any) {
      console.error("WeatherContext fetch error:", err);
      setError(err?.message || "Weather unavailable");
      setWeather({
        temp: "--",
        condition: "Unavailable",
        humidity: 0,
        wind: 0,
      });
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }, [token, selectedField]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return (
    <WeatherContext.Provider
      value={{ weather, forecast, loading, error, refetch: fetchWeather }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  return useContext(WeatherContext);
}
