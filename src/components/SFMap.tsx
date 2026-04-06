
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

const SF_CENTER: [number, number] = [-122.4194, 37.7749];
const SF_ZOOM = 11.5;

interface SFMapProps {
  highlightDistrict?: number;
  onMapReady?: (map: mapboxgl.Map) => void;
  interactive?: boolean;
}

export default function SFMap({ highlightDistrict, onMapReady, interactive = false }: SFMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: SF_CENTER,
      zoom: SF_ZOOM,
      interactive,
      attributionControl: false,
      trackResize: false, // Prevent resize on keyboard open (mobile crash fix)
      fadeDuration: 0, // Reduce GPU work
    });

    map.on("load", () => {
      // Add district boundaries source
      map.addSource("districts", {
        type: "geojson",
        data: "/data/district_boundaries.geojson",
      });

      // District fill layer
      map.addLayer({
        id: "district-fills",
        type: "fill",
        source: "districts",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "district"], highlightDistrict ?? -1],
            "rgba(59, 130, 246, 0.3)",
            "rgba(0, 0, 0, 0.05)",
          ],
          "fill-opacity": 0.6,
        },
      });

      // District outline layer
      map.addLayer({
        id: "district-outlines",
        type: "line",
        source: "districts",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "district"], highlightDistrict ?? -1],
            "#2563eb",
            "#64748b",
          ],
          "line-width": [
            "case",
            ["==", ["get", "district"], highlightDistrict ?? -1],
            3,
            1.5,
          ],
        },
      });

      // District labels
      map.addLayer({
        id: "district-labels",
        type: "symbol",
        source: "districts",
        layout: {
          "text-field": ["concat", "D", ["to-string", ["get", "district"]]],
          "text-size": 14,
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#1e293b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });

      setLoaded(true);
      onMapReady?.(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update highlight when district changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const dist = highlightDistrict ?? -1;

    map.setPaintProperty("district-fills", "fill-color", [
      "case",
      ["==", ["get", "district"], dist],
      "rgba(59, 130, 246, 0.3)",
      "rgba(0, 0, 0, 0.05)",
    ]);

    map.setPaintProperty("district-outlines", "line-color", [
      "case",
      ["==", ["get", "district"], dist],
      "#2563eb",
      "#64748b",
    ]);

    map.setPaintProperty("district-outlines", "line-width", [
      "case",
      ["==", ["get", "district"], dist],
      3,
      1.5,
    ]);
  }, [highlightDistrict, loaded]);

  return (
    <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
  );
}
