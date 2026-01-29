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
    <div className="flex items-center justify-center h-full bg-slate-100 rounded-xl">
      <p className="text-slate-500">Loading map...</p>
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
    router.push(`/dashboard/fields/${fieldId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Loading fields...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Fields</h1>
        <Link
          href="/dashboard/fields/new"
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium rounded-lg hover:shadow-lg transition-all"
        >
          + New Field
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[500px] bg-white rounded-xl border border-slate-200 overflow-hidden">
          <FieldMap fields={fields} onFieldClick={handleFieldClick} zoom={fields.length > 0 ? 8 : 6} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 h-[500px] overflow-auto">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {fields.length} field{fields.length !== 1 ? "s" : ""}
          </h2>

          {fields.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-4">🌱</span>
              <p className="text-slate-500 mb-4">No fields registered</p>
              <Link href="/dashboard/fields/new" className="inline-block px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600">
                Add First Field
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedField === field.id ? "border-emerald-500 bg-emerald-50" : "border-slate-100 hover:border-emerald-200"
                  )}
                  onClick={() => handleFieldClick(field.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{field.name}</h3>
                      <p className="text-sm text-slate-500">{field.crop_type || "Not specified"} • {field.area_hectares?.toFixed(1) || "?"} ha</p>
                    </div>
                    {field.latest_ndvi && (
                      <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full",
                        field.latest_ndvi >= 0.6 ? "bg-green-100 text-green-700" : field.latest_ndvi >= 0.4 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      )}>{field.latest_ndvi.toFixed(2)}</span>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(field.id); }} className="mt-2 text-xs text-red-500 hover:text-red-700">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
