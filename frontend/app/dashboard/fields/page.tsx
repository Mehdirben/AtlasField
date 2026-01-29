"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFields, deleteField, Field } from "@/lib/api";
import { cn } from "@/lib/utils";

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

export default function FieldsPage() {
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<number | null>(null);

  useEffect(() => {
    loadFields();
  }, []);

  async function loadFields() {
    try {
      const data = await getFields();
      setFields(data);
    } catch (error) {
      console.error("Failed to load fields:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this field?")) return;
    try {
      await deleteField(id);
      setFields(fields.filter((f) => f.id !== id));
      if (selectedField === id) setSelectedField(null);
    } catch (error) {
      console.error("Failed to delete field:", error);
    }
  };

  const handleFieldClick = (fieldId: number) => {
    setSelectedField(fieldId);
    router.push(`/dashboard/analysis?field=${fieldId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Loading your fields...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Fields</h1>
          <p className="text-slate-500 mt-1">Manage and monitor all your agricultural fields</p>
        </div>
        <Link
          href="/dashboard/fields/new"
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-200"
        >
          + New Field
        </Link>
      </div>

      {/* Map and List Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 h-[600px] bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
          <FieldMap fields={fields} onFieldClick={handleFieldClick} zoom={fields.length > 0 ? 8 : 6} />
        </div>

        {/* Fields List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 h-[600px] flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white text-lg">🗺️</span>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{fields.length} Field{fields.length !== 1 ? "s" : ""}</h2>
                <p className="text-xs text-slate-500">Click to view details</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-2 pr-1 -mr-1">
            {fields.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                  <span className="text-3xl">🌱</span>
                </div>
                <p className="text-slate-600 font-medium mb-2">No fields registered</p>
                <p className="text-sm text-slate-500 mb-4">Start by adding your first field</p>
                <Link 
                  href="/dashboard/fields/new" 
                  className="inline-block px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  Add First Field
                </Link>
              </div>
            ) : (
              fields.map((field) => (
                <div
                  key={field.id}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all duration-200 group",
                    selectedField === field.id 
                      ? "border-emerald-400 bg-gradient-to-r from-emerald-50 to-cyan-50 shadow-md" 
                      : "border-slate-200/60 hover:border-emerald-300 hover:bg-slate-50/80"
                  )}
                  onClick={() => handleFieldClick(field.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors",
                        selectedField === field.id ? "bg-emerald-100" : "bg-slate-100 group-hover:bg-emerald-50"
                      )}>
                        🌾
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">{field.name}</h3>
                        <p className="text-sm text-slate-500">{field.crop_type || "Not specified"} • {field.area_hectares?.toFixed(1) || "?"} ha</p>
                      </div>
                    </div>
                    {field.latest_ndvi && (
                      <span className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-lg",
                        field.latest_ndvi >= 0.6 ? "bg-emerald-100 text-emerald-700" : 
                        field.latest_ndvi >= 0.4 ? "bg-amber-100 text-amber-700" : 
                        "bg-red-100 text-red-700"
                      )}>
                        {field.latest_ndvi.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {field.latest_analysis_date 
                        ? `Last analysis: ${new Date(field.latest_analysis_date).toLocaleDateString()}`
                        : "No analysis yet"}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(field.id); }} 
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
