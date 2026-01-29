"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSite, SiteType } from "@/lib/api";
import { cn } from "@/lib/utils";

const FieldMap = dynamic(() => import("@/components/map/FieldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-100/50 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 font-medium">Loading map...</span>
      </div>
    </div>
  ),
});

const CROP_TYPES = [
  "Wheat",
  "Barley",
  "Corn",
  "Sunflower",
  "Olives",
  "Citrus",
  "Tomatoes",
  "Potatoes",
  "Grapes",
  "Almonds",
  "Other",
];

const TREE_SPECIES = [
  "Oak",
  "Pine",
  "Spruce",
  "Beech",
  "Birch",
  "Eucalyptus",
  "Cedar",
  "Fir",
  "Maple",
  "Mixed",
  "Unknown",
];

export default function NewSitePage() {
  const router = useRouter();
  const [siteType, setSiteType] = useState<SiteType>("field");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    crop_type: "",
    tree_species: "",
    protected_status: "",  // "protected", "unprotected", or empty
  });
  const [geometry, setGeometry] = useState<GeoJSON.Polygon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handlePolygonComplete = (coordinates: number[][][]) => {
    setGeometry({
      type: "Polygon",
      coordinates: coordinates,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!geometry) {
      setError(`Please draw the boundaries of your ${siteType} on the map`);
      return;
    }

    if (!formData.name.trim()) {
      setError(`Please give your ${siteType} a name`);
      return;
    }

    setLoading(true);

    try {
      await createSite({
        name: formData.name,
        description: formData.description || undefined,
        geometry: geometry,
        site_type: siteType,
        // Field-specific
        crop_type: siteType === "field" ? formData.crop_type || undefined : undefined,
        // Forest-specific (forest_type will be auto-detected by satellite)
        tree_species: siteType === "forest" ? formData.tree_species || undefined : undefined,
        protected_status: siteType === "forest" ? formData.protected_status : undefined,
      });

      router.push("/dashboard/sites");
    } catch (err: any) {
      setError(err.response?.data?.detail || `Error creating ${siteType}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">New Site</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Choose a site type, draw on the map and fill in the information
        </p>
      </div>

      {/* Site Type Selector */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm p-4 sm:p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl text-sm font-bold shadow-lg">
            0
          </span>
          What type of site do you want to add?
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSiteType("field")}
            className={cn(
              "p-6 rounded-xl border-2 transition-all duration-200 text-left",
              siteType === "field"
                ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-cyan-50 shadow-lg shadow-emerald-500/10"
                : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-colors",
                siteType === "field" ? "bg-emerald-100" : "bg-slate-100"
              )}>
                🌾
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Agricultural Field</h3>
                <p className="text-sm text-slate-500 mt-1">Track crops, NDVI, yields and more</p>
              </div>
            </div>
            {siteType === "field" && (
              <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Selected
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSiteType("forest")}
            className={cn(
              "p-6 rounded-xl border-2 transition-all duration-200 text-left",
              siteType === "forest"
                ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-500/10"
                : "border-slate-200 hover:border-green-300 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-colors",
                siteType === "forest" ? "bg-green-100" : "bg-slate-100"
              )}>
                🌲
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Forest</h3>
                <p className="text-sm text-slate-500 mt-1">Monitor fire risk, health, deforestation</p>
              </div>
            </div>
            {siteType === "forest" && (
              <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Selected
              </div>
            )}
          </button>
        </div>

        {siteType === "forest" && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-xl">🛰️</span>
              <div>
                <p className="text-sm font-medium text-blue-900">AI-Powered Forest Detection</p>
                <p className="text-sm text-blue-700 mt-1">
                  After you draw your forest boundaries, our satellite analysis will automatically classify the forest type
                  (coniferous, deciduous, or mixed) using spectral signatures from Sentinel-2 imagery.
                </p>
              </div>
            </div>
          </div>
        )}

        {siteType === "field" && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-xl">🛰️</span>
              <div>
                <p className="text-sm font-medium text-emerald-900">AI-Powered Crop Detection</p>
                <p className="text-sm text-emerald-700 mt-1">
                  If you leave the crop type empty, our satellite analysis will automatically identify the crop type
                  using multispectral temporal analysis from Sentinel-2 data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Map Section */}
        <div className="xl:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                <span className={cn(
                  "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-lg",
                  siteType === "forest"
                    ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25"
                    : "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25"
                )}>
                  1
                </span>
                Draw your {siteType} boundaries
              </h2>
            </div>
            <div className="p-3 sm:p-6">
              <div className="h-[300px] sm:h-[400px] lg:h-[500px] rounded-lg sm:rounded-xl overflow-hidden border border-slate-200/60">
                <FieldMap
                  editable={true}
                  onPolygonComplete={handlePolygonComplete}
                  zoom={8}
                />
              </div>
              {geometry && (
                <div className={cn(
                  "mt-4 flex items-center gap-2 px-4 py-3 rounded-xl border",
                  siteType === "forest"
                    ? "text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/60"
                    : "text-emerald-700 bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200/60"
                )}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">{siteType === "forest" ? "Forest" : "Field"} drawn! You can edit it or continue.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                <span className={cn(
                  "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-lg",
                  siteType === "forest"
                    ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25"
                    : "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25"
                )}>
                  2
                </span>
                {siteType === "forest" ? "Forest" : "Field"} information
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-200/60">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    {siteType === "forest" ? "Forest" : "Field"} Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder={siteType === "forest" ? "e.g. Cedar Valley Forest" : "e.g. North Field"}
                    required
                  />
                </div>

                {/* Field-specific: Crop Type */}
                {siteType === "field" && (
                  <div>
                    <label htmlFor="crop_type" className="block text-sm font-medium text-slate-700 mb-2">
                      Crop Type
                    </label>
                    <select
                      id="crop_type"
                      name="crop_type"
                      value={formData.crop_type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                    >
                      <option value="">Select or leave for auto-detection...</option>
                      {CROP_TYPES.map((crop) => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Crop type will be auto-detected via satellite if left empty
                    </p>
                  </div>
                )}

                {/* Forest-specific: Tree Species */}
                {siteType === "forest" && (
                  <>
                    <div>
                      <label htmlFor="tree_species" className="block text-sm font-medium text-slate-700 mb-2">
                        Primary Tree Species (optional)
                      </label>
                      <select
                        id="tree_species"
                        name="tree_species"
                        value={formData.tree_species}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white"
                      >
                        <option value="">Select or leave for auto-detection...</option>
                        {TREE_SPECIES.map((species) => (
                          <option key={species} value={species}>
                            {species}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        Forest type (coniferous/deciduous/mixed) will be auto-detected via satellite
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="protected_status"
                        name="protected_status"
                        checked={formData.protected_status === "protected"}
                        onChange={(e) => setFormData({ ...formData, protected_status: e.target.checked ? "protected" : "" })}
                        className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="protected_status" className="text-sm font-medium text-slate-700">
                        🛡️ Protected forest area
                      </label>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                    placeholder={siteType === "forest" ? "Notes about the forest..." : "Notes about the field..."}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !geometry}
                    className={cn(
                      "flex-1 px-4 py-3 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed",
                      siteType === "forest"
                        ? "bg-gradient-to-r from-green-500 to-green-600 hover:shadow-green-500/25"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-emerald-500/25"
                    )}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      `Create ${siteType === "forest" ? "Forest" : "Field"}`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
