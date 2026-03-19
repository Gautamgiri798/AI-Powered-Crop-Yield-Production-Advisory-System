"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { useField } from "@/context/FieldContext";
import { EEData } from "./EEData";
import MapView from "./MapView";
import { apiFetch } from "@/lib/api";
import { HealthScoreResponse } from "@/types/field";
import { cn } from "@/lib/utils";
import { useWeather } from "@/context/WeatherContext";

// Stat Card Component
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = "text-primary"
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
}) => (
  <Card className="overflow-hidden border-white/5 bg-white/5 shadow-none transition-all hover:bg-white/10">
    <CardContent className="p-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate mb-1">{title}</p>
          <p className="text-lg sm:text-2xl font-black tabular-nums tracking-tight text-white truncate">{value}</p>
          {subtitle && (
            <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground mt-1 truncate uppercase tracking-tight">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn("size-8 sm:size-10 rounded-lg flex items-center justify-center shrink-0", iconColor, "bg-white/5")}>
          <span className="material-symbols-outlined text-base sm:text-lg">{icon}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function FieldReport() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { selectedField } = useField();

  const { weather, forecast, loading: isLoadingWeather } = useWeather();

  const [healthData, setHealthData] = useState<HealthScoreResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Soil State
  type SoilInputs = { N: string; P: string; K: string; pH: string; };
  const [soilInputs, setSoilInputs] = useState<SoilInputs>({ N: "120", P: "45", K: "180", pH: "6.8" });
  const [soilSubmitted, setSoilSubmitted] = useState(true);

  type SoilAdviceData = {
    overall_status: string;
    recommendations: string[];
    fertilizer_suggestion: string | null;
    timing: string | null;
    caution: string | null;
  };
  const [aiSoilAdvice, setAiSoilAdvice] = useState<SoilAdviceData | null>(null);
  const [loadingSoilAdvice, setLoadingSoilAdvice] = useState(false);

  const handleSoilSubmit = async () => {
    setSoilSubmitted(true);
    setLoadingSoilAdvice(true);
    try {
      const response = await apiFetch<{ advice: SoilAdviceData }>('/field/soil-advice', {
        method: 'POST',
        body: JSON.stringify({
          N: parseFloat(soilInputs.N) || 0,
          P: parseFloat(soilInputs.P) || 0,
          K: parseFloat(soilInputs.K) || 0,
          pH: parseFloat(soilInputs.pH) || 7.0,
        }),
      });
      setAiSoilAdvice(response.advice);
    } catch (err) {
      console.error("Soil advice fetch error:", err);
    } finally {
      setLoadingSoilAdvice(false);
    }
  };

  // Fetch Health
  useEffect(() => {
    const fetchHealth = async () => {
      if (!token) return;
      setLoadingHealth(true);
      try {
        let endpoint = '/field/healthscore';
        if (selectedField) endpoint += `?field_id=${selectedField.id}`;
        const data = await apiFetch<HealthScoreResponse>(endpoint);
        setHealthData(data);
      } catch (err) { console.error(err); }
      finally { setLoadingHealth(false); }
    };
    fetchHealth();
  }, [token, selectedField]);

  const handlePDFDownload = () => { window.print(); };

  const [activeLayer, setActiveLayer] = useState<"satellite" | "street" | "ndvi">("street");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 sm:size-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="material-symbols-outlined text-white text-xl sm:text-2xl">description</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Field Report</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {selectedField ? selectedField.name : "All Fields Analysis"}
            </p>
          </div>
        </div>
        <Button 
          onClick={handlePDFDownload} 
          className="w-full sm:w-auto gap-2 bg-white/10 hover:bg-primary hover:text-primary-foreground text-white border-white/5 shadow-xl backdrop-blur-md rounded-xl h-11 transition-all duration-300 print:hidden"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Export PDF
        </Button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Area"
          value={selectedField?.area ? `${selectedField.area} Ac` : "24.5 Ac"}
          icon="straighten"
        />
        <StatCard
          title="Crop Health"
          value={healthData ? `${healthData.score_percent}%` : "87%"}
          subtitle={healthData?.rating || "Good"}
          icon="monitoring"
          iconColor="text-primary"
        />
        <StatCard
          title="Active Alerts"
          value="2"
          subtitle="1 High Priority"
          icon="notifications_active"
          iconColor="text-amber-500"
        />
        <StatCard
          title="Days to Harvest"
          value="15"
          subtitle="Wheat (Rabi)"
          icon="calendar_today"
          iconColor="text-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column - Map & Analysis */}
        <div className="lg:col-span-8 space-y-5">
          {/* Field Map */}
          <Card className="h-80 sm:h-[500px] overflow-hidden relative border-white/5 bg-white/5 rounded-2xl shadow-xl">
            {/* Map Header */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">analytics</span>
                </div>
                <p className="text-[10px] font-black text-white uppercase tracking-[0.1em]">Geo-Spatial Engine</p>
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">Live Telemetry</span>
              </div>
            </div>

            <div className="absolute inset-0 z-0 scale-[1.01]">
              <MapView 
                readOnly={true} 
                mapType={activeLayer === "satellite" || activeLayer === "ndvi" ? "satellite" : "street"}
                showNDVI={true}
                onNDVIToggle={() => setActiveLayer(activeLayer === "ndvi" ? "satellite" : "ndvi")}
                isNDVIActive={activeLayer === "ndvi"}
                setMapType={(type) => setActiveLayer(type as any)}
              />
              {activeLayer === "ndvi" && (
                <div className="absolute inset-0 z-10 bg-[radial-gradient(circle,rgba(34,197,94,0.1)_0%,rgba(0,0,0,0)_100%)] pointer-events-none" />
              )}
            </div>
          </Card>

          {/* AI Analysis Card */}
          <Card className="border-white/5 bg-white/5 rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <span className="material-symbols-outlined text-xl">psychology</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">AI Crop Analysis</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Powered by satellite imagery & ML models</p>
                </div>
              </div>

              <div className="flex flex-col md:grid md:grid-cols-3 gap-6 items-center text-center md:text-left">
                {/* Health Score */}
                <div className="flex items-center justify-center shrink-0 w-full md:w-auto">
                  <div className="relative size-28 sm:size-32">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/5" />
                      <circle
                        cx="18" cy="18" r="15.9155" fill="none" strokeWidth="2.5" strokeDasharray={`${healthData?.score_percent || 87}, 100`}
                        strokeLinecap="round" className="text-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        stroke="currentColor"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl sm:text-3xl font-black text-white">{healthData?.score_percent || 87}%</span>
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-0.5">Health</span>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className="md:col-span-2 flex flex-col justify-center space-y-3 w-full">
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 group hover:bg-emerald-500/10 transition-colors">
                    <div className="flex items-start gap-3 text-left">
                      <div className="size-6 rounded-lg bg-emerald-500/20 flex items-center justify-center mt-0.5 shrink-0">
                        <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] sm:text-xs font-black text-emerald-400 uppercase tracking-wide">Vegetation index stable</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Optimal growth patterns detected across main sectors.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 group hover:bg-amber-500/10 transition-colors">
                    <div className="flex items-start gap-3 text-left">
                      <div className="size-6 rounded-lg bg-amber-500/20 flex items-center justify-center mt-0.5 shrink-0">
                        <span className="material-symbols-outlined text-amber-400 text-sm">water_drop</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] sm:text-xs font-black text-amber-400 uppercase tracking-wide">Moisture Alert: Zone B</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Targeted irrigation recommended within 48 hours.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Widgets */}
        <div className="lg:col-span-4 space-y-6">
          {/* Weather Card */}
          <Card className="overflow-hidden border-white/5 bg-white/5 rounded-2xl relative shadow-2xl group transition-all duration-500 hover:bg-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Current Weather</p>
                  <p className="text-3xl sm:text-4xl font-black mt-1 tabular-nums tracking-tighter">
                    {weather?.temp ? `${weather.temp}°C` : "--°C"}
                  </p>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined text-4xl sm:text-5xl text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)] animate-pulse">wb_sunny</span>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-tighter">
                  <span className="material-symbols-outlined text-[14px]">water_drop</span>
                  {weather?.humidity || 0}%
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-tighter">
                  <span className="material-symbols-outlined text-[14px]">air</span>
                  {weather?.wind ? `${weather.wind} km/h` : "-- km/h"}
                </div>
              </div>
            </div>
            <CardContent className="p-4 space-y-2.5 relative z-10">
              {forecast.slice(0, 4).map((f, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 group/item transition-colors">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover/item:text-white transition-colors">
                    {new Date(f.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs font-black text-white bg-white/5 px-2 py-0.5 rounded-md tabular-nums">{Math.round(f.main.temp)}°C</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Soil Health Card */}
          <Card className="border-white/5 bg-white/5 rounded-2xl relative shadow-2xl transition-all duration-300 hover:bg-white/10">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                  <span className="material-symbols-outlined text-lg">science</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Soil Nutrients</h3>
                  <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Live Composition</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Nitrogen (N)", value: soilInputs.N, color: "bg-indigo-500", percent: Math.min(+soilInputs.N / 2, 100) },
                  { label: "Phosphorus (P)", value: soilInputs.P, color: "bg-orange-500", percent: Math.min(+soilInputs.P, 100) },
                  { label: "Potassium (K)", value: soilInputs.K, color: "bg-purple-500", percent: Math.min(+soilInputs.K / 2, 100) },
                ].map((n, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground">{n.label}</span>
                      <span className="text-white tabular-nums">{n.value} <span className="text-muted-foreground/50 text-[8px]">mg/kg</span></span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                      <div className={cn("h-full rounded-full transition-all duration-1000", n.color)} style={{ width: `${n.percent}%` }}></div>
                    </div>
                  </div>
                ))}
                
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">pH Balance</span>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-black text-white tabular-nums">{soilInputs.pH}</span>
                  </div>
                </div>
              </div>
              {aiSoilAdvice?.overall_status && (
                <div className="mt-5 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] sm:text-xs text-indigo-300 font-medium leading-relaxed italic">
                  "{aiSoilAdvice.overall_status}"
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EE Data Stats full width row */}
      <EEData />
    </div>
  );
}
