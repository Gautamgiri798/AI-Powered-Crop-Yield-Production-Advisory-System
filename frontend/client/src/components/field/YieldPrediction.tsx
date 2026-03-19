"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useField } from "@/context/FieldContext";
import { apiFetch } from "@/lib/api";
import { PredictionData } from "@/types/field";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

/* ── Helpers ── */
const formatYield = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(1)}t` : `${value}kg`;

const confidenceLabel = (c: number) =>
  c >= 80 ? "Very High" : c >= 60 ? "High" : c >= 40 ? "Medium" : "Low";

const confidenceColor = (c: number) =>
  c >= 80 ? "text-emerald-400" : c >= 60 ? "text-blue-400" : c >= 40 ? "text-amber-400" : "text-red-400";

const confidenceRing = (c: number) =>
  c >= 80 ? "text-emerald-500" : c >= 60 ? "text-blue-500" : c >= 40 ? "text-amber-500" : "text-red-500";

export function YieldPrediction() {
  const { selectedField } = useField();
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedField) fetchPrediction();
  }, [selectedField]);

  const fetchPrediction = async () => {
    if (!selectedField) return;
    setLoading(true);
    try {
      const data = await apiFetch<PredictionData>(`/field/yield-prediction?field_id=${selectedField.id}`);
      setPrediction(data);
    } catch (error) { console.error("Failed to fetch yield prediction:", error); }
    finally { setLoading(false); }
  };

  /* ── Empty State ── */
  if (!selectedField) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-500">
        <div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-4xl text-emerald-400">target</span>
        </div>
        <h2 className="text-lg font-semibold mb-1">No Field Selected</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Select a field from "My Field" to view AI-powered yield predictions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-8">

      {/* ══════ Header ══════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <span className="material-symbols-outlined text-white text-lg sm:text-xl">analytics</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">Yield Prediction</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="truncate">For {selectedField.name}</span>
              {prediction?.crop_type && (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] sm:text-[10px] font-bold uppercase shrink-0">
                  {prediction.crop_type}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={fetchPrediction}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border bg-card hover:bg-muted/50 text-sm font-medium transition-all hover:shadow-sm active:scale-[0.97]"
        >
          <span className={cn("material-symbols-outlined text-base", loading && "animate-spin")}>
            {loading ? "progress_activity" : "refresh"}
          </span>
          {loading ? "Analyzing…" : "Refresh"}
        </button>
      </div>

      {/* ══════ Loading Skeleton ══════ */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-56 bg-muted/50 animate-pulse rounded-xl" />
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted/50 animate-pulse rounded-xl" />)}
          </div>
        </div>
      ) : prediction ? (
        <>
          {/* ══════ Hero Prediction Card ══════ */}
          <Card className="overflow-hidden relative border-emerald-500/15">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-teal-500/[0.03] pointer-events-none" />
            <CardContent className="p-5 sm:p-7 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

                {/* ── Predicted Yield ── */}
                <div className="text-center md:text-left space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 w-fit px-2 py-0.5 rounded-md mx-auto md:mx-0">
                    Predicted Yield
                  </p>
                  <div className="flex flex-col md:items-start items-center">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent tracking-tight">
                        {formatYield(prediction.prediction.yield_per_hectare)}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground font-bold">/ha</span>
                    </div>
                    <div className="mt-4 flex gap-4 md:flex-col md:gap-1.5 items-center md:items-start">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-base">inventory_2</span>
                        <span>Total: <span className="text-foreground font-bold">{formatYield(prediction.prediction.total_yield)}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-base">square_foot</span>
                        <span>Area: <span className="text-foreground font-bold">{prediction.field_area_hectares} ha</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Confidence Gauge ── */}
                <div className="flex flex-col items-center py-4 md:py-2 border-y md:border-y-0 md:border-x border-border/10">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 bg-muted/30 w-fit px-2 py-0.5 rounded-md">
                    Confidence
                  </p>
                  <div className="relative size-28 sm:size-32">
                    <svg className="size-full transform -rotate-90" viewBox="0 0 128 128">
                      {/* Background ring */}
                      <circle cx="64" cy="64" r="54" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" opacity="0.1" />
                      {/* Progress ring */}
                      <circle
                        cx="64" cy="64" r="54" fill="none"
                        strokeWidth="10" strokeLinecap="round"
                        className={cn("transition-all duration-1000 ease-out", confidenceRing(prediction.prediction.confidence))}
                        stroke="currentColor"
                        strokeDasharray={`${prediction.prediction.confidence * 3.39} 339`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-black">{prediction.prediction.confidence}%</span>
                      <span className={cn("text-[9px] sm:text-[10px] font-bold mt-0.5", confidenceColor(prediction.prediction.confidence))}>
                        {confidenceLabel(prediction.prediction.confidence)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground mt-3">
                    Range: {formatYield(prediction.prediction.range.low)} – {formatYield(prediction.prediction.range.high)}
                  </p>
                </div>

                {/* ── Regional Comparison ── */}
                <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-3 pt-4 md:pt-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 w-fit px-2 py-0.5 rounded-md">
                    vs Regional
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={cn(
                      "text-3xl sm:text-4xl font-black tracking-tight",
                      prediction.comparison.vs_regional >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {prediction.comparison.vs_regional >= 0 ? '+' : ''}{prediction.comparison.vs_regional}%
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "material-symbols-outlined text-base sm:text-lg transition-all",
                          i < prediction.comparison.rating.stars ? 'text-amber-400' : 'text-muted/20'
                        )}
                        style={{ fontVariationSettings: i < prediction.comparison.rating.stars ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className={cn(
                    "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
                    prediction.comparison.vs_regional >= 0
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  )}>
                    {prediction.comparison.rating.rating}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ══════ Stats Grid ══════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Current NDVI",
                value: prediction.ndvi.current.toString(),
                icon: "grass",
                iconBg: "bg-emerald-500/10",
                iconColor: "text-emerald-500",
                sub: prediction.ndvi.trend,
                trendIcon: prediction.ndvi.trend === 'increasing' ? 'trending_up' : prediction.ndvi.trend === 'decreasing' ? 'trending_down' : 'trending_flat',
                trendColor: prediction.ndvi.trend === 'increasing' ? 'text-emerald-500' : prediction.ndvi.trend === 'decreasing' ? 'text-red-500' : 'text-muted-foreground',
              },
              {
                label: "Crop Health",
                value: prediction.ndvi.status.status,
                icon: prediction.ndvi.status.icon,
                isEmoji: true,
                iconBg: "bg-blue-500/10",
                iconColor: "text-blue-500",
              },
              {
                label: "Regional Avg",
                value: formatYield(prediction.comparison.regional_average),
                icon: "bar_chart",
                iconBg: "bg-cyan-500/10",
                iconColor: "text-cyan-500",
                sub: "Per Hectare",
              },
              {
                label: "Crop Type",
                value: prediction.crop_type,
                icon: "eco",
                iconBg: "bg-amber-500/10",
                iconColor: "text-amber-500",
              },
            ].map((stat, i) => (
              <Card key={i} className="overflow-hidden relative group transition-all duration-300 border-white/5 bg-white/5 rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <CardContent className="p-3.5 sm:p-5 relative z-10">
                  <div className="flex justify-between items-start mb-2.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                    <div className={cn("size-8 sm:size-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform", stat.iconBg)}>
                      {stat.isEmoji ? (
                        <span className="text-base sm:text-lg">{stat.icon}</span>
                      ) : (
                        <span className={cn("material-symbols-outlined text-base sm:text-lg", stat.iconColor)}>{stat.icon}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-lg sm:text-xl font-black truncate text-white">{stat.value}</p>
                  {stat.sub && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {stat.trendIcon && (
                        <span className={cn("material-symbols-outlined text-xs", stat.trendColor)}>
                          {stat.trendIcon}
                        </span>
                      )}
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{stat.sub}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ══════ NDVI Chart + AI Insights ══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* ── NDVI Growth Trend (Premium) ── */}
            <Card className="lg:col-span-3 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-teal-500/[0.02] pointer-events-none" />
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-4 sm:px-5 py-3 border-b relative z-10">
                <div className="size-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <span className="material-symbols-outlined text-white text-sm">show_chart</span>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xs sm:text-sm truncate">NDVI Growth Trend</CardTitle>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Vegetation index — 12 weeks</p>
                </div>
                {/* Live stat pills */}
                {prediction.ndvi.time_series.length > 0 && (() => {
                  const values = prediction.ndvi.time_series.map(d => d.ndvi);
                  const current = values[values.length - 1];
                  return (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 h-7 overflow-hidden">
                        <div className="size-1 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="text-[10px] font-bold text-emerald-400 leading-none">{current.toFixed(2)}</span>
                        <span className="text-[8px] font-black text-emerald-400/60 leading-none hidden xs:inline">NOW</span>
                      </div>
                    </div>
                  );
                })()}
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-4 sm:pt-5 relative z-10">
                <div className="h-[240px] sm:h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prediction.ndvi.time_series} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                      <defs>
                        {/* Multi-stop gradient for premium look */}
                        <linearGradient id="ndviAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.40} />
                          <stop offset="40%" stopColor="#14b8a6" stopOpacity={0.20} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                        {/* Glow filter for stroke */}
                        <filter id="ndviGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        {/* Line gradient */}
                        <linearGradient id="ndviStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                        opacity={0.12}
                      />

                      {/* Healthy threshold reference line */}
                      <ReferenceLine
                        y={0.5}
                        stroke="#f59e0b"
                        strokeDasharray="6 4"
                        strokeWidth={1}
                        opacity={0.4}
                        label={{
                          value: "Healthy",
                          position: "right",
                          fill: "#f59e0b",
                          fontSize: 9,
                          fontWeight: 600,
                          opacity: 0.6
                        }}
                      />

                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.55)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(_value, index) => `W${index + 1}`}
                        interval={1}
                      />
                      <YAxis
                        domain={[0, 1]}
                        ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.55)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => v.toFixed(1)}
                      />
                      <Tooltip
                        cursor={false}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.[0]) return null;
                          const val = payload[0].value as number;
                          const health = val >= 0.7 ? { label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500" }
                            : val >= 0.5 ? { label: "Good", color: "text-blue-400", bg: "bg-blue-500" }
                            : val >= 0.3 ? { label: "Fair", color: "text-amber-400", bg: "bg-amber-500" }
                            : { label: "Poor", color: "text-red-400", bg: "bg-red-500" };
                          return (
                            <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl px-4 py-3 shadow-xl shadow-black/20 min-w-[160px]">
                              <p className="text-[10px] text-muted-foreground font-medium mb-2">{label}</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold">{val.toFixed(3)}</span>
                                <span className={cn("text-[10px] font-bold", health.color)}>{health.label}</span>
                              </div>
                              <div className="mt-2 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full transition-all", health.bg)}
                                  style={{ width: `${val * 100}%` }}
                                />
                              </div>
                            </div>
                          );
                        }}
                      />

                      {/* Glow layer (behind) */}
                      <Area
                        type="monotone"
                        dataKey="ndvi"
                        stroke="#10b981"
                        strokeWidth={6}
                        strokeOpacity={0.15}
                        fill="none"
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                      />

                      {/* Main area */}
                      <Area
                        type="monotone"
                        dataKey="ndvi"
                        stroke="url(#ndviStrokeGradient)"
                        strokeWidth={2.5}
                        fill="url(#ndviAreaGradient)"
                        dot={({ cx, cy, index }: { cx: number; cy: number; index: number }) => {
                          const isLast = index === prediction.ndvi.time_series.length - 1;
                          return isLast ? (
                            <g key={`dot-${index}`}>
                              <circle cx={cx} cy={cy} r={8} fill="#10b981" opacity={0.15}>
                                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
                              </circle>
                              <circle cx={cx} cy={cy} r={4} fill="#10b981" stroke="#0d9668" strokeWidth={1.5} />
                            </g>
                          ) : (
                            <circle key={`dot-${index}`} cx={cx} cy={cy} r={2.5} fill="#10b981" opacity={0.5} />
                          );
                        }}
                        activeDot={({ cx, cy }: { cx: number; cy: number }) => (
                          <g>
                            <circle cx={cx} cy={cy} r={8} fill="#10b981" opacity={0.15} />
                            <circle cx={cx} cy={cy} r={5} fill="#10b981" stroke="#fff" strokeWidth={2} />
                          </g>
                        )}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend bar */}
                <div className="flex items-center justify-center gap-5 mt-3 pt-3 border-t border-border/20">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
                    <span className="text-[10px] text-muted-foreground">NDVI Value</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-px border-t-2 border-dashed border-amber-500/50" />
                    <span className="text-[10px] text-muted-foreground">Healthy Threshold (0.5)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">Current</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── AI Insights ── */}
            <Card className="lg:col-span-2 overflow-hidden relative flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent pointer-events-none" />
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-5 py-3 border-b relative z-10">
                <div className="size-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-500 text-sm">lightbulb</span>
                </div>
                <div>
                  <CardTitle className="text-sm">AI Insights</CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{prediction.recommendations.length} recommendations</p>
                </div>
              </CardHeader>
              <CardContent className="p-3 flex-1 overflow-y-auto custom-scrollbar relative z-10">
                <div className="space-y-2">
                  {prediction.recommendations.map((rec, idx) => {
                    const isWarning = rec.type === 'warning';
                    const isPositive = rec.type === 'positive';
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 rounded-xl border flex gap-3 transition-all hover:shadow-md group",
                          isWarning ? "bg-amber-500/[0.04] border-amber-500/15 hover:border-amber-500/30" :
                          isPositive ? "bg-emerald-500/[0.04] border-emerald-500/15 hover:border-emerald-500/30" :
                          "bg-blue-500/[0.04] border-blue-500/15 hover:border-blue-500/30"
                        )}
                      >
                        <div className={cn(
                          "size-8 rounded-lg shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform",
                          isWarning ? "bg-amber-500/10 text-amber-400" :
                          isPositive ? "bg-emerald-500/10 text-emerald-400" :
                          "bg-blue-500/10 text-blue-400"
                        )}>
                          <span className="material-symbols-outlined text-base">
                            {isWarning ? 'warning' : isPositive ? 'check_circle' : 'info'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-relaxed">{rec.text}</p>
                          <span className={cn(
                            "inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize",
                            isWarning ? "bg-amber-500/10 text-amber-400" :
                            isPositive ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-blue-500/10 text-blue-400"
                          )}>
                            {rec.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {prediction.recommendations.length === 0 && (
                    <div className="text-center py-10">
                      <div className="size-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-xl text-emerald-400">check_circle</span>
                      </div>
                      <p className="text-sm font-medium">All Clear</p>
                      <p className="text-xs text-muted-foreground mt-1">No issues detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ══════ Yield Factors Breakdown ══════ */}
          <Card className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-5 py-3 border-b relative z-10">
              <div className="size-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-cyan-500 text-sm">tune</span>
              </div>
              <CardTitle className="text-sm">Yield Factor Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-5 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Base Yield",
                    value: formatYield(prediction.factors.base_yield),
                    desc: "Historical average for crop",
                    icon: "agriculture",
                    color: "emerald",
                    barWidth: 60,
                  },
                  {
                    label: "NDVI Impact",
                    value: `${prediction.factors.ndvi_impact >= 0 ? '+' : ''}${(prediction.factors.ndvi_impact * 100).toFixed(0)}%`,
                    desc: "Vegetation health adjustment",
                    icon: "grass",
                    color: prediction.factors.ndvi_impact >= 0 ? "blue" : "red",
                    barWidth: Math.min(100, Math.abs(prediction.factors.ndvi_impact * 100) + 50),
                  },
                  {
                    label: "Trend Impact",
                    value: `${prediction.factors.trend_impact >= 0 ? '+' : ''}${(prediction.factors.trend_impact * 100).toFixed(0)}%`,
                    desc: "Growth trajectory adjustment",
                    icon: "trending_up",
                    color: prediction.factors.trend_impact >= 0 ? "cyan" : "amber",
                    barWidth: Math.min(100, Math.abs(prediction.factors.trend_impact * 100) + 50),
                  },
                ].map((f, i) => (
                  <div key={i} className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className={cn(
                        "size-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                        f.color === 'emerald' ? 'bg-emerald-500/10' :
                        f.color === 'blue' ? 'bg-blue-500/10' :
                        f.color === 'cyan' ? 'bg-cyan-500/10' :
                        f.color === 'amber' ? 'bg-amber-500/10' : 'bg-red-500/10'
                      )}>
                        <span className={cn(
                          "material-symbols-outlined text-sm",
                          f.color === 'emerald' ? 'text-emerald-500' :
                          f.color === 'blue' ? 'text-blue-500' :
                          f.color === 'cyan' ? 'text-cyan-500' :
                          f.color === 'amber' ? 'text-amber-500' : 'text-red-500'
                        )}>{f.icon}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{f.label}</span>
                    </div>
                    <p className="text-lg sm:text-xl font-black mb-1.5 text-white">{f.value}</p>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2 shadow-inner">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          f.color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                          f.color === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                          f.color === 'cyan' ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' :
                          f.color === 'amber' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                        )}
                        style={{ width: `${f.barWidth}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">{f.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* ── Error / No Data State ── */
        <Card className="overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] to-transparent pointer-events-none" />
          <CardContent className="py-16 text-center relative z-10">
            <div className="size-14 mx-auto rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl text-red-400">error</span>
            </div>
            <h3 className="text-base font-semibold mb-1">Analysis Unavailable</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
              We couldn't generate the yield prediction. Check your connection or try again.
            </p>
            <button
              onClick={fetchPrediction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border hover:bg-muted/50 text-sm font-medium transition-all"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
