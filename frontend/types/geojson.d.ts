// GeoJSON Type Definitions

export interface GeoJSONPosition {
  0: number; // longitude
  1: number; // latitude
  2?: number; // altitude (optional)
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONPolygon;
  properties: Record<string, unknown>;
  id?: string | number;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// Make GeoJSON available globally
declare global {
  namespace GeoJSON {
    type Polygon = GeoJSONPolygon;
    type Feature = GeoJSONFeature;
    type FeatureCollection = GeoJSONFeatureCollection;
  }
}

export {};
