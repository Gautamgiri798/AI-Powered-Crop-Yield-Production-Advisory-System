"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ExportButton } from "@/components/common/ExportButton";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useField } from "@/context/FieldContext";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ActivityType = "Watering" | "Fertilizer" | "Sowing" | "Pesticide" | "Harvest" | "Other";

interface LogEntry {
  id: number;
  date: string;
  activity: ActivityType;
  details: string;
}

interface AlertEntry {
  id: number;
  date: string;
  message: string;
  is_read: boolean;
}

const activityConfig: Record<ActivityType, { icon: string; color: string; bg: string; accent: string }> = {
  Watering:   { icon: "water_drop",  color: "text-blue-400",    bg: "bg-blue-500/15",    accent: "#3b82f6" },
  Fertilizer: { icon: "inventory_2", color: "text-amber-400",   bg: "bg-amber-500/15",   accent: "#f59e0b" },
  Sowing:     { icon: "grass",       color: "text-emerald-400", bg: "bg-emerald-500/15",  accent: "#10b981" },
  Pesticide:  { icon: "bug_report",  color: "text-red-400",     bg: "bg-red-500/15",     accent: "#ef4444" },
  Harvest:    { icon: "agriculture", color: "text-orange-400",  bg: "bg-orange-500/15",  accent: "#f97316" },
  Other:      { icon: "eco",         color: "text-slate-400",   bg: "bg-muted",          accent: "#94a3b8" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/* ── Calendar Grid Builder ── */
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startOffset = firstDay.getDay() - 1; // Monday=0
  if (startOffset < 0) startOffset = 6;

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month fill
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }
  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  // Next month fill (complete to 6 rows of 7)
  while (days.length < 42) {
    const d = new Date(year, month + 1, days.length - startOffset - lastDay.getDate() + 1);
    days.push({ date: d, isCurrentMonth: false });
  }

  return days;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ══════════════════════════════════════════════════════ */

export function FieldLog() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { selectedField, refreshFields } = useField();

  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [calendarView, setCalendarView] = useState<'days' | 'months' | 'years'>('days');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activity, setActivity] = useState<ActivityType>("Watering");
  const [details, setDetails] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { isRecording, startRecording, stopRecording, transcript, setTranscript } = useVoiceRecording();

  useEffect(() => { if (transcript) setDetails(transcript); }, [transcript]);
  useEffect(() => { if (!showModal) { setTranscript(""); if (isRecording) stopRecording(); } }, [showModal]);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        let logsEndpoint = '/field/logs';
        let alertsEndpoint = '/field/alerts';
        if (selectedField) {
          logsEndpoint += `?field_id=${selectedField.id}`;
          alertsEndpoint += `?field_id=${selectedField.id}`;
        }
        const [logsData, alertsData] = await Promise.all([
          apiFetch<LogEntry[]>(logsEndpoint, { headers: { Authorization: `Token ${token}` } }),
          apiFetch<AlertEntry[]>(alertsEndpoint, { headers: { Authorization: `Token ${token}` } }),
        ]);
        setLogs(logsData);
        setAlerts(alertsData);
      } catch (error) {
        console.error("Error fetching field data:", error);
        toast({ title: "Error fetching data", variant: "destructive" });
      } finally { setLoading(false); }
    };
    fetchData();
  }, [token, selectedField]);

  const handleDeleteLog = async (logId: number) => {
    if (!token) return;
    try {
      await apiFetch(`/field/logs/${logId}`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      setLogs(prev => prev.filter(l => l.id !== logId));
      // Refresh alerts to remove any associated with this log
      let alertsEndpoint = '/field/alerts';
      if (selectedField) alertsEndpoint += `?field_id=${selectedField.id}`;
      const alertsData = await apiFetch<AlertEntry[]>(alertsEndpoint);
      setAlerts(alertsData);
      toast({ title: "Log deleted", description: "Activity history updated." });
    } catch (err) {
      toast({ title: "Delete failed", description: "Could not remove log.", variant: "destructive" });
    }
  };

  const handleAddLog = async () => {
    if (!details.trim()) {
      toast({ title: "Missing details", description: "Please fill in activity details.", variant: "destructive" });
      return;
    }
    if (!token || !selectedDate) return;
    setSubmitting(true);
    try {
      const formattedDate = toDateStr(selectedDate);
      // Build a clean body — only include field_id when we have one
      const body: Record<string, unknown> = { date: formattedDate, activity, details };
      if (selectedField?.id) body.field_id = selectedField.id;

      const newLog = await apiFetch<LogEntry>('/field/logs', {
        method: "POST",
        body: JSON.stringify(body),
      });
      setLogs(prev => [...prev, newLog]);
      // Refresh alerts
      let alertsEndpoint = '/field/alerts';
      if (selectedField) alertsEndpoint += `?field_id=${selectedField.id}`;
      const alertsData = await apiFetch<AlertEntry[]>(alertsEndpoint);
      setAlerts(alertsData);
      setActivity("Watering"); setDetails(""); setShowModal(false);
      toast({ title: "Log saved", description: "Activity recorded successfully." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Failed to save", description: message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleClearAll = async () => {
    if (!token || logs.length === 0) return;
    if (!confirm("Are you sure you want to clear your entire activity history for this field?")) return;
    
    try {
      // Loop through and delete each or we could have a bulk endpoint, 
      // but let's use the individual delete for simplicity and safety.
      await Promise.all(logs.map(l => 
        apiFetch(`/field/logs/${l.id}`, {
          method: "DELETE",
          headers: { Authorization: `Token ${token}` },
        })
      ));
      setLogs([]);
      setAlerts([]);
      toast({ title: "History cleared", description: "All field activities have been removed." });
    } catch (err) {
      toast({ title: "Clear failed", description: "Some logs could not be removed.", variant: "destructive" });
      // Refresh to see what's left
      refreshFields(); 
    }
  };

  const getDetailsPlaceholder = () => {
    switch (activity) {
      case "Watering": return "Amount (liters) or irrigation type...";
      case "Fertilizer": return "Type and quantity (kg)...";
      case "Sowing": return "Seeds per row or area...";
      case "Pesticide": return "Type and dosage...";
      case "Harvest": return "Estimated yield...";
      default: return "Notes...";
    }
  };

  const navigateMonth = (dir: -1 | 1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const goToday = () => {
    const now = new Date();
    setViewMonth(now.getMonth());
    setViewYear(now.getFullYear());
  };

  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const todayStr = toDateStr(new Date());

  // Build a map of logs/alerts by date for fast lookup
  const logsByDate = useMemo(() => {
    const map: Record<string, LogEntry[]> = {};
    logs.forEach(l => { (map[l.date] ??= []).push(l); });
    return map;
  }, [logs]);

  const alertsByDate = useMemo(() => {
    const map: Record<string, AlertEntry[]> = {};
    alerts.forEach(a => { (map[a.date] ??= []).push(a); });
    return map;
  }, [alerts]);

  // Stats
  const thisMonthLogs = logs.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });
  const recentLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow shadow-teal-500/20">
            <span className="material-symbols-outlined text-white text-sm">edit_calendar</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{t("field_log")}</h1>
            <p className="text-xs text-muted-foreground">Track and manage farm activities</p>
          </div>
        </div>
        <ExportButton
          data={logs}
          filename="field_logs"
          title="Field Activity Log"
          columns={[
            { header: "Date", accessorKey: "date" },
            { header: "Activity", accessorKey: "activity" },
            { header: "Details", accessorKey: "details" }
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ════ Custom Calendar ════ */}
        <div className="lg:col-span-3">
          {loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 gap-2">
                <span className="material-symbols-outlined text-2xl animate-spin text-primary">progress_activity</span>
                <span className="text-xs text-muted-foreground">Loading calendar…</span>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              {/* ── Navigation Bar ── */}
              <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-primary/[0.05] to-transparent">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (calendarView === 'days') navigateMonth(-1);
                      else if (calendarView === 'months') setViewYear(y => y - 1);
                      else setViewYear(y => y - 12);
                    }}
                    className="size-8 rounded-lg flex items-center justify-center hover:bg-foreground/[0.06] active:bg-foreground/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-muted-foreground">chevron_left</span>
                  </button>
                  <button
                    onClick={() => {
                      if (calendarView === 'days') navigateMonth(1);
                      else if (calendarView === 'months') setViewYear(y => y + 1);
                      else setViewYear(y => y + 12);
                    }}
                    className="size-8 rounded-lg flex items-center justify-center hover:bg-foreground/[0.06] active:bg-foreground/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-muted-foreground">chevron_right</span>
                  </button>
                </div>

                {/* Clickable Month/Year — drills into month/year picker */}
                <button
                  onClick={() => {
                    if (calendarView === 'days') setCalendarView('months');
                    else if (calendarView === 'months') setCalendarView('years');
                    else setCalendarView('days');
                  }}
                  className="text-base font-bold tracking-tight hover:text-primary transition-colors px-3 py-1 rounded-lg hover:bg-foreground/[0.04]"
                >
                  {calendarView === 'days' && `${MONTH_NAMES[viewMonth]} ${viewYear}`}
                  {calendarView === 'months' && `${viewYear}`}
                  {calendarView === 'years' && `${viewYear - 5} – ${viewYear + 6}`}
                </button>

                <button
                  onClick={goToday}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  Today
                </button>
              </div>

              {/* ════ MONTHS VIEW ════ */}
              {calendarView === 'months' && (
                <div className="grid grid-cols-4 gap-2 p-4">
                  {MONTH_NAMES.map((name, i) => {
                    const isCurrentMonth = i === new Date().getMonth() && viewYear === new Date().getFullYear();
                    return (
                      <button
                        key={name}
                        onClick={() => { setViewMonth(i); setCalendarView('days'); }}
                        className={cn(
                          "py-4 rounded-lg text-sm font-medium transition-all border",
                          isCurrentMonth
                            ? "bg-primary/10 border-primary/40 text-primary font-bold"
                            : "border-transparent hover:bg-foreground/[0.05] hover:border-border/40"
                        )}
                      >
                        {name.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ════ YEARS VIEW ════ */}
              {calendarView === 'years' && (
                <div className="grid grid-cols-4 gap-2 p-4">
                  {Array.from({ length: 12 }, (_, i) => viewYear - 5 + i).map(yr => {
                    const isCurrentYear = yr === new Date().getFullYear();
                    return (
                      <button
                        key={yr}
                        onClick={() => { setViewYear(yr); setCalendarView('months'); }}
                        className={cn(
                          "py-4 rounded-lg text-sm font-medium transition-all border",
                          isCurrentYear
                            ? "bg-primary/10 border-primary/40 text-primary font-bold"
                            : "border-transparent hover:bg-foreground/[0.05] hover:border-border/40"
                        )}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ════ DAYS VIEW ════ */}
              {calendarView === 'days' && (<>
              {/* ── Weekday Header ── */}
              <div className="grid grid-cols-7 border-b bg-muted/30">
                {WEEKDAYS.map((day, i) => (
                  <div
                    key={day}
                    className={cn(
                      "text-center py-2.5 text-[10px] font-bold uppercase tracking-[0.15em]",
                      i >= 5 ? "text-red-400/60" : "text-muted-foreground/60",
                      i < 6 && "border-r border-border/30"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* ── Days Grid ── */}
              <div className="grid grid-cols-7">
                {calendarDays.map((dayObj, idx) => {
                  const dateStr = toDateStr(dayObj.date);
                  const isToday = dateStr === todayStr;
                  const isWeekend = idx % 7 >= 5;
                  const dayLogs = logsByDate[dateStr] || [];
                  const dayAlerts = alertsByDate[dateStr] || [];
                  const rowIndex = Math.floor(idx / 7);
                  const isLastRow = rowIndex === 5;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDate(dayObj.date);
                        setShowModal(true);
                      }}
                      className={cn(
                        "relative flex flex-col items-start p-1.5 min-h-[72px] text-left transition-all duration-100 group",
                        // borders
                        idx % 7 < 6 && "border-r border-border/30",
                        !isLastRow && "border-b border-border/30",
                        // zebra rows
                        rowIndex % 2 === 1 && "bg-foreground/[0.015]",
                        // non-current month
                        !dayObj.isCurrentMonth && "opacity-30",
                        // hover
                        "hover:bg-primary/[0.06]",
                      )}
                    >
                      {/* Hover accent bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[3px] bg-primary transition-all duration-150 rounded-r" />

                      {/* Date number */}
                      <span
                        className={cn(
                          "inline-flex items-center justify-center text-xs font-medium leading-none select-none",
                          isToday
                            ? "size-7 rounded-full bg-primary text-primary-foreground font-bold shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]"
                            : "size-7",
                          isWeekend && !isToday && "text-red-400",
                          !isWeekend && !isToday && dayObj.isCurrentMonth && "text-foreground",
                        )}
                      >
                        {dayObj.date.getDate()}
                      </span>

                      {/* Activity chips */}
                      {(dayLogs.length > 0 || dayAlerts.length > 0) && (
                        <div className="mt-auto w-full flex flex-col gap-px overflow-hidden">
                          {dayLogs.slice(0, 2).map(log => {
                            const cfg = activityConfig[log.activity];
                            return (
                              <div
                                key={log.id}
                                className={cn(
                                  "text-[9px] font-semibold rounded px-1 py-px truncate flex items-center gap-0.5",
                                  cfg.bg, cfg.color
                                )}
                                title={log.details}
                              >
                                <span className="material-symbols-outlined text-[9px]">{cfg.icon}</span>
                                {log.activity}
                              </div>
                            );
                          })}
                          {dayAlerts.slice(0, 1).map(alert => (
                            <div key={alert.id} className="text-[9px] text-red-400 truncate flex items-center gap-0.5" title={alert.message}>
                              <span className="material-symbols-outlined text-[9px]">warning</span>Alert
                            </div>
                          ))}
                          {dayLogs.length > 2 && (
                            <span className="text-[8px] text-muted-foreground">+{dayLogs.length - 2} more</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Legend ── */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-t bg-muted/20 flex-wrap">
                {(Object.entries(activityConfig) as [ActivityType, typeof activityConfig[ActivityType]][]).map(([type, config]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: config.accent }} />
                    <span className="text-[10px] text-muted-foreground">{type}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="text-[10px] text-muted-foreground">Today</span>
                </div>
              </div>
              </>)}
            </div>
          )}
        </div>

        {/* ══ Right Sidebar ══ */}
        <div className="space-y-4">
          {/* Alerts */}
          <Card className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-4 py-3 border-b relative z-10">
              <div className="size-6 rounded bg-amber-500/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-sm">notifications_active</span>
              </div>
              <CardTitle className="text-sm">Alerts</CardTitle>
              {alerts.length > 0 && (
                <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {alerts.length}
                </span>
              )}
            </CardHeader>
            <CardContent className="p-3 max-h-48 overflow-y-auto relative z-10">
              {alerts.length === 0 ? (
                <div className="py-4 text-center">
                  <span className="material-symbols-outlined text-lg text-muted-foreground/30">check_circle</span>
                  <p className="text-xs text-muted-foreground mt-1">No pending alerts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 4).map(alert => (
                    <div key={alert.id} className="p-2.5 bg-red-500/10 border border-red-500/15 rounded-lg">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 leading-relaxed">{alert.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{alert.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* This Month Stats */}
          <Card className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.03] to-transparent pointer-events-none" />
            <CardHeader className="px-4 py-3 border-b relative z-10">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-sky-500/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sky-500 text-sm">calendar_month</span>
                </div>
                <CardTitle className="text-sm">This Month</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 relative z-10">
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(activityConfig) as [ActivityType, typeof activityConfig[ActivityType]][]).slice(0, 4).map(([type, config]) => {
                  const count = thisMonthLogs.filter(l => l.activity === type).length;
                  return (
                    <div key={type} className="p-2 rounded-lg border bg-card/50 flex items-center gap-2 hover:shadow-sm transition-shadow">
                      <div className={cn("size-7 rounded flex items-center justify-center shrink-0", config.bg)}>
                        <span className={cn("material-symbols-outlined text-xs", config.color)}>{config.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-none">{count}</p>
                        <p className="text-[9px] text-muted-foreground">{type}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />
            <CardHeader className="px-4 py-3 border-b relative z-10">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-emerald-500/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-500 text-sm">history</span>
                  </div>
                  <CardTitle className="text-sm">Recent</CardTitle>
                </div>
                {logs.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-[10px] text-muted-foreground hover:text-red-400 font-medium transition-colors"
                  >
                    Clear History
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 relative z-10">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No activities yet</p>
              ) : (
                <div className="space-y-1.5">
                  {recentLogs.map(log => {
                    const cfg = activityConfig[log.activity];
                    return (
                      <div key={log.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors group/item">
                        <div className={cn("size-5 rounded flex items-center justify-center shrink-0", cfg.bg)}>
                          <span className={cn("material-symbols-outlined text-[10px]", cfg.color)}>{cfg.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate">{log.details || log.activity}</p>
                          <p className="text-[9px] text-muted-foreground">{log.date}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteLog(log.id)}
                          className="size-6 rounded-md opacity-0 group-hover/item:opacity-100 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-sm">delete_outline</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 mx-4 shadow-2xl border-primary/10">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">add_task</span>
                  </div>
                  Log Activity
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs bg-secondary px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-xs text-primary">event</span>
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </div>

              {/* Activity Type */}
              <div>
                <label className="block text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">Activity Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(activityConfig) as ActivityType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setActivity(type)}
                      className={cn(
                        "p-2 rounded-lg border text-center transition-all text-xs",
                        activity === type
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/50 hover:bg-muted/50 hover:border-border"
                      )}
                    >
                      <span className={cn("material-symbols-outlined text-base block", activityConfig[type].color)}>
                        {activityConfig[type].icon}
                      </span>
                      <span className="mt-0.5 block">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">Details</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                    placeholder={getDetailsPlaceholder()}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "px-3 rounded-lg border transition-all",
                      isRecording ? "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse" : "hover:bg-muted"
                    )}
                  >
                    <span className="material-symbols-outlined text-lg">{isRecording ? "mic_off" : "mic"}</span>
                  </button>
                </div>
                {isRecording && (
                  <p className="text-[10px] text-red-500 mt-1 animate-pulse flex items-center gap-1">
                    <span className="inline-block size-1.5 rounded-full bg-red-500" />
                    Listening… {transcript && `"${transcript}"`}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button className="px-4 py-2 rounded-lg text-sm hover:bg-muted transition-colors" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </button>
                <button
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:brightness-110 transition-all disabled:opacity-50"
                  onClick={handleAddLog}
                  disabled={submitting}
                >
                  {submitting && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                  Save Activity
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
