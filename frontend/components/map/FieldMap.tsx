"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Site } from "@/lib/api";

interface FieldMapProps {
  fields?: Site[];  // Accept sites (backwards compatible prop name)
  onFieldClick?: (siteId: number) => void;  // Backwards compatible
  zoom?: number;
  center?: [number, number];
  editable?: boolean;
  onPolygonComplete?: (coordinates: number[][][]) => void;
}

export default function FieldMap({
  fields = [],
  onFieldClick,
  zoom = 6,
  center = [2.3522, 46.6034], // France center
  editable = false,
  onPolygonComplete,
}: FieldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution:
              "© Esri, Maxar, Earthstar Geographics, and the GIS User Community",
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "satellite",
            type: "raster",
            source: "satellite",
          },
        ],
      },
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add fields to map
  useEffect(() => {
    if (!map.current || fields.length === 0) return;

    const addFields = () => {
      // Remove existing sources and layers
      fields.forEach((_, i) => {
        if (map.current?.getLayer(`field-fill-${i}`)) {
          map.current.removeLayer(`field-fill-${i}`);
        }
        if (map.current?.getLayer(`field-outline-${i}`)) {
          map.current.removeLayer(`field-outline-${i}`);
        }
        if (map.current?.getSource(`field-${i}`)) {
          map.current.removeSource(`field-${i}`);
        }
      });

      // Add fields/sites
      fields.forEach((site, i) => {
        if (!site.geometry?.coordinates) return;

        map.current?.addSource(`field-${i}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: { id: site.id, name: site.name },
            geometry: site.geometry,
          },
        });

        // Color based on site type and health
        let color = "#1b9b1"; // Default emerald
        if (site.site_type === "FOREST") {
          // Heatmap colors for fire risk
          color = site.fire_risk_level?.toUpperCase() === "LOW"
            ? "#22c55e" // green-500
            : (site.fire_risk_level?.toUpperCase() === "MEDIUM" || site.fire_risk_level?.toUpperCase() === "MODERATE")
              ? "#f59e0b" // amber-500
              : site.fire_risk_level?.toUpperCase() === "HIGH" || site.fire_risk_level?.toUpperCase() === "CRITICAL"
                ? "#ef4444" // red-500
                : "#22c55e"; // default green-500 for forests
        } else {
          // Field coloring based on NDVI
          color = site.latest_ndvi
            ? site.latest_ndvi >= 0.6
              ? "#10b981"
              : site.latest_ndvi >= 0.4
                ? "#f59e0b"
                : "#ef4444"
            : "#6b7280";
        }

        map.current?.addLayer({
          id: `field-fill-${i}`,
          type: "fill",
          source: `field-${i}`,
          paint: {
            "fill-color": color,
            "fill-opacity": 0.3,
          },
        });

        map.current?.addLayer({
          id: `field-outline-${i}`,
          type: "line",
          source: `field-${i}`,
          paint: {
            "line-color": color,
            "line-width": 2,
          },
        });

        if (onFieldClick) {
          map.current?.on("click", `field-fill-${i}`, () => {
            onFieldClick(site.id);
          });
          map.current?.on("mouseenter", `field-fill-${i}`, () => {
            if (map.current) map.current.getCanvas().style.cursor = "pointer";
          });
          map.current?.on("mouseleave", `field-fill-${i}`, () => {
            if (map.current) map.current.getCanvas().style.cursor = "";
          });
        }
      });

      // Fit bounds to all sites
      if (fields.length > 0 && fields[0].geometry?.coordinates) {
        const bounds = new maplibregl.LngLatBounds();
        fields.forEach((site) => {
          site.geometry?.coordinates?.[0]?.forEach((coord: number[]) => {
            bounds.extend([coord[0], coord[1]]);
          });
        });
        map.current?.fitBounds(bounds, { padding: 50 });
      }
    };

    if (map.current.isStyleLoaded()) {
      addFields();
    } else {
      map.current.on("load", addFields);
    }
  }, [fields, onFieldClick]);

  // Drawing functionality
  useEffect(() => {
    if (!map.current || !editable) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawing) return;
      const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setDrawPoints((prev) => [...prev, newPoint]);
    };

    const handleDblClick = (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      if (drawPoints.length >= 3 && onPolygonComplete) {
        const closedPolygon = [...drawPoints, drawPoints[0]];
        onPolygonComplete([closedPolygon]);
        setDrawPoints([]);
        setIsDrawing(false);
      }
    };

    map.current.on("click", handleClick);
    map.current.on("dblclick", handleDblClick);

    return () => {
      map.current?.off("click", handleClick);
      map.current?.off("dblclick", handleDblClick);
    };
  }, [editable, isDrawing, drawPoints, onPolygonComplete]);

  // Draw preview polygon
  useEffect(() => {
    if (!map.current || drawPoints.length === 0) return;

    const sourceId = "draw-preview";
    const layerId = "draw-preview-fill";
    const lineId = "draw-preview-line";

    if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
    if (map.current.getLayer(lineId)) map.current.removeLayer(lineId);
    if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

    const coordinates = drawPoints.length >= 3 ? [...drawPoints, drawPoints[0]] : drawPoints;

    const geometry = drawPoints.length >= 3
      ? { type: "Polygon" as const, coordinates: [coordinates] }
      : { type: "LineString" as const, coordinates: coordinates };

    map.current.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry,
      },
    });

    if (drawPoints.length >= 3) {
      map.current.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: { "fill-color": "#10b981", "fill-opacity": 0.3 },
      });
    }

    map.current.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      paint: { "line-color": "#10b981", "line-width": 2 },
    });
  }, [drawPoints]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {editable && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <button
            onClick={() => {
              setIsDrawing(!isDrawing);
              if (!isDrawing) setDrawPoints([]);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${isDrawing
              ? "bg-red-500 text-white"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
          >
            {isDrawing ? "Cancel Drawing" : "Draw Field"}
          </button>
          {isDrawing && (
            <p className="text-xs text-slate-500 mt-2 max-w-[200px]">
              Click to add points. Double-click to complete the polygon.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
