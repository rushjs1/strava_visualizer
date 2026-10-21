"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import mapboxgl, { type GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { routeBounds, type Coordinate } from "@/lib/run-map";

export type MapRoute = { id: number; coordinates: Coordinate[] };

type Props = {
  routes: MapRoute[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  viewRequest: number;
  satellite: boolean;
};

export default function RunMapCanvas({ routes, selectedId, onSelect, viewRequest, satellite }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [size, setSize] = useState("");
  const selectRoute = useEffectEvent(onSelect);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!container.current || !token) return;
    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: container.current,
        accessToken: token,
        style: satellite ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/dark-v11",
        center: [-86.1581, 39.7684], zoom: 11, attributionControl: false,
      });
    } catch {
      // Defer the state update from initialization; this is an external failure.
      queueMicrotask(() => setError("This browser could not start the map. Check that WebGL is enabled."));
      return;
    }
    mapRef.current = map;
    const timeout = window.setTimeout(() => setError("The map is taking longer than expected. Check your connection and Mapbox token permissions."), 20000);
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.on("error", (event) => {
      const status = (event.error as Error & { status?: number }).status;
      if (status === 401 || status === 403) setError("Mapbox could not authorize this map. Check your public token and its allowed URLs.");
    });
    map.on("load", () => {
      window.clearTimeout(timeout);
      setError("");
      map.addSource("runs", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "run-glow", type: "line", source: "runs", paint: { "line-color": "#cefb09", "line-width": 9, "line-blur": 6, "line-opacity": .2 } });
      map.addLayer({ id: "run-lines", type: "line", source: "runs", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#cefb09", "line-width": 2, "line-opacity": .65 } });
      map.addLayer({ id: "run-hit", type: "line", source: "runs", paint: { "line-width": 18, "line-opacity": 0 } });
      map.addLayer({ id: "selected-run", type: "line", source: "runs", filter: ["==", ["get", "id"], -1], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#4fe3c1", "line-width": 5 } });
      map.addSource("endpoints", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "endpoints", type: "circle", source: "endpoints", paint: { "circle-radius": 6, "circle-color": ["match", ["get", "end"], "start", "#cefb09", "#4fe3c1"], "circle-stroke-color": "#10120d", "circle-stroke-width": 2 } });
      map.on("click", "run-hit", (event) => {
        const id = Number(event.features?.[0]?.properties?.id);
        if (Number.isFinite(id)) selectRoute(id);
      });
      map.on("mouseenter", "run-hit", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "run-hit", () => { map.getCanvas().style.cursor = ""; });
      setReady(true);
    });
    const observer = new ResizeObserver(() => {
      map.resize();
      setSize(`${map.getContainer().clientWidth}:${map.getContainer().clientHeight}`);
    });
    observer.observe(container.current);
    return () => { window.clearTimeout(timeout); observer.disconnect(); map.remove(); mapRef.current = null; };
  }, [token, satellite]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("runs") as GeoJSONSource).setData({ type: "FeatureCollection", features: routes.map((route) => ({
      type: "Feature", properties: { id: route.id }, geometry: { type: "LineString", coordinates: route.coordinates },
    })) });
    map.setFilter("selected-run", ["==", ["get", "id"], selectedId ?? -1]);
    map.setPaintProperty("run-lines", "line-opacity", selectedId === null ? .65 : .18);
    const selected = routes.find((route) => route.id === selectedId);
    (map.getSource("endpoints") as GeoJSONSource).setData({ type: "FeatureCollection", features: selected ? [
      { type: "Feature", properties: { end: "start" }, geometry: { type: "Point", coordinates: selected.coordinates[0] } },
      { type: "Feature", properties: { end: "finish" }, geometry: { type: "Point", coordinates: selected.coordinates.at(-1)! } },
    ] : [] });
    const bounds = routeBounds((selected ? [selected] : routes).map((route) => route.coordinates));
    if (bounds) {
      const narrow = map.getContainer().clientWidth < 600;
      const padding = { top: 80, left: 40, right: 60, bottom: selected ? (narrow ? 290 : 235) : 65 };
      const camera = map.cameraForBounds(bounds, { padding, maxZoom: selected ? 15 : 13 });
      if (camera) map.flyTo({ ...camera, padding, retainPadding: false, duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1400 });
    }
  }, [routes, selectedId, ready, viewRequest, size]);

  return <>
    <div ref={container} style={{ position: "absolute", inset: 0 }} aria-label="Interactive map of running routes" />
    {!token || error ? <div role="status" className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 p-8 text-center"><p className="max-w-md text-sm text-muted-foreground">{error || "Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your local environment and restart the app to load the map."}</p></div> : !ready ? <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Loading your map…</div> : null}
  </>;
}
