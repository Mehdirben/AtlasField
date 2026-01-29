"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getFields,
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

// Simple bar chart component
function BarChart({ data, label, color }: { data: number[]; label: string; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <div className="flex items-end gap-1 h-24">
        {data.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-md transition-all ${color}`}
              style={{ height: `${(value / max) * 100}%`, minHeight: '4px' }}
            />
            <span className="text-[10px] text-slate-400">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Gauge component for health score
function HealthGauge({ value, label }: { value: number; label: string }) {
  const percentage = Math.min(100, Math.max(0, value * 100));
  const getColor = () => {
    if (percentage >= 70) return "from-emerald-500 to-green-500";
    if (percentage >= 40) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="48"
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            className="text-slate-200"
          />
          <circle
            cx="56"
            cy="56"
            r="48"
            stroke="url(#gradient)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 3.02} 302`}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={`${percentage >= 70 ? 'stop-emerald-500' : percentage >= 40 ? 'stop-yellow-500' : 'stop-red-500'}`} stopColor={percentage >= 70 ? '#10b981' : percentage >= 40 ? '#eab308' : '#ef4444'} />
              <stop offset="100%" className={`${percentage >= 70 ? 'stop-green-500' : percentage >= 40 ? 'stop-orange-500' : 'stop-rose-500'}`} stopColor={percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#f97316' : '#f43f5e'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}

export default function AnalysisPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [yieldData, setYieldData] = useState<any>(null);
  const [biomassData, setBiomassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "recommendations">("overview");

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    if (selectedField) {
      loadFieldData(selectedField.id);
    }
  }, [selectedField?.id]);

  async function loadFields() {
    try {
      const data = await getFields();
      setFields(data);
      if (data.length > 0) {
        setSelectedField(data[0]);
      }
    } catch (error) {
      console.error("Failed to load fields:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFieldData(fieldId: number) {
    try {
      const [analysisData, yieldRes, biomassRes] = await Promise.all([
        getAnalysisHistory(fieldId),
        getYieldPrediction(fieldId).catch(() => null),
        getBiomassEstimate(fieldId).catch(() => null),
      ]);
      setAnalyses(analysisData);
      setYieldData(yieldRes);
      setBiomassData(biomassRes);
    } catch (error) {
      console.error("Failed to load field data:", error);
    }
  }

  const handleRunAnalysis = async (type: string) => {
    if (!selectedField) return;
    setAnalyzing(type);
    try {
      const analysis = await runAnalysis(selectedField.id, type);
      setAnalyses((prev) => [analysis, ...prev]);
      // Refresh predictions
      const [yieldRes, biomassRes] = await Promise.all([
        getYieldPrediction(selectedField.id).catch(() => null),
        getBiomassEstimate(selectedField.id).catch(() => null),
      ]);
      setYieldData(yieldRes);
      setBiomassData(biomassRes);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(null);
    }
  };

  const latestNDVI = analyses.find((a) => a.analysis_type === "ndvi");
  const latestRVI = analyses.find((a) => a.analysis_type === "rvi");
  const ndviHistory = analyses
    .filter((a) => a.analysis_type === "ndvi" && a.mean_value)
    .slice(0, 10)
    .reverse()
    .map((a) => a.mean_value!);

  // Generate recommendations based on data
  const getRecommendations = () => {
    const recommendations = [];
    const problems = [];
    const monitoring = [];

    if (latestNDVI?.mean_value) {
      const ndvi = latestNDVI.mean_value;
      if (ndvi < 0.3) {
        problems.push({
          severity: "critical",
          title: "Very Low Vegetation",
          description: "NDVI indicates very sparse or stressed vegetation. Immediate attention required.",
          actions: ["Check for pest infestation", "Verify irrigation system", "Test soil nutrients", "Consider replanting if damage is severe"]
        });
      } else if (ndvi < 0.5) {
        problems.push({
          severity: "warning",
          title: "Vegetation Stress Detected",
          description: "Moderate vegetation stress observed. Early intervention recommended.",
          actions: ["Increase irrigation frequency", "Apply foliar fertilizer", "Monitor for disease symptoms"]
        });
      } else if (ndvi >= 0.7) {
        recommendations.push({
          type: "success",
          title: "Excellent Crop Health",
          description: "Your crops show excellent health indicators. Maintain current practices.",
          actions: ["Continue current irrigation schedule", "Monitor for any changes", "Plan for optimal harvest timing"]
        });
      }
    }

    if (latestRVI?.mean_value) {
      const rvi = latestRVI.mean_value;
      if (rvi > 0.7) {
        recommendations.push({
          type: "info",
          title: "High Biomass Detected",
          description: "Radar analysis shows dense vegetation structure.",
          actions: ["Consider thinning if overcrowded", "Plan for harvest logistics"]
        });
      }
    }

    if (yieldData?.predicted_yield) {
      const yieldPerHa = yieldData.yield_per_ha;
      recommendations.push({
        type: "info",
        title: `Yield Prediction: ${yieldPerHa?.toFixed(1) || "N/A"} t/ha`,
        description: `Confidence: ${yieldData.confidence_percent || 70}%. Based on ${ndviHistory.length} historical analyses.`,
        actions: ["Run more analyses to improve accuracy", "Compare with regional averages"]
      });
    }

    // Monitoring suggestions
    monitoring.push(
      { item: "Soil moisture levels", frequency: "Every 3 days", priority: "high" },
      { item: "Pest and disease signs", frequency: "Weekly", priority: "medium" },
      { item: "Weed growth", frequency: "Weekly", priority: "medium" },
      { item: "Weather forecast", frequency: "Daily", priority: "high" },
      { item: "Irrigation system", frequency: "Monthly", priority: "low" }
    );

    return { recommendations, problems, monitoring };
  };

  const { recommendations, problems, monitoring } = getRecommendations();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Loading analysis data...</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center mb-2">
          <span className="text-4xl">🗺️</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">No Fields Yet</h2>
        <p className="text-slate-500 text-center max-w-md">
          Create your first field to start running satellite analyses.
        </p>
        <Link
          href="/dashboard/fields/new"
          className="mt-4 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
        >
          Create Field
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Satellite Analysis</h1>
          <p className="text-slate-500 mt-1">
            Monitor crop health with real-time satellite data
          </p>
        </div>
        
        {/* Field Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedField?.id || ""}
            onChange={(e) => {
              const field = fields.find((f) => f.id === Number(e.target.value));
              setSelectedField(field || null);
            }}
            className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-w-[200px]"
          >
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name} {field.crop_type ? `(${field.crop_type})` : ""}
              </option>
            ))}
          </select>
          <Link
            href={`/dashboard/chat${selectedField ? `?field=${selectedField.id}` : ""}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
          >
            <span>🤖</span> Ask AI
          </Link>
        </div>
      </div>

      {selectedField && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-2xl">
                  🌿
                </div>
                <div>
                  <p className="text-sm text-slate-500">Latest NDVI</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {latestNDVI?.mean_value?.toFixed(3) || "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-2xl">
                  📡
                </div>
                <div>
                  <p className="text-sm text-slate-500">Latest RVI</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {latestRVI?.mean_value?.toFixed(3) || "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl">
                  🌾
                </div>
                <div>
                  <p className="text-sm text-slate-500">Yield Prediction</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {yieldData?.yield_per_ha?.toFixed(1) || "—"} <span className="text-sm font-normal text-slate-400">t/ha</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl">
                  🌱
                </div>
                <div>
                  <p className="text-sm text-slate-500">Biomass</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {biomassData?.mean_biomass?.toFixed(1) || "—"} <span className="text-sm font-normal text-slate-400">t/ha</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="xl:col-span-2 space-y-6">
              {/* Map */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="h-[350px]">
                  <FieldMap
                    fields={[selectedField]}
                    center={getCenterFromGeometry(selectedField.geometry)}
                    zoom={14}
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200/60">
                  {(["overview", "history", "recommendations"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                        activeTab === tab
                          ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {tab === "overview" && "📊 Overview"}
                      {tab === "history" && "📈 History"}
                      {tab === "recommendations" && "💡 Recommendations"}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Health Score */}
                        <div className="flex justify-center">
                          <HealthGauge 
                            value={latestNDVI?.mean_value || 0.5} 
                            label="Vegetation Health" 
                          />
                        </div>
                        
                        {/* NDVI Trend */}
                        <div className="md:col-span-2">
                          {ndviHistory.length > 0 ? (
                            <BarChart 
                              data={ndviHistory} 
                              label="NDVI Trend (Last Analyses)" 
                              color="bg-emerald-500"
                            />
                          ) : (
                            <div className="h-24 flex items-center justify-center text-slate-400 text-sm">
                              Run analyses to see trends
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interpretation */}
                      {latestNDVI?.interpretation && (
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-200/60">
                          <h4 className="font-medium text-slate-900 mb-2">Latest Analysis Interpretation</h4>
                          <p className="text-slate-600">{latestNDVI.interpretation}</p>
                        </div>
                      )}

                      {/* Field Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50/80 rounded-xl">
                          <p className="text-xs text-slate-500">Area</p>
                          <p className="font-semibold text-slate-900">{selectedField.area_hectares?.toFixed(2) || "—"} ha</p>
                        </div>
                        <div className="p-3 bg-slate-50/80 rounded-xl">
                          <p className="text-xs text-slate-500">Crop</p>
                          <p className="font-semibold text-slate-900">{selectedField.crop_type || "Not set"}</p>
                        </div>
                        <div className="p-3 bg-slate-50/80 rounded-xl">
                          <p className="text-xs text-slate-500">Analyses</p>
                          <p className="font-semibold text-slate-900">{analyses.length}</p>
                        </div>
                        <div className="p-3 bg-slate-50/80 rounded-xl">
                          <p className="text-xs text-slate-500">Last Update</p>
                          <p className="font-semibold text-slate-900">
                            {analyses[0]?.created_at 
                              ? new Date(analyses[0].created_at).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* History Tab */}
                  {activeTab === "history" && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {analyses.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <p>No analyses yet</p>
                          <p className="text-sm">Run your first analysis to see history</p>
                        </div>
                      ) : (
                        analyses.map((analysis) => (
                          <div
                            key={analysis.id}
                            className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/60"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                analysis.analysis_type === "ndvi"
                                  ? "bg-green-100"
                                  : analysis.analysis_type === "rvi"
                                  ? "bg-blue-100"
                                  : "bg-purple-100"
                              }`}>
                                {analysis.analysis_type === "ndvi" ? "🌿" : 
                                 analysis.analysis_type === "rvi" ? "📡" : "🔄"}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {analysis.analysis_type.toUpperCase()}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {new Date(analysis.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">
                                {analysis.mean_value?.toFixed(3) || "—"}
                              </p>
                              <Badge
                                variant={
                                  (analysis.mean_value || 0) >= 0.6
                                    ? "success"
                                    : (analysis.mean_value || 0) >= 0.4
                                    ? "warning"
                                    : "error"
                                }
                              >
                                {(analysis.mean_value || 0) >= 0.6
                                  ? "Good"
                                  : (analysis.mean_value || 0) >= 0.4
                                  ? "Moderate"
                                  : "Low"}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Recommendations Tab */}
                  {activeTab === "recommendations" && (
                    <div className="space-y-6">
                      {/* Problems */}
                      {problems.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                            <span>⚠️</span> Issues Detected
                          </h4>
                          <div className="space-y-3">
                            {problems.map((problem, i) => (
                              <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-200/60">
                                <div className="flex items-start gap-3">
                                  <Badge variant="error">{problem.severity}</Badge>
                                  <div>
                                    <h5 className="font-medium text-slate-900">{problem.title}</h5>
                                    <p className="text-sm text-slate-600 mt-1">{problem.description}</p>
                                    <div className="mt-3">
                                      <p className="text-xs font-medium text-slate-500 uppercase mb-2">Recommended Actions:</p>
                                      <ul className="text-sm text-slate-600 space-y-1">
                                        {problem.actions.map((action, j) => (
                                          <li key={j} className="flex items-center gap-2">
                                            <span className="text-red-500">•</span> {action}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <span>💡</span> Recommendations
                          </h4>
                          <div className="space-y-3">
                            {recommendations.map((rec, i) => (
                              <div key={i} className={`p-4 rounded-xl border ${
                                rec.type === "success" 
                                  ? "bg-emerald-50 border-emerald-200/60" 
                                  : "bg-blue-50 border-blue-200/60"
                              }`}>
                                <h5 className="font-medium text-slate-900">{rec.title}</h5>
                                <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                                {rec.actions && (
                                  <ul className="mt-2 text-sm text-slate-600 space-y-1">
                                    {rec.actions.map((action, j) => (
                                      <li key={j} className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {action}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Monitoring Checklist */}
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <span>👁️</span> Monitoring Checklist
                        </h4>
                        <div className="overflow-hidden rounded-xl border border-slate-200/60">
                          <table className="w-full">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Frequency</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Priority</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60">
                              {monitoring.map((item, i) => (
                                <tr key={i} className="bg-white">
                                  <td className="px-4 py-3 text-sm text-slate-900">{item.item}</td>
                                  <td className="px-4 py-3 text-sm text-slate-600">{item.frequency}</td>
                                  <td className="px-4 py-3">
                                    <Badge variant={
                                      item.priority === "high" ? "error" : 
                                      item.priority === "medium" ? "warning" : "default"
                                    }>
                                      {item.priority}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* No data message */}
                      {problems.length === 0 && recommendations.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <p>Run analyses to get personalized recommendations</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Analysis Actions */}
            <div className="space-y-6">
              {/* Run Analysis */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Run Analysis</h2>
                  <p className="text-sm text-slate-500 mt-1">Get real-time satellite data</p>
                </div>
                <div className="p-5 space-y-3">
                  <button
                    onClick={() => handleRunAnalysis("ndvi")}
                    disabled={analyzing !== null}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl transition-all disabled:opacity-50 border border-green-200/60"
                  >
                    <span className="text-2xl">{analyzing === "ndvi" ? "⏳" : "🌿"}</span>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">NDVI Analysis</p>
                      <p className="text-sm text-slate-500">Vegetation health index</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRunAnalysis("rvi")}
                    disabled={analyzing !== null}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl transition-all disabled:opacity-50 border border-blue-200/60"
                  >
                    <span className="text-2xl">{analyzing === "rvi" ? "⏳" : "📡"}</span>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">RVI Analysis</p>
                      <p className="text-sm text-slate-500">Works through clouds</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRunAnalysis("fusion")}
                    disabled={analyzing !== null}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-all disabled:opacity-50 border border-purple-200/60"
                  >
                    <span className="text-2xl">{analyzing === "fusion" ? "⏳" : "🔄"}</span>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">Fusion Analysis</p>
                      <p className="text-sm text-slate-500">Optical + Radar combined</p>
                    </div>
                  </button>
                  {analyzing && (
                    <div className="flex items-center justify-center gap-2 py-2 text-emerald-600">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Processing satellite data...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Yield Prediction Card */}
              {yieldData && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>🌾</span> Yield Prediction
                    </h2>
                  </div>
                  <div className="p-5">
                    <div className="text-center py-2">
                      <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {yieldData.total_yield_tonnes?.toFixed(1) || "—"}
                      </p>
                      <p className="text-slate-500 mt-1">tonnes total</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50/80 rounded-xl text-center">
                        <p className="text-xs text-slate-500">Per Hectare</p>
                        <p className="font-semibold text-slate-900">{yieldData.yield_per_ha?.toFixed(1)} t/ha</p>
                      </div>
                      <div className="p-3 bg-slate-50/80 rounded-xl text-center">
                        <p className="text-xs text-slate-500">Confidence</p>
                        <p className="font-semibold text-slate-900">{yieldData.confidence_percent}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Biomass Card */}
              {biomassData && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>🌱</span> Biomass Estimate
                    </h2>
                  </div>
                  <div className="p-5">
                    <div className="text-center py-2">
                      <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {biomassData.mean_biomass?.toFixed(1) || "—"}
                      </p>
                      <p className="text-slate-500 mt-1">tonnes/hectare</p>
                    </div>
                    {biomassData.growth_stage && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl text-center border border-green-200/60">
                        <p className="text-xs text-slate-500">Growth Stage</p>
                        <p className="font-semibold text-green-700">{biomassData.growth_stage}</p>
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50/80 rounded-xl text-center">
                        <p className="text-xs text-slate-500">Min</p>
                        <p className="font-semibold text-slate-900">{biomassData.min_biomass?.toFixed(1)}</p>
                      </div>
                      <div className="p-3 bg-slate-50/80 rounded-xl text-center">
                        <p className="text-xs text-slate-500">Max</p>
                        <p className="font-semibold text-slate-900">{biomassData.max_biomass?.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-5">
                <h3 className="font-medium text-slate-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Link
                    href={`/dashboard/fields/${selectedField.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900"
                  >
                    <span>🗺️</span> View Field Details
                  </Link>
                  <Link
                    href="/dashboard/alerts"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900"
                  >
                    <span>🔔</span> Check Alerts
                  </Link>
                  <Link
                    href={`/dashboard/chat?field=${selectedField.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900"
                  >
                    <span>💬</span> Get AI Advice
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
