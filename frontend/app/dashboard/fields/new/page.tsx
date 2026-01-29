"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createField } from "@/lib/api";

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

export default function NewFieldPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    crop_type: "",
  });
  const [geometry, setGeometry] = useState<GeoJSON.Polygon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
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
      setError("Please draw the boundaries of your field on the map");
      return;
    }

    if (!formData.name.trim()) {
      setError("Please give your field a name");
      return;
    }

    setLoading(true);

    try {
      await createField({
        name: formData.name,
        description: formData.description || undefined,
        geometry: geometry,
        crop_type: formData.crop_type || undefined,
      });

      router.push("/dashboard/fields");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error creating field");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">New Field</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Draw your field on the map and fill in the information
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Map Section */}
        <div className="xl:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25">
                  1
                </span>
                Draw your field boundaries
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
                <div className="mt-4 flex items-center gap-2 text-emerald-700 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-3 rounded-xl border border-emerald-200/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Field drawn! You can edit it or continue.</span>
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
                <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25">
                  2
                </span>
                Field information
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
                    Field Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="e.g. North Field"
                    required
                  />
                </div>

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
                    <option value="">Select...</option>
                    {CROP_TYPES.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                </div>

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
                    placeholder="Notes about the field..."
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
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      "Create Field"
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
