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

// Fields
export interface Field {
  id: number;
  name: string;
  description?: string;
  geometry: GeoJSON.Polygon;
  area_hectares?: number;
  crop_type?: string;
  planting_date?: string;
  created_at: string;
  updated_at: string;
  latest_ndvi?: number;
  latest_analysis_date?: string;
  alert_count?: number;
}

export const getFields = async (): Promise<Field[]> => {
  const response = await api.get("/fields");
  return response.data;
};

export const createField = async (data: {
  name: string;
  description?: string;
  geometry: GeoJSON.Polygon;
  crop_type?: string;
}): Promise<Field> => {
  const response = await api.post("/fields", data);
  return response.data;
};

export const getField = async (id: number): Promise<Field> => {
  const response = await api.get(`/fields/${id}`);
  return response.data;
};

export const updateField = async (
  id: number,
  data: Partial<Field>
): Promise<Field> => {
  const response = await api.put(`/fields/${id}`, data);
  return response.data;
};

export const deleteField = async (id: number): Promise<void> => {
  await api.delete(`/fields/${id}`);
};

// Analysis
export interface Analysis {
  id: number;
  field_id: number;
  analysis_type: "ndvi" | "rvi" | "moisture" | "fusion" | "yield" | "biomass";
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
  fieldId: number,
  analysisType: string = "ndvi"
): Promise<Analysis> => {
  const response = await api.post(`/analysis/${fieldId}`, {
    analysis_type: analysisType,
  });
  return response.data;
};

export const getAnalysisHistory = async (
  fieldId: number,
  analysisType?: string
): Promise<Analysis[]> => {
  const params = analysisType ? { analysis_type: analysisType } : {};
  const response = await api.get(`/analysis/${fieldId}/history`, { params });
  return response.data;
};

export const getYieldPrediction = async (fieldId: number) => {
  const response = await api.get(`/analysis/${fieldId}/yield`);
  return response.data;
};

export const getBiomassEstimate = async (fieldId: number) => {
  const response = await api.get(`/analysis/${fieldId}/biomass`);
  return response.data;
};

// Chat
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export const sendChatMessage = async (
  message: string,
  fieldId?: number
): Promise<{ response: string; field_context?: Record<string, unknown> }> => {
  const response = await api.post("/chat", { message, field_id: fieldId });
  return response.data;
};

// Alerts
export interface Alert {
  id: number;
  field_id: number;
  field_name?: string;
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
