"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useField } from "@/context/FieldContext";
import { useWeather } from "@/context/WeatherContext";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSmartAlerts, SmartAlert } from "@/hooks/useSmartAlerts";
/* ── Style config ── */
const PRIORITY_STYLES: Record<string, { border: string; bg: string; dot: string; badge: string; badgeText: string }> = {
  critical: { border: "border-red-500/30", bg: "bg-red-500/[0.04]", dot: "bg-red-500 animate-pulse", badge: "bg-red-500/15 text-red-400 border-red-500/20", badgeText: "CRITICAL" },
  high: { border: "border-amber-500/30", bg: "bg-amber-500/[0.04]", dot: "bg-amber-500", badge: "bg-amber-500/15 text-amber-400 border-amber-500/20", badgeText: "HIGH" },
  medium: { border: "border-blue-500/20", bg: "bg-blue-500/[0.02]", dot: "bg-blue-500", badge: "bg-blue-500/15 text-blue-400 border-blue-500/20", badgeText: "MEDIUM" },
  low: { border: "border-emerald-500/20", bg: "", dot: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", badgeText: "LOW" },
  info: { border: "border-border/30", bg: "", dot: "bg-slate-400", badge: "bg-slate-500/15 text-slate-400 border-slate-500/20", badgeText: "INFO" },
};

const CATEGORY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  weather: { icon: "thunderstorm", color: "text-red-400", bg: "bg-red-500/10" },
  crop_suggestion: { icon: "spa", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  schedule: { icon: "alarm", color: "text-blue-400", bg: "bg-blue-500/10" },
  input_recommendation: { icon: "science", color: "text-purple-400", bg: "bg-purple-500/10" },
  season: { icon: "calendar_month", color: "text-amber-400", bg: "bg-amber-500/10" },
  general: { icon: "notifications", color: "text-teal-400", bg: "bg-teal-500/10" },
};

/* ── Time helpers ── */
function timeAgo(d: Date) {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ── Tabs ── */
type TabKey = "all" | "weather" | "schedule" | "crop_suggestion" | "input_recommendation" | "season";

/* ── Component ── */
export function FieldAlerts() {
  const { selectedField } = useField();
  const { weather } = useWeather();
  const { allAlerts, loading, unreadCount, criticalCount, markAsRead, markAllAsRead, unmarkAsRead, refetch } = useSmartAlerts();
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const filtered = useMemo(() => {
    return activeTab === "all" ? allAlerts : allAlerts.filter(a => a.category === activeTab);
  }, [activeTab, allAlerts]);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "notifications" },
    { key: "weather", label: "Weather", icon: "thunderstorm" },
    { key: "schedule", label: "Schedule", icon: "alarm" },
    { key: "crop_suggestion", label: "Crops", icon: "spa" },
    { key: "input_recommendation", label: "Inputs", icon: "science" },
    { key: "season", label: "Season", icon: "calendar_month" },
  ];

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-500">
        <span className="material-symbols-outlined text-3xl animate-spin text-amber-500">progress_activity</span>
        <span className="text-xs text-muted-foreground mt-3">Loading alerts…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">

      {/* ══════ Header ══════ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 px-1">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 relative shrink-0">
            <span className="material-symbols-outlined text-white text-3xl">notifications_active</span>
            {criticalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse border-2 border-background">
                {criticalCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Smart Advisories</h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
              {selectedField ? (
                <span className="flex items-center gap-1.5 flex-wrap">
                  AI monitoring for <span className="text-amber-500 font-bold">{selectedField.name}</span>
                  {selectedField.cropType && <><span className="text-muted-foreground/40">•</span> <span className="text-emerald-500 font-bold">{selectedField.cropType}</span></>}
                </span>
              ) : "Real-time field intelligence & alerts"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-[11px] font-black uppercase tracking-wider text-emerald-500 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">done_all</span>
              Mark All Read
            </button>
          )}
          <button
            onClick={refetch}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border bg-card/60 backdrop-blur-xl hover:bg-muted/50 text-[11px] font-black uppercase tracking-wider transition-all hover:shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* ══════ Summary Stats ══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
        {[
          { label: "Total Alerts", value: allAlerts.length, icon: "notifications", iconBg: "bg-blue-500/10", iconColor: "text-blue-500" },
          { label: "Action Msg", value: unreadCount, icon: "priority_high", iconBg: "bg-red-500/10", iconColor: "text-red-500", valueColor: "text-red-500" },
          { label: "Critical", value: criticalCount, icon: "warning", iconBg: "bg-amber-500/10", iconColor: "text-amber-500", valueColor: "text-amber-500" },
          { label: "Resolved", value: allAlerts.filter(a => a.is_read).length, icon: "task_alt", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", valueColor: "text-emerald-500" },
        ].map((stat, i) => (
          <Card key={i} className="overflow-hidden border-border/40 bg-card/40 backdrop-blur-xl group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate">{stat.label}</p>
                  <p className={cn("text-2xl font-black mt-1 group-hover:scale-110 transition-transform origin-left", stat.valueColor)}>{stat.value}</p>
                </div>
                <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0 shadow-inner", stat.iconBg)}>
                  <span className={cn("material-symbols-outlined text-lg", stat.iconColor)}>{stat.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ══════ Category Tabs ══════ */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border/30 overflow-x-auto thin-scrollbar">
        {tabs.map(tab => {
          const count = tab.key === "all" ? allAlerts.length : allAlerts.filter(a => a.category === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("material-symbols-outlined text-sm", activeTab === tab.key && "text-amber-500")}>{tab.icon}</span>
              {tab.label}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                activeTab === tab.key ? "bg-amber-500/15 text-amber-400" : "bg-muted/50 text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════ Alerts List ══════ */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-5 py-3 border-b bg-muted/10">
          <div className="size-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-500 text-sm">inbox</span>
          </div>
          <CardTitle className="text-sm flex-1">
            {activeTab === "all" ? "All Alerts" : tabs.find(t => t.key === activeTab)?.label + " Alerts"}
          </CardTitle>
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted/60 font-semibold">
            {filtered.length} {filtered.length === 1 ? "alert" : "alerts"}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-amber-400/60">notifications_off</span>
              </div>
              <h3 className="text-sm font-semibold mb-1">No Alerts in This Category</h3>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Switch to "All" tab or check back later for new notifications.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtered.map((alert) => {
                const catStyle = CATEGORY_ICONS[alert.category] || CATEGORY_ICONS.general;
                const priStyle = PRIORITY_STYLES[alert.priority] || PRIORITY_STYLES.info;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-3 px-5 py-4 transition-all hover:bg-muted/20 group",
                      !alert.is_read ? priStyle.bg : "bg-muted/5 opacity-70"
                    )}
                  >
                    {/* Unread dot */}
                    <div className="pt-2 w-2 shrink-0">
                      {!alert.is_read && (
                        <div className={cn("size-2 rounded-full", priStyle.dot)} />
                      )}
                    </div>

                    {/* Category Icon */}
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
                      catStyle.bg
                    )}>
                      <span className={cn("material-symbols-outlined text-lg", catStyle.color)}>{alert.icon || catStyle.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className={cn(
                          "text-sm font-bold leading-snug flex-1",
                          alert.is_read ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {alert.title}
                        </p>
                        <Badge className={cn("text-[9px] px-1.5 py-0 font-bold border shrink-0", priStyle.badge)}>
                          {priStyle.badgeText}
                        </Badge>
                      </div>
                      <p className={cn(
                        "text-[13px] mt-1.5 leading-relaxed whitespace-pre-line",
                        alert.is_read ? "text-muted-foreground/70" : "text-muted-foreground"
                      )}>
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">schedule</span>
                          {timeAgo(alert.timestamp)}
                        </span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-semibold", catStyle.bg, catStyle.color)}>
                          {alert.category.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      {!alert.is_read ? (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="size-8 rounded-lg flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                          title="Mark as read"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => unmarkAsRead(alert.id)}
                          className="size-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-500/10 transition-all active:scale-90"
                          title="Mark as unread"
                        >
                          <span className="material-symbols-outlined text-sm">history</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
