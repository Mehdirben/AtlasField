"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFields, getAlerts, Field, Alert } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [fieldsData, alertsData] = await Promise.all([
          getFields(),
          getAlerts(true),
        ]);
        setFields(fieldsData);
        setAlerts(alertsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalArea = fields.reduce((sum, f) => sum + (f.area_hectares || 0), 0);
  const healthyFields = fields.filter((f) => f.latest_ndvi && f.latest_ndvi >= 0.4).length;
  const fieldsNeedingAttention = fields.filter((f) => f.latest_ndvi && f.latest_ndvi < 0.4).length;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's an overview of your fields.</p>
        </div>
        <Link
          href="/dashboard/fields/new"
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-200"
        >
          + Add Field
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: "🗺️", value: fields.length, label: "Fields", color: "from-blue-500 to-blue-600" },
          { icon: "📐", value: totalArea.toFixed(1), label: "Total Hectares", color: "from-purple-500 to-purple-600" },
          { icon: "✅", value: healthyFields, label: "Healthy Fields", color: "from-emerald-500 to-emerald-600" },
          { icon: "⚠️", value: fieldsNeedingAttention, label: "Need Attention", color: "from-amber-500 to-amber-600" },
          { icon: "🔔", value: alerts.length, label: "Unread Alerts", color: "from-red-500 to-red-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <span className="text-xl text-white drop-shadow">{stat.icon}</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-slate-900">{stat.value}</span>
                <span className="text-sm text-slate-500">{stat.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: "/dashboard/fields/new", icon: "➕", label: "New Field", desc: "Add a field to monitor" },
            { href: "/dashboard/analysis", icon: "🛰️", label: "Run Analysis", desc: "Analyze satellite data" },
            { href: "/dashboard/chat", icon: "💬", label: "Ask AI", desc: "Get AI-powered advice" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-3 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center group-hover:from-emerald-100 group-hover:to-emerald-50 transition-colors">
                <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
              </div>
              <div className="text-center">
                <span className="block font-semibold text-slate-900 group-hover:text-emerald-700">{action.label}</span>
                <span className="text-xs text-slate-500">{action.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Fields */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Fields</h2>
          <Link href="/dashboard/fields" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 group">
            View all <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
              <span className="text-4xl">🌱</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No fields yet</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">Add your first field to start monitoring it via satellite imagery and AI analysis.</p>
            <Link
              href="/dashboard/fields/new"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              Add Your First Field
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {fields.slice(0, 4).map((field) => (
              <Link
                key={field.id}
                href={`/dashboard/analysis?field=${field.id}`}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 hover:shadow-lg hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">{field.name}</h3>
                  {field.latest_ndvi && (
                    <span
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-lg",
                        field.latest_ndvi >= 0.6
                          ? "bg-emerald-100 text-emerald-700"
                          : field.latest_ndvi >= 0.4
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {field.latest_ndvi.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  {field.crop_type && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">{field.crop_type}</span>
                  )}
                  {field.area_hectares && <span>{field.area_hectares.toFixed(1)} ha</span>}
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
