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
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [zipLookup, setZipLookup] = useState<ZipEntry[] | null>(null);
  const [supervisors, setSupervisors] = useState<Record<number, SupervisorInfo>>({});
  const [phase, setPhase] = useState<"idle" | "flying" | "overlay" | "dissolving">("idle");
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);

  useEffect(() => {
    fetch("/data/zip_lookup.json").then(r => r.json()).then(setZipLookup).catch(() => {});
    fetch("/data/supervisors_index.json").then(r => r.json()).then((data: SupervisorInfo[]) => {
      const m: Record<number, SupervisorInfo> = {};
      for (const s of data) m[s.district] = s;
      setSupervisors(m);
    }).catch(() => {});
  }, []);

  // Initialize map using the pre-existing #map div from HTML (like SFcinema)
  useEffect(() => {
    const container = document.getElementById("map");
    if (!container) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/streets-v11",
      center: SF_CENTER,
      zoom: 11.5,
      maxBounds: [[-122.60, 37.65], [-122.28, 37.88]],
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;
    map.on("load", () => setMapReady(true));

    // Show the map container
    container.style.opacity = "0";
    container.style.transition = "opacity 1s";
    map.on("load", () => { container.style.opacity = "1"; });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) { setError("Please enter a 5-digit ZIP code."); return; }
    if (!zipLookup) { setError("Loading data..."); return; }
    const matches = zipLookup.filter(entry => entry.zip === zip);
    if (!matches.length) { setError("Not an SF ZIP. Try a 94xxx code."); return; }
    const best = matches.reduce((a, b) => a.ratio > b.ratio ? a : b);
    setSelectedDistrict(best.district);

    const map = mapRef.current;
    if (!map) { navigate(`/zip/${zip}/district-${best.district}`); return; }

    setOverlayFading(true);
    setTimeout(() => {
      setPhase("flying");
      const center = DISTRICT_CENTERS[best.district] ?? SF_CENTER;
      map.flyTo({ center, zoom: 13, duration: 1800, essential: true });
      map.once("moveend", () => setPhase("overlay"));
    }, 500);
  }, [zip, zipLookup, navigate]);

  useEffect(() => {
    if (phase !== "overlay") return;
    const t = setTimeout(() => {
      setPhase("dissolving");
      setTimeout(() => {
        if (selectedDistrict !== null) {
          // Hide the map before navigating so it doesn't persist
          const container = document.getElementById("map");
          if (container) container.style.display = "none";
          navigate(`/zip/${zip}/district-${selectedDistrict}`);
        }
      }, 700);
    }, 2000);
    return () => clearTimeout(t);
  }, [phase, selectedDistrict, zip, navigate]);

  const supName = selectedDistrict ? supervisors[selectedDistrict]?.name : null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`transition-opacity duration-500 ease-out ${overlayFading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, background: "rgba(255,255,255,0.65)" }}
      />

      {/* Content */}
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
                onChange={e => { setZip(e.target.value.replace(/\D/g, "").slice(0, 5)); setError(""); }}
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
            <div className="mx-4 max-w-sm rounded-2xl bg-white px-6 py-8 text-center shadow-xl flex flex-col items-center">
              <img
                src={`/photos/thumbs/district-${selectedDistrict}.jpg`}
                alt={supName || ""}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md"
              />
              <p className="mt-3 text-sm font-medium text-zinc-500 uppercase tracking-wider">District {selectedDistrict}</p>
              <p className="mt-1 text-xl font-bold text-zinc-900">{supName || "Your Supervisor"}</p>
              <p className="mt-1 text-sm text-zinc-500">Your Supervisor</p>
            </div>
          </div>
          <div className={`absolute inset-0 bg-white transition-opacity duration-700 ease-in ${phase === "dissolving" ? "opacity-100" : "opacity-0 pointer-events-none"}`} />
        </div>
      )}
    </>
  );
}
