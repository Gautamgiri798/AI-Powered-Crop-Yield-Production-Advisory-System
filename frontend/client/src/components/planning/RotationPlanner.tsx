import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Star, ArrowRight, Leaf, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";
import { useField } from "@/context/FieldContext";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Suggestion {
    crop: string;
    score: number;
    rating: { stars: number; label: string };
    reasons: string[];
    season: string;
    benefits: { nitrogen_fix?: boolean; soil_structure?: string; pest_break?: boolean };
}

interface TimelineItem {
    season: string;
    start_month?: string;
    end_month?: string;
    start_year: number;
    end_year: number;
    crop: string;
    status: string;
    score?: number;
    icon: string;
}

interface SoilTip {
    type: string;
    icon: string;
    text: string;
}

interface RotationData {
    field_id: number;
    field_name: string;
    current_crop: string;
    current_season: string;
    crop_history: { year: number; season: string; crop: string }[];
    suggestions: Suggestion[];
    timeline: TimelineItem[];
    soil_health_tips: SoilTip[];
}

export function RotationPlanner() {
    const { selectedField } = useField();
    const [data, setData] = useState<RotationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<{ year: number; season: string; crop: string }[]>([]);

    // Helper to get the localStorage key for the selected field
    const getClearedKey = () => selectedField ? `crop_history_cleared_${selectedField.id}` : '';

    useEffect(() => {
        if (selectedField) {
            fetchRotation();
        }
    }, [selectedField]);

    const fetchRotation = async () => {
        if (!selectedField) return;
        setLoading(true);
        try {
            const result = await apiFetch(`/planning/rotation?field_id=${selectedField.id}`) as RotationData;
            setData(result);

            // Check if history was previously cleared for this field
            const clearedKey = `crop_history_cleared_${selectedField.id}`;
            const isCleared = localStorage.getItem(clearedKey);
            if (isCleared) {
                setHistory([]);
            } else {
                setHistory(result.crop_history || []);
            }
        } catch (error) {
            console.error("Failed to fetch rotation plan:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = () => {
        if (confirm("Are you sure you want to clear the crop history for this field?")) {
            setHistory([]);
            // Persist cleared state in localStorage so it survives page refreshes
            const clearedKey = getClearedKey();
            if (clearedKey) {
                localStorage.setItem(clearedKey, 'true');
            }
        }
    };

    if (!selectedField) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a field to view rotation suggestions</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <RefreshCw className="h-6 w-6 text-white" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-bold tracking-tight">Crop Rotation Planner</h1>
                      <p className="text-muted-foreground text-sm mt-0.5">
                          AI suggestions for <span className="text-foreground font-medium">{data?.field_name || selectedField.name}</span>
                      </p>
                  </div>
                </div>
                <Button onClick={fetchRotation} variant="outline" disabled={loading} className="gap-2 transition-all shadow-md active:scale-95 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-emerald-600 hover:text-white hover:border-transparent group">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    {loading ? "Analyzing..." : "Refresh Plans"}
                </Button>
            </div>

            {loading ? (
                <Card><CardContent className="py-12 text-center">Analyzing rotation options...</CardContent></Card>
            ) : data ? (
                <>
                    {/* Current Status */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {[
                          { label: "Current Crop", value: data.current_crop, icon: "Leaf", iconSrc: <Leaf className="h-6 w-6 text-emerald-500" />, bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                          { label: "Current Season", value: data.current_season, icon: "calendar_month", iconSrc: <span className="material-symbols-outlined text-[24px] text-amber-500">calendar_month</span>, bg: "bg-amber-500/10", border: "border-amber-500/20" },
                          { label: "Best Next Crop", value: data.suggestions[0]?.crop || '-', icon: "psychiatry", iconSrc: <span className="material-symbols-outlined text-[24px] text-blue-500">psychiatry</span>, bg: "bg-blue-500/10", border: "border-blue-500/20", valColor: "text-blue-500 dark:text-blue-400" },
                        ].map((stat, i) => (
                          <Card key={i} className={cn("border-border/50 shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1", i === 2 && "col-span-2 lg:col-span-1")}>
                              {i === 0 && <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />}
                              <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                                  <div className={cn("size-10 sm:size-12 rounded-xl flex items-center justify-center border shrink-0 shadow-inner", stat.bg, stat.border)}>
                                      {stat.iconSrc}
                                  </div>
                                  <div className="min-w-0">
                                      <p className="text-[10px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-[0.1em]">{stat.label}</p>
                                      <p className={cn("text-lg sm:text-2xl font-black text-foreground truncate mt-0.5", stat.valColor)}>{stat.value}</p>
                                  </div>
                              </CardContent>
                          </Card>
                        ))}
                    </div>

                    {/* Rotation Timeline */}
                    <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-xl">
                        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-500 text-lg">timeline</span>
                                Suggested Rotation Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex bg-muted/20 rounded-b-xl overflow-x-auto thin-scrollbar">
                                {data.timeline.map((item, idx) => (
                                    <div 
                                      key={idx} 
                                      className={cn(
                                        "flex-1 min-w-[200px] p-6 flex flex-col items-center border-r border-border/40 last:border-0 relative group transition-colors",
                                        item.status === 'current' ? "bg-emerald-500/[0.03]" : "hover:bg-muted/30"
                                      )}
                                    >
                                        {item.status === 'current' && (
                                            <div className="absolute top-0 inset-x-0 flex justify-center">
                                                <div className="h-1 w-2/3 bg-emerald-500 rounded-b-full shadow-[0_2px_10px_rgba(16,185,129,0.3)] animate-pulse" />
                                                <span className="absolute top-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Now</span>
                                            </div>
                                        )}
                                        
                                        <div className="size-14 rounded-2xl bg-background/50 flex items-center justify-center text-4xl mb-4 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                            {item.icon}
                                        </div>
                                        
                                        <h3 className="font-black text-lg text-foreground mb-1">{item.crop}</h3>
                                        
                                        <div className="flex flex-col items-center gap-1.5 mt-auto">
                                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">{item.season} Cycle</span>
                                            <span className="text-[10px] font-bold text-emerald-500/80 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
                                                {item.start_month} {item.start_year} - {item.end_month} {item.end_year}
                                            </span>
                                        </div>
                                        
                                        {idx < data.timeline.length - 1 && (
                                            <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-20 size-6 rounded-full bg-background border border-border/50 flex items-center justify-center shadow-sm">
                                                <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Suggestions */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 px-1">
                            <span className="material-symbols-outlined text-emerald-500 text-xl">recommend</span>
                            Top Rotation Suggestions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.suggestions.map((sug, idx) => (
                                <div key={idx} className={`p-6 rounded-2xl border relative flex flex-col h-full transition-all duration-300 group ${idx === 0
                                    ? 'bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1'
                                    : 'bg-card/60 backdrop-blur-xl border-border/50 hover:border-emerald-500/30 hover:-translate-y-1 hover:shadow-lg'
                                    }`}>
                                    {idx === 0 && (
                                        <div className="absolute -top-3 -right-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 z-10">
                                            <Star className="h-3 w-3 fill-white" />
                                            Top Pick
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-xl text-foreground">{sug.crop}</h3>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider inline-flex items-center gap-1 mt-1.5 bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                                                <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                                Best: {sug.season}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-emerald-500 mb-1">{sug.score}% Match</span>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`h-3 w-3 ${i < sug.rating.stars ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_2px_rgba(251,191,36,0.5)]' : 'text-muted-foreground/20'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <ul className="space-y-2.5 mb-6 flex-1 mt-2">
                                        {sug.reasons.slice(0, 3).map((r, i) => (
                                            <li key={i} className="text-[13px] flex items-start gap-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                                <div className="mt-0.5 bg-emerald-500/10 rounded-full p-0.5 shrink-0">
                                                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                                                </div>
                                                <span className="leading-snug">{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border/40">
                                        {sug.benefits.nitrogen_fix && (
                                            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-md border border-blue-500/20 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">air</span> Nitrogen Fixer
                                            </span>
                                        )}
                                        {sug.benefits.pest_break && (
                                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">pest_control</span> Pest Break
                                            </span>
                                        )}
                                        {sug.benefits.soil_structure && (
                                            <span className="text-[10px] font-bold bg-purple-500/10 text-purple-500 px-2.5 py-1 rounded-md border border-purple-500/20 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">landscape</span> Soil Structure
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Soil Health Tips */}
                        <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-xl h-full flex flex-col">
                            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10 shrink-0">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-amber-500" />
                                    Soil Health Tips
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex-1">
                                <div className="space-y-4">
                                    {data.soil_health_tips.map((tip, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl flex items-start gap-4 transition-all hover:scale-[1.01] shadow-sm ${tip.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 text-yellow-800 dark:text-yellow-200' :
                                            'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-200'
                                            }`}>
                                            <span className="text-2xl mt-0.5 filter drop-shadow-sm">{tip.icon}</span>
                                            <p className="text-sm leading-relaxed font-medium">{tip.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Crop History */}
                        <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-xl h-full flex flex-col relative group">
                            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10 shrink-0 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-500 text-lg">history</span>
                                    Crop History
                                </CardTitle>
                                {history.length > 0 && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleClearHistory}
                                        className="h-7 px-2 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[14px] mr-1">delete</span>
                                        Clear
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-6 flex-1">
                                {history.length > 0 ? (
                                    <div className="flex flex-wrap gap-2.5">
                                        {history.map((h, idx) => (
                                            <div key={idx} className="px-3.5 py-1.5 bg-background/80 border border-border/50 shadow-sm rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors hover:bg-muted">
                                                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">{h.season} {h.year}</span>
                                                <div className="w-px h-3 bg-border" />
                                                <span className="text-foreground">{h.crop}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-6 opacity-70">
                                        <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                            <span className="material-symbols-outlined text-2xl text-muted-foreground">history_toggle_off</span>
                                        </div>
                                        <p className="text-sm font-semibold">No history recorded</p>
                                        <p className="text-xs text-muted-foreground mt-1">Past crop cycles will appear here.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                <Card><CardContent className="py-12 text-center text-muted-foreground">Failed to load. Click Refresh.</CardContent></Card>
            )}
        </div>
    );
}
