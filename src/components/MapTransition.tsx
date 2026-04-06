
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

interface MapTransitionProps {
  district: number;
  supervisorName: string;
  photoUrl?: string | null;
  onComplete?: () => void;
}

// Approximate centroids for each supervisor district
const DISTRICT_CENTERS: Record<number, [number, number]> = {
  1: [-122.4745, 37.7795],
  2: [-122.4370, 37.7945],
  3: [-122.4060, 37.7960],
  4: [-122.4940, 37.7550],
  5: [-122.4310, 37.7730],
  6: [-122.3990, 37.7780],
  7: [-122.4590, 37.7350],
  8: [-122.4350, 37.7560],
  9: [-122.4130, 37.7490],
  10: [-122.3830, 37.7330],
  11: [-122.4430, 37.7210],
};

const SF_CENTER: [number, number] = [-122.4194, 37.7749];

export default function MapTransition({ district, supervisorName, photoUrl, onComplete }: MapTransitionProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [phase, setPhase] = useState<"map" | "overlay" | "fade">("map");

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: SF_CENTER,
      zoom: 11.5,
      interactive: false,
      attributionControl: false,
      trackResize: false,
      fadeDuration: 0,
    });

    map.on("load", () => {
      map.addSource("districts", {
        type: "geojson",
        data: "/data/district_boundaries.geojson",
      });

      map.addLayer({
        id: "district-fills",
        type: "fill",
        source: "districts",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "district"], district],
            "rgba(59, 130, 246, 0.35)",
            "rgba(0, 0, 0, 0.05)",
          ],
          "fill-opacity": 0.7,
        },
      });

      map.addLayer({
        id: "district-outlines",
        type: "line",
        source: "districts",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "district"], district],
            "#2563eb",
            "#94a3b8",
          ],
          "line-width": [
            "case",
            ["==", ["get", "district"], district],
            3,
            1,
          ],
        },
      });

      // Fly to the district
      const center = DISTRICT_CENTERS[district] ?? SF_CENTER;
      map.flyTo({
        center,
        zoom: 13.5,
        duration: 2500,
        essential: true,
      });

      // Show overlay after fly animation
      setTimeout(() => setPhase("overlay"), 2000);

      // Fade to white after showing overlay
      setTimeout(() => setPhase("fade"), 3500);

      // Complete
      setTimeout(() => onCompleteRef.current?.(), 4200);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-100">
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Overlay with supervisor info */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
          phase === "overlay" || phase === "fade" ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 text-center shadow-xl flex flex-col items-center">
          {photoUrl && (
            
            <img
              src={photoUrl}
              alt={supervisorName}
              className="w-20 h-20 rounded-full object-cover mb-3 ring-2 ring-white shadow-md"
            />
          )}
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
            District {district}
          </p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {supervisorName}
          </p>
          <p className="text-sm text-zinc-500 mt-1">Your Supervisor</p>
        </div>
      </div>

      {/* White fade-out */}
      <div
        className={`absolute inset-0 bg-zinc-50 transition-opacity duration-700 ${
          phase === "fade" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
