import axios from "axios";
import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }
  return config;
});

// API functions

// Auth
export const registerUser = async (data: {
  email: string;
  password: string;
  full_name?: string;
}) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export interface UserProfile {
  id: number;
  email: string;
  full_name?: string;
  subscription_tier: "free" | "pro" | "enterprise";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Site types
export type SiteType = "field" | "forest";

// Sites (formerly Fields)
export interface Site {
  id: number;
  name: string;
  description?: string;
  geometry: GeoJSON.Polygon;
  area_hectares?: number;
  site_type: SiteType;
  // Field-specific
  crop_type?: string;
  planting_date?: string;
  // Forest-specific
  forest_type?: string;  // coniferous, deciduous, mixed
  tree_species?: string;
  protected_status?: string;
  // Timestamps
  created_at: string;
  updated_at: string;
  // Analysis data
  latest_ndvi?: number;
  latest_analysis_date?: string;
  alert_count?: number;
  // Forest-specific analysis
  latest_nbr?: number;
  fire_risk_level?: string;
}

// Backwards compatibility
export type Field = Site;

export const getSites = async (siteType?: SiteType): Promise<Site[]> => {
  const params = siteType ? { site_type: siteType } : {};
  const response = await api.get("/sites", { params });
  return response.data;
};

// Backwards compatibility alias
export const getFields = getSites;

export const getSite = async (id: number): Promise<Site> => {
  const response = await api.get(`/sites/${id}`);
  return response.data;
};

// Backwards compatibility alias
export const getField = getSite;

export const createSite = async (data: {
  name: string;
  description?: string;
  geometry: GeoJSON.Polygon;
  site_type: SiteType;
  // Field-specific
  crop_type?: string;
  planting_date?: string;
  // Forest-specific
  forest_type?: string;
  tree_species?: string;
  protected_status?: string;
}): Promise<Site> => {
  const response = await api.post("/sites", data);
  return response.data;
};

// Backwards compatibility alias
export const createField = async (data: {
  name: string;
  description?: string;
  geometry: GeoJSON.Polygon;
  crop_type?: string;
}): Promise<Site> => {
  return createSite({ ...data, site_type: "field" });
};

export const updateSite = async (
  id: number,
  data: Partial<Site>
): Promise<Site> => {
  const response = await api.put(`/sites/${id}`, data);
  return response.data;
};

// Backwards compatibility alias
export const updateField = updateSite;

export const deleteSite = async (id: number): Promise<void> => {
  await api.delete(`/sites/${id}`);
};

// Backwards compatibility alias
export const deleteField = deleteSite;

// Analysis
export interface Analysis {
  id: number;
  site_id: number;
  analysis_type: "NDVI" | "RVI" | "MOISTURE" | "FUSION" | "YIELD" | "BIOMASS" | "COMPLETE" | "FOREST";
  satellite_date?: string;
  data: Record<string, unknown>;
  mean_value?: number;
  min_value?: number;
  max_value?: number;
  cloud_coverage?: number;
  interpretation?: string;
  created_at: string;
}

export const runAnalysis = async (
  siteId: number,
  analysisType: string = "NDVI"
): Promise<Analysis> => {
  const response = await api.post(`/analysis/${siteId}`, {
    analysis_type: analysisType,
  });
  return response.data;
};

export const getAnalysisHistory = async (
  siteId: number,
  analysisType?: string
): Promise<Analysis[]> => {
  const params = analysisType ? { analysis_type: analysisType } : {};
  const response = await api.get(`/analysis/${siteId}/history`, { params });
  return response.data;
};

export const getYieldPrediction = async (siteId: number) => {
  const response = await api.get(`/analysis/${siteId}/yield`);
  return response.data;
};

export const getBiomassEstimate = async (siteId: number) => {
  const response = await api.get(`/analysis/${siteId}/biomass`);
  return response.data;
};

// Forest Trends (Analysis-by-Analysis)
export interface ForestAnalysisData {
  analysis_id: number;
  date: string;
  ndvi: number;
  nbr: number;
  ndmi: number;
  carbon_stock_t_ha: number;
  canopy_cover_percent: number;
  fire_risk_level: string;
  deforestation_risk: string;
  ndvi_change_pct?: number;
  nbr_change_pct?: number;
  carbon_change_pct?: number;
  canopy_change_pct?: number;
}

export interface ForestTrends {
  analyses: ForestAnalysisData[];
  overall_trend: "improving" | "stable" | "declining" | "unknown";
  avg_ndvi_change?: number;
  avg_carbon_change?: number;
  baseline_comparison?: any;
  has_sufficient_data: boolean;
  message?: string;
}

export interface FieldAnalysisData {
  analysis_id: number;
  date: string;
  ndvi: number;
  yield_per_ha?: number;
  biomass_t_ha?: number;
  moisture_pct?: number;
  ndvi_change_pct?: number;
  yield_change_pct?: number;
}

export interface FieldTrends {
  analyses: FieldAnalysisData[];
  overall_trend: "improving" | "stable" | "declining" | "unknown";
  avg_ndvi_change?: number;
  avg_yield_change?: number;
  baseline_comparison?: any;
  has_sufficient_data: boolean;
  message?: string;
}

export const getForestTrends = async (siteId: number): Promise<ForestTrends> => {
  const response = await api.get(`/analysis/${siteId}/forest-trends`);
  return response.data;
};

export const getFieldTrends = async (siteId: number): Promise<FieldTrends> => {
  const response = await api.get(`/analysis/${siteId}/field-trends`);
  return response.data;
};

// Chat
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatHistory {
  id: number;
  field_id: number | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export const sendChatMessage = async (
  message: string,
  fieldId?: number
): Promise<{ response: string; field_context?: Record<string, unknown> }> => {
  const response = await api.post("/chat", { message, field_id: fieldId });
  return response.data;
};

export const getChatHistory = async (
  fieldId?: number
): Promise<ChatHistory[]> => {
  const response = await api.get("/chat/history", {
    params: fieldId !== undefined ? { field_id: fieldId } : {},
  });
  return response.data;
};

export const deleteChatHistory = async (historyId: number): Promise<void> => {
  await api.delete(`/chat/history/${historyId}`);
};

// Alerts
export interface Alert {
  id: number;
  site_id: number;
  site_name?: string;
  // Backwards compatibility
  field_id?: number;
  field_name?: string;
  alert_type?: "vegetation_health" | "moisture" | "fire_risk" | "deforestation" | "drought_stress" | "pest_disease";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const getAlerts = async (unreadOnly = false): Promise<Alert[]> => {
  const response = await api.get("/alerts", {
    params: { unread_only: unreadOnly },
  });
  return response.data;
};

export const markAlertRead = async (alertId: number): Promise<Alert> => {
  const response = await api.put(`/alerts/${alertId}/read`);
  return response.data;
};

export const markAllAlertsRead = async (): Promise<void> => {
  await api.put("/alerts/read-all");
};
