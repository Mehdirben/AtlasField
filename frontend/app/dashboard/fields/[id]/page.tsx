"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getField,
  runAnalysis,
  getAnalysisHistory,
  getYieldPrediction,
  getBiomassEstimate,
  Field,
  Analysis,
} from "@/lib/api";
import { Badge } from "@/components/ui";

const FieldMap = dynamic(() => import("@/components/map/FieldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-100/50 rounded-2xl">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

function getCenterFromGeometry(geometry: GeoJSON.Polygon | undefined): [number, number] {
  if (!geometry?.coordinates?.[0]) return [2.3522, 46.6034];
  const coords = geometry.coordinates[0];
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
}

export default function FieldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fieldId = Number(params.id);

  const [field, setField] = useState<Field | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [yieldData, setYieldData] = useState<any>(null);
  const [biomassData, setBiomassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, [fieldId]);

  async function loadData() {
    try {
      const [fieldData, analysisData] = await Promise.all([
        getField(fieldId),
        getAnalysisHistory(fieldId),
      ]);
      setField(fieldData);
      setAnalyses(analysisData);

      if (analysisData.length > 0) {
        try {
          const [yield_, biomass] = await Promise.all([
            getYieldPrediction(fieldId),
            getBiomassEstimate(fieldId),
          ]);
          setYieldData(yield_);
          setBiomassData(biomass);
        } catch (e) {
          console.error("Failed to load predictions:", e);
        }
      }
    } catch (error) {
      console.error("Failed to load field:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleRunAnalysis = async (type: string) => {
    setAnalyzing(true);
    try {
      const analysis = await runAnalysis(fieldId, type);
      setAnalyses((prev) => [analysis, ...prev]);
      const [yield_, biomass] = await Promise.all([
        getYieldPrediction(fieldId),
        getBiomassEstimate(fieldId),
      ]);
      setYieldData(yield_);
      setBiomassData(biomass);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Loading field...</p>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-2">
          <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Field not found</h2>
        <Link href="/dashboard/fields" className="text-emerald-600 hover:text-emerald-700 font-medium">
          ← Back to fields
        </Link>
      </div>
    );
  }

  const latestNDVI = analyses.find((a) => a.analysis_type === "ndvi");

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 sm:p-2.5 hover:bg-white/80 rounded-lg sm:rounded-xl transition-all border border-slate-200/60 shadow-sm shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">{field.name}</h1>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
              {field.crop_type && (
                <Badge variant="primary" className="text-[10px] sm:text-xs">{field.crop_type}</Badge>
              )}
              {field.area_hectares && (
                <span className="text-xs sm:text-sm text-slate-500">
                  {field.area_hectares.toFixed(2)} ha
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/dashboard/chat?field=${fieldId}`}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="hidden sm:inline">Ask</span> AI
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Map & Info */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Map */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="h-[250px] sm:h-[400px]">
              <FieldMap
                fields={[field]}
                center={getCenterFromGeometry(field.geometry)}
                zoom={14}
              />
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Information</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-emerald-100/60">
                  <p className="text-[10px] sm:text-sm text-slate-500">Area</p>
                  <p className="text-sm sm:text-lg font-semibold text-slate-900">
                    {field.area_hectares?.toFixed(2) || "—"} ha
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-100/60">
                  <p className="text-[10px] sm:text-sm text-slate-500">Crop</p>
                  <p className="text-sm sm:text-lg font-semibold text-slate-900 truncate">
                    {field.crop_type || "Not set"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100/60">
                  <p className="text-[10px] sm:text-sm text-slate-500">Created</p>
                  <p className="text-sm sm:text-lg font-semibold text-slate-900">
                    {new Date(field.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-100/60">
                  <p className="text-[10px] sm:text-sm text-slate-500">Analyses</p>
                  <p className="text-sm sm:text-lg font-semibold text-slate-900">
                    {analyses.length}
                  </p>
                </div>
              </div>
              {field.description && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50/80 rounded-lg sm:rounded-xl border border-slate-200/60">
                  <p className="text-[10px] sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Description</p>
                  <p className="text-slate-700 text-xs sm:text-base">{field.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Analysis History */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Analysis History</h2>
            </div>
            <div className="p-4 sm:p-6">
              {analyses.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">📊</span>
                  </div>
                  <p className="text-slate-900 font-medium text-sm sm:text-base">No analyses yet</p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Run an analysis to see results</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {analyses.slice(0, 5).map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-slate-50/80 rounded-lg sm:rounded-xl border border-slate-200/60 hover:bg-slate-100/80 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 ${
                          analysis.analysis_type === "ndvi"
                            ? "bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200/60"
                            : analysis.analysis_type === "rvi"
                            ? "bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-200/60"
                            : "bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200/60"
                        }`}>
                          {analysis.analysis_type === "ndvi" ? "🌿" : 
                           analysis.analysis_type === "rvi" ? "📡" : "🔄"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-xs sm:text-base truncate">
                            {analysis.analysis_type.toUpperCase()}
                          </p>
                          <p className="text-[10px] sm:text-sm text-slate-500">
                            {new Date(analysis.created_at).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      {analysis.mean_value && (
                        <div className="text-right shrink-0 shrink-0">
                          <p className="font-semibold text-slate-900 text-xs sm:text-base">
                            {analysis.mean_value.toFixed(3)}
                          </p>
                          <Badge
                            variant={
                              analysis.mean_value >= 0.6
                                ? "success"
                                : analysis.mean_value >= 0.4
                                ? "warning"
                                : "error"
                            }
                            className="text-[10px] sm:text-xs"
                          >
                            {analysis.mean_value >= 0.6
                              ? "Good"
                              : analysis.mean_value >= 0.4
                              ? "Fair"
                              : "Low"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Predictions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Analysis Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Satellite Analysis</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
              <button
                onClick={() => handleRunAnalysis("ndvi")}
                disabled={analyzing}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-lg sm:rounded-xl transition-all disabled:opacity-50 border border-green-200/60"
              >
                <span className="text-xl sm:text-2xl">🌿</span>
                <div className="text-left">
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Analyze NDVI</p>
                  <p className="text-[10px] sm:text-sm text-slate-500">Vegetation index</p>
                </div>
              </button>
              <button
                onClick={() => handleRunAnalysis("rvi")}
                disabled={analyzing}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-lg sm:rounded-xl transition-all disabled:opacity-50 border border-blue-200/60"
              >
                <span className="text-xl sm:text-2xl">📡</span>
                <div className="text-left">
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Analyze RVI</p>
                  <p className="text-[10px] sm:text-sm text-slate-500">Radar (cloudy weather)</p>
                </div>
              </button>
              <button
                onClick={() => handleRunAnalysis("fusion")}
                disabled={analyzing}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg sm:rounded-xl transition-all disabled:opacity-50 border border-purple-200/60"
              >
                <span className="text-xl sm:text-2xl">🔄</span>
                <div className="text-left">
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Fusion Analysis</p>
                  <p className="text-[10px] sm:text-sm text-slate-500">Optical + radar</p>
                </div>
              </button>
              {analyzing && (
                <div className="flex items-center justify-center gap-2 py-3 sm:py-4 text-emerald-600">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium text-xs sm:text-base">Analyzing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Yield Prediction */}
          {yieldData && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                  <span>🌾</span> Yield Prediction
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center py-3 sm:py-4">
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    {yieldData.predicted_yield?.toFixed(1) || "—"}
                  </p>
                  <p className="text-slate-500 mt-0.5 sm:mt-1 text-xs sm:text-base">tonnes/hectare</p>
                </div>
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50/80 rounded-lg sm:rounded-xl border border-slate-200/60">
                  <p className="text-[10px] sm:text-sm text-slate-500 mb-1.5 sm:mb-2">Confidence</p>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 h-2 sm:h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${(yieldData.confidence || 0.7) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      {((yieldData.confidence || 0.7) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Biomass Estimate */}
          {biomassData && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                  <span>🌱</span> Biomass Estimate
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center py-3 sm:py-4">
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {biomassData.estimated_biomass?.toFixed(1) || "—"}
                  </p>
                  <p className="text-slate-500 mt-0.5 sm:mt-1 text-xs sm:text-base">tonnes/hectare</p>
                </div>
                {biomassData.growth_stage && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl text-center border border-green-200/60">
                    <p className="text-[10px] sm:text-sm text-slate-500">Growth Stage</p>
                    <p className="font-semibold text-green-700 mt-0.5 sm:mt-1 text-sm sm:text-base">
                      {biomassData.growth_stage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
