import { useState, useEffect, useMemo } from "react";
import { useField } from "@/context/FieldContext";
import { useWeather } from "@/context/WeatherContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

/* ── Types ── */
export type SmartAlert = {
  id: string;
  category: "weather" | "crop_suggestion" | "schedule" | "input_recommendation" | "season" | "general";
  priority: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  message: string;
  icon: string;
  timestamp: Date;
  is_read: boolean;
  source: "api" | "generated";
};

type ApiAlert = {
  id: number;
  field_id: number | null;
  log: number | null;
  date: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

/* ── Smart Alert Generator ── */
function generateSmartAlerts(
  crop: string | undefined,
  weather: any,
  forecast: any[],
): SmartAlert[] {
  const now = new Date();
  const month = now.getMonth();
  const hour = now.getHours();
  const alerts: SmartAlert[] = [];

  const mkId = (category: string, title: string) => {
    // Include season or month context to ensure seasonal messages refresh correctly
    const seasonContext = category === "season" ? `_${month}` : "";
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
    return `smart_${category}${seasonContext}_${slug}`;
  };

  // ─── WEATHER ───
  if (weather) {
    const temp = typeof weather.temp === "number" ? weather.temp : parseFloat(weather.temp);
    const condition = (weather.condition || "").toLowerCase();
    const humidity = weather.humidity || 0;
    const wind = weather.wind || 0;

    if (temp > 40) {
      const title = "🔥 Extreme Heat Alert";
      alerts.push({ id: mkId("weather", title), category: "weather", priority: "critical", title, message: `Temperature is ${temp}°C. Severe heat stress risk. Increase irrigation, use mulch, avoid field work 11AM–3PM.`, icon: "local_fire_department", timestamp: now, is_read: false, source: "generated" });
    } else if (temp > 35) {
      const title = "🌡️ Heat Advisory";
      alerts.push({ id: mkId("weather", title), category: "weather", priority: "high", title, message: `Temperature is ${temp}°C. Irrigate early morning (5–7 AM) or late evening to reduce evaporation.`, icon: "thermostat", timestamp: now, is_read: false, source: "generated" });
    }
    if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunder")) {
      const title = "🌧️ Rain Alert — Skip Irrigation";
      alerts.push({ id: mkId("weather", title), category: "weather", priority: "high", title, message: `Current: ${weather.condition}. Skip irrigation today; postpone spraying for 24h.`, icon: "water_drop", timestamp: now, is_read: false, source: "generated" });
    }
    if (wind > 35) {
      const title = "💨 Strong Wind Warning";
      alerts.push({ id: mkId("weather", title), category: "weather", priority: "high", title, message: `Wind ${wind} km/h. Do NOT spray pesticides — secure shade nets & poly houses.`, icon: "air", timestamp: now, is_read: false, source: "generated" });
    }
    if (humidity > 85) {
      const title = "🍄 Fungal Disease Risk";
      alerts.push({ id: mkId("weather", title), category: "weather", priority: "medium", title, message: `Humidity ${humidity}%. Apply preventive fungicide (Mancozeb 2g/L or Carbendazim 1g/L).`, icon: "coronavirus", timestamp: now, is_read: false, source: "generated" });
    }
  }

  if (forecast && forecast.length > 0) {
    const upcomingRain = forecast.find(f => {
      const desc = f.weather?.[0]?.main?.toLowerCase() || "";
      return desc.includes("rain") || desc.includes("thunder");
    });
    if (upcomingRain) {
      const title = "🌦️ Rain Expected in 24h";
      alerts.push({ id: mkId("weather", title), category: "weather", priority: "medium", title, message: `Forecast: "${upcomingRain.weather?.[0]?.description}". Complete harvest/spraying ASAP.`, icon: "cloudy_snowing", timestamp: now, is_read: false, source: "generated" });
    }
  }

  // ─── SEASON ───
  const currentSeason = month >= 5 && month <= 9 ? "Kharif" : month >= 10 || month <= 1 ? "Rabi" : "Zaid";
  const seasonCrops: Record<string, string[]> = {
    Kharif: ["Rice", "Maize", "Cotton", "Soybean", "Groundnut"],
    Rabi: ["Wheat", "Mustard", "Chickpea", "Lentil", "Potato"],
    Zaid: ["Watermelon", "Cucumber", "Moong", "Sunflower"],
  };
  const seasonTitle = `📅 Season: ${currentSeason}`;
  alerts.push({ id: mkId("season", seasonTitle), category: "season", priority: "info", title: seasonTitle, message: `Best crops: ${(seasonCrops[currentSeason] || []).join(", ")}`, icon: "eco", timestamp: new Date(now.getTime() - 60000), is_read: false, source: "generated" });

  // ─── SCHEDULE ───
  if (hour >= 5 && hour <= 7) {
    const title = "💧 Irrigation Time — NOW";
    alerts.push({ id: mkId("schedule", title), category: "schedule", priority: "high", title, message: `Early morning is ideal. ${crop ? `Water your ${crop} now.` : "Irrigate now for best efficiency."}`, icon: "water_drop", timestamp: now, is_read: false, source: "generated" });
  } else if (hour >= 17 && hour <= 19) {
    const title = "💧 Evening Irrigation Window";
    alerts.push({ id: mkId("schedule", title), category: "schedule", priority: "medium", title, message: "If you missed morning, water now. Avoid night to prevent fungus.", icon: "water_drop", timestamp: now, is_read: false, source: "generated" });
  }
  if (hour >= 6 && hour <= 9) {
    const title = "🧪 Spray Window Open";
    alerts.push({ id: mkId("schedule", title), category: "schedule", priority: "low", title, message: "6–9 AM is best for pesticide/herbicide spraying. Wear PPE.", icon: "sanitizer", timestamp: new Date(now.getTime() - 180000), is_read: false, source: "generated" });
  }

  // ─── CROP INPUTS ───
  if (crop) {
    const cropLC = crop.toLowerCase();
    const knownCrops = ["rice", "wheat", "cotton", "maize", "sugarcane"];
    if (knownCrops.includes(cropLC)) {
      const fTitle = `🧪 Fertilizer for ${crop}`;
      alerts.push({ id: mkId("input", fTitle), category: "input_recommendation", priority: "medium", title: fTitle, message: `Apply balanced NPK as basal. Top-dress with Urea after 21 days. See full plan in Alerts page.`, icon: "compost", timestamp: new Date(now.getTime() - 240000), is_read: false, source: "generated" });
      const pTitle = `🐛 Pest Watch for ${crop}`;
      alerts.push({ id: mkId("input", pTitle), category: "input_recommendation", priority: "low", title: pTitle, message: `Monitor regularly. See detailed pesticide guide on the Alerts page.`, icon: "pest_control", timestamp: new Date(now.getTime() - 300000), is_read: false, source: "generated" });
    }
  }

  // ─── GENERAL ───
  const soilTitle = "📊 Soil Test Reminder";
  alerts.push({ id: mkId("general", soilTitle), category: "general", priority: "info", title: soilTitle, message: "Test soil every 6 months. Visit your nearest KVK for free testing.", icon: "science", timestamp: new Date(now.getTime() - 600000), is_read: false, source: "generated" });

  return alerts;
}

