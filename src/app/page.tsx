"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const SF_CENTER: [number, number] = [-122.4194, 37.7749];
const DISTRICT_CENTERS: Record<number, [number, number]> = {
  1: [-122.4745, 37.7795], 2: [-122.4370, 37.7945], 3: [-122.4060, 37.7960],
  4: [-122.4940, 37.7550], 5: [-122.4310, 37.7730], 6: [-122.3990, 37.7780],
  7: [-122.4590, 37.7350], 8: [-122.4350, 37.7560], 9: [-122.4130, 37.7490],
  10: [-122.3830, 37.7330], 11: [-122.4430, 37.7210],
};

interface ZipEntry { zip: string; district: number; ratio: number; }

export default function Home() {
  const router = useRouter();
  const bgMapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgMapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [zipLookup, setZipLookup] = useState<ZipEntry[] | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Load ZIP lookup
  useEffect(() => {
    fetch("/data/zip_lookup.json")
      .then((r) => r.json())
      .then((data) => setZipLookup(data))
      .catch(() => {});
  }, []);

  // Initialize background map — desktop only
  useEffect(() => {
    if (isMobile || !bgMapContainerRef.current) return;
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
      map.on("load", () => { if (!cancelled) setMapReady(true); });
    }

    initMap();
    return () => { cancelled = true; bgMapRef.current?.remove(); bgMapRef.current = null; };
  }, [isMobile]);

  // Handle submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) { setError("Please enter a 5-digit ZIP code."); return; }
    if (!zipLookup) { setError("Loading..."); return; }
    const matches = zipLookup.filter((entry) => entry.zip === zip);
    if (!matches.length) { setError("Not a SF ZIP code."); return; }
    const best = matches.reduce((a, b) => (a.ratio > b.ratio ? a : b));

    const map = bgMapRef.current;
    if (!map) {
      // Mobile or map not ready — navigate directly
      router.push(`/zip/${zip}/district-${best.district}`);
      return;
    }

    // Desktop — fly animation
    setOverlayFading(true);
    setTimeout(() => {
      const center = DISTRICT_CENTERS[best.district] ?? SF_CENTER;
      map.flyTo({ center, zoom: 13.5, duration: 2500, essential: true });
      map.once("moveend", () => {
        setTimeout(() => router.push(`/zip/${zip}/district-${best.district}`), 1500);
      });
    }, 600);
  }, [zip, zipLookup, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 bg-white">
      {/* Background map — desktop only */}
      {!isMobile && (
        <div
          ref={bgMapContainerRef}
          className={`fixed inset-0 z-0 transition-opacity duration-1000 ${mapReady ? "opacity-100" : "opacity-0"}`}
          style={{ width: "100vw", height: "100vh" }}
        />
      )}

      {/* Semi-transparent overlay — desktop only */}
      {!isMobile && (
        <div className={`fixed inset-0 z-10 transition-opacity duration-600 ease-out ${overlayFading ? "opacity-0 pointer-events-none" : "opacity-100"} bg-white/80 backdrop-blur-[2px]`} />
      )}

      {/* Content */}
      <div className={`relative z-20 w-full max-w-md text-center transition-opacity duration-500 ${overlayFading ? "opacity-0" : "opacity-100"}`}>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-zinc-900">SF Supervisors</h1>
        <p className="mt-3 text-lg text-zinc-600">Get to know your supervisor: who funds them, how they vote, and whether they represent you.</p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col items-center gap-3">
          <div className="flex w-full max-w-xs gap-2">
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5}
              placeholder="Enter ZIP code" value={zip}
              onChange={(e) => { setZip(e.target.value.replace(/\D/g, "").slice(0, 5)); setError(""); }}
              className="flex-1 rounded-full border border-zinc-300 bg-white px-5 py-3 text-center text-lg font-medium tracking-widest outline-none placeholder:tracking-normal focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              aria-label="ZIP code"
            />
            <button type="submit" className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-800">Go</button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
        <p className="mt-6 text-sm text-zinc-500">Data from SF Ethics Commission, Legistar, and SF Dept of Elections</p>
      </div>
    </main>
  );
}
