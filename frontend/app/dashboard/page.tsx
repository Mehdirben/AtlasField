"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSites, getAlerts, Site, Alert } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sitesData, alertsData] = await Promise.all([
          getSites(),
          getAlerts(true),
        ]);
        setSites(sitesData);
        setAlerts(alertsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const fields = sites.filter((s) => s.site_type === "field");
  const forests = sites.filter((s) => s.site_type === "forest");
  const totalArea = sites.reduce((sum, s) => sum + (s.area_hectares || 0), 0);
  const healthySites = sites.filter((s) => {
    if (s.site_type === "forest") {
      return s.fire_risk_level === "low";
    }
    return s.latest_ndvi && s.latest_ndvi >= 0.4;
  }).length;
  const sitesNeedingAttention = sites.filter((s) => {
    if (s.site_type === "forest") {
      return s.fire_risk_level && s.fire_risk_level !== "low";
    }
    return s.latest_ndvi && s.latest_ndvi < 0.4;
  }).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Welcome back! Here's an overview of your sites.</p>
        </div>
        <Link
          href="/dashboard/sites/new"
          className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-200 text-center text-sm sm:text-base"
        >
          + Add Site
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { icon: "🗺️", value: sites.length, label: "Total Sites", color: "from-blue-500 to-blue-600" },
          { icon: "🌾", value: fields.length, label: "Fields", color: "from-amber-500 to-amber-600" },
          { icon: "🌲", value: forests.length, label: "Forests", color: "from-green-600 to-green-700" },
          { icon: "📐", value: totalArea.toFixed(1), label: "Hectares", color: "from-purple-500 to-purple-600" },
          { icon: "✅", value: healthySites, label: "Healthy", color: "from-emerald-500 to-emerald-600" },
          { icon: "⚠️", value: sitesNeedingAttention, label: "Attention", color: "from-red-500 to-red-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg shrink-0`}>
                <span className="text-base sm:text-xl text-white drop-shadow">{stat.icon}</span>
              </div>
              <div className="min-w-0">
                <span className="block text-lg sm:text-2xl font-bold text-slate-900">{stat.value}</span>
                <span className="text-xs sm:text-sm text-slate-500 truncate block">{stat.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { href: "/dashboard/sites/new", icon: "➕", label: "New Site", desc: "Add a field or forest" },
            { href: "/dashboard/analysis", icon: "🛰️", label: "Analysis", desc: "Analyze satellite data" },
            { href: "/dashboard/chat", icon: "💬", label: "Ask AI", desc: "Get AI-powered advice" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center group-hover:from-emerald-100 group-hover:to-emerald-50 transition-colors">
                <span className="text-lg sm:text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
              </div>
              <div className="text-center">
                <span className="block text-sm sm:text-base font-semibold text-slate-900 group-hover:text-emerald-700">{action.label}</span>
                <span className="hidden sm:block text-xs text-slate-500">{action.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sites */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Sites</h2>
          <Link href="/dashboard/sites" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 group">
            View all <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {sites.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
              <span className="text-4xl">🌱</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No sites yet</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">Add your first site (field or forest) to start monitoring it via satellite imagery and AI analysis.</p>
            <Link
              href="/dashboard/sites/new"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              Add Your First Site
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {sites.slice(0, 4).map((site) => (
              <Link
                key={site.id}
                href={`/dashboard/analysis?site=${site.id}`}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 hover:shadow-lg hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{site.site_type === "forest" ? "🌲" : "🌾"}</span>
                    <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">{site.name}</h3>
                  </div>
                  {site.health_score !== undefined && site.health_score !== null ? (
                    <Badge
                      variant={
                        site.health_score >= 60
                          ? "success"
                          : site.health_score >= 40
                            ? "warning"
                            : "error"
                      }
                    >
                      {Math.round(site.health_score)}%
                    </Badge>
                  ) : site.site_type === "forest" ? (
                    site.fire_risk_level && (
                      <span
                        className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded-lg",
                          site.fire_risk_level === "low"
                            ? "bg-emerald-100 text-emerald-700"
                            : site.fire_risk_level === "moderate"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        )}
                      >
                        🔥 {site.fire_risk_level}
                      </span>
                    )
                  ) : (
                    site.latest_ndvi && (
                      <span
                        className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded-lg",
                          site.latest_ndvi >= 0.6
                            ? "bg-emerald-100 text-emerald-700"
                            : site.latest_ndvi >= 0.4
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        )}
                      >
                        {site.latest_ndvi.toFixed(2)}
                      </span>
                    )
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  {site.site_type === "forest" ? (
                    site.forest_type && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md">{site.forest_type}</span>
                    )
                  ) : (
                    site.crop_type && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md">{site.crop_type}</span>
                    )
                  )}
                  {site.area_hectares && <span>{site.area_hectares.toFixed(1)} ha</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Alerts</h2>
            <Link href="/dashboard/alerts" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 group">
              View all <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-2xl border backdrop-blur-sm transition-all hover:shadow-md",
                  alert.severity === "critical"
                    ? "bg-red-50/80 border-red-200"
                    : alert.severity === "high"
                      ? "bg-amber-50/80 border-amber-200"
                      : "bg-blue-50/80 border-blue-200"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                  alert.severity === "critical"
                    ? "bg-red-100"
                    : alert.severity === "high"
                      ? "bg-amber-100"
                      : "bg-blue-100"
                )}>
                  {alert.severity === "critical" ? "🚨" : alert.severity === "high" ? "⚠️" : "ℹ️"}
                </div>
                <div className="flex-1">
                  <span className="block font-semibold text-slate-900">{alert.title}</span>
                  <span className="text-sm text-slate-600">{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