/* ── Hook ── */
export function useSmartAlerts() {
  const { token } = useAuth();
  const { selectedField } = useField();
  const { weather, forecast } = useWeather();
  const [apiAlerts, setApiAlerts] = useState<ApiAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("alert_read_ids");
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch { return new Set(); }
  });

  const fetchAlerts = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = selectedField ? `?field_id=${selectedField.id}` : "";
      const data = await apiFetch<ApiAlert[]>(`/field/alerts${params}`);
      setApiAlerts(data);
    } catch (err) { console.error("Failed to fetch alerts:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, [token, selectedField]);

  useEffect(() => {
    localStorage.setItem("alert_read_ids", JSON.stringify(Array.from(readIds)));
  }, [readIds]);

  const smartAlerts = useMemo(() => {
    const crop = selectedField?.cropType;
    return generateSmartAlerts(crop, weather, forecast);
  }, [selectedField, weather, forecast]);

  const allAlerts = useMemo(() => {
    const fromApi: SmartAlert[] = apiAlerts.map(a => ({
      id: `api_${a.id}`,
      category: "general" as const,
      priority: (new Date(a.date) <= new Date() && !a.is_read ? "high" : "medium") as SmartAlert["priority"],
      title: a.message.length > 50 ? a.message.slice(0, 50) + "…" : a.message,
      message: a.message,
      icon: "notifications",
      timestamp: new Date(a.date),
      is_read: a.is_read || readIds.has(`api_${a.id}`),
      source: "api" as const,
    }));

    const combined = [...smartAlerts.map(a => ({ ...a, is_read: readIds.has(a.id) })), ...fromApi];

    const priorityWeight: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return combined.sort((a, b) => {
      if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
      const pw = (priorityWeight[a.priority] || 4) - (priorityWeight[b.priority] || 4);
      if (pw !== 0) return pw;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [smartAlerts, apiAlerts, readIds]);

  const markAsRead = (alertId: string) => {
    setReadIds(prev => { const next = new Set(prev); next.add(alertId); return next; });
    if (alertId.startsWith("api_")) {
      const numId = parseInt(alertId.replace("api_", ""));
      apiFetch(`/field/alerts/${numId}`, { method: "PATCH" }).catch(() => {});
    }
  };

  const markAllAsRead = () => {
    const unreadIds = allAlerts.filter(a => !a.is_read).map(a => a.id);
    setReadIds(prev => { const next = new Set(prev); unreadIds.forEach(id => next.add(id)); return next; });
  };

  const unmarkAsRead = (alertId: string) => {
    setReadIds(prev => { const next = new Set(prev); next.delete(alertId); return next; });
    if (alertId.startsWith("api_")) {
      const numId = parseInt(alertId.replace("api_", ""));
      apiFetch(`/field/alerts/${numId}`, { method: "PATCH", body: JSON.stringify({ is_read: false }) }).catch(() => {});
    }
  };

  const unreadCount = allAlerts.filter(a => !a.is_read).length;
  const criticalCount = allAlerts.filter(a => !a.is_read && (a.priority === "critical" || a.priority === "high")).length;

  return {
    allAlerts,
    loading,
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    unmarkAsRead,
    refetch: fetchAlerts,
  };
}
