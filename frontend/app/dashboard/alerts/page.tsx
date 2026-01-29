"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAlerts, markAlertRead, markAllAlertsRead, Alert } from "@/lib/api";
import { Badge } from "@/components/ui";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  async function loadAlerts() {
    try {
      setLoading(true);
      const data = await getAlerts(filter === "unread");
      setAlerts(data);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkRead = async (alertId: number) => {
    try {
      await markAlertRead(alertId);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      );
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead();
      setAlerts((prev) => prev.map((alert) => ({ ...alert, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all alerts as read:", error);
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const getSeverityIcon = (severity: string, alertType?: string) => {
    // Forest-specific icons
    if (alertType === "fire_risk") return "🔥";
    if (alertType === "deforestation") return "🪓";
    if (alertType === "drought_stress") return "🏜️";
    
    switch (severity) {
      case "critical":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "⚡";
      default:
        return "ℹ️";
    }
  };

  const getSeverityColor = (severity: string, alertType?: string) => {
    // Forest fire risk gets special treatment
    if (alertType === "fire_risk") {
      return "bg-orange-100 text-orange-700 border-orange-200";
    }
    if (alertType === "deforestation") {
      return "bg-red-100 text-red-700 border-red-200";
    }
    if (alertType === "drought_stress") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const groupAlertsByDate = (alerts: Alert[]) => {
    const groups: { [key: string]: Alert[] } = {};

    alerts.forEach((alert) => {
      const date = new Date(alert.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "Yesterday";
      } else {
        key = date.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(alert);
    });

    return groups;
  };

  const groupedAlerts = groupAlertsByDate(alerts);

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Alerts</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}`
              : "All alerts are read"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-xl p-1 sm:p-1.5 border border-slate-200/60 shadow-sm">
            <button
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "unread"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              onClick={() => setFilter("unread")}
            >
              Unread
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 sm:py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-200 text-center"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 mt-4">Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 py-20 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No alerts</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            {filter === "unread"
              ? "You've read all your alerts. Great job!"
              : "Your sites are doing well. Keep it up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAlerts).map(([date, dateAlerts]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-1">
                {date}
              </h2>
              <div className="space-y-3">
                {dateAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`bg-white/80 backdrop-blur-sm rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                      !alert.is_read ? "ring-2 ring-emerald-500/20 border-emerald-200" : "border-slate-200/60"
                    }`}
                  >
                    <div className="flex items-start gap-4 p-5">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border shrink-0 ${getSeverityColor(
                          alert.severity, alert.alert_type
                        )}`}
                      >
                        {getSeverityIcon(alert.severity, alert.alert_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {alert.title}
                            </h3>
                            <p className="text-slate-600">{alert.message}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant={
                                alert.severity === "critical"
                                  ? "error"
                                  : alert.severity === "high"
                                  ? "warning"
                                  : "default"
                              }
                            >
                              {alert.severity === "critical"
                                ? "Critical"
                                : alert.severity === "high"
                                ? "High"
                                : alert.severity === "medium"
                                ? "Medium"
                                : "Info"}
                            </Badge>
                            {!alert.is_read && (
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                          {(alert.field_name || alert.site_name) && (
                            <Link
                              href={`/dashboard/sites/${alert.site_id || alert.field_id}`}
                              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                            >
                              <span>📍</span> {alert.site_name || alert.field_name}
                            </Link>
                          )}
                          <span className="text-sm text-slate-400">
                            {new Date(alert.created_at).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {!alert.is_read && (
                            <button
                              onClick={() => handleMarkRead(alert.id)}
                              className="text-sm text-slate-500 hover:text-emerald-600 transition-colors ml-auto"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
