import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const SF_CENTER: [number, number] = [-122.4194, 37.7749];
const DISTRICT_CENTERS: Record<number, [number, number]> = {
  1: [-122.4745, 37.7795], 2: [-122.4370, 37.7945], 3: [-122.4060, 37.7960],
  4: [-122.4940, 37.7550], 5: [-122.4310, 37.7730], 6: [-122.3990, 37.7780],
  7: [-122.4590, 37.7350], 8: [-122.4350, 37.7560], 9: [-122.4130, 37.7490],
  10: [-122.3830, 37.7330], 11: [-122.4430, 37.7210],
};

interface ZipEntry { zip: string; district: number; ratio: number; }
interface SupervisorInfo { district: number; name: string; }

export default function HomePage() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [zipLookup, setZipLookup] = useState<ZipEntry[] | null>(null);
  const [supervisors, setSupervisors] = useState<Record<number, SupervisorInfo>>({});
  const [phase, setPhase] = useState<"idle" | "flying" | "overlay" | "dissolving">("idle");
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);

  useEffect(() => { document.title = "SFReps — Who Pays for Your Supervisor?"; }, []);

  // Load ZIP lookup and supervisor names
  useEffect(() => {
    fetch("/data/zip_lookup.json").then((r) => r.json()).then(setZipLookup).catch(() => {});
    fetch("/data/supervisors_index.json").then((r) => r.json()).then((data: SupervisorInfo[]) => {
      const map: Record<number, SupervisorInfo> = {};
      for (const s of data) map[s.district] = s;
      setSupervisors(map);
    }).catch(() => {});
  }, []);

  // Detect mobile — skip Mapbox entirely on touch devices to prevent Chrome crash
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  // Initialize map — desktop only
  useEffect(() => {
    if (isMobile || !mapContainerRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: SF_CENTER,
      zoom: 11.5,
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;
    map.on("load", () => setMapReady(true));
    return () => { map.remove(); mapRef.current = null; };
  }, [isMobile]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) { setError("Please enter a 5-digit ZIP code."); return; }
    if (!zipLookup) { setError("Loading data..."); return; }
    const matches = zipLookup.filter((entry) => entry.zip === zip);
    if (!matches.length) { setError("Not an SF ZIP. Try a 94xxx code."); return; }
    const best = matches.reduce((a, b) => (a.ratio > b.ratio ? a : b));
    setSelectedDistrict(best.district);

    const map = mapRef.current;
    if (!map || isMobile) { navigate(`/zip/${zip}/district-${best.district}`); return; }

    setOverlayFading(true);
    setTimeout(() => {
      if (!map.getSource("districts")) {
        map.addSource("districts", { type: "geojson", data: "/data/district_boundaries.geojson" });
        map.addLayer({
          id: "district-fills", type: "fill", source: "districts",
          paint: {
            "fill-color": ["case", ["==", ["get", "district"], best.district], "rgba(59,130,246,0.35)", "rgba(0,0,0,0.05)"],
            "fill-opacity": 0.7,
          },
        });
        map.addLayer({
          id: "district-outlines", type: "line", source: "districts",
          paint: {
            "line-color": ["case", ["==", ["get", "district"], best.district], "#2563eb", "#94a3b8"],
            "line-width": ["case", ["==", ["get", "district"], best.district], 3, 1],
          },
        });
      }

      setPhase("flying");
      const center = DISTRICT_CENTERS[best.district] ?? SF_CENTER;
      map.flyTo({ center, zoom: 13, duration: 2500, essential: true });
      map.once("moveend", () => setPhase("overlay"));
    }, 600);
  }, [zip, zipLookup, navigate]);

  useEffect(() => {
    if (phase !== "overlay") return;
    const t = setTimeout(() => {
      setPhase("dissolving");
      setTimeout(() => {
        if (selectedDistrict !== null)
          navigate(`/zip/${zip}/district-${selectedDistrict}`);
      }, 700);
    }, 2000);
    return () => clearTimeout(t);
  }, [phase, selectedDistrict, zip, navigate]);

  const supName = selectedDistrict ? supervisors[selectedDistrict]?.name : null;

  return (
    <>
      {/* Map — desktop only, not rendered on mobile at all */}
      {!isMobile && (
        <div
          ref={mapContainerRef}
          className={`transition-opacity duration-1000 ${mapReady ? "opacity-100" : "opacity-0"}`}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        />
      )}

      {/* Overlay — desktop: translucent over map, mobile: light background */}
      <div
        className={`transition-opacity duration-500 ease-out ${overlayFading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, background: isMobile ? "#f8f8f8" : "rgba(255,255,255,0.82)", backdropFilter: isMobile ? "none" : "blur(2px)", WebkitBackdropFilter: isMobile ? "none" : "blur(2px)" }}
      />

      {/* Content — use fixed positioning to avoid min-h-screen issues on mobile */}
      <div
        className={`transition-opacity duration-500 ${overlayFading ? "opacity-0" : "opacity-100"}`}
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      >
        <div className="w-full max-w-md text-center">
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
      </div>

      {/* Transition overlay */}
      {phase !== "idle" && selectedDistrict && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${phase === "overlay" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <div className="mx-4 max-w-sm rounded-2xl bg-white/90 px-6 py-8 text-center shadow-xl backdrop-blur-sm">
              <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">District {selectedDistrict}</p>
              <p className="mt-2 text-xl font-bold text-zinc-900">{supName || "Your Supervisor"}</p>
            </div>
          </div>
          <div className={`absolute inset-0 bg-white transition-opacity duration-700 ease-in ${phase === "dissolving" ? "opacity-100" : "opacity-0 pointer-events-none"}`} />
        </div>
      )}
    </>
  );
}
