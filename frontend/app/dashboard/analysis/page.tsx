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
              <stop offset="0%" stopColor={percentage >= 70 ? '#10b981' : percentage >= 40 ? '#eab308' : '#ef4444'} />
              <stop offset="100%" stopColor={percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#f97316' : '#f43f5e'} />
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

// Detailed Report Modal/Panel Component
function DetailedReportPanel({ 
  analysis, 
  onClose 
}: { 
  analysis: Analysis; 
  onClose: () => void;
}) {
  const report = analysis.data?.detailed_report as any;
  
  if (!report) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">Analysis Report</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <div className="text-center py-8 text-slate-500">
            <p>Detailed report not available for this analysis.</p>
            <p className="text-sm mt-2">Run a new analysis to get detailed reports.</p>
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl">
            <h3 className="font-medium text-slate-900 mb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Type:</span>{" "}
                <span className="font-medium">{analysis.analysis_type.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-slate-500">Mean Value:</span>{" "}
                <span className="font-medium">{analysis.mean_value?.toFixed(3) || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500">Date:</span>{" "}
                <span className="font-medium">{new Date(analysis.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Interpretation:</span>{" "}
                <span className="font-medium">{analysis.interpretation || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {report.summary?.index_name || `${analysis.analysis_type.toUpperCase()} Analysis Report`}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {report.metadata?.field_name} • {new Date(analysis.created_at).toLocaleString()}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Section */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-200/60">
            <h3 className="font-semibold text-slate-900 mb-3">📊 Summary</h3>
            <p className="text-sm text-slate-600 mb-4">{report.summary?.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-slate-500">Mean Value</p>
                <p className="text-xl font-bold text-slate-900">{report.summary?.mean_value?.toFixed(3)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-slate-500">Min Value</p>
                <p className="text-xl font-bold text-slate-900">{report.summary?.min_value?.toFixed(3)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-slate-500">Max Value</p>
                <p className="text-xl font-bold text-slate-900">{report.summary?.max_value?.toFixed(3)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-slate-500">Variability</p>
                <p className="text-xl font-bold text-slate-900">{report.summary?.variability?.toFixed(3)}</p>
              </div>
            </div>

            {report.summary?.health_status && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-slate-500">Health Status:</span>
                <Badge variant={
                  report.summary.health_status === "Excellent" || report.summary.health_status === "Good" ? "success" :
                  report.summary.health_status === "Moderate" ? "warning" : "error"
                }>
                  {report.summary.health_status}
                </Badge>
                {report.summary.health_score && (
                  <span className="text-sm font-medium text-slate-700">({report.summary.health_score}%)</span>
                )}
              </div>
            )}
          </div>

          {/* Health Assessment */}
          {report.health_assessment && (
            <div className="bg-white rounded-xl p-5 border border-slate-200/60">
              <h3 className="font-semibold text-slate-900 mb-3">🌱 Health Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.health_assessment.overall_health && (
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Overall Health</span>
                    <span className="font-medium text-slate-900">{report.health_assessment.overall_health}</span>
                  </div>
                )}
                {report.health_assessment.vegetation_density && (
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Vegetation Density</span>
                    <span className="font-medium text-slate-900">{report.health_assessment.vegetation_density}</span>
                  </div>
                )}
                {report.health_assessment.chlorophyll_activity && (
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Chlorophyll Activity</span>
                    <span className="font-medium text-slate-900">{report.health_assessment.chlorophyll_activity}</span>
                  </div>
                )}
                {report.health_assessment.growth_stage_estimate && (
                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Growth Stage</span>
                    <span className="font-medium text-slate-900">{report.health_assessment.growth_stage_estimate}</span>
                  </div>
                )}
              </div>

              {report.health_assessment.stress_indicators && report.health_assessment.stress_indicators.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-600 mb-2">Stress Indicators:</p>
                  <ul className="space-y-1">
                    {report.health_assessment.stress_indicators.map((indicator: string, i: number) => (
                      <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                        <span className={indicator.includes("No significant") ? "text-green-500" : "text-amber-500"}>
                          {indicator.includes("No significant") ? "✓" : "⚡"}
                        </span>
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Spatial Analysis */}
          {report.spatial_analysis && (
            <div className="bg-white rounded-xl p-5 border border-slate-200/60">
              <h3 className="font-semibold text-slate-900 mb-3">🗺️ Spatial Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.spatial_analysis.uniformity_score !== undefined && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200/60">
                    <p className="text-sm text-slate-600">Field Uniformity</p>
                    <p className="text-2xl font-bold text-slate-900">{report.spatial_analysis.uniformity_score}%</p>
                    <p className="text-sm text-blue-600">{report.spatial_analysis.uniformity_status}</p>
                  </div>
                )}
                {report.spatial_analysis.affected_area_estimate && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200/60">
                    <p className="text-sm text-slate-600">Healthy Area</p>
                    <p className="text-2xl font-bold text-green-700">
                      {report.spatial_analysis.affected_area_estimate.healthy_area_percent}%
                    </p>
                    <p className="text-sm text-green-600">
                      {report.spatial_analysis.affected_area_estimate.healthy_area_hectares} ha
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Problems Section */}
          {report.problems && report.problems.length > 0 && (
            <div className="bg-red-50 rounded-xl p-5 border border-red-200/60">
              <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                <span>⚠️</span> Issues Detected
              </h3>
              <div className="space-y-4">
                {report.problems.map((problem: any, i: number) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-red-200/60">
                    <div className="flex items-start gap-3">
                      <Badge variant="error">{problem.severity}</Badge>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{problem.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{problem.description}</p>
                        
                        {problem.possible_causes && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">Possible Causes:</p>
                            <ul className="text-sm text-slate-600 space-y-1">
                              {problem.possible_causes.map((cause: string, j: number) => (
                                <li key={j} className="flex items-center gap-2">
                                  <span className="text-red-400">•</span> {cause}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {problem.urgent_actions && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">Urgent Actions:</p>
                            <ul className="text-sm text-slate-600 space-y-1">
                              {problem.urgent_actions.map((action: string, j: number) => (
                                <li key={j} className="flex items-center gap-2">
                                  <span className="text-red-500">→</span> {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Section */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200/60">
              <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                <span>💡</span> Recommendations
              </h3>
              <div className="space-y-4">
                {report.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-emerald-200/60">
                    <div className="flex items-start gap-3">
                      <Badge variant={
                        rec.priority === "low" ? "success" : 
                        rec.priority === "medium" ? "warning" : "error"
                      }>
                        {rec.priority}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{rec.category}</span>
                        </div>
                        <h4 className="font-medium text-slate-900 mt-1">{rec.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                        
                        {rec.actions && (
                          <ul className="mt-3 text-sm text-slate-600 space-y-1">
                            {rec.actions.map((action: string, j: number) => (
                              <li key={j} className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> {action}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monitoring Schedule */}
          {report.monitoring_schedule && report.monitoring_schedule.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-slate-200/60">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>📅</span> Recommended Monitoring Schedule
              </h3>
              <div className="overflow-hidden rounded-lg border border-slate-200/60">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Task</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Interval</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Urgency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {report.monitoring_schedule.map((item: any, i: number) => (
                      <tr key={i} className="bg-white">
                        <td className="px-4 py-3 text-sm text-slate-900">{item.task}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.recommended_interval}</td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            item.urgency === "High" ? "error" : 
                            item.urgency === "Medium" ? "warning" : "default"
                          }>
                            {item.urgency}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
            <h3 className="font-medium text-slate-700 mb-2 text-sm">Report Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Generated:</span>{" "}
                <span className="text-slate-700">{new Date(report.metadata?.generated_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Field:</span>{" "}
                <span className="text-slate-700">{report.metadata?.field_name}</span>
              </div>
              <div>
                <span className="text-slate-500">Crop:</span>{" "}
                <span className="text-slate-700">{report.metadata?.crop_type}</span>
              </div>
              <div>
                <span className="text-slate-500">Area:</span>{" "}
                <span className="text-slate-700">{report.metadata?.area_hectares} ha</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

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
      setSelectedAnalysis(analysis);
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

  const getRecommendationsFromReport = () => {
    const latestWithReport = analyses.find(a => a.data?.detailed_report);
    const report = latestWithReport?.data?.detailed_report as any;
    
    if (!report) {
      return { recommendations: [], problems: [], monitoring: [] };
    }

    return {
      recommendations: report.recommendations || [],
      problems: report.problems || [],
      monitoring: report.monitoring_schedule || []
    };
  };

  const { recommendations, problems, monitoring } = getRecommendationsFromReport();

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

  const getAnalysisTypeStyle = (type: string) => {
    if (type === "ndvi") return "bg-green-100";
    if (type === "rvi") return "bg-blue-100";
    return "bg-purple-100";
  };

  const getAnalysisTypeIcon = (type: string) => {
    if (type === "ndvi") return "🌿";
    if (type === "rvi") return "📡";
    return "🔄";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {selectedAnalysis && (
        <DetailedReportPanel 
          analysis={selectedAnalysis} 
          onClose={() => setSelectedAnalysis(null)} 
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Satellite Analysis</h1>
          <p className="text-slate-500 mt-1">
            Monitor crop health with real-time satellite data
          </p>
        </div>
        
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
                    {biomassData?.mean_biomass_t_ha?.toFixed(1) || "—"} <span className="text-sm font-normal text-slate-400">t/ha</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="h-[350px]">
                  <FieldMap
                    fields={[selectedField]}
                    center={getCenterFromGeometry(selectedField.geometry)}
                    zoom={14}
                  />
                </div>
              </div>

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
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex justify-center">
                          <HealthGauge 
                            value={latestNDVI?.mean_value || 0.5} 
                            label="Vegetation Health" 
                          />
                        </div>
                        
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

                      {latestNDVI?.interpretation && (
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-200/60">
                          <h4 className="font-medium text-slate-900 mb-2">Latest Analysis Interpretation</h4>
                          <p className="text-slate-600">{String(latestNDVI.interpretation)}</p>
                          {(latestNDVI.data as any)?.detailed_report && (
                            <button
                              onClick={() => setSelectedAnalysis(latestNDVI)}
                              className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              View Full Report →
                            </button>
                          )}
                        </div>
                      )}

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

                  {activeTab === "history" && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {analyses.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <p>No analyses yet</p>
                          <p className="text-sm">Run your first analysis to see history</p>
                        </div>
                      ) : (
                        analyses.map((analysis) => (
                          <button
                            key={analysis.id}
                            onClick={() => setSelectedAnalysis(analysis)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getAnalysisTypeStyle(analysis.analysis_type)}`}>
                                {getAnalysisTypeIcon(analysis.analysis_type)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {analysis.analysis_type.toUpperCase()}
                                  {(analysis.data as any)?.detailed_report && (
                                    <span className="ml-2 text-xs text-emerald-600">📄 Report</span>
                                  )}
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
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "recommendations" && (
                    <div className="space-y-6">
                      {problems.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                            <span>⚠️</span> Issues Detected
                          </h4>
                          <div className="space-y-3">
                            {problems.map((problem: any, i: number) => (
                              <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-200/60">
                                <div className="flex items-start gap-3">
                                  <Badge variant="error">{problem.severity}</Badge>
                                  <div>
                                    <h5 className="font-medium text-slate-900">{problem.title}</h5>
                                    <p className="text-sm text-slate-600 mt-1">{problem.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <span>💡</span> Recommendations
                          </h4>
                          <div className="space-y-3">
                            {recommendations.map((rec: any, i: number) => (
                              <div key={i} className={`p-4 rounded-xl border ${
                                rec.priority === "low" 
                                  ? "bg-emerald-50 border-emerald-200/60" 
                                  : rec.priority === "medium"
                                  ? "bg-blue-50 border-blue-200/60"
                                  : "bg-amber-50 border-amber-200/60"
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={
                                    rec.priority === "low" ? "success" : 
                                    rec.priority === "medium" ? "warning" : "error"
                                  }>
                                    {rec.priority}
                                  </Badge>
                                  <span className="text-xs bg-white/80 px-2 py-0.5 rounded text-slate-600">{rec.category}</span>
                                </div>
                                <h5 className="font-medium text-slate-900">{rec.title}</h5>
                                <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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

            <div className="space-y-6">
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
                        {biomassData.mean_biomass_t_ha?.toFixed(1) || "—"}
                      </p>
                      <p className="text-slate-500 mt-1">tonnes/hectare</p>
                    </div>
                    {biomassData.interpretation && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl text-center border border-green-200/60">
                        <p className="text-xs text-slate-500">Status</p>
                        <p className="font-semibold text-green-700 text-sm">{biomassData.interpretation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
