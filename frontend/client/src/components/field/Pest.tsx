"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useField } from "@/context/FieldContext";
import { apiGet, apiPost, apiDelete, API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PestDetectionResult, PestReport, AgroAlert } from "@/types/field";

/* ── Risk-level color helper ── */
const riskStyle = (level: string) => {
  switch (level) {
    case "Low":    return { ring: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", bar: "from-emerald-500 to-emerald-400" };
    case "Medium": return { ring: "text-amber-500",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-600 dark:text-amber-400",     bar: "from-amber-500 to-amber-400" };
    case "High":   return { ring: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-600 dark:text-red-400",         bar: "from-red-500 to-red-400" };
    default:       return { ring: "text-muted-foreground", bg: "bg-muted", border: "border-border", text: "text-muted-foreground", bar: "from-muted to-muted" };
  }
};

/* ── SVG Arc for risk gauge ── */
function RiskGauge({ value, level }: { value: number; level: string }) {
  const r = 52, cx = 60, cy = 60, stroke = 8;
  const circumference = 2 * Math.PI * r;
  const progress = circumference - value * circumference;
  const style = riskStyle(level);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border/40" />
        <circle
          cx={cx} cy={cy} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke="url(#riskGrad)"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={style.ring} stopColor="currentColor" />
            <stop offset="100%" className={style.ring} stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-black tabular-nums", style.text)}>
          {(value * 100).toFixed(0)}%
        </span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">risk</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ */

export function Pest() {
  const { token } = useAuth();
  const { selectedField } = useField();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<PestDetectionResult | null>(null);
  const [pestPrediction, setPestPrediction] = useState<null | { risk_probability: number; risk_level: string }>(null);
  const [predictionLoading, setPredictionLoading] = useState(true);
  const [pestHistory, setPestHistory] = useState<PestReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const fetchPestPrediction = useCallback(async () => {
    if (!token) { setPredictionLoading(false); return; }
    try {
      let url = '/field/pestpredict';
      if (selectedField) url += `?field_id=${selectedField.id}`;
      const pestData = await apiGet<{ risk_probability: number; risk_level: string }>(url);
      setPestPrediction(pestData);
    } catch (err) { console.error("Pest prediction fetch error:", err); }
    finally { setPredictionLoading(false); }
  }, [token, selectedField]);

  useEffect(() => {
    fetchPestPrediction();
  }, [fetchPestPrediction]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) { setHistoryLoading(false); return; }
      try {
        const historyData = await apiGet<PestReport[]>('/field/pest/report');
        setPestHistory(historyData);
      } catch (err) { console.error("History fetch error:", err); }
      finally { setHistoryLoading(false); }
    };
    fetchHistory();
  }, [token]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
  };

  const addFiles = useCallback((files: File[]) => {
    setSelectedFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    setDetectionResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !token) return;
    setUploading(true);
    setDetectionResult(null);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("image", file));
    try {
      const data = await apiPost<PestDetectionResult>('/field/pest/report', formData);
      setDetectionResult(data);
      const historyData = await apiGet<PestReport[]>('/field/pest/report');
      setPestHistory(historyData);
      // Update risk prediction after new scan
      fetchPestPrediction();
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string; detected?: string } } };
      const message = err.response?.data?.message || err.message || "Something went wrong";
      setDetectionResult({ error: message, detected: err.response?.data?.detected, class: "Error", confidence: 0 });
    } finally { setUploading(false); }
  };

  const clearSelection = () => { setSelectedFiles([]); setPreviews([]); setDetectionResult(null); };

  const [clearingHistory, setClearingHistory] = useState(false);
  const clearHistory = async () => {
    if (!token || clearingHistory) return;
    setClearingHistory(true);
    try {
      await apiDelete('/field/pest/report');
      setPestHistory([]);
      // Reset risk prediction after clearing history
      fetchPestPrediction();
    } catch (err) {
      console.error('Failed to clear history:', err);
    } finally {
      setClearingHistory(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="material-symbols-outlined text-white text-base">pest_control</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Pest Detection</h1>
            <p className="text-xs text-muted-foreground">AI-powered pest detection and risk analysis</p>
          </div>
        </div>
        {/* Quick stats pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-xs">
            <span className="material-symbols-outlined text-sm text-blue-500">history</span>
            <span className="font-semibold">{pestHistory.length}</span>
            <span className="text-muted-foreground">scans</span>
          </div>
          {pestPrediction && (
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs", riskStyle(pestPrediction.risk_level).bg, riskStyle(pestPrediction.risk_level).border)}>
              <span className="material-symbols-outlined text-sm">shield</span>
              <span className={cn("font-bold", riskStyle(pestPrediction.risk_level).text)}>{pestPrediction.risk_level} Risk</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ════ Upload & Scan ════ */}
        <Card className="lg:col-span-3 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-5 py-3 border-b relative z-10">
            <div className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-500 text-sm">photo_camera</span>
            </div>
            <CardTitle className="text-sm">Scan Crop</CardTitle>
            {selectedFiles.length > 0 && (
              <button onClick={clearSelection} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">close</span> Clear
              </button>
            )}
          </CardHeader>
          <CardContent className="p-5 relative z-10">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={cn(
                "relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden",
                dragActive
                  ? "border-primary bg-primary/[0.06] scale-[1.01]"
                  : previews.length > 0
                    ? "border-border/40 bg-card"
                    : "border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-primary/[0.02]"
              )}
            >
              {previews.length > 0 ? (
                /* Image previews */
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {previews.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`Crop ${idx}`} className="size-20 object-cover rounded-lg border shadow-sm" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-sm">zoom_in</span>
                        </div>
                      </div>
                    ))}
                    {/* Add more label */}
                    <label className="size-20 rounded-lg border-2 border-dashed border-border/40 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.04] transition-all text-muted-foreground hover:text-primary">
                      <span className="material-symbols-outlined text-lg">add</span>
                      <span className="text-[8px] font-medium mt-0.5">More</span>
                      <input type="file" accept="image/*" multiple onChange={handleFilesChange} className="hidden" />
                    </label>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <label className="block cursor-pointer p-10 text-center">
                  <div className="size-14 mx-auto rounded-2xl bg-gradient-to-b from-primary/10 to-primary/5 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-2xl text-primary/50">cloud_upload</span>
                  </div>
                  <p className="text-sm font-medium">Drop crop images here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse · JPG, PNG up to 10MB</p>
                  <input type="file" accept="image/*" multiple onChange={handleFilesChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Scan Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className={cn(
                "mt-3 w-full h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                selectedFiles.length === 0
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-110 active:scale-[0.98]"
              )}
            >
              {uploading ? (
                <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Analyzing…</>
              ) : (
                <><span className="material-symbols-outlined text-sm">biotech</span> Analyze {selectedFiles.length > 0 ? `${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''}` : 'Crop'}</>
              )}
            </button>

            {/* Detection Result */}
            {detectionResult && (
              <div className={cn(
                "mt-3 p-4 rounded-xl border animate-in slide-in-from-bottom-2 duration-200",
                detectionResult.error
                  ? "bg-red-500/[0.06] border-red-500/20"
                  : detectionResult.class === "Healthy"
                    ? "bg-emerald-500/[0.06] border-emerald-500/20"
                    : "bg-amber-500/[0.06] border-amber-500/20"
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center shrink-0",
                    detectionResult.error ? "bg-red-500/15" : detectionResult.class === "Healthy" ? "bg-emerald-500/15" : "bg-amber-500/15"
                  )}>
                    <span className={cn(
                      "material-symbols-outlined text-xl",
                      detectionResult.error ? "text-red-500" : detectionResult.class === "Healthy" ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {detectionResult.error ? "error" : detectionResult.class === "Healthy" ? "verified" : "warning"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {detectionResult.error ? (() => {
                      const raw = detectionResult.error ?? "";
                      const isQuota = raw.includes("429") || raw.toLowerCase().includes("quota") || raw.toLowerCase().includes("rate");
                      const friendlyMsg = isQuota
                        ? "API rate limit reached. Please wait a minute and try again."
                        : raw.length > 120 ? raw.slice(0, 120) + "…" : raw;
                      return (
                        <>
                          <p className="text-sm font-bold text-red-600 dark:text-red-400">{isQuota ? "Rate Limit Reached" : "Analysis Failed"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{friendlyMsg}</p>
                          {detectionResult.detected && <p className="text-xs text-muted-foreground mt-0.5">Detected: {detectionResult.detected}</p>}
                        </>
                      );
                    })() : (
                      <>
                        <p className={cn("text-sm font-bold", detectionResult.class === "Healthy" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                          {detectionResult.class}
                        </p>
                        {detectionResult.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{detectionResult.description}</p>
                        )}
                        {detectionResult.confidence > 0 && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="h-1.5 flex-1 bg-border/30 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full bg-gradient-to-r", detectionResult.class === "Healthy" ? "from-emerald-500 to-emerald-400" : "from-amber-500 to-amber-400")}
                                style={{ width: `${detectionResult.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium tabular-nums">{(detectionResult.confidence * 100).toFixed(1)}%</span>
                          </div>
                        )}
                        {detectionResult.model && (
                          <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                            via {detectionResult.model === 'gemini-vision' ? 'Gemini AI' : 'CNN Model'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ════ Pest Prediction Sidebar ════ */}
        <Card className="lg:col-span-2 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-5 py-3 border-b relative z-10">
            <div className="size-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-sm">analytics</span>
            </div>
            <CardTitle className="text-sm">Pest Risk</CardTitle>
            {pestPrediction && (
              <span className={cn("ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full", riskStyle(pestPrediction.risk_level).bg, riskStyle(pestPrediction.risk_level).text)}>
                {pestPrediction.risk_level}
              </span>
            )}
          </CardHeader>
          <CardContent className="p-5 relative z-10">
            {predictionLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <span className="material-symbols-outlined text-2xl animate-spin text-blue-500">progress_activity</span>
                <span className="text-xs text-muted-foreground">Analyzing risk…</span>
              </div>
            ) : pestPrediction ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <RiskGauge value={pestPrediction.risk_probability} level={pestPrediction.risk_level} />

                {/* Risk bar */}
                <div className="w-full space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Risk Probability</span>
                    <span className={cn("font-bold tabular-nums", riskStyle(pestPrediction.risk_level).text)}>
                      {(pestPrediction.risk_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-border/30 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", riskStyle(pestPrediction.risk_level).bar)}
                      style={{ width: `${pestPrediction.risk_probability * 100}%` }}
                    />
                  </div>
                </div>

                {/* Risk tips */}
                <div className="w-full p-3 rounded-xl bg-muted/40 border border-border/40">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {pestPrediction.risk_level === "Low" && "✅ Low pest pressure. Continue monitoring weekly."}
                    {pestPrediction.risk_level === "Medium" && "⚠️ Moderate risk detected. Consider preventive spraying."}
                    {pestPrediction.risk_level === "High" && "🚨 High pest risk! Immediate action recommended."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="size-12 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl text-blue-500/50">pin_drop</span>
                </div>
                <p className="text-sm font-medium">No field saved</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Save your field location in<br />"My Field" to get pest predictions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Scans ── */}
      <Card className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] to-transparent pointer-events-none" />
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-5 py-3 border-b relative z-10">
          <div className="size-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-violet-500 text-sm">history</span>
          </div>
          <CardTitle className="text-sm">Recent Scans</CardTitle>
          {pestHistory.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{pestHistory.length} scan{pestHistory.length !== 1 ? 's' : ''}</span>
              <button
                onClick={clearHistory}
                disabled={clearingHistory}
                className="text-[10px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-0.5 hover:bg-red-500/10 rounded-md px-1.5 py-0.5"
              >
                {clearingHistory ? (
                  <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-xs">delete_sweep</span>
                )}
                Clear All
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 relative z-10">
          {historyLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <span className="material-symbols-outlined text-xl animate-spin text-violet-500">progress_activity</span>
              <span className="text-xs text-muted-foreground">Loading history…</span>
            </div>
          ) : pestHistory.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {pestHistory.map((pest) => (
                <div key={pest.id} className="group relative rounded-xl overflow-hidden border hover:shadow-lg hover:scale-[1.03] transition-all duration-200 cursor-pointer">
                  <img
                    src={pest.image.startsWith('http') ? pest.image : `${API_BASE_URL}${pest.image}`}
                    alt="Scan"
                    className="w-full aspect-square object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Date label */}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <span className="text-[9px] font-medium text-white/90 bg-black/40 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                      {new Date(pest.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="size-12 mx-auto rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl text-violet-500/50">photo_library</span>
              </div>
              <p className="text-sm font-medium">No scans yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload crop images above to start scanning</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
