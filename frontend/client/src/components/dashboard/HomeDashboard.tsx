"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/context/AuthContext";
import { useField } from "@/context/FieldContext";
import {
  Sprout,
  Plus,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Download,
  Activity,
  Leaf,
  BarChart3,
  Wheat,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { HealthScoreResponse, PredictionData } from "@/types/field";
import { WeatherWidget } from "./WeatherWidget";
import { useWeather } from "@/context/WeatherContext";
import { HealthGauge } from "./HealthGauge";
import { cn } from "@/lib/utils";

interface MarketData {
  crops_summary:
    | {
        crop: string;
        modal_price: number;
        change: number;
        trend: string;
      }[]
    | null;
}

// Time‑based greeting
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export function HomeDashboard({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  // const { t } = useTranslation(); // TODO: re-add i18n later
  const { user, token } = useAuth();
  const { selectedField, setSelectedField, fields, healthData, setHealthData, predictionData, setPredictionData } = useField();
  const { weather } = useWeather();
  const [marketPrices, setMarketPrices] = useState<any[]>([]);

  useEffect(() => {
    const fetchHealth = async () => {
      if (!token || healthData) return;
      try {
        let endpoint = "/field/healthscore";
        if (selectedField) endpoint += `?field_id=${selectedField.id}`;
        const data = await apiFetch<HealthScoreResponse>(endpoint);
        setHealthData(data);
      } catch {
        setHealthData(null);
      }
    };
    fetchHealth();
  }, [selectedField, token, healthData]);

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!token || !selectedField || predictionData) return;
      try {
        const data = await apiFetch<PredictionData>(
          `/field/yield-prediction?field_id=${selectedField.id}`,
        );
        setPredictionData(data);
      } catch {
        setPredictionData(null);
      }
    };
    fetchPrediction();
  }, [selectedField, token, predictionData]);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const data = await apiFetch<MarketData>(
          "/finance/market-prices?state=Punjab",
        );
        if (data?.crops_summary) {
          setMarketPrices(
            data.crops_summary.slice(0, 4).map((c) => ({
              commodity: c.crop,
              price: c.modal_price,
              change: c.change,
              changeLabel: `${c.change >= 0 ? "+" : ""}${c.change}%`,
              trend: c.trend,
            })),
          );
        }
      } catch {
        /* silent */
      }
    };
    fetchMarket();
  }, []);

  const handleExportPDF = () => { window.print(); };

  /* ---------- Quick stats derived from data ---------- */
  const quickStats = useMemo(
    () => [
      {
        label: "Crop Health",
        value: healthData ? `${healthData.score_percent}%` : "--",
        icon: <Activity className="h-4 w-4" />,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
      },
      {
        label: "Active Fields",
        value: fields.length.toString(),
        icon: <Leaf className="h-4 w-4" />,
        color: "text-sky-500",
        bgColor: "bg-sky-500/10",
      },
      {
        label: "NDVI Index",
        value: predictionData?.ndvi?.current?.toFixed(2) ?? "--",
        icon: <BarChart3 className="h-4 w-4" />,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      },
      {
        label: "Season Status",
        value: predictionData?.crop_type ?? "Rabi",
        icon: <Wheat className="h-4 w-4" />,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
      },
    ],
    [healthData, fields, predictionData],
  );

  /* ---------- Empty state ---------- */
  if (!selectedField && fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-primary/20 to-emerald-500/10 rounded-full flex items-center justify-center border border-primary/20">
            <Sprout className="w-12 h-12 text-primary" />
          </div>
        </div>
        <div className="space-y-3 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              AgriSmart
            </span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Add your first field to unlock satellite-driven crop analytics, AI
            yield predictions, and real-time market insights.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => onNavigate("my-field")}
          className="gap-2 px-8 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
        >
          <Plus className="h-5 w-5" />
          Add Your First Field
        </Button>
      </div>
    );
  }

  /* ---------- Main dashboard ---------- */
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* ─── Header Greeting ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent p-4 sm:p-5 rounded-2xl border border-emerald-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2">
            {getGreeting()}, <span className="text-foreground font-bold tracking-tight">{user?.username || "Farmer"}</span> 👋
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 sm:mt-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
        </div>
        <div className="bg-card/50 backdrop-blur-sm border px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground shadow-sm relative z-10">
          {new Date().toLocaleDateString('en-IN', {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* ─── Quick Stats Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((s, i) => {
          const isEmerald = s.color.includes("emerald");
          const bgGradient = isEmerald ? "from-emerald-500/10 to-transparent" 
                           : s.color.includes("sky") ? "from-sky-500/10 to-transparent"
                           : s.color.includes("amber") ? "from-amber-500/10 to-transparent"
                           : "from-violet-500/10 to-transparent";
          return (
            <Card
              key={s.label}
              className="group overflow-hidden relative hover:shadow-xl transition-all duration-500 border-border/40 hover:-translate-y-0.5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              <CardContent className="p-3.5 sm:p-5 flex items-start gap-1 justify-between relative z-10">
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5 sm:mb-1 truncate">
                    {s.label}
                  </p>
                  <p className="text-lg sm:text-2xl font-black tracking-tight truncate">{s.value}</p>
                </div>
                <div
                  className={`size-8 sm:size-10 rounded-lg sm:rounded-xl flex items-center justify-center ${s.bgColor} ${s.color} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm shrink-0`}
                >
                  {s.icon}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ─── Row 1: Weather + Recent Fields ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 rounded-xl">
          <WeatherWidget weather={weather} />
        </div>
        <div className="lg:col-span-8">
          <Card className="h-full overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/40 relative z-10 px-5 pt-5">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold tracking-tight">Recent Saved Fields</CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">Quickly access and manage your workspace</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("my-field")}
                className="text-[10px] sm:text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1 rounded-full px-2.5 transition-all group/add shadow-none border-none py-1.5 h-auto bg-transparent print:hidden"
              >
                <Plus className="h-3 w-3 group-hover/add:rotate-90 transition-transform duration-300" />
                ADD NEW
              </Button>
            </CardHeader>
            <CardContent className="p-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedField(f)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border group",
                      selectedField?.id === f.id 
                        ? "bg-primary/10 border-primary/20 shadow-[0_4px_12px_rgba(34,197,94,0.08)]" 
                        : "bg-background/50 border-white/5 hover:border-white/10 hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "size-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                      selectedField?.id === f.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Sprout className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{f.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">
                        {f.cropType || "Unknown"} • {f.area ? `${f.area} ha` : "Auto-calc"}
                      </p>
                    </div>
                    {selectedField?.id === f.id && (
                      <div className="size-5 rounded-full bg-primary flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                        <CheckCircle2 className="size-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {fields.length === 0 && (
                  <div className="col-span-2 py-8 text-center border border-dashed rounded-xl border-border/40">
                    <p className="text-xs text-muted-foreground">No fields saved yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Row 2: Growth Chart + Activity Feed ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart */}
        <Card className="lg:col-span-8 overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/40 relative z-10 px-5 pt-5">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-bold tracking-tight">Yield Prediction</CardTitle>
                <CardDescription className="text-[11px] mt-0.5">Vegetation index trend vs estimated output</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              className="h-8 text-xs gap-1.5 rounded-lg border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 print:hidden"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="p-5 pt-4 relative z-10">
            <div className="h-[280px] w-full">
              {predictionData?.ndvi?.time_series ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={predictionData.ndvi.time_series}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="dashNdviPremium" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short" })}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                    />
                    <YAxis
                      domain={[0, 1]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                    />
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
                      }}
                      labelFormatter={(d) => new Date(d).toLocaleDateString()}
                      formatter={(v: number) => [v.toFixed(3), "NDVI"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="ndvi"
                      stroke="url(#lineGrad)"
                      strokeWidth={3}
                      fill="url(#dashNdviPremium)"
                      dot={false}
                      activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/40 gap-3">
                  <BarChart3 className="size-8 opacity-20" />
                  <span className="text-sm font-medium">{selectedField ? "Loading chart..." : "Select a field to view growth trends."}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="lg:col-span-4 flex flex-col overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/[0.02] to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/40 relative z-10 px-5 pt-5">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-gradient-to-br from-rose-400 to-orange-500 flex items-center justify-center shadow-md shadow-rose-500/20">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <CardTitle className="text-sm font-bold tracking-tight">Recent Activity</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary font-bold p-0 h-auto hover:bg-transparent">
              View All
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 max-h-[340px] custom-scrollbar relative z-10">
            <div className="space-y-1.5">
              {(predictionData?.recommendations?.length
                ? predictionData.recommendations.map((rec: any, i: number) => ({
                    title: "Recommendation",
                    text: rec.text,
                    type: rec.type as string,
                    time: "Just now",
                  }))
                : [
                    {
                      title: "Severe Storm Alert",
                      text: "High probability of hail in Sector 4. Cover sensitive equipment.",
                      type: "warning",
                      time: "2h ago",
                    },
                    {
                      title: "Irrigation System Warning",
                      text: "Pressure drop detected in Zone B pump.",
                      type: "warning",
                      time: "4h ago",
                    },
                    {
                      title: "NDVI Update",
                      text: "Satellite imagery processed. Vegetation index updated for all fields.",
                      type: "positive",
                      time: "6h ago",
                    },
                  ]
              ).map((item: any, i: number) => {
                const isWarning = item.type === "warning";
                const isPositive = item.type === "positive";
                const iconColor = isWarning ? "text-amber-500" : isPositive ? "text-emerald-500" : "text-blue-500";
                const iconBg = isWarning ? "bg-amber-500/10" : isPositive ? "bg-emerald-500/10" : "bg-blue-500/10";
                const ItemIcon = isWarning ? AlertTriangle : isPositive ? CheckCircle2 : Info;

                return (
                  <div key={i} className="flex gap-3.5 p-3 rounded-xl hover:bg-muted/40 transition-all duration-300 group cursor-default border border-transparent hover:border-border/30">
                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg} group-hover:scale-110 transition-transform`}>
                      <ItemIcon className={`size-4 ${iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-[13px] font-bold tracking-tight text-foreground/90 truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {item.text}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-[9px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                        <Clock className="size-2.5" />
                        {item.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 3: Market Prices — modern card grid ─── */}
      <Card className="overflow-hidden relative shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.02] via-transparent to-transparent pointer-events-none" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40 relative z-10 px-5 pt-5">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Live Market Prices</CardTitle>
              <CardDescription className="text-[11px] mt-0.5">Latest commodity rates from regional mandis</CardDescription>
            </div>
          </div>
          <Button variant="ghost" onClick={() => onNavigate("market")} className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber-500 font-bold p-0 h-auto hover:bg-transparent flex items-center gap-1">
            Full Report <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-5 relative z-10 bg-muted/10">
          {marketPrices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {marketPrices.map((item: any, i: number) => {
                const isUp = item.change >= 0;
                return (
                  <div key={i} className="group relative overflow-hidden p-5 rounded-2xl border border-border/40 bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${isUp ? 'from-emerald-500/[0.03] to-transparent' : 'from-red-500/[0.03] to-transparent'}`} />
                    
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="size-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
                          <Wheat className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <span className="font-bold text-sm tracking-tight">{item.commodity}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 border-0 font-bold ${isUp ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                        {isUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                        {item.changeLabel}
                      </Badge>
                    </div>

                    <div className="relative z-10">
                      <p className="text-3xl font-black tracking-tighter">
                        ₹{item.price?.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-widest font-semibold opacity-70">
                        per quintal
                      </p>
                    </div>

                    {/* Mini sparkline */}
                    <div className="mt-4 h-10 w-[110%] -ml-[5%] relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                      <svg className={`w-full h-full fill-none stroke-[2.5] ${isUp ? "stroke-emerald-500" : "stroke-red-500"}`} viewBox="0 0 100 30" preserveAspectRatio="none">
                        <path d={isUp ? "M0,25 Q15,20 25,22 T50,15 T75,8 T100,5" : "M0,5 Q15,8 25,10 T50,15 T75,22 T100,25"} strokeLinecap="round" />
                        <path d={isUp ? "M0,25 Q15,20 25,22 T50,15 T75,8 T100,5" : "M0,5 Q15,8 25,10 T50,15 T75,22 T100,25"} className={isUp ? "stroke-emerald-500/30" : "stroke-red-500/30"} strokeWidth="6" strokeLinecap="round" filter="blur(4px)" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-muted/40 animate-pulse rounded-2xl border border-border/30" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="h-2" />
    </div>
  );
}
