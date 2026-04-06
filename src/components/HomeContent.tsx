"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ZipInput from "./ZipInput";
import "mapbox-gl/dist/mapbox-gl.css";

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
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function HomeContent() {
  const router = useRouter();
  const bgMapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgMapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  const [transition, setTransition] = useState<TransitionData | null>(null);
  const [phase, setPhase] = useState<"idle" | "overlay" | "fade">("idle");

  // Initialize background map
  useEffect(() => {
    if (!bgMapContainerRef.current) return;

    let cancelled = false;

    async function initMap() {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !bgMapContainerRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: bgMapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: SF_CENTER,
        zoom: 11.5,
        interactive: false,
        attributionControl: false,
      });

      bgMapRef.current = map;

      map.on("load", () => {
        if (!cancelled) {
          setMapReady(true);
        }
      });
    }

    initMap();

    return () => {
      cancelled = true;
      if (bgMapRef.current) {
        bgMapRef.current.remove();
        bgMapRef.current = null;
      }
    };
  }, []);

  const handleResult = useCallback((result: TransitionData) => {
    const map = bgMapRef.current;
    if (!map) {
      router.push(`/zip/${result.zip}/${result.supervisorId}`);
      return;
    }

    // Step 1: Fade out the overlay to reveal the map
    setOverlayFading(true);

    // Step 2: After overlay fades, add districts and fly
    setTimeout(() => {
      setTransition(result);

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

      const center = DISTRICT_CENTERS[result.district] ?? SF_CENTER;
      map.flyTo({ center, zoom: 13.5, duration: 2500, essential: true });

      map.once("moveend", () => {
        setPhase("overlay");
        setTimeout(() => setPhase("fade"), 1500);
        setTimeout(() => {
          router.push(`/zip/${result.zip}/${result.supervisorId}`);
        }, 2200);
      });
    }, 600);
  }, [router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background map — always present, covers full viewport */}
      <div
        ref={bgMapContainerRef}
        className={`fixed inset-0 z-0 transition-opacity duration-1000 ${
          mapReady ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: "100vw", height: "100vh" }}
      />

      {/* Semi-transparent overlay for readability */}
      <div
        className={`fixed inset-0 z-10 transition-opacity duration-600 ease-out ${
          overlayFading ? "opacity-0 pointer-events-none" : "opacity-100"
        } bg-white/80 dark:bg-zinc-950/80 backdrop-blur-[2px]`}
      />

      {/* Content — floats above overlay, no card background */}
      <div
        className={`relative z-20 w-full max-w-md text-center transition-opacity duration-500 ${
          overlayFading ? "opacity-0" : "opacity-100"
        }`}
      >
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          SF Supervisors
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          Get to know your supervisor: who funds them, how they vote, and whether they represent you.
        </p>

        <div className="mt-8">
          <ZipInput onResult={handleResult} />
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          Data from SF Ethics Commission, Legistar, and SF Dept of Elections
        </p>
      </div>

      {/* Supervisor overlay — shows after fly animation */}
      {(phase === "overlay" || phase === "fade") && transition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-2xl px-8 py-6 text-center shadow-xl flex flex-col items-center">
            {transition.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transition.photoUrl}
                alt={transition.supervisorName}
                className="w-20 h-20 rounded-full object-cover mb-3 ring-2 ring-white shadow-md"
              />
            )}
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              District {transition.district}
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {transition.supervisorName}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your Supervisor</p>
          </div>
        </div>
      )}

      {/* White fade-out before navigation */}
      {phase === "fade" && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-zinc-950 animate-fade-in" />
      )}
    </main>
  );
}
