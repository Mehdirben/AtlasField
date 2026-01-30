"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSites, deleteSite, Site, SiteType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

const FieldMap = dynamic(() => import("@/components/map/FieldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500">Loading map...</p>
      </div>
    </div>
  ),
});

// Helper to get site icon based on type
const getSiteIcon = (siteType: SiteType) => {
  return siteType === "FOREST" ? "🌲" : "🌾";
};

// Helper to get site color classes
const getSiteColorClasses = (siteType: SiteType, isSelected: boolean) => {
  if (siteType === "FOREST") {
    return isSelected
      ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md"
      : "border-slate-200/60 hover:border-green-300 hover:bg-green-50/80";
  }
  return isSelected
    ? "border-emerald-400 bg-gradient-to-r from-emerald-50 to-cyan-50 shadow-md"
    : "border-slate-200/60 hover:border-emerald-300 hover:bg-slate-50/80";
};

export default function SitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<SiteType | "all">("all");

  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    try {
      const data = await getSites();
      setSites(data);
    } catch (error) {
      console.error("Failed to load sites:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: number) => {
    const site = sites.find(s => s.id === id);
    if (!confirm(`Are you sure you want to delete this ${site?.site_type || "site"}?`)) return;
    try {
      await deleteSite(id);
      setSites(sites.filter((s) => s.id !== id));
      if (selectedSite === id) setSelectedSite(null);
    } catch (error) {
      console.error("Failed to delete site:", error);
    }
  };

  const handleSiteClick = (siteId: number) => {
    setSelectedSite(siteId);
    router.push(`/dashboard/analysis?site=${siteId}`);
  };

  const filteredSites = filterType === "all"
    ? sites
    : sites.filter(s => s.site_type === filterType);

  const fieldCount = sites.filter(s => s.site_type === "FIELD").length;
  const forestCount = sites.filter(s => s.site_type === "FOREST").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Loading your sites...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Sites</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Manage and monitor your fields and forests</p>
        </div>
        <Link
          href="/dashboard/sites/new"
          className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-200 text-center text-sm sm:text-base"
        >
          + New Site
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType("all")}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all",
            filterType === "all"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          All ({sites.length})
        </button>
        <button
          onClick={() => setFilterType("FIELD")}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
            filterType === "FIELD"
              ? "bg-emerald-500 text-white"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          )}
        >
          🌾 Fields ({fieldCount})
        </button>
        <button
          onClick={() => setFilterType("FOREST")}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
            filterType === "FOREST"
              ? "bg-green-600 text-white"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          )}
        >
          🌲 Forests ({forestCount})
        </button>
      </div>

      {/* Map and List Grid */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Map */}
        <div className="lg:col-span-2 h-[300px] sm:h-[450px] lg:h-[600px] bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
          <FieldMap fields={filteredSites} onFieldClick={handleSiteClick} zoom={filteredSites.length > 0 ? 8 : 6} />
        </div>

        {/* Sites List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-4 sm:p-5 max-h-[400px] lg:h-[600px] lg:max-h-none flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white text-lg">🗺️</span>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{filteredSites.length} Site{filteredSites.length !== 1 ? "s" : ""}</h2>
                <p className="text-xs text-slate-500">Click to view details</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-2 pr-1 -mr-1">
            {filteredSites.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                  <span className="text-3xl">🌍</span>
                </div>
                <p className="text-slate-600 font-medium mb-2">
                  {filterType === "all" ? "No sites registered" : `No ${filterType}s registered`}
                </p>
                <p className="text-sm text-slate-500 mb-4">Start by adding your first site</p>
                <Link
                  href="/dashboard/sites/new"
                  className="inline-block px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  Add First Site
                </Link>
              </div>
            ) : (
              filteredSites.map((site) => (
                <div
                  key={site.id}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all duration-200 group",
                    getSiteColorClasses(site.site_type, selectedSite === site.id)
                  )}
                  onClick={() => handleSiteClick(site.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors",
                        selectedSite === site.id
                          ? (site.site_type === "FOREST" ? "bg-green-100" : "bg-emerald-100")
                          : "bg-slate-100 group-hover:bg-emerald-50"
                      )}>
                        {getSiteIcon(site.site_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">{site.name}</h3>
                        <p className="text-sm text-slate-500">
                          {site.site_type === "FOREST"
                            ? `${site.forest_type || "Forest"} • ${site.area_hectares?.toFixed(1) || "?"} ha`
                            : `${site.crop_type || "Not specified"} • ${site.area_hectares?.toFixed(1) || "?"} ha`
                          }
                        </p>
                        {site.site_type === "FOREST" && site.protected_status && (
                          <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                            🛡️ Protected
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Health indicator */}
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
                    ) : site.site_type === "FIELD" && site.latest_ndvi ? (
                      <span className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-lg",
                        site.latest_ndvi >= 0.6 ? "bg-emerald-100 text-emerald-700" :
                          site.latest_ndvi >= 0.4 ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                      )}>
                        {site.latest_ndvi.toFixed(2)}
                      </span>
                    ) : site.site_type === "FOREST" && site.fire_risk_level ? (
                      <span className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-lg",
                        site.fire_risk_level?.toUpperCase() === "LOW" ? "bg-green-100 text-green-700" :
                          (site.fire_risk_level?.toUpperCase() === "MEDIUM" || site.fire_risk_level?.toUpperCase() === "MODERATE") ? "bg-amber-100 text-amber-700" :
                            site.fire_risk_level?.toUpperCase() === "HIGH" ? "bg-orange-100 text-orange-700" :
                              "bg-red-100 text-red-700"
                      )}>
                        🔥 {site.fire_risk_level}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {site.latest_analysis_date
                        ? `Last analysis: ${new Date(site.latest_analysis_date).toLocaleDateString()}`
                        : "No analysis yet"}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(site.id); }}
                      className="text-xs text-slate-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
