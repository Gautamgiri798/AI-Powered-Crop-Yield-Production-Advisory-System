"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useField } from "@/context/FieldContext";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface WeatherData {
  temp_max: number | null;
  temp_min: number | null;
  rain_chance: number;
  rain_mm: number;
  humidity: number | null;
  description: string;
  icon: string;
}

interface Recommendation {
  action: string;
  icon: string;
  confidence: number;
  reason: string;
}

interface ScheduleDay {
  date: string;
  day_of_week: string;
  weather: WeatherData;
  recommendation: Recommendation;
  irrigated: boolean;
  log: unknown | null;
}

interface ScheduleData {
  field_id: number;
  field_name: string;
  crop_type: string;
  schedule: ScheduleDay[];
  summary: {
    water_used_this_week: number;
    irrigation_count: number;
    next_recommended_irrigation: string | null;
  };
}

interface IrrigationSource {
  value: string;
  label: string;
}

/* ── Helpers ── */
const recStyles: Record<string, { gradient: string; text: string; border: string; bg: string; glow: string }> = {
  irrigate: { gradient: "from-blue-500 to-cyan-400", text: "text-blue-400", border: "border-blue-500/40", bg: "bg-blue-500/8", glow: "shadow-blue-500/10" },
  skip:     { gradient: "from-emerald-500 to-teal-400", text: "text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-500/8", glow: "shadow-emerald-500/10" },
  monitor:  { gradient: "from-amber-500 to-orange-400", text: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/8", glow: "shadow-amber-500/10" },
  done:     { gradient: "from-gray-500 to-gray-400", text: "text-gray-400", border: "border-gray-500/30", bg: "bg-gray-500/8", glow: "shadow-gray-500/10" },
};

const getRecStyle = (action: string) => recStyles[action] || recStyles.done;

const owmIconUrl = (code: string) => `https://openweathermap.org/img/wn/${code}@2x.png`;

/* ── Component ── */
export function IrrigationScheduler() {
  const { selectedField } = useField();
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [sources, setSources] = useState<IrrigationSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [logForm, setLogForm] = useState({ water_amount: "", duration_minutes: "", source: "other", notes: "" });

  useEffect(() => {
    if (selectedField) { fetchSchedule(); fetchSources(); }
  }, [selectedField]);

  const fetchSchedule = async () => {
    if (!selectedField) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/field/irrigation-schedule?field_id=${selectedField.id}`) as ScheduleData;
      setSchedule(data);
    } catch (error) { console.error("Failed to fetch irrigation schedule:", error); }
    finally { setLoading(false); }
  };

  const fetchSources = async () => {
    try {
      const data = await apiFetch("/field/irrigation-logs") as { sources?: IrrigationSource[] };
      setSources(data.sources || []);
    } catch (error) { console.error("Failed to fetch sources:", error); }
  };

  const handleLogIrrigation = async () => {
    if (!selectedField || !selectedDate) return;
    try {
      await apiFetch("/field/irrigation-logs", {
        method: "POST",
        body: JSON.stringify({
          field_id: selectedField.id, date: selectedDate,
          water_amount: logForm.water_amount ? parseFloat(logForm.water_amount) : null,
          duration_minutes: logForm.duration_minutes ? parseInt(logForm.duration_minutes) : null,
          source: logForm.source, notes: logForm.notes
        })
      });
      setDialogOpen(false);
      setLogForm({ water_amount: "", duration_minutes: "", source: "other", notes: "" });
      fetchSchedule();
    } catch (error) { console.error("Failed to log irrigation:", error); }
  };

  const today = new Date().toISOString().split('T')[0];

  /* ── Empty State ── */
  if (!selectedField) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-500">
        <div className="size-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-4xl text-blue-400">water_drop</span>
        </div>
        <h2 className="text-lg font-semibold mb-1">No Field Selected</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Select a field from "My Field" to view your smart irrigation schedule
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-8">

      {/* ══════ Header ══════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="material-symbols-outlined text-white text-xl">water_drop</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Smart Irrigation</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI-powered schedule for {schedule?.field_name || selectedField.name}
              {schedule?.crop_type && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-medium">{schedule.crop_type}</span>}
            </p>
          </div>
        </div>
        <button
          onClick={fetchSchedule}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border bg-card hover:bg-muted/50 text-sm font-medium transition-all hover:shadow-sm active:scale-[0.97]"
        >
          <span className={cn("material-symbols-outlined text-base", loading && "animate-spin")}>
            {loading ? "progress_activity" : "refresh"}
          </span>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* ══════ Summary Stats ══════ */}
      {schedule && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Water Used */}
          <Card className="overflow-hidden relative group hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-transparent pointer-events-none" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Water Used</p>
                  <p className="text-2xl font-bold mt-1 text-blue-500">{schedule.summary.water_used_this_week.toFixed(0)}<span className="text-sm font-medium text-blue-400/70 ml-0.5">L</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Past 7 days</p>
                </div>
                <div className="size-11 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-blue-500">water_drop</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Irrigations */}
          <Card className="overflow-hidden relative group hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Irrigations</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-500">{schedule.summary.irrigation_count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">This week</p>
                </div>
                <div className="size-11 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Recommended */}
          <Card className="overflow-hidden relative group hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent pointer-events-none" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Next Irrigation</p>
                  <p className="text-2xl font-bold mt-1">
                    {schedule.summary.next_recommended_irrigation
                      ? new Date(schedule.summary.next_recommended_irrigation).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
                      : <span className="text-muted-foreground text-base">None soon</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Recommended</p>
                </div>
                <div className="size-11 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-amber-500">event</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════ 5-Day Schedule ══════ */}
      <Card className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none" />
        <CardHeader className="flex flex-row items-start sm:items-center gap-2.5 sm:gap-3 space-y-0 px-3 sm:px-5 py-3 border-b relative z-10">
          <div className="size-8 sm:size-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <span className="material-symbols-outlined text-blue-500 text-sm sm:text-base">calendar_month</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full min-w-0 pr-1">
            <CardTitle className="text-sm sm:text-base font-bold truncate leading-tight mt-0.5 sm:mt-0 text-foreground">5-Day Forecast & Schedule</CardTitle>
            {schedule && (
              <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 sm:mt-0 px-2 py-0.5 rounded-full bg-muted/60 shrink-0 self-start sm:self-auto leading-tight truncate max-w-[130px] sm:max-w-none">
                Real-time weather data
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="material-symbols-outlined text-3xl animate-spin text-blue-500">progress_activity</span>
              <span className="text-xs text-muted-foreground">Fetching weather data…</span>
            </div>
          ) : schedule ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {schedule.schedule.map((day) => {
                const rs = getRecStyle(day.recommendation.action);
                const isToday = day.date === today;
                return (
                  <div
                    key={day.date}
                    className={cn(
                      "relative rounded-xl border p-3 transition-all duration-200 hover:shadow-lg group",
                      rs.border, rs.bg, rs.glow,
                      isToday && "ring-2 ring-blue-500/40 ring-offset-1 ring-offset-background"
                    )}
                  >
                    {/* Today badge */}
                    {isToday && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-500 text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wider shadow-sm ring-2 ring-background">
                        Today
                      </div>
                    )}

                    {/* Day + Date */}
                    <div className="text-center mb-2 mt-1">
                      <p className={cn("font-bold text-xs", rs.text)}>{day.day_of_week.slice(0, 3)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>

                    {/* Weather Icon from OpenWeatherMap */}
                    <div className="flex justify-center mb-0.5 sm:mb-1">
                      <img
                        src={owmIconUrl(day.weather.icon || '01d')}
                        alt={day.weather.description}
                        className="size-10 sm:size-12 drop-shadow-md group-hover:scale-110 transition-transform"
                      />
                    </div>

                    {/* Temp */}
                    <div className="text-center mb-1.5">
                      <span className="text-base font-bold">{day.weather.temp_max != null ? Math.round(day.weather.temp_max) : '--'}°</span>
                      {day.weather.temp_min != null && (
                        <span className="text-[10px] text-muted-foreground ml-1">{Math.round(day.weather.temp_min)}°</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-[9px] text-muted-foreground text-center capitalize truncate mb-2">{day.weather.description}</p>

                    {/* Rain + Humidity mini stats */}
                    <div className="flex items-center justify-center gap-2 mb-2.5">
                      <div className="flex items-center gap-0.5" title="Rain chance">
                        <span className="material-symbols-outlined text-[11px] text-blue-400">water_drop</span>
                        <span className="text-[10px] font-medium">{day.weather.rain_chance}%</span>
                      </div>
                      {day.weather.humidity != null && (
                        <div className="flex items-center gap-0.5" title="Humidity">
                          <span className="material-symbols-outlined text-[11px] text-cyan-400">humidity_mid</span>
                          <span className="text-[10px] font-medium">{day.weather.humidity}%</span>
                        </div>
                      )}
                    </div>

                    {/* Rain chance bar */}
                    <div className="h-1 rounded-full bg-border/30 overflow-hidden mb-2.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${Math.min(day.weather.rain_chance, 100)}%` }}
                      />
                    </div>

                    {/* Recommendation badge */}
                    <div className="text-center mb-2">
                      <span className="text-lg leading-none">{day.recommendation.icon}</span>
                      <p className={cn("text-[10px] mt-0.5 font-semibold capitalize", rs.text)}>
                        {day.recommendation.action}
                      </p>
                    </div>

                    {/* Action: Log or Logged */}
                    {day.irrigated ? (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/8 rounded-lg py-1.5 font-medium">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        Logged
                      </div>
                    ) : day.recommendation.action !== 'done' && (
                      <Dialog open={dialogOpen && selectedDate === day.date} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (open) setSelectedDate(day.date);
                      }}>
                        <DialogTrigger asChild>
                          <button
                            className="w-full flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-all hover:shadow-sm active:scale-[0.96]"
                            onClick={() => setSelectedDate(day.date)}
                          >
                            <span className="material-symbols-outlined text-xs">add</span>
                            Log
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-base">water_drop</span>
                              </div>
                              Log Irrigation — {day.day_of_week}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Water Amount (L)</Label>
                                <Input
                                  type="number" placeholder="e.g. 500"
                                  value={logForm.water_amount}
                                  onChange={(e) => setLogForm({ ...logForm, water_amount: e.target.value })}
                                  className="bg-background h-9"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Duration (min)</Label>
                                <Input
                                  type="number" placeholder="e.g. 30"
                                  value={logForm.duration_minutes}
                                  onChange={(e) => setLogForm({ ...logForm, duration_minutes: e.target.value })}
                                  className="bg-background h-9"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Water Source</Label>
                              <Select value={logForm.source} onValueChange={(v) => setLogForm({ ...logForm, source: v })}>
                                <SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {sources.map(s => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Notes</Label>
                              <Textarea
                                placeholder="Any observations…"
                                value={logForm.notes}
                                onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                                className="bg-background min-h-[70px]"
                              />
                            </div>
                            <button
                              onClick={handleLogIrrigation}
                              className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.97] transition-all"
                            >
                              <span className="material-symbols-outlined text-base">check_circle</span>
                              Save Irrigation Log
                            </button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="size-14 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-2xl text-blue-500/40">cloudy_snowing</span>
              </div>
              <p className="text-sm font-medium">No schedule data available</p>
              <p className="text-xs text-muted-foreground mt-1">Click Refresh to load weather data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════ Tips ══════ */}
      <Card className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent pointer-events-none" />
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-5 py-3 border-b relative z-10">
          <div className="size-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-500 text-sm">tips_and_updates</span>
          </div>
          <CardTitle className="text-sm">Irrigation Tips for {schedule?.crop_type || selectedField.cropType}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { icon: "schedule", iconCls: "text-blue-500", bgCls: "bg-blue-500/10", text: "Best time: Early morning (6-8 AM) or evening (5-7 PM)" },
              { icon: "thermostat", iconCls: "text-amber-500", bgCls: "bg-amber-500/10", text: "Avoid irrigation during peak heat (12-3 PM)" },
              { icon: "water_drop", iconCls: "text-cyan-500", bgCls: "bg-cyan-500/10", text: "Deep watering is better than frequent light watering" },
              { icon: "rainy", iconCls: "text-indigo-500", bgCls: "bg-indigo-500/10", text: "Skip irrigation if rain expected within 24 hours" },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", tip.bgCls)}>
                  <span className={cn("material-symbols-outlined text-base", tip.iconCls)}>{tip.icon}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">{tip.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
