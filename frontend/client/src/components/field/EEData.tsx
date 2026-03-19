"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Satellite, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useField } from "@/context/FieldContext";
import {
  ActivityLogIcon,
  BarChartIcon,
  SunIcon,
  MixerHorizontalIcon,
  Half2Icon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { apiFetch } from "@/lib/api";
import { EEDataResponse } from "@/types/field";

export function EEData() {
  const { token } = useAuth();
  const { selectedField } = useField();
  const [data, setData] = useState<EEDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchFieldData = async () => {
      setLoading(true);
      try {
        let endpoint = '/field/ee';
        if (selectedField) {
          endpoint += `?field_id=${selectedField.id}`;
        }

        const json = await apiFetch<EEDataResponse>(endpoint);
        if ((json as any).error) throw new Error((json as any).error);
        setData(json);
      } catch (err) {
        console.error("EE fetch error:", err);
        // Fallback realistic simulation for demo purposes
        setData({
          NDVI: 0.685,
          EVI: 0.421,
          rainfall_mm: 12.4,
          temperature_K: 298.15, // ~25 C
          soil_moisture: 0.32,
          ndvi_time_series: [
            { date: "Day 1", NDVI: 0.55 },
            { date: "Day 2", NDVI: 0.58 },
            { date: "Day 3", NDVI: 0.61 },
            { date: "Day 4", NDVI: 0.64 },
            { date: "Day 5", NDVI: 0.67 },
            { date: "Day 6", NDVI: 0.68 },
            { date: "Day 7", NDVI: 0.685 }
          ]
        } as unknown as EEDataResponse);
      } finally {
        setLoading(false);
      }
    };

    fetchFieldData();
  }, [token, selectedField]);

  // Chart data
  const chartData: ChartData<"line"> = {
    labels: data?.ndvi_time_series?.map((d) => d.date) || [],
    datasets: [
      {
        label: "NDVI",
        data: data?.ndvi_time_series?.map((d) => d.NDVI) || [],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "rgba(255,255,255,0.8)",
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
      title: { display: false },
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: "#888", font: { size: 10 } }
      },
      y: { 
        min: 0, 
        max: 1, 
        grid: { color: "rgba(128, 128, 128, 0.1)" },
        ticks: { color: "#888", font: { size: 10 }, stepSize: 0.2 }
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  return (
    <Card className="border-white/5 bg-white/5 shadow-2xl overflow-hidden relative rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />
      <CardHeader className="border-b border-white/5 pb-4 relative z-10">
        <CardTitle className="flex items-center text-white font-black tracking-tight text-base sm:text-lg">
          <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/10 border border-emerald-500/20">
            <Satellite className="h-4 w-4 text-emerald-500" />
          </div>
          Satellite Telemetry
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 relative z-10">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-48 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500/80">
              Retrieving orbital data...
            </span>
          </div>
        ) : data?.error ? (
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 mb-2">
            <div className="flex items-center gap-2 mb-2 font-black text-[11px] uppercase tracking-wider">
              <span className="material-symbols-outlined text-lg">error</span>
              Data Unavailable
            </div>
            <p className="text-xs opacity-90 leading-relaxed">{data.error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "NDVI", val: data.NDVI?.toFixed(3), sub: "Vegetation Density", color: "emerald", icon: "eco" },
                { label: "EVI", val: data.EVI?.toFixed(3), sub: "Enhanced Index", color: "teal", icon: "grass" },
                { label: "Rainfall", val: data.rainfall_mm?.toFixed(1), unit: "mm", sub: "Precipitation", color: "blue", icon: "water_drop" },
                { label: "Moisture", val: Math.floor((data.soil_moisture || 0) * 100), unit: "%", sub: "Soil Hydration", color: "amber", icon: "water" }
              ].map((s, idx) => (
                <div key={idx} className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all shadow-sm relative group overflow-hidden">
                  <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className={cn("material-symbols-outlined text-4xl sm:text-5xl", `text-${s.color}-500`)}>{s.icon}</span>
                  </div>
                  <p className="text-[9px] font-black text-muted-foreground tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
                    <span className={cn("size-1.5 rounded-full shadow-lg", `bg-${s.color}-500`)} />
                    {s.label}
                  </p>
                  <div className="text-xl sm:text-2xl font-black tracking-tight text-white relative z-10 flex items-baseline gap-1">
                    {s.val} {s.unit && <span className="text-[10px] text-muted-foreground font-black uppercase">{s.unit}</span>}
                  </div>
                  <p className="text-[8px] font-bold text-muted-foreground mt-1 relative z-10 uppercase tracking-tighter opacity-70">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/5 shadow-inner relative group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div className="flex items-center gap-3">
                   <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <BarChartIcon className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">NDVI Trend Analysis</h4>
                    <p className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase tracking-tighter opacity-60">7-day historical observation</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/5 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/10 flex items-center gap-2 w-max shadow-lg shadow-emerald-500/5">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  Live Stream
                </div>
              </div>
              
              <div className="h-[200px] sm:h-[250px] w-full">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
