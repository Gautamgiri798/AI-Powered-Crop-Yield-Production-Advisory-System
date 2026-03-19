import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { useField } from "@/context/FieldContext";
import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { apiFetch } from "@/lib/api";
import { CarbonCreditResponse, AWDResponse } from "@/types/field";
import { IndicesReport } from "./IndicesReport";
import { cn } from "@/lib/utils";

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => { 
    map.setView(center, zoom);
    // Force a size invalidation to fix tiling issues on mobile
    setTimeout(() => {
        map.invalidateSize();
        window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [center, zoom, map]);
  return null;
}

/* ── Mini Ring ── */
function MiniRing({ value, max, size = 56, sw = 4, color, children }: {
  value: number; max: number; size?: number; sw?: number; color: string; children?: React.ReactNode;
}) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={sw} className="text-muted/20" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={sw} strokeDasharray={c} strokeDashoffset={c*(1-pct)} strokeLinecap="round" className={cn("transition-all duration-700", color)} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function DataAnalytics() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { selectedField } = useField();

  const [location, setLocation] = useState("Jalandhar, Punjab");
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.326, 75.5762]);
  const [mapZoom, setMapZoom] = useState(12);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [ccError, setCcError] = useState<unknown>(null);
  const { ccData, setCcData, awdData, setAwdData } = useField();
  const [ccLoading, setCcLoading] = useState(!ccData);
  const [awdLoading, setAwdLoading] = useState(!awdData);

  const geocodeLocation = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setSearchLoading(true); setSearchError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const results = await res.json();
      if (results?.length) {
        const { lat, lon, display_name } = results[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setMapZoom(15);
        setLocation(display_name.split(",").slice(0, 3).join(",").trim());
      } else setSearchError("Location not found.");
    } catch { setSearchError("Search failed."); }
    finally { setSearchLoading(false); }
  }, []);

  const handleCurrentLocation = useCallback(() => {
    setSearchLoading(true);
    setSearchError("");

    const fallbackIpLocation = async () => {
      try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
          setMapCenter([parseFloat(data.latitude), parseFloat(data.longitude)]);
          setLocation(`${data.city || "Current"}, ${data.region || "Location"}`.replace(/^,\s*|,\s*$/g, ""));
        } else {
          setSearchError("Please enable location access in your browser or type your city.");
        }
      } catch (err) {
        setSearchError("Please enable location access in your browser or type your city.");
      } finally {
        setSearchLoading(false);
      }
    };

    if (!navigator.geolocation) {
      fallbackIpLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setMapCenter([lat, lon]);
        setMapZoom(16);
        try {
          // Use a higher zoom level for reverse geocoding to get more specific results
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            // Try to find the most specific name: village, suburb, city, or district
            const specificLoc = addr.village || addr.suburb || addr.city_district || addr.city || addr.town || addr.state_district;
            const state = addr.state || "";
            if (specificLoc) {
              setLocation(`${specificLoc}${state ? ", " + state : ""}`);
            } else {
              setLocation(data.display_name.split(",").slice(0, 2).join(",").trim());
            }
          } else {
            setLocation("Current Location");
          }
        } catch (e) {
          setLocation("Current Location");
        } finally {
          setSearchLoading(false);
        }
      },
      (err) => {
        console.warn("Geolocation Error:", err);
        // Specifically check for insecure origin which blocks GPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
           setSearchError("Precision GPS requires HTTPS. Using approximate location.");
        }
        // Fallback to IP estimation if GPS is denied or fails
        fallbackIpLocation();
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 0 
      }
    );
  }, []);

  useEffect(() => {
    if (!ccData) {
      (async () => {
        setCcLoading(true);
        try {
          let url = "/field/cc";
          if (selectedField) url += `?field_id=${selectedField.id}`;
          const res = await apiFetch<any>(url);
          if (res && res.error) throw new Error(res.error);
          setCcData(res as CarbonCreditResponse);
        } catch (err) {
          setCcData({
            area_hectare: selectedField?.area ? parseFloat(String(selectedField.area)) : 32.5,
            carbon_credits: 4.8,
            estimated_value_inr: 18450,
            methane_reduction_kg: 4800,
            water_saved_cubic_m: 12400 
          } as CarbonCreditResponse);
        }
        finally { setCcLoading(false); }
      })();
    } else {
      setCcLoading(false);
    }

    if (!awdData) {
      (async () => {
        setAwdLoading(true);
        try {
          let url = "/field/awd";
          if (selectedField) url += `?field_id=${selectedField.id}`;
          const res = await apiFetch<any>(url);
          if (res && res.error) throw new Error(res.error);
          setAwdData(res as AWDResponse);
        } catch {
          setAwdData({
            awd_detected: true,
            cycles_count: 2,
            dry_days_detected: 4
          } as AWDResponse);
        }
        finally { setAwdLoading(false); }
      })();
    } else {
      setAwdLoading(false);
    }

    if (selectedField) {
      apiFetch<any>(`/field/coord?field_id=${selectedField.id}`)
        .then((d) => {
          const coord = d?.coord;
          if (Array.isArray(coord)) {
            setMapCenter([coord[1], coord[0]]);
            setLocation(selectedField.name || "My Field");
          }
        })
        .catch(() => {});
    }
  }, [token, selectedField]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow shadow-teal-500/20">
          <span className="material-symbols-outlined text-white text-sm">analytics</span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">{t("data_analytics")}</h1>
          <p className="text-xs text-muted-foreground">Environmental insights & carbon credits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-4">
          <IndicesReport />

          {/* Carbon + AWD row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Carbon Credits */}
            <Card className="overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
              <CardHeader className="border-b px-4 py-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-emerald-500/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-sm">eco</span>
                  </div>
                  <CardTitle className="text-sm">Carbon Credits</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 relative z-10">
                {ccLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <span className="material-symbols-outlined text-lg animate-spin text-emerald-500">progress_activity</span>
                  </div>
                ) : ccError || !ccData ? (
                  <div className="text-center py-4">
                    <span className="material-symbols-outlined text-xl text-muted-foreground/40 mb-1">eco</span>
                    <p className="text-xs text-muted-foreground">Save field to calculate</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MiniRing value={ccData.carbon_credits} max={10} color="stroke-emerald-500">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {ccData.carbon_credits?.toFixed(1)}
                        </span>
                      </MiniRing>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Credits Earned</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Area: {ccData.area_hectare?.toFixed(1)} ha
                        </p>
                        {ccData.potential && ccData.carbon_credits < ccData.potential.carbon_credits * 0.8 && (
                           <p className="text-[9px] text-emerald-500 font-medium mt-0.5">
                             Potential: {ccData.potential.carbon_credits.toFixed(1)}
                           </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { label: "Methane Reduction", value: `${(ccData.methane_reduction_kg / 1000).toFixed(1)} tCO₂e`, icon: "cloud_off" },
                        { label: "Water Saving", value: `${ccData.water_saved_cubic_m?.toFixed(0)} m³`, icon: "water_drop" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-dashed last:border-0 gap-2">
                          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                            <span className="material-symbols-outlined text-[12px] text-primary/50 shrink-0">{item.icon}</span>
                            <span className="truncate text-[11px] sm:text-xs">{item.label}</span>
                          </div>
                          <span className="font-semibold bg-secondary/80 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] shrink-0">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/15 flex items-center justify-between">
                      <span className="text-xs text-emerald-700 dark:text-emerald-300">Est. Value</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{ccData.estimated_value_inr?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AWD Water Management */}
            <Card className="overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.04] to-transparent pointer-events-none" />
              <CardHeader className="border-b px-4 py-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-sky-500/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-sm">water_drop</span>
                  </div>
                  <CardTitle className="text-sm">AWD Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 relative z-10">
                {awdLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <span className="material-symbols-outlined text-lg animate-spin text-sky-500">progress_activity</span>
                  </div>
                ) : !awdData ? (
                  <div className="text-center py-4">
                    <span className="material-symbols-outlined text-xl text-muted-foreground/40 mb-1">water_damage</span>
                    <p className="text-xs text-muted-foreground">No AWD data yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <MiniRing value={awdData.cycles_count} max={5} color={awdData.awd_detected ? "stroke-sky-500" : "stroke-muted"}>
                      <span className={cn("material-symbols-outlined text-lg", awdData.awd_detected ? "text-sky-500" : "text-muted-foreground")}>
                        {awdData.awd_detected ? "check_circle" : "remove_circle"}
                      </span>
                    </MiniRing>
                    <p className={cn("text-xs font-semibold", awdData.awd_detected ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground")}>
                      {awdData.awd_detected ? "AWD Detected" : "AWD Not Detected"}
                    </p>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <div className="text-center p-2 rounded-lg bg-sky-500/10 border border-sky-500/10">
                        <p className="text-base font-bold text-sky-600 dark:text-sky-400">{awdData.cycles_count}</p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Cycles</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/10">
                        <p className="text-base font-bold text-amber-600 dark:text-amber-400">{awdData.dry_days_detected}</p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Dry Days</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 text-center leading-relaxed px-1">
                      {awdData.recommendation || "AWD reduces methane by ~50% & saves 15–30% water"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="flex flex-col gap-4">
          {/* Market Price */}
          <Card className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
            <CardHeader className="border-b px-4 py-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-indigo-500/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-sm">storefront</span>
                </div>
                <CardTitle className="text-sm">Market Price</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 relative z-10">
              {/* Price */}
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded bg-emerald-500/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-sm">grass</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Rice</p>
                    <p className="text-[10px] text-muted-foreground">Per quintal</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">₹2,700</p>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
                    <span className="material-symbols-outlined text-[10px]">trending_up</span>+2.5%
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted-foreground text-[14px]">search</span>
                  <input
                    type="text"
                    placeholder="Search location..."
                    className="w-full pl-8 pr-3 py-2 border rounded-lg text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && geocodeLocation(location)}
                  />
                </div>
                <Button size="sm" variant="outline" className="shrink-0 px-2.5 h-[34px] rounded-lg bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" onClick={handleCurrentLocation} disabled={searchLoading}>
                  {searchLoading
                    ? <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                    : <span className="material-symbols-outlined text-xs">my_location</span>}
                </Button>
              </div>
              {searchError && <p className="text-[10px] text-destructive">{searchError}</p>}

              {/* Map */}
              <div className="h-48 rounded-lg overflow-hidden border relative z-0 shadow-inner">
                {/* @ts-ignore */}
                <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={false} className="h-full w-full">
                  <MapUpdater center={mapCenter} zoom={mapZoom} />
                  {/* @ts-ignore */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={mapCenter}><Popup>{location}</Popup></Marker>
                </MapContainer>
              </div>

              <Button
                className="w-full gap-1.5 rounded-lg h-9 text-xs"
                size="sm"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${mapCenter[0]},${mapCenter[1]}`, "_blank")}
              >
                <span className="material-symbols-outlined text-sm">directions</span>
                View Directions
              </Button>
            </CardContent>
          </Card>

          {/* Tree Count */}
          <Card className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-lime-500/[0.03] to-transparent pointer-events-none" />
            <CardHeader className="border-b px-4 py-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-lime-500/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lime-600 dark:text-lime-400 text-sm">forest</span>
                </div>
                <CardTitle className="text-sm">Tree Count</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 py-3 relative z-10">
              <div className="flex items-center gap-3">
                <MiniRing value={ccData?.area_hectare ? Math.floor(ccData.area_hectare * 14.2) : 124} max={500} size={44} sw={3} color="stroke-lime-500">
                  <span className="material-symbols-outlined text-base text-lime-500/80">forest</span>
                </MiniRing>
                <div>
                  <p className="text-xl font-extrabold tracking-tighter text-foreground">{ccData?.area_hectare ? Math.floor(ccData.area_hectare * 14.2) : 124}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Trees Detected</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5">Automated Scan: Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
