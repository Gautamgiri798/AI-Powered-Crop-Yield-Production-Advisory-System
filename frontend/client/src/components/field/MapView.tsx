"use client";

import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  CircleMarker,
  Polyline,
  ZoomControl,
  useMapEvents,
  useMap,
} from "react-leaflet";
import * as turf from "@turf/turf";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import { useAuth } from "@/context/AuthContext";
import { useField } from "@/context/FieldContext";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import "./MapView.css";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

// ================= Map Click Handler =================
function MapClickHandler({
  onMapClick,
  isDrawing,
}: {
  onMapClick: (latlng: any) => void;
  isDrawing: boolean;
}) {
  useMapEvents({
    click(e) {
      if (isDrawing) onMapClick(e.latlng);
    },
  });
  return null;
}

// ================= Map Switcher Control =================
function MapSwitcher({
  mapType,
  setMapType,
  showNDVI = false,
  onNDVIToggle,
  isNDVIActive = false,
}: {
  mapType: string;
  setMapType: (t: string) => void;
  showNDVI?: boolean;
  onNDVIToggle?: () => void;
  isNDVIActive?: boolean;
}) {
  return (
    <div className="absolute bottom-3 right-3 z-[1000] pointer-events-none">
      <div className="flex items-center gap-0.5 p-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 shadow-xl pointer-events-auto">
        <button 
          onClick={() => setMapType("satellite")}
          className={cn(
            "flex items-center justify-center size-8 sm:size-9 rounded-md transition-all duration-300",
            mapType === "satellite" && !isNDVIActive
              ? "bg-emerald-500 text-white shadow-lg scale-105" 
              : "text-white/60 hover:text-white hover:bg-white/10"
          )}
          title="Satellite View"
        >
          <span className="material-symbols-outlined text-[16px] sm:text-[18px]">satellite_alt</span>
        </button>

        <button 
          onClick={() => setMapType("street")}
          className={cn(
            "flex items-center justify-center size-8 sm:size-9 rounded-md transition-all duration-300",
            mapType === "street" && !isNDVIActive
              ? "bg-sky-500 text-white shadow-lg scale-105" 
              : "text-white/60 hover:text-white hover:bg-white/10"
          )}
          title="Street View"
        >
          <span className="material-symbols-outlined text-[16px] sm:text-[18px]">map</span>
        </button>

        {showNDVI && (
          <button 
            onClick={onNDVIToggle}
            className={cn(
              "flex items-center justify-center size-8 sm:size-9 rounded-md transition-all duration-300",
              isNDVIActive
                ? "bg-indigo-500 text-white shadow-lg scale-105" 
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
            title="NDVI Analysis"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">visibility</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ================= Search Control =================
function SearchControl() {
  const map = useMap();
  React.useEffect(() => {
    const provider = new OpenStreetMapProvider();
    // @ts-ignore
    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      autoClose: true,
      keepResult: true,
    });
    map.addControl(searchControl);
    return () => { map.removeControl(searchControl); };
  }, [map]);
  return null;
}

// ================= Map Recenter Component =================
function MapRecenter({ center, zoom = 13 }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
    // Fix tiling issues on mobile
    setTimeout(() => {
        map.invalidateSize();
        window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [map, center, zoom]);
  return null;
}

// ================= Main Component =================
export default function MapView({
  cropType,
  soilType,
  irrigationType,
  readOnly = false,
  mapType: externalMapType,
  setMapType: externalSetMapType,
  showNDVI = false,
  onNDVIToggle,
  isNDVIActive = false,
}: {
  cropType?: string;
  soilType?: string;
  irrigationType?: string;
  readOnly?: boolean;
  mapType?: string;
  setMapType?: (type: string) => void;
  showNDVI?: boolean;
  onNDVIToggle?: () => void;
  isNDVIActive?: boolean;
}) {
  const { token } = useAuth();
  const { selectedField, setSelectedField, refreshFields } = useField();
  const [farmPolygon, setFarmPolygon] = useState<any[]>([]);
  const [fieldName, setFieldName] = useState("My Field");
  const [isDrawing, setIsDrawing] = useState(false);
  const [farmArea, setFarmArea] = useState(0);
  const [internalMapType, setInternalMapType] = useState("street");
  
  const mapType = externalMapType || internalMapType;
  const setMapType = externalSetMapType || setInternalMapType;
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Geolocation states
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [centerPosition, setCenterPosition] = useState<[number, number]>([20.5937, 78.9629]); // India center default
  const [currentZoom, setCurrentZoom] = useState(8);

  // Request user's location on mount
  React.useEffect(() => {
    if (!locationRequested && !selectedField) {
      setLocationRequested(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLoc: [number, number] = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            setUserLocation(userLoc);
            setCenterPosition(userLoc);
            setCurrentZoom(16);
            console.log("📍 User location detected:", userLoc);
          },
          (error) => {
            console.log("📍 Location access denied or unavailable, using default location");
            console.error(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      }
    }
  }, [locationRequested, selectedField]);

  // Load selected field polygon
  React.useEffect(() => {
    if (selectedField) {
      setFieldName(selectedField.name);
      if (selectedField.polygon && selectedField.polygon.coordinates) {
        const coords = selectedField.polygon.coordinates[0];
        if (coords) {
          // Convert [lon, lat] to [lat, lon]
          const latlngs = coords.map((c: any) => [c[1], c[0]]);
          // Remove last point if it duplicates first (closed loop)
          if (latlngs.length > 2 && latlngs[0][0] === latlngs[latlngs.length - 1][0] && latlngs[0][1] === latlngs[latlngs.length - 1][1]) {
            latlngs.pop();
          }
          setFarmPolygon(latlngs);

          // Calculate area
          try {
            const area = Number((turf.area(selectedField.polygon) / 10000).toFixed(2));
            setFarmArea(area);
          } catch (e) { console.error(e); }

          // Center map on the selected field
          if (latlngs.length > 0) {
            const fieldCenter: [number, number] = [latlngs[0][0], latlngs[0][1]];
            setCenterPosition(fieldCenter);
            setCurrentZoom(16);
          }

          setSubmitted(true);
        }
      }
    } else {
      // New field mode - use user location if available, otherwise default
      setFarmPolygon([]);
      setFarmArea(0);
      setFieldName("My Field");
      setSubmitted(false);
      if (userLocation) {
        setCenterPosition(userLocation);
      }
    }
  }, [selectedField, userLocation]);

  const handleMapClick = (latlng: any) => {
    if (isDrawing) {
      const newPoint = [latlng.lat, latlng.lng];
      const newPolygon = [...farmPolygon, newPoint];
      setFarmPolygon(newPolygon);

      if (newPolygon.length >= 3) {
        const coords = newPolygon.map((p) => [p[1], p[0]]);
        coords.push(coords[0]);
        setFarmArea(
          Number((turf.area(turf.polygon([coords])) / 10000).toFixed(2))
        );
      }
    }
  };

  // Toolbar
  const startDrawing = () => {
    setIsDrawing(true);
    setFarmPolygon([]);
    setFarmArea(0);
    setSubmitted(false);
  };
  const finishDrawing = () => {
    if (farmPolygon.length >= 3) {
      setIsDrawing(false);
      const coords = farmPolygon.map((p) => [p[1], p[0]]);
      coords.push(coords[0]);
      setFarmArea(
        Number((turf.area(turf.polygon([coords])) / 10000).toFixed(2))
      );
    } else showToast("Please select at least 3 points!", "error");
  };
  const clearFarm = () => {
    setFarmPolygon([]);
    setIsDrawing(false);
    setFarmArea(0);
    setSubmitted(false);
    setSelectedField(null);
  };
  const undoLastPoint = () => {
    if (farmPolygon.length > 0) setFarmPolygon(farmPolygon.slice(0, -1));
  };

  const requestLocation = () => {
    const fallbackIpLocation = async () => {
      try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
          const userLoc: [number, number] = [
            parseFloat(data.latitude),
            parseFloat(data.longitude),
          ];
          setUserLocation(userLoc);
          setCenterPosition(userLoc);
          setCurrentZoom(13);
          showToast("Approximate location found via IP.", "info");
        } else {
          showToast("Could not determine location automatically.", "error");
        }
      } catch (err) {
        showToast("Location service unavailable. Use search bar.", "error");
      }
    };

    if (!navigator.geolocation) {
      fallbackIpLocation();
      return;
    }

    showToast("Detecting precision GPS...", "info");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(userLoc);
        setCenterPosition(userLoc);
        setCurrentZoom(16);
        showToast("Precision location detected!", "success");
      },
      (error) => {
        console.warn("📍 Geolocation Error:", error);
        // Inform user about HTTPS requirement if applicable
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
           showToast("Precision GPS requires HTTPS. Using approximate location instead.", "info");
        } else {
           showToast("GPS failed. Using approximate location.", "info");
        }
        fallbackIpLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ================= Submit =================
  const handleSubmit = async () => {
    if (farmPolygon.length < 3) {
      showToast("Please draw a farm boundary first.", "error");
      return;
    }

    if (!cropType) {
      showToast("Please select a crop type.", "error");
      return;
    }

    if (!token) {
      showToast("Please log in to save your field.", "error");
      return;
    }

    const polygonGeoJSON = {
      type: "Polygon",
      coordinates: [
        [
          ...farmPolygon.map((p) => [p[1], p[0]]),
          [farmPolygon[0][1], farmPolygon[0][0]],
        ],
      ],
    };

    const farmData = {
      id: selectedField?.id,
      name: fieldName,
      polygon: polygonGeoJSON,
      cropType: cropType,
      soilType: soilType,
      irrigationType: irrigationType,
      area: farmArea,
    };

    try {
      setLoading(true);

      const data = await apiFetch<any>("/field/set_polygon", {
        method: "POST",
        body: JSON.stringify(farmData),
      });

      console.log("✅ Polygon saved:", data);
      setSubmitted(true);
      setIsDrawing(false);
      await refreshFields();
      showToast("Farm polygon saved successfully!", "success");
    } catch (err: any) {
      console.error("❌ Error saving field:", err);
      showToast(`Error saving: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const toastColors = {
    success: "bg-emerald-500/90 text-white",
    error: "bg-red-500/90 text-white",
    info: "bg-blue-500/90 text-white",
  };

  return (
    <div className="mapview-container">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg backdrop-blur-md transition-all animate-fade-in-up ${toastColors[toast.type]}`}>
          {toast.message}
        </div>
      )}
      {!readOnly && (
        <div className="toolbar gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-[#0b1120] border-b border-white/5 flex flex-wrap w-full justify-center z-20 relative">
          <button
            className="flex-1 min-w-[30%] sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 font-bold rounded-md px-1.5 py-1.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 text-white shadow-sm active:scale-95 text-[9px] sm:text-xs"
            onClick={startDrawing}
            disabled={isDrawing}
          >
            <span className="material-symbols-outlined text-[14px] sm:text-[18px]">edit_location</span>
            {isDrawing ? "Scan" : "Start"}
          </button>
          
          <button
            className="flex-1 min-w-[30%] sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 font-bold rounded-md px-1.5 py-1.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-white/5 text-white/90 border border-white/10 hover:bg-white/10 active:scale-95 text-[9px] sm:text-xs"
            onClick={undoLastPoint}
            disabled={!isDrawing || farmPolygon.length === 0}
          >
            <span className="material-symbols-outlined text-[14px] sm:text-[18px]">undo</span>
            Undo
          </button>
          
          <button
            className="flex-1 min-w-[30%] sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 font-bold rounded-md px-1.5 py-1.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-white/5 text-white/90 border border-white/10 hover:bg-white/10 active:scale-95 text-[9px] sm:text-xs"
            onClick={finishDrawing}
            disabled={!isDrawing || farmPolygon.length < 3}
          >
            <span className="material-symbols-outlined text-[14px] sm:text-[18px]">check_circle</span>
            Finish
          </button>
          
          <button 
            className="flex-1 min-w-[46%] sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 font-bold rounded-md px-1.5 py-1.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-rose-500/10 text-rose-400 border border-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-[9px] sm:text-xs" 
            onClick={clearFarm}
          >
            <span className="material-symbols-outlined text-[14px] sm:text-[18px]">delete</span>
            Clear
          </button>
          
          <button
            className="flex-1 min-w-[46%] sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 font-bold rounded-md px-1.5 py-1.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-white/5 text-white/90 border border-white/10 hover:bg-white/10 active:scale-95 text-[9px] sm:text-xs"
            onClick={requestLocation}
            title="My Location"
          >
            <span className="material-symbols-outlined text-[14px] sm:text-[18px]">my_location</span>
            Locate
          </button>
        </div>
      )}

      <div className="map-container relative">
        <MapContainer
          center={centerPosition}
          zoom={8}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
          dragging={true}
          touchZoom={true}
          scrollWheelZoom={true}
          doubleClickZoom={!readOnly}
        >
          <ZoomControl position="topright" />
          <MapRecenter center={centerPosition} zoom={currentZoom} />
          <SearchControl />
          <TileLayer
            key={mapType}
            url={
               mapType === "street"
                ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            }
            attribution={mapType === "street" ? "&copy; OSM" : "&copy; Esri"}
          />
          <MapClickHandler onMapClick={handleMapClick} isDrawing={isDrawing} />

          {farmPolygon.map((point, idx) => (
            <CircleMarker
              key={idx}
              center={point}
              radius={isDrawing ? 4 : 2}
              pathOptions={{
                color: "#ffffff",
                weight: 1,
                fillColor: isDrawing ? "#fbbf24" : "#10b981",
                fillOpacity: 1,
              }}
            />
          ))}

          {farmPolygon.length >= 2 && (
            <Polyline
              positions={farmPolygon}
              pathOptions={{
                color: isDrawing ? "#fbbf24" : "#10b981",
                weight: 2,
                dashArray: isDrawing ? "4,4" : undefined,
                opacity: 0.8,
              }}
            />
          )}

          {!isDrawing && farmPolygon.length >= 3 && (
            <Polygon
              positions={farmPolygon}
              pathOptions={{ 
                color: "#fbbf24", /* Surveyor yellow for high contrast against green foliage */
                weight: 1.5,
                fillColor: "#10b981",
                fillOpacity: 0.15,
                className: "clean-polygon"
              }}
            />
          )}
        </MapContainer>

        <MapSwitcher 
          mapType={mapType} 
          setMapType={setMapType} 
          showNDVI={showNDVI}
          onNDVIToggle={onNDVIToggle}
          isNDVIActive={isNDVIActive}
        />
      </div>

      <div className="area-display py-2 sm:py-3 px-3 sm:px-4 text-[9px] sm:text-[11px]">
        {farmArea > 0 ? (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <span className="opacity-50">FIELD AREA:</span>
            <span className="value text-emerald-400 font-black">{farmArea} HECTARES</span>
            {selectedField && <span className="text-white/20 text-[8px] sm:text-[10px] tracking-normal lowercase">// {selectedField.name}</span>}
          </div>
        ) : "NO FARM SELECTED"}
      </div>

      {farmPolygon.length >= 3 && !isDrawing && !readOnly ? (
        <div className="submit-section p-3 sm:p-4 bg-[#0b1120] border-t border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {!submitted || selectedField ? (
            <div className="flex flex-col sm:flex-row gap-2.5 w-full items-stretch sm:items-center max-w-2xl mx-auto">
              <div className="flex-1 relative flex items-center">
                <span className="absolute left-3 material-symbols-outlined text-white/30 text-xs pointer-events-none">edit</span>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => {
                    setFieldName(e.target.value);
                    if (submitted) setSubmitted(false);
                  }}
                  placeholder="Field Registry Name"
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-3 py-2.5 text-white text-xs font-bold outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all min-w-[180px]"
                />
              </div>
              <button
                className="btn-primary sm:w-auto px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-emerald-900/20"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "SAVING..." : (selectedField ? "Update Registry" : "Execute Entry")}
              </button>
            </div>
          ) : null}
          {submitted && (
            <div className="text-emerald-500 font-bold text-center flex items-center justify-center gap-1.5 pt-1 text-[11px] uppercase tracking-wider">
               <span className="material-symbols-outlined text-sm">verified</span>
               Telemetry Saved
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
