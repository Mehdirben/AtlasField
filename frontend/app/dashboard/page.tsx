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
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link
          href="/dashboard/fields/new"
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium rounded-lg hover:shadow-lg transition-all"
        >
          + Add Field
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { icon: "🗺️", value: fields.length, label: "Fields" },
          { icon: "📐", value: totalArea.toFixed(1), label: "Total Hectares" },
          { icon: "✅", value: healthyFields, label: "Healthy Fields" },
          { icon: "⚠️", value: fieldsNeedingAttention, label: "Need Attention" },
          { icon: "🔔", value: alerts.length, label: "Unread Alerts" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <span className="block text-2xl font-bold text-slate-900">{stat.value}</span>
                <span className="text-sm text-slate-500">{stat.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: "/dashboard/fields/new", icon: "➕", label: "New Field" },
            { href: "/dashboard/analysis", icon: "🛰️", label: "Run Analysis" },
            { href: "/dashboard/chat", icon: "💬", label: "Ask AI" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Fields */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Fields</h2>
          <Link href="/dashboard/fields" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            View all →
          </Link>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <span className="text-4xl mb-4 block">🌱</span>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No fields yet</h3>
            <p className="text-slate-500 mb-4">Add your first field to start monitoring it via satellite.</p>
            <Link
              href="/dashboard/fields/new"
              className="inline-block px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Add Field
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {fields.slice(0, 4).map((field) => (
              <Link
                key={field.id}
                href={`/dashboard/fields/${field.id}`}
                className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{field.name}</h3>
                  {field.latest_ndvi && (
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        field.latest_ndvi >= 0.6
                          ? "bg-green-100 text-green-700"
                          : field.latest_ndvi >= 0.4
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      NDVI: {field.latest_ndvi.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  {field.crop_type && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded">{field.crop_type}</span>
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
            <Link href="/dashboard/alerts" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border",
                  alert.severity === "critical"
                    ? "bg-red-50 border-red-200"
                    : alert.severity === "high"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-blue-50 border-blue-200"
                )}
              >
                <span className="text-xl">
                  {alert.severity === "critical" ? "🚨" : alert.severity === "high" ? "⚠️" : "ℹ️"}
                </span>
                <div>
                  <span className="block font-medium text-slate-900">{alert.title}</span>
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
