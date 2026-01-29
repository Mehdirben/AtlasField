"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAlerts, markAlertRead, markAllAlertsRead, Alert } from "@/lib/api";
import { Card, CardContent, Badge } from "@/components/ui";

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

  const getSeverityIcon = (severity: string) => {
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

  const getSeverityColor = (severity: string) => {
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
        key = "Aujourd'hui";
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "Hier";
      } else {
        key = date.toLocaleDateString("fr-FR", {
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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alertes</h1>
          <p className="text-slate-600 mt-1">
            {unreadCount > 0
              ? `${unreadCount} alerte${unreadCount > 1 ? "s" : ""} non lue${
                  unreadCount > 1 ? "s" : ""
                }`
              : "Toutes les alertes sont lues"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setFilter("all")}
            >
              Toutes
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "unread"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setFilter("unread")}
            >
              Non lues
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 mt-4">Chargement des alertes...</p>
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <span className="text-6xl mb-4 block">✅</span>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Aucune alerte</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              {filter === "unread"
                ? "Vous avez lu toutes vos alertes. Bravo !"
                : "Vos cultures se portent bien. Continuez ainsi !"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAlerts).map(([date, dateAlerts]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                {date}
              </h2>
              <div className="space-y-3">
                {dateAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`transition-all ${
                      !alert.is_read ? "ring-2 ring-emerald-500/20" : ""
                    }`}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4 p-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${getSeverityColor(
                            alert.severity
                          )}`}
                        >
                          {getSeverityIcon(alert.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                {alert.title}
                              </h3>
                              <p className="text-slate-600 mt-1">{alert.message}</p>
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
                                  ? "Critique"
                                  : alert.severity === "high"
                                  ? "Important"
                                  : alert.severity === "medium"
                                  ? "Moyen"
                                  : "Info"}
                              </Badge>
                              {!alert.is_read && (
                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            {alert.field_name && (
                              <Link
                                href={`/dashboard/fields/${alert.field_id}`}
                                className="text-sm text-emerald-600 hover:underline"
                              >
                                📍 {alert.field_name}
                              </Link>
                            )}
                            <span className="text-sm text-slate-400">
                              {new Date(alert.created_at).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {!alert.is_read && (
                              <button
                                onClick={() => handleMarkRead(alert.id)}
                                className="text-sm text-slate-500 hover:text-slate-700"
                              >
                                Marquer comme lu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
