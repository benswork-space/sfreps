
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ZipInput from "./ZipInput";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const SF_CENTER: [number, number] = [-122.4194, 37.7749];

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

interface LookupResult {
  zip: string;
  supervisorId: string;
  district: number;
  supervisorName: string;
  photoUrl: string | null;
}

type Phase = "idle" | "flying" | "overlay" | "dissolving";

export default function HomeContent() {
  const router = useRouter();
  const [overlayFading, setOverlayFading] = useState(false);
  const [transition, setTransition] = useState<LookupResult | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  // Background map
  const bgMapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgMapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize background map — copied from reference project
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

  // Handle ZIP submit — fade overlay, then fly map
  const handleResult = useCallback(
    (result: LookupResult) => {
      const map = bgMapRef.current;
      if (!map) {
        router.push(`/zip/${result.zip}/${result.supervisorId}`);
        return;
      }

      // Fade out the white overlay to reveal the map
      setOverlayFading(true);

      // After overlay fades, start the map transition
      setTimeout(() => {
        setTransition(result);

        // Add district boundaries
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

        setPhase("flying");

        const center = DISTRICT_CENTERS[result.district] ?? SF_CENTER;
        map.flyTo({ center, zoom: 13.5, duration: 2500, essential: true });

        map.once("moveend", () => {
          setPhase("overlay");
        });
      }, 600);
    },
    [router],
  );

  // Start dissolve timer when overlay phase begins
  useEffect(() => {
    if (phase !== "overlay") return;
    const timer = setTimeout(() => {
      setPhase("dissolving");
      setTimeout(() => {
        if (transition) {
          router.push(`/zip/${transition.zip}/${transition.supervisorId}`);
        }
      }, 700);
    }, 2500);
    return () => clearTimeout(timer);
  }, [phase, transition, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background map — always present, covers full viewport */}
      <div
        ref={bgMapContainerRef}
        className={`fixed inset-0 z-0 transition-opacity duration-1000 ${
          mapReady ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: "100vw", height: "100vh", background: "#e5e7eb" }}
      />

      {/* Semi-transparent overlay for readability */}
      <div
        className={`fixed inset-0 z-10 transition-opacity duration-600 ease-out ${
          overlayFading
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        } bg-white/80 backdrop-blur-[2px]`}
      />

      {/* Content — floats above map and overlay */}
      <div
        className={`relative z-20 w-full max-w-md text-center transition-opacity duration-500 ${
          overlayFading ? "opacity-0" : "opacity-100"
        }`}
      >
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          SF Supervisors
        </h1>
        <p className="mt-3 text-lg text-zinc-600">
          Get to know your supervisor: who funds them, how they vote, and
          whether they represent you.
        </p>

        <div className="mt-8">
          <ZipInput onResult={handleResult} />
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          Data from SF Ethics Commission, Legistar, and SF Dept of Elections
        </p>
      </div>

      {/* Transition overlay — shows after fly animation */}
      {phase !== "idle" && transition && (
        <div className="fixed inset-0 z-50">
          {/* Rep info overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
              phase === "overlay"
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="mx-4 max-w-sm rounded-2xl bg-white/90 px-6 py-8 text-center shadow-xl backdrop-blur-sm">
              <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                District {transition.district}
              </p>
              <div className="mt-3 flex justify-center">
                {transition.photoUrl && (
                  
                  <img
                    src={transition.photoUrl}
                    alt={transition.supervisorName}
                    className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-md"
                  />
                )}
              </div>
              <p className="mt-3 text-xl font-bold text-zinc-900">
                {transition.supervisorName}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Your Supervisor</p>
            </div>
          </div>

          {/* Dissolve-to-white overlay */}
          <div
            className={`absolute inset-0 bg-white transition-opacity duration-700 ease-in ${
              phase === "dissolving" ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        </div>
      )}
    </main>
  );
}
