"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  getSites,
  runAnalysis,
  getAnalysisHistory,
  getYieldPrediction,
  getBiomassEstimate,
  getForestTrends,
  getFieldTrends,
  Site,
  Analysis,
  ForestTrends,
  FieldTrends,
} from "@/lib/api";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Analysis Report</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600">Detailed report not available for this analysis.</p>
            <p className="text-sm text-slate-400 mt-1">Run a new analysis to get detailed reports.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-b-3xl">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded-xl">
                <span className="text-slate-400 text-xs">Type</span>
                <p className="font-medium text-slate-900">{analysis.analysis_type === "COMPLETE" ? "Complete Analysis" : analysis.analysis_type}</p>
              </div>
              <div className="bg-white p-3 rounded-xl">
                <span className="text-slate-400 text-xs">Date</span>
                <p className="font-medium text-slate-900">{new Date(analysis.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const healthScore = report.summary?.overall_health_score ?? 0;
  const healthColor = healthScore >= 70 ? 'emerald' : healthScore >= 40 ? 'amber' : 'red';

  // Detect if this is a forest analysis report
  const isForestReport = report.metadata?.analysis_type === "FOREST" || report.canopy_health !== undefined;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-slate-50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-white px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200/80">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                {report.summary?.index_name || (isForestReport ? "Complete Forest Analysis" : "Complete Field Analysis")}
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                <span className="text-xs sm:text-sm text-slate-500">{report.metadata?.field_name}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
                <span className="text-xs sm:text-sm text-slate-500 hidden sm:inline">
                  {isForestReport ? report.metadata?.forest_type || "Forest" : report.metadata?.crop_type}
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
                <span className="text-xs sm:text-sm text-slate-500">{new Date(analysis.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {report.summary?.overall_health_score !== undefined && (
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-600 text-xs sm:text-sm">❤️</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">Health</span>
                  </div>
                  <p className={`text-xl sm:text-3xl font-bold text-${healthColor}-600`}>{healthScore}%</p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 truncate">{report.summary.health_status}</p>
                </div>
              )}

              {/* Forest-specific metrics */}
              {isForestReport ? (
                <>
                  {report.fire_risk_assessment?.nbr_value !== undefined && (
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 text-xs sm:text-sm">🔥</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">NBR</span>
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900">{report.fire_risk_assessment.nbr_value.toFixed(2)}</p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 truncate">{report.fire_risk_assessment.burn_severity}</p>
                    </div>
                  )}

                  {report.fire_risk_assessment?.ndmi_value !== undefined && (
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-xs sm:text-sm">💧</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">NDMI</span>
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900">{report.fire_risk_assessment.ndmi_value.toFixed(2)}</p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 truncate">{report.fire_risk_assessment.moisture_status}</p>
                    </div>
                  )}

                  {report.carbon_sequestration?.current_carbon_stock_t_ha !== undefined && (
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 text-xs sm:text-sm">🌳</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">Carbon</span>
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900">{report.carbon_sequestration.current_carbon_stock_t_ha}</p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">t CO₂/ha</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Field/Agriculture metrics */}
                  {report.vegetation_health?.ndvi_mean !== undefined && (
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 text-xs sm:text-sm">🌿</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">NDVI</span>
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900">{report.vegetation_health.ndvi_mean.toFixed(2)}</p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 truncate">{report.vegetation_health.vegetation_density}</p>
                    </div>
                  )}

                  {report.moisture_assessment?.estimated_moisture !== undefined && (
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-xs sm:text-sm">💧</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">Moisture</span>
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900">{(report.moisture_assessment.estimated_moisture * 100).toFixed(0)}%</p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 truncate">{report.moisture_assessment.moisture_status}</p>
                    </div>
                  )}

                  {report.yield_prediction?.predicted_yield_per_ha !== undefined && (
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-amber-100 flex items-center justify-center">
                          <span className="text-amber-600 text-xs sm:text-sm">🌾</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">Yield</span>
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900">{report.yield_prediction.predicted_yield_per_ha}</p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">tonnes/ha</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Summary Description */}
            {report.summary?.description && (
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{report.summary.description}</p>
              </div>
            )}

            {/* Detailed Sections in Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Forest-specific: Canopy Health */}
              {isForestReport && report.canopy_health && (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">🌲</span> Canopy Health
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Canopy Cover</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{report.canopy_health.canopy_cover_percent}%</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Canopy Density</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{report.canopy_health.canopy_density}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Vegetation Vigor</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{report.canopy_health.vegetation_vigor}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2">
                      <span className="text-xs sm:text-base text-slate-600">Health Status</span>
                      <Badge variant={
                        report.canopy_health.health_status === "Excellent" || report.canopy_health.health_status === "Good" ? "success" :
                          report.canopy_health.health_status === "Moderate" ? "warning" : "error"
                      }>
                        {report.canopy_health.health_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Forest-specific: Fire Risk Assessment */}
              {isForestReport && report.fire_risk_assessment && (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">🔥</span> Fire Risk Assessment
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="text-center mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg sm:rounded-xl">
                      <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide mb-1">Fire Risk Level</p>
                      <Badge variant={
                        report.fire_risk_assessment.fire_risk_level === "LOW" ? "success" :
                          report.fire_risk_assessment.fire_risk_level === "MEDIUM" ? "warning" : "error"
                      } className="text-sm sm:text-lg px-3 py-1">
                        {report.fire_risk_assessment.fire_risk_level?.toUpperCase()}
                      </Badge>
                      <p className="text-xs sm:text-sm text-slate-500 mt-2">Score: {report.fire_risk_assessment.fire_risk_score}/100</p>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                        <span className="text-xs sm:text-base text-slate-600">Moisture Status</span>
                        <span className="font-medium text-xs sm:text-base text-slate-900">{report.fire_risk_assessment.moisture_status}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                        <span className="text-xs sm:text-base text-slate-600">Burn Severity</span>
                        <span className="font-medium text-xs sm:text-base text-slate-900">{report.fire_risk_assessment.burn_severity}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 sm:py-2">
                        <span className="text-xs sm:text-base text-slate-600">Prevention Priority</span>
                        <Badge variant={
                          report.fire_risk_assessment.fire_prevention_priority === "Normal" ? "success" :
                            report.fire_risk_assessment.fire_prevention_priority === "Medium" ? "warning" : "error"
                        }>
                          {report.fire_risk_assessment.fire_prevention_priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Forest-specific: Deforestation Monitoring */}
              {isForestReport && report.deforestation_monitoring && (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">🌳</span> Deforestation Monitoring
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Deforestation Risk</span>
                      <Badge variant={
                        report.deforestation_monitoring.deforestation_risk === "LOW" ? "success" :
                          report.deforestation_monitoring.deforestation_risk === "MEDIUM" ? "warning" : "error"
                      }>
                        {report.deforestation_monitoring.deforestation_risk}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Canopy Loss</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{report.deforestation_monitoring.canopy_loss_indicator}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Forest Fragmentation</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{report.deforestation_monitoring.forest_fragmentation}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2">
                      <span className="text-xs sm:text-base text-slate-600">Detection Confidence</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{report.deforestation_monitoring.change_detection_confidence}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Forest-specific: Carbon Sequestration */}
              {isForestReport && report.carbon_sequestration && (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">🌿</span> Carbon Sequestration
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="text-center mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg sm:rounded-xl">
                      <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide mb-1">Total Carbon Stock</p>
                      <p className="text-2xl sm:text-4xl font-bold text-teal-600">{report.carbon_sequestration.total_carbon_stock_tonnes}</p>
                      <p className="text-xs sm:text-sm text-teal-600">tonnes CO₂</p>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                        <span className="text-xs sm:text-base text-slate-600">Per Hectare</span>
                        <span className="font-medium text-xs sm:text-base text-slate-900">{report.carbon_sequestration.current_carbon_stock_t_ha} t/ha</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                        <span className="text-xs sm:text-base text-slate-600">Carbon Status</span>
                        <span className="font-medium text-xs sm:text-base text-slate-900">{report.carbon_sequestration.carbon_status}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                        <span className="text-xs sm:text-base text-slate-600">Sequestration Potential</span>
                        <span className="font-medium text-xs sm:text-base text-slate-900">{report.carbon_sequestration.sequestration_potential}</span>
                      </div>
                      {report.carbon_sequestration.carbon_change_percent !== null && (
                        <div className="flex justify-between items-center py-1.5 sm:py-2">
                          <span className="text-xs sm:text-base text-slate-600">Change from Baseline</span>
                          <Badge variant={
                            (report.carbon_sequestration.carbon_change_percent || 0) >= 0 ? "success" : "error"
                          }>
                            {(report.carbon_sequestration.carbon_change_percent || 0) >= 0 ? "+" : ""}{report.carbon_sequestration.carbon_change_percent}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Field/Agriculture: Vegetation Health */}
              {!isForestReport && report.vegetation_health && (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">🌿</span> Vegetation Health
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Vegetation Density</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{report.vegetation_health.vegetation_density}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Chlorophyll Activity</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{report.vegetation_health.chlorophyll_activity}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Growth Stage</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{report.vegetation_health.growth_stage}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2">
                      <span className="text-xs sm:text-base text-slate-600">Health Status</span>
                      <Badge variant={
                        report.vegetation_health.health_status === "Excellent" || report.vegetation_health.health_status === "Good" ? "success" :
                          report.vegetation_health.health_status === "Moderate" ? "warning" : "error"
                      }>
                        {report.vegetation_health.health_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Field/Agriculture: Moisture Assessment */}
              {!isForestReport && report.moisture_assessment && (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">💧</span> Moisture Assessment
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Moisture Status</span>
                      <Badge variant={
                        report.moisture_assessment.moisture_status === "Optimal" || report.moisture_assessment.moisture_status === "Good" ? "success" :
                          report.moisture_assessment.moisture_status === "Moderate" ? "warning" : "error"
                      }>
                        {report.moisture_assessment.moisture_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Irrigation Need</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{report.moisture_assessment.irrigation_need}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-xs sm:text-base text-slate-600">Water Stress Risk</span>
                      <Badge variant={
                        report.moisture_assessment.water_stress_risk === "Low" ? "success" :
                          report.moisture_assessment.water_stress_risk === "Medium" ? "warning" : "error"
                      }>
                        {report.moisture_assessment.water_stress_risk}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2">
                      <span className="text-xs sm:text-base text-slate-600">Estimated Moisture</span>
                      <span className="font-medium text-xs sm:text-base text-slate-900">{(report.moisture_assessment.estimated_moisture * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Field/Agriculture: Biomass Analysis */}
              {!isForestReport && report.biomass_analysis && (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">🌱</span> Biomass Analysis
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="text-center mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg sm:rounded-xl">
                      <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide mb-1">Estimated Biomass</p>
                      <p className="text-2xl sm:text-4xl font-bold text-emerald-600">{report.biomass_analysis.estimated_biomass_t_ha}</p>
                      <p className="text-xs sm:text-sm text-emerald-600">tonnes/hectare</p>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                        <span className="text-xs sm:text-base text-slate-600">Biomass Level</span>
                        <span className="font-medium text-xs sm:text-base text-slate-900">{report.biomass_analysis.biomass_level}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                        <span className="text-xs sm:text-base text-slate-600">Canopy Structure</span>
                        <span className="font-medium text-xs sm:text-base text-slate-900">{report.biomass_analysis.canopy_structure}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 sm:py-2">
                        <span className="text-xs sm:text-base text-slate-600">Carbon Content</span>
                        <span className="font-medium text-xs sm:text-base text-slate-900">{report.biomass_analysis.carbon_content_t_ha} t CO₂/ha</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Field/Agriculture: Yield Prediction */}
              {!isForestReport && report.yield_prediction && (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">🌾</span> Yield Prediction
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="text-center mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-xl">
                      <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide mb-1">Total Predicted Yield</p>
                      <p className="text-2xl sm:text-4xl font-bold text-amber-600">{report.yield_prediction.total_predicted_yield_tonnes}</p>
                      <p className="text-xs sm:text-sm text-amber-600">tonnes</p>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                        <span className="text-xs sm:text-base text-slate-600">Per Hectare</span>
                        <span className="font-medium text-xs sm:text-base text-slate-900">{report.yield_prediction.predicted_yield_per_ha} t/ha</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                        <span className="text-xs sm:text-base text-slate-600">Yield Potential</span>
                        <Badge variant={
                          report.yield_prediction.yield_potential === "High" ? "success" :
                            report.yield_prediction.yield_potential === "Moderate" ? "warning" : "error"
                        }>
                          {report.yield_prediction.yield_potential}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-1.5 sm:py-2">
                        <span className="text-xs sm:text-base text-slate-600">Confidence</span>
                        <span className="font-medium text-xs sm:text-base text-slate-900">{report.yield_prediction.confidence_level}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Environmental & Spatial in one row */}
            {(report.environmental_factors || report.spatial_analysis) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Environmental Factors */}
                {report.environmental_factors && (
                  <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-sky-100">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                        <span className="text-base sm:text-lg">🌤️</span> Environmental Factors
                      </h3>
                    </div>
                    <div className="p-3 sm:p-6 grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                        <p className="text-[10px] sm:text-xs text-slate-500">Data Quality</p>
                        <p className="font-semibold text-xs sm:text-base text-slate-900 mt-0.5 sm:mt-1">{report.environmental_factors.data_quality}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                        <p className="text-[10px] sm:text-xs text-slate-500">Cloud Cover</p>
                        <p className="font-semibold text-xs sm:text-base text-slate-900 mt-0.5 sm:mt-1">{report.environmental_factors.cloud_coverage_percent}%</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                        <p className="text-[10px] sm:text-xs text-slate-500">Data Age</p>
                        <p className="font-semibold text-xs sm:text-base text-slate-900 mt-0.5 sm:mt-1">{report.environmental_factors.satellite_data_age}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                        <p className="text-[10px] sm:text-xs text-slate-500">Season</p>
                        <p className="font-semibold text-[10px] sm:text-xs text-slate-900 mt-0.5 sm:mt-1">{report.environmental_factors.seasonal_context}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Spatial Analysis */}
                {report.spatial_analysis && (
                  <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                        <span className="text-base sm:text-lg">🗺️</span> Spatial Analysis
                      </h3>
                    </div>
                    <div className="p-3 sm:p-6 grid grid-cols-2 gap-2 sm:gap-4">
                      {report.spatial_analysis.uniformity_score !== undefined && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                          <p className="text-[10px] sm:text-xs text-slate-500">Field Uniformity</p>
                          <p className="text-lg sm:text-2xl font-bold text-purple-600 mt-0.5 sm:mt-1">{report.spatial_analysis.uniformity_score}%</p>
                          <p className="text-[10px] sm:text-xs text-purple-600">{report.spatial_analysis.uniformity_status}</p>
                        </div>
                      )}
                      {report.spatial_analysis.affected_area_estimate && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                          <p className="text-[10px] sm:text-xs text-slate-500">Healthy Area</p>
                          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">
                            {report.spatial_analysis.affected_area_estimate.healthy_area_percent}%
                          </p>
                          <p className="text-[10px] sm:text-xs text-green-600">
                            {report.spatial_analysis.affected_area_estimate.healthy_area_hectares} ha
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Issues & Recommendations side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Problems Section */}
              {report.problems && report.problems.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-red-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
                    <h3 className="font-semibold text-red-700 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">⚠️</span> Issues Detected
                      <span className="ml-auto bg-red-100 text-red-600 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                        {report.problems.length}
                      </span>
                    </h3>
                  </div>
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
                    {report.problems.map((problem: any, i: number) => (
                      <div key={i} className="p-3 sm:p-4 bg-red-50/50 rounded-lg sm:rounded-xl border border-red-100">
                        <div className="flex flex-wrap items-start gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <Badge variant="error" className="text-[10px] sm:text-xs">{problem.severity}</Badge>
                          <h4 className="font-medium text-slate-900 text-xs sm:text-sm">{problem.title}</h4>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-600">{problem.description}</p>
                        {problem.urgent_actions && problem.urgent_actions.length > 0 && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-red-100">
                            <p className="text-[10px] sm:text-xs font-medium text-red-600 mb-1">Actions:</p>
                            <ul className="space-y-0.5 sm:space-y-1">
                              {problem.urgent_actions.slice(0, 2).map((action: string, j: number) => (
                                <li key={j} className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1">
                                  <span className="text-red-400">→</span> {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations Section */}
              {report.recommendations && report.recommendations.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-emerald-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <h3 className="font-semibold text-emerald-700 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">💡</span> Recommendations
                      <span className="ml-auto bg-emerald-100 text-emerald-600 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                        {report.recommendations.length}
                      </span>
                    </h3>
                  </div>
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
                    {report.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="p-3 sm:p-4 bg-emerald-50/50 rounded-lg sm:rounded-xl border border-emerald-100">
                        <div className="flex flex-wrap items-start gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <Badge variant={
                            rec.priority === "LOW" ? "success" :
                              rec.priority === "MEDIUM" ? "warning" : "error"
                          } className="text-[10px] sm:text-xs">
                            {rec.priority}
                          </Badge>
                          <span className="text-[10px] sm:text-xs text-emerald-600 bg-emerald-100 px-1 sm:px-1.5 py-0.5 rounded">{rec.category}</span>
                        </div>
                        <h4 className="font-medium text-slate-900 text-xs sm:text-sm">{rec.title}</h4>
                        <p className="text-[10px] sm:text-xs text-slate-600 mt-1">{rec.description}</p>
                        {rec.actions && rec.actions.length > 0 && (
                          <ul className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                            {rec.actions.slice(0, 2).map((action: string, j: number) => (
                              <li key={j} className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1">
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
            </div>

            {/* Monitoring Schedule */}
            {report.monitoring_schedule && report.monitoring_schedule.length > 0 && (
              <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-base sm:text-lg">📅</span> Monitoring Schedule
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Interval</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.monitoring_schedule.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-slate-900">{item.task}</td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-slate-600">{item.recommended_interval}</td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
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

          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-4 sm:px-8 py-3 sm:py-4 border-t border-slate-200 flex items-center justify-center text-xs sm:text-sm text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <span>Generated: {new Date(report.metadata?.generated_at).toLocaleDateString()}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span>{report.metadata?.area_hectares} hectares</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialSiteId = searchParams.get("site") || searchParams.get("field");

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [yieldData, setYieldData] = useState<any>(null);
  const [biomassData, setBiomassData] = useState<any>(null);
  const [forestTrends, setForestTrends] = useState<ForestTrends | null>(null);
  const [fieldTrends, setFieldTrends] = useState<FieldTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "recommendations" | "trends">("overview");
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      loadSiteData(selectedSite.id);

      // Update URL and localStorage to persist selection
      const params = new URLSearchParams(searchParams.toString());
      params.set("site", selectedSite.id.toString());
      localStorage.setItem("lastSelectedSiteId", selectedSite.id.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [selectedSite?.id]);

  async function loadSites() {
    try {
      const data = await getSites();
      setSites(data);

      const savedSiteId = typeof window !== 'undefined' ? localStorage.getItem("lastSelectedSiteId") : null;

      // If site ID is provided in URL, select that site
      if (initialSiteId) {
        const siteFromUrl = data.find((s: Site) => s.id === Number(initialSiteId));
        if (siteFromUrl) {
          setSelectedSite(siteFromUrl);
        } else if (data.length > 0) {
          setSelectedSite(data[0]);
        }
      } else if (savedSiteId) {
        const siteFromStorage = data.find((s: Site) => s.id === Number(savedSiteId));
        if (siteFromStorage) {
          setSelectedSite(siteFromStorage);
        } else if (data.length > 0) {
          setSelectedSite(data[0]);
        }
      } else if (data.length > 0) {
        setSelectedSite(data[0]);
      }
    } catch (error) {
      console.error("Failed to load sites:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSiteData(siteId: number) {
    try {
      const site = sites.find(s => s.id === siteId) || selectedSite;
      const isForest = site?.site_type === "FOREST";

      const [analysisData, yieldRes, biomassRes, trendsRes] = await Promise.all([
        getAnalysisHistory(siteId),
        isForest ? Promise.resolve(null) : getYieldPrediction(siteId).catch(() => null),
        getBiomassEstimate(siteId).catch(() => null),
        isForest ? getForestTrends(siteId).catch(() => null) : Promise.resolve(null),
      ]);
      setAnalyses(analysisData);
      setYieldData(yieldRes);
      setBiomassData(biomassRes);
      setForestTrends(trendsRes);

      // Fetch field trends if it's a field site
      if (!isForest) {
        const fieldTrendsRes = await getFieldTrends(siteId).catch(() => null);
        setFieldTrends(fieldTrendsRes);
      }
    } catch (error) {
      console.error("Failed to load site data:", error);
    }
  }

  const handleRunAnalysis = async (type: string) => {
    if (!selectedSite) return;
    setAnalyzing(type);
    try {
      const analysis = await runAnalysis(selectedSite.id, type);
      setAnalyses((prev) => [analysis, ...prev]);
      setSelectedAnalysis(analysis);
      const [yieldRes, biomassRes] = await Promise.all([
        getYieldPrediction(selectedSite.id).catch(() => null),
        getBiomassEstimate(selectedSite.id).catch(() => null),
      ]);
      setYieldData(yieldRes);
      setBiomassData(biomassRes);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(null);
    }
  };

  const latestAnalysis = analyses[0];
  const latestComplete = analyses.find((a) => a.analysis_type === "COMPLETE" || a.analysis_type === "FOREST");
  const latestNDVI = latestComplete || analyses.find((a) => a.analysis_type === "NDVI");
  const latestRVI = analyses.find((a) => a.analysis_type === "RVI");
  const latestMoisture = analyses.find((a) => a.analysis_type === "MOISTURE");

  // Extract moisture from complete analysis if available
  const moistureValue = latestComplete
    ? (latestComplete.data?.detailed_report as any)?.moisture_assessment?.estimated_moisture
    : latestMoisture?.mean_value;

  // Extract yield and biomass from complete analysis
  const yieldFromComplete = latestComplete
    ? (latestComplete.data?.detailed_report as any)?.yield_prediction
    : null;

  const biomassFromComplete = latestComplete
    ? (latestComplete.data?.detailed_report as any)?.biomass_analysis
    : null;

  // Build analysis history from NDVI/COMPLETE analyses with proper filtering
  const analysisHistory = analyses
    .filter((a) => (a.analysis_type === "NDVI" || a.analysis_type === "COMPLETE" || a.analysis_type === "FOREST") && a.mean_value != null)
    .slice(0, 10)
    .map((a) => a.mean_value! * 100) // Convert to health score percentage (0-100)
    .reverse(); // Oldest to newest for the chart


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

  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center mb-2">
          <span className="text-4xl">🗺️</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">No Sites Yet</h2>
        <p className="text-slate-500 text-center max-w-md">
          Create your first site to start running satellite analyses.
        </p>
        <Link
          href="/dashboard/sites/new"
          className="mt-4 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
        >
          Create Site
        </Link>
      </div>
    );
  }

  const getAnalysisTypeStyle = (type: string) => {
    if (type === "COMPLETE") return "bg-gradient-to-br from-emerald-100 to-teal-100";
    if (type === "FOREST") return "bg-gradient-to-br from-green-100 to-teal-100";
    if (type === "NDVI") return "bg-green-100";
    if (type === "RVI") return "bg-blue-100";
    return "bg-purple-100";
  };

  const getAnalysisTypeIcon = (type: string) => {
    if (type === "COMPLETE") return "🛰️";
    if (type === "FOREST") return "🌲";
    if (type === "NDVI") return "🌿";
    if (type === "RVI") return "📡";
    return "🔄";
  };

  const getAnalysisTypeName = (type: string) => {
    if (type === "COMPLETE") return "Complete Analysis";
    if (type === "FOREST") return "Forest Analysis";
    return type;
  };

  const isForest = selectedSite?.site_type === "FOREST";

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {selectedAnalysis && (
        <DetailedReportPanel
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Satellite Analysis</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Monitor {isForest ? "forest health" : "crop health"} with real-time satellite data
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedSite?.id || ""}
            onChange={(e) => {
              const site = sites.find((s: Site) => s.id === Number(e.target.value));
              setSelectedSite(site || null);
            }}
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all sm:min-w-[200px] text-sm sm:text-base"
          >
            {sites.map((site: Site) => (
              <option key={site.id} value={site.id}>
                {site.site_type === "FOREST" ? "🌲" : "🌾"} {site.name} {site.crop_type ? `(${site.crop_type})` : site.forest_type ? `(${site.forest_type})` : ""}
              </option>
            ))}
          </select>
          <Link
            href={`/dashboard/chat${selectedSite ? `?site=${selectedSite.id}` : ""}`}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm sm:text-base",
              isForest
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:shadow-green-500/25"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-emerald-500/25"
            )}
          >
            <span>🤖</span> <span className="hidden sm:inline">Ask</span> AI
          </Link>
        </div>
      </div>

      {selectedSite && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {isForest ? (
              <>
                {/* Forest-specific metric cards */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-3 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-lg sm:text-2xl shrink-0">
                      🌲
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-500 truncate">NDVI</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {latestNDVI?.mean_value?.toFixed(3) || "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-3 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-lg sm:text-2xl shrink-0">
                      🔥
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-500 truncate">Fire Risk</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900 capitalize">
                        {(latestComplete?.data?.detailed_report as any)?.fire_risk_assessment?.fire_risk_level ||
                          (latestComplete?.data as any)?.forest_data?.fire_risk_level || "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-3 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-lg sm:text-2xl shrink-0">
                      💧
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-500 truncate">NDMI</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {((latestComplete?.data?.detailed_report as any)?.fire_risk_assessment?.ndmi_value ??
                          (latestComplete?.data as any)?.forest_data?.ndmi)?.toFixed(2) || "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-3 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-lg sm:text-2xl shrink-0">
                      🌳
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-500 truncate">Carbon</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {((latestComplete?.data?.detailed_report as any)?.carbon_sequestration?.current_carbon_stock_t_ha ??
                          (latestComplete?.data as any)?.forest_data?.carbon_estimate_tonnes_ha)?.toFixed(0) || "—"} <span className="text-[10px] sm:text-sm font-normal text-slate-400">t/ha</span>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* FIELD/Agriculture metric cards */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-3 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-lg sm:text-2xl shrink-0">
                      🌿
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-500 truncate">NDVI</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {latestNDVI?.mean_value?.toFixed(3) || "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-3 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-lg sm:text-2xl shrink-0">
                      💧
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-500 truncate">Moisture</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {moistureValue ? `${(moistureValue * 100).toFixed(0)}%` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-3 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-lg sm:text-2xl shrink-0">
                      🌾
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-500 truncate">Yield</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {yieldFromComplete?.predicted_yield_per_ha?.toFixed(1) || yieldData?.yield_per_ha?.toFixed(1) || "—"} <span className="text-[10px] sm:text-sm font-normal text-slate-400">t/ha</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-3 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-lg sm:text-2xl shrink-0">
                      🌱
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-500 truncate">Biomass</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {biomassFromComplete?.estimated_biomass_t_ha?.toFixed(1) || biomassData?.mean_biomass_t_ha?.toFixed(1) || "—"} <span className="text-[10px] sm:text-sm font-normal text-slate-400">t/ha</span>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="h-[250px] sm:h-[350px]">
                  <FieldMap
                    fields={[selectedSite]}
                    center={getCenterFromGeometry(selectedSite.geometry)}
                    zoom={14}
                  />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200/60 overflow-x-auto">
                  {(isForest
                    ? ["overview", "trends", "history", "recommendations"] as const
                    : ["overview", "trends", "history", "recommendations"] as const
                  ).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 min-w-0 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                        ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      {tab === "overview" && <><span className="hidden sm:inline">📊 </span>Overview</>}
                      {tab === "trends" && <><span className="hidden sm:inline">📈 </span>Trends</>}
                      {tab === "history" && <><span className="hidden sm:inline">📜 </span>History</>}
                      {tab === "recommendations" && <><span className="hidden sm:inline">💡 </span>Tips</>}
                    </button>
                  ))}
                </div>

                <div className="p-4 sm:p-6">
                  {activeTab === "overview" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <div className="flex justify-center">
                          <HealthGauge
                            value={latestNDVI?.mean_value || 0.5}
                            label={isForest ? "Canopy Health" : "Vegetation Health"}
                          />
                        </div>

                        <div className="md:col-span-2">
                          {analysisHistory.length > 0 ? (
                            <BarChart
                              data={analysisHistory}
                              label={isForest ? "FOREST Health Trend" : "Health Score Trend (Last Analyses)"}
                              color={isForest ? "bg-teal-500" : "bg-emerald-500"}
                            />
                          ) : (
                            <div className="h-24 flex items-center justify-center text-slate-400 text-xs sm:text-sm">
                              Run analyses to see trends
                            </div>
                          )}
                        </div>
                      </div>


                      {latestNDVI?.interpretation && (
                        <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${isForest
                          ? "bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200/60"
                          : "bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200/60"
                          }`}>
                          <h4 className="font-medium text-slate-900 mb-1.5 sm:mb-2 text-sm sm:text-base">
                            {isForest ? "Latest FOREST Analysis" : "Latest Analysis Interpretation"}
                          </h4>
                          <p className="text-slate-600 text-xs sm:text-base">{String(latestNDVI.interpretation)}</p>
                          {selectedSite.site_type === "FOREST" ? (
                            <button
                              onClick={() => handleRunAnalysis("FOREST")}
                              disabled={analyzing !== null}
                              className="mt-2 sm:mt-3 flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                              {analyzing === "FOREST" ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "🌲"} Run Forest Analysis
                            </button>
                          ) : (
                            (latestNDVI.data as any)?.detailed_report && (
                              <button
                                onClick={() => setSelectedAnalysis(latestNDVI)}
                                className="mt-2 sm:mt-3 text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                View Full Report →
                              </button>
                            )
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                        <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-lg sm:rounded-xl">
                          <p className="text-[10px] sm:text-xs text-slate-500">Area</p>
                          <p className="font-semibold text-slate-900 text-sm sm:text-base">{selectedSite.area_hectares?.toFixed(2) || "—"} ha</p>
                        </div>
                        <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-lg sm:rounded-xl">
                          <p className="text-[10px] sm:text-xs text-slate-500">{isForest ? "FOREST Type" : "Crop"}</p>
                          <p className="font-semibold text-slate-900 text-sm sm:text-base truncate capitalize">
                            {isForest ? (selectedSite.forest_type || "Pending analysis") : (selectedSite.crop_type || "Not set")}
                          </p>
                        </div>
                        <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-lg sm:rounded-xl">
                          <p className="text-[10px] sm:text-xs text-slate-500">Analyses</p>
                          <p className="font-semibold text-slate-900 text-sm sm:text-base">{analyses.length}</p>
                        </div>
                        <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-lg sm:rounded-xl">
                          <p className="text-[10px] sm:text-xs text-slate-500">Last Update</p>
                          <p className="font-semibold text-slate-900 text-sm sm:text-base">
                            {analyses[0]?.created_at
                              ? new Date(analyses[0].created_at).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "history" && (
                    <div className="space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                      {analyses.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-slate-400">
                          <p className="text-sm sm:text-base">No analyses yet</p>
                          <p className="text-xs sm:text-sm">Run your first analysis to see history</p>
                        </div>
                      ) : (
                        analyses.map((analysis) => (
                          <button
                            key={analysis.id}
                            onClick={() => setSelectedAnalysis(analysis)}
                            className="w-full flex items-center justify-between p-3 sm:p-4 bg-slate-50/80 rounded-lg sm:rounded-xl border border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left gap-2"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm sm:text-lg shrink-0 ${getAnalysisTypeStyle(analysis.analysis_type)}`}>
                                {getAnalysisTypeIcon(analysis.analysis_type)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">
                                  {analysis.analysis_type === "COMPLETE" ? "Complete" : analysis.analysis_type}
                                  {(analysis.data as any)?.detailed_report && (
                                    <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-emerald-600">📄</span>
                                  )}
                                </p>
                                <p className="text-[10px] sm:text-sm text-slate-500 truncate">
                                  {new Date(analysis.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-slate-900 text-xs sm:text-base">
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
                                    ? "Fair"
                                    : "Low"}
                              </Badge>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "recommendations" && (
                    <div className="space-y-4 sm:space-y-6">
                      {problems.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-600 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                            <span>⚠️</span> Issues Detected
                          </h4>
                          <div className="space-y-2 sm:space-y-3">
                            {problems.map((problem: any, i: number) => (
                              <div key={i} className="p-3 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl border border-red-200/60">
                                <div className="flex items-start gap-2 sm:gap-3">
                                  <Badge variant="error" className="shrink-0 text-[10px] sm:text-xs">{problem.severity}</Badge>
                                  <div className="min-w-0">
                                    <h5 className="font-medium text-slate-900 text-xs sm:text-base">{problem.title}</h5>
                                    <p className="text-[10px] sm:text-sm text-slate-600 mt-0.5 sm:mt-1">{problem.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                            <span>💡</span> Recommendations
                          </h4>
                          <div className="space-y-2 sm:space-y-3">
                            {recommendations.map((rec: any, i: number) => (
                              <div key={i} className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${rec.priority === "LOW"
                                ? "bg-emerald-50 border-emerald-200/60"
                                : rec.priority === "MEDIUM"
                                  ? "bg-blue-50 border-blue-200/60"
                                  : "bg-amber-50 border-amber-200/60"
                                }`}>
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                  <Badge variant={
                                    rec.priority === "LOW" ? "success" :
                                      rec.priority === "MEDIUM" ? "warning" : "error"
                                  } className="text-[10px] sm:text-xs">
                                    {rec.priority}
                                  </Badge>
                                  <span className="text-[10px] sm:text-xs bg-white/80 px-1.5 sm:px-2 py-0.5 rounded text-slate-600">{rec.category}</span>
                                </div>
                                <h5 className="font-medium text-slate-900 text-xs sm:text-base">{rec.title}</h5>
                                <p className="text-[10px] sm:text-sm text-slate-600 mt-0.5 sm:mt-1">{rec.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {problems.length === 0 && recommendations.length === 0 && (
                        <div className="text-center py-6 sm:py-8 text-slate-400">
                          <p className="text-xs sm:text-base">Run analyses to get personalized recommendations</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "trends" && selectedSite?.site_type === "FIELD" && (
                    <div className="space-y-4 sm:space-y-6">
                      {!fieldTrends?.has_sufficient_data ? (
                        <div className="text-center py-8 sm:py-12">
                          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">📈</span>
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-2">Trends Coming Soon</h3>
                          <p className="text-slate-500 text-sm max-w-md mx-auto">
                            {fieldTrends?.message || "Run more FIELD analyses to see trends in vegetation health, crop yield, and biomass."}
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Overall Trend Banner */}
                          <div className={`p-4 rounded-xl border ${fieldTrends.overall_trend === "IMPROVING"
                            ? "bg-green-50/50 border-green-200/60"
                            : fieldTrends.overall_trend === "DECLINING"
                              ? "bg-red-50/50 border-red-200/60"
                              : "bg-slate-50/50 border-slate-200/60"
                            }`}>
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                                fieldTrends.overall_trend === "IMPROVING" ? "bg-green-100 text-green-700" :
                                  fieldTrends.overall_trend === "DECLINING" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                              )}>
                                {fieldTrends.overall_trend === "IMPROVING" ? "📈" :
                                  fieldTrends.overall_trend === "DECLINING" ? "📉" : "➡️"}
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900 capitalize">
                                  FIELD Health: {fieldTrends.overall_trend}
                                </h4>
                                <p className="text-sm text-slate-600">
                                  Based on {fieldTrends.analyses.length} analyses
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Average Changes Summary */}
                          {(fieldTrends.avg_ndvi_change !== null || fieldTrends.avg_yield_change !== null) && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Avg NDVI Change</p>
                                <p className={`text-xl font-bold ${(fieldTrends.avg_ndvi_change || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                  {(fieldTrends.avg_ndvi_change || 0) >= 0 ? "+" : ""}{fieldTrends.avg_ndvi_change?.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-400 mt-1">per analysis</p>
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Avg Yield Change</p>
                                <p className={`text-xl font-bold ${(fieldTrends.avg_yield_change || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                  {(fieldTrends.avg_yield_change || 0) >= 0 ? "+" : ""}{fieldTrends.avg_yield_change?.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-400 mt-1">per analysis</p>
                              </div>
                            </div>
                          )}

                          {/* Analysis History & Trends Table */}
                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                              <h4 className="font-semibold text-slate-900">Analysis History & Trends</h4>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[600px]">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">NDVI</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Yield (t/ha)</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Biomass (t/ha)</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Moisture</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Change</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {fieldTrends.analyses.map((analysis, idx) => (
                                    <tr key={analysis.analysis_id} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 font-medium text-slate-900">
                                        {new Date(analysis.date).toLocaleDateString()}
                                      </td>
                                      <td className="px-4 py-3 text-emerald-600 font-medium">{analysis.ndvi.toFixed(3)}</td>
                                      <td className="px-4 py-3 text-slate-600 font-medium">{analysis.yield_per_ha?.toFixed(1) || "—"}</td>
                                      <td className="px-4 py-3 text-slate-600">{analysis.biomass_t_ha?.toFixed(1) || "—"}</td>
                                      <td className="px-4 py-3 text-slate-600">{analysis.moisture_pct ? `${analysis.moisture_pct}%` : "—"}</td>
                                      <td className="px-4 py-3">
                                        {analysis.ndvi_change_pct !== null && analysis.ndvi_change_pct !== undefined ? (
                                          <span className={`text-sm font-medium ${analysis.ndvi_change_pct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {analysis.ndvi_change_pct >= 0 ? "+" : ""}{analysis.ndvi_change_pct.toFixed(1)}%
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 text-sm">baseline</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Baseline Comparison */}
                          {fieldTrends.baseline_comparison && (
                            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl p-4 border border-emerald-200">
                              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <span>📊</span> Baseline Comparison
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-slate-500">Baseline Date</p>
                                  <p className="font-medium text-slate-900">
                                    {fieldTrends.baseline_comparison.baseline_date
                                      ? new Date(fieldTrends.baseline_comparison.baseline_date).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">NDVI vs Baseline</p>
                                  <p className={`font-medium ${(fieldTrends.baseline_comparison.ndvi_change_from_baseline_pct || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {(fieldTrends.baseline_comparison.ndvi_change_from_baseline_pct || 0) >= 0 ? "+" : ""}
                                    {fieldTrends.baseline_comparison.ndvi_change_from_baseline_pct?.toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Yield vs Baseline</p>
                                  <p className={`font-medium ${(fieldTrends.baseline_comparison.yield_change_from_baseline_pct || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {(fieldTrends.baseline_comparison.yield_change_from_baseline_pct || 0) >= 0 ? "+" : ""}
                                    {fieldTrends.baseline_comparison.yield_change_from_baseline_pct?.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === "trends" && isForest && (
                    <div className="space-y-4 sm:space-y-6">
                      {!forestTrends?.has_sufficient_data ? (
                        <div className="text-center py-8 sm:py-12">
                          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">📈</span>
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-2">Trends Coming Soon</h3>
                          <p className="text-slate-500 text-sm max-w-md mx-auto">
                            {forestTrends?.message || "Run more FOREST analyses to see trends in carbon sequestration, canopy coverage, and FOREST health."}
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Overall Trend Banner */}
                          <div className={`p-4 rounded-xl border ${forestTrends.overall_trend === "IMPROVING"
                            ? "bg-green-50/50 border-green-200/60"
                            : forestTrends.overall_trend === "DECLINING"
                              ? "bg-red-50/50 border-red-200/60"
                              : "bg-slate-50/50 border-slate-200/60"
                            }`}>
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                                forestTrends.overall_trend === "IMPROVING" ? "bg-green-100 text-green-700" :
                                  forestTrends.overall_trend === "DECLINING" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                              )}>
                                {forestTrends.overall_trend === "IMPROVING" ? "📈" :
                                  forestTrends.overall_trend === "DECLINING" ? "📉" : "➡️"}
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900 capitalize">
                                  FOREST Health: {forestTrends.overall_trend}
                                </h4>
                                <p className="text-sm text-slate-600">
                                  Based on {forestTrends.analyses.length} analyses
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Average Changes Summary */}
                          {(forestTrends.avg_ndvi_change !== null || forestTrends.avg_carbon_change !== null) && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Avg NDVI Change</p>
                                <p className={`text-xl font-bold ${(forestTrends.avg_ndvi_change || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                  {(forestTrends.avg_ndvi_change || 0) >= 0 ? "+" : ""}{forestTrends.avg_ndvi_change?.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-400 mt-1">per analysis</p>
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Avg Carbon Change</p>
                                <p className={`text-xl font-bold ${(forestTrends.avg_carbon_change || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                  {(forestTrends.avg_carbon_change || 0) >= 0 ? "+" : ""}{forestTrends.avg_carbon_change?.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-400 mt-1">per analysis</p>
                              </div>
                            </div>
                          )}

                          {/* Analysis-by-Analysis Data Table */}
                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                              <h4 className="font-semibold text-slate-900">Analysis History & Trends</h4>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[600px]">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">NDVI</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Carbon (t/ha)</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Canopy</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Fire Risk</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Change</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {forestTrends.analyses.map((analysis, idx) => (
                                    <tr key={analysis.analysis_id} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 font-medium text-slate-900">
                                        {new Date(analysis.date).toLocaleDateString()}
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">{analysis.ndvi.toFixed(3)}</td>
                                      <td className="px-4 py-3 text-slate-600">{analysis.carbon_stock_t_ha.toFixed(1)}</td>
                                      <td className="px-4 py-3 text-slate-600">{analysis.canopy_cover_percent.toFixed(0)}%</td>
                                      <td className="px-4 py-3">
                                        <Badge variant={
                                          analysis.fire_risk_level === "LOW" ? "success" :
                                            analysis.fire_risk_level === "MEDIUM" ? "warning" : "error"
                                        }>
                                          {analysis.fire_risk_level}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3">
                                        {analysis.ndvi_change_pct !== null && analysis.ndvi_change_pct !== undefined ? (
                                          <span className={`text-sm font-medium ${analysis.ndvi_change_pct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {analysis.ndvi_change_pct >= 0 ? "+" : ""}{analysis.ndvi_change_pct.toFixed(1)}%
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 text-sm">baseline</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Baseline Comparison */}
                          {forestTrends.baseline_comparison && (
                            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <span>📊</span> Baseline Comparison
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-slate-500">Baseline Date</p>
                                  <p className="font-medium text-slate-900">
                                    {forestTrends.baseline_comparison.baseline_date
                                      ? new Date(forestTrends.baseline_comparison.baseline_date).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Baseline Carbon</p>
                                  <p className="font-medium text-slate-900">
                                    {forestTrends.baseline_comparison.baseline_carbon_t_ha?.toFixed(1)} t/ha
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Carbon vs Baseline</p>
                                  <p className={`font-medium ${(forestTrends.baseline_comparison.carbon_change_from_baseline_pct || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {(forestTrends.baseline_comparison.carbon_change_from_baseline_pct || 0) >= 0 ? "+" : ""}
                                    {forestTrends.baseline_comparison.carbon_change_from_baseline_pct?.toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Canopy vs Baseline</p>
                                  <p className={`font-medium ${(forestTrends.baseline_comparison.canopy_change_from_baseline_pct || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {(forestTrends.baseline_comparison.canopy_change_from_baseline_pct || 0) >= 0 ? "+" : ""}
                                    {forestTrends.baseline_comparison.canopy_change_from_baseline_pct?.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
                    {isForest ? "FOREST Analysis" : "FIELD Analysis"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Comprehensive satellite analysis</p>
                </div>
                <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                  <button
                    onClick={() => handleRunAnalysis(isForest ? "FOREST" : "COMPLETE")}
                    disabled={analyzing !== null}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 ${isForest
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-teal-500/25 hover:shadow-teal-500/40"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25 hover:shadow-emerald-500/40"
                      } text-white rounded-xl transition-all disabled:opacity-50 shadow-lg`}
                  >
                    <span className="text-2xl sm:text-3xl">{analyzing ? "⏳" : isForest ? "🌲" : "🛰️"}</span>
                    <div className="text-left">
                      <p className="font-semibold text-base sm:text-lg">Run Analysis</p>
                      <p className="text-xs sm:text-sm text-emerald-100">
                        {isForest ? "NBR • NDMI • Carbon • Fire Risk" : "NDVI • Biomass • Moisture • Yield"}
                      </p>
                    </div>
                  </button>

                  {analyzing && (
                    <div className="flex items-center justify-center gap-2 py-2.5 sm:py-3 text-emerald-600 bg-emerald-50 rounded-lg sm:rounded-xl">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs sm:text-sm font-medium">Processing satellite data...</span>
                    </div>
                  )}

                  <div className="text-xs sm:text-sm text-slate-500 p-2.5 sm:p-3 bg-slate-50 rounded-lg sm:rounded-xl">
                    <p className="font-medium text-slate-700 mb-1.5 sm:mb-2">Analysis includes:</p>
                    {isForest ? (
                      <ul className="space-y-1 sm:space-y-1.5">
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Canopy health (NDVI)
                        </li>
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Fire risk assessment (NBR)
                        </li>
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Moisture index (NDMI)
                        </li>
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Carbon sequestration estimate
                        </li>
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Deforestation monitoring
                        </li>
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Year-over-year trends
                        </li>
                      </ul>
                    ) : (
                      <ul className="space-y-1 sm:space-y-1.5">
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Vegetation health (NDVI)
                        </li>
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Biomass estimation
                        </li>
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Soil moisture assessment
                        </li>
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Yield prediction
                        </li>
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Problem detection & alerts
                        </li>
                        <li className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-green-500 text-xs sm:text-sm">✓</span> Recommendations
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm p-4 sm:p-5">
                <h3 className="font-medium text-slate-900 mb-2 sm:mb-3 text-sm sm:text-base">Quick Links</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <Link
                    href="/dashboard/alerts"
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 text-xs sm:text-base"
                  >
                    <span>🔔</span> Check Alerts
                  </Link>
                  <Link
                    href={`/dashboard/chat?site=${selectedSite.id}`}
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 text-xs sm:text-base"
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
