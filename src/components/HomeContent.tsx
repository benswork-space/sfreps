"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ZipInput from "./ZipInput";

interface TransitionData {
  zip: string;
  supervisorId: string;
  district: number;
  supervisorName: string;
  photoUrl: string | null;
}

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

export default function HomeContent() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [phase, setPhase] = useState<"idle" | "flying" | "overlay" | "fade">("idle");
  const [transitionData, setTransitionData] = useState<TransitionData | null>(null);

  // Initialize ONE map instance via dynamic import
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");

      if (cancelled || !mapContainerRef.current) return;

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: SF_CENTER,
        zoom: 11.5,
        interactive: false,
        attributionControl: false,
      });

      map.on("load", () => {
        if (!cancelled) {
          mapRef.current = map;
          setMapReady(true);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleResult = useCallback((result: TransitionData) => {
    setTransitionData(result);
    const map = mapRef.current;
    if (!map) {
      router.push(`/zip/${result.zip}/${result.supervisorId}`);
      return;
    }

    // Add district boundaries for the fly animation
    if (!map.getSource("districts")) {
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
            ["==", ["get", "district"], result.district],
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
            ["==", ["get", "district"], result.district],
            "#2563eb",
            "#94a3b8",
          ],
          "line-width": [
            "case",
            ["==", ["get", "district"], result.district],
            3,
            1,
          ],
        },
      });
    }

    // Hide the content card and overlay, start flying
    setPhase("flying");

    const center = DISTRICT_CENTERS[result.district] ?? SF_CENTER;
    map.flyTo({ center, zoom: 13.5, duration: 2500, essential: true });

    map.once("moveend", () => {
      setPhase("overlay");
      setTimeout(() => setPhase("fade"), 1500);
      setTimeout(() => {
        router.push(`/zip/${result.zip}/${result.supervisorId}`);
      }, 2200);
    });
  }, [router]);

  const isFlying = phase !== "idle";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      {/* Map container — fixed, explicit dimensions */}
      <div
        ref={mapContainerRef}
        className={`fixed inset-0 z-0 transition-opacity duration-700 ${mapReady ? "opacity-100" : "opacity-0"}`}
        style={{ width: "100vw", height: "100vh" }}
      />

      {/* Semi-transparent overlay — hides during fly animation to show the map */}
      <div
        className={`fixed inset-0 z-10 transition-opacity duration-500 ${
          isFlying ? "opacity-0 pointer-events-none" : "opacity-100"
        } bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[2px]`}
      />

      {/* Content card — hides during fly animation */}
      <main
        className={`relative z-20 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-12 text-center w-full transition-opacity duration-300 ${
          isFlying ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="bg-zinc-800/80 sm:bg-black/50 sm:backdrop-blur-md rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-6 sm:py-10 flex flex-col items-center gap-4 sm:gap-6 max-w-md w-full">
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              SF Supervisors
            </h1>
            <p className="text-base sm:text-xl text-white/90 max-w-sm leading-relaxed">
              Get to know your supervisor: who funds them, how they vote, and whether they represent you.
            </p>
          </div>

          <ZipInput onResult={handleResult} />

          <p className="text-xs sm:text-sm text-white/60 max-w-sm hidden sm:block">
            Enter your San Francisco ZIP code to see your district supervisor, their campaign donors,
            voting record, and how well they align with your neighborhood.
          </p>
        </div>
      </main>

      {/* Footer — hides during animation */}
      <footer
        className={`relative z-20 pb-4 sm:pb-6 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 transition-opacity duration-300 ${
          isFlying ? "opacity-0" : "opacity-100"
        }`}
      >
        Data from SF Ethics Commission, Legistar, and SF Dept of Elections
      </footer>

      {/* Transition overlay — shows supervisor info then fades to white */}
      {(phase === "overlay" || phase === "fade") && transitionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-2xl px-8 py-6 text-center shadow-xl flex flex-col items-center">
            {transitionData.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transitionData.photoUrl}
                alt={transitionData.supervisorName}
                className="w-20 h-20 rounded-full object-cover mb-3 ring-2 ring-white shadow-md"
              />
            )}
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              District {transitionData.district}
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {transitionData.supervisorName}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your Supervisor</p>
          </div>
        </div>
      )}

      {/* White fade-out */}
      {phase === "fade" && (
        <div className="fixed inset-0 z-[60] bg-zinc-50 dark:bg-zinc-950 animate-fade-in" />
      )}
    </div>
  );
}
