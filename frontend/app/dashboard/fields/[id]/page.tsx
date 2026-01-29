"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getField,
  runAnalysis,
  getAnalysisHistory,
  getYieldPrediction,
  getBiomassEstimate,
  Field,
  Analysis,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";

const FieldMap = dynamic(() => import("@/components/map/FieldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

function getCenterFromGeometry(geometry: GeoJSON.Polygon | undefined): [number, number] {
  if (!geometry?.coordinates?.[0]) return [2.3522, 46.6034];
  const coords = geometry.coordinates[0];
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
}

export default function FieldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fieldId = Number(params.id);

  const [field, setField] = useState<Field | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [yieldData, setYieldData] = useState<any>(null);
  const [biomassData, setBiomassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, [fieldId]);

  async function loadData() {
    try {
      const [fieldData, analysisData] = await Promise.all([
        getField(fieldId),
        getAnalysisHistory(fieldId),
      ]);
      setField(fieldData);
      setAnalyses(analysisData);

      if (analysisData.length > 0) {
        try {
          const [yield_, biomass] = await Promise.all([
            getYieldPrediction(fieldId),
            getBiomassEstimate(fieldId),
          ]);
          setYieldData(yield_);
          setBiomassData(biomass);
        } catch (e) {
          console.error("Failed to load predictions:", e);
        }
      }
    } catch (error) {
      console.error("Failed to load field:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleRunAnalysis = async (type: string) => {
    setAnalyzing(true);
    try {
      const analysis = await runAnalysis(fieldId, type);
      setAnalyses((prev) => [analysis, ...prev]);
      const [yield_, biomass] = await Promise.all([
        getYieldPrediction(fieldId),
        getBiomassEstimate(fieldId),
      ]);
      setYieldData(yield_);
      setBiomassData(biomass);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("L'analyse a échoué. Veuillez réessayer.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600">Chargement de la parcelle...</p>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Parcelle non trouvée</h2>
        <Link href="/dashboard/fields" className="text-emerald-600 hover:underline">
          Retour aux parcelles
        </Link>
      </div>
    );
  }

  const latestNDVI = analyses.find((a) => a.analysis_type === "ndvi");

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{field.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {field.crop_type && (
                <Badge variant="primary">{field.crop_type}</Badge>
              )}
              {field.area_hectares && (
                <span className="text-sm text-slate-500">
                  {field.area_hectares.toFixed(2)} ha
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/dashboard/chat?field=${fieldId}`}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Consulter l'IA
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Map & Info */}
        <div className="xl:col-span-2 space-y-6">
          {/* Map */}
          <Card>
            <CardContent className="p-0">
              <div className="h-[400px] rounded-lg overflow-hidden">
                <FieldMap
                  fields={[field]}
                  center={getCenterFromGeometry(field.geometry)}
                  zoom={14}
                />
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500">Surface</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {field.area_hectares?.toFixed(2) || "—"} ha
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500">Culture</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {field.crop_type || "Non spécifiée"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500">Créée le</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {new Date(field.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500">Analyses</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {analyses.length}
                  </p>
                </div>
              </div>
              {field.description && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="text-slate-700">{field.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis History */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des analyses</CardTitle>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>Aucune analyse effectuée</p>
                  <p className="text-sm mt-1">Lancez une analyse pour voir les résultats ici</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analyses.slice(0, 5).map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          analysis.analysis_type === "ndvi"
                            ? "bg-green-100 text-green-600"
                            : analysis.analysis_type === "rvi"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-purple-100 text-purple-600"
                        }`}>
                          {analysis.analysis_type === "ndvi" ? "🌿" : 
                           analysis.analysis_type === "rvi" ? "📡" : "🔄"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {analysis.analysis_type.toUpperCase()}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(analysis.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      {analysis.mean_value && (
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {analysis.mean_value.toFixed(3)}
                          </p>
                          <Badge
                            variant={
                              analysis.mean_value >= 0.6
                                ? "success"
                                : analysis.mean_value >= 0.4
                                ? "warning"
                                : "error"
                            }
                          >
                            {analysis.mean_value >= 0.6
                              ? "Excellent"
                              : analysis.mean_value >= 0.4
                              ? "Modéré"
                              : "Attention"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Predictions */}
        <div className="space-y-6">
          {/* Analysis Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Analyses satellite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => handleRunAnalysis("ndvi")}
                disabled={analyzing}
                className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">🌿</span>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Analyser NDVI</p>
                  <p className="text-sm text-slate-500">Indice de végétation</p>
                </div>
              </button>
              <button
                onClick={() => handleRunAnalysis("rvi")}
                disabled={analyzing}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">📡</span>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Analyser RVI</p>
                  <p className="text-sm text-slate-500">Radar (fonctionne par temps nuageux)</p>
                </div>
              </button>
              <button
                onClick={() => handleRunAnalysis("fusion")}
                disabled={analyzing}
                className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">🔄</span>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Analyse fusionnée</p>
                  <p className="text-sm text-slate-500">Combine optique et radar</p>
                </div>
              </button>
              {analyzing && (
                <div className="flex items-center justify-center gap-2 py-4 text-emerald-600">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Analyse en cours...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Yield Prediction */}
          {yieldData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌾 Prédiction de rendement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-emerald-600">
                    {yieldData.predicted_yield?.toFixed(1) || "—"}
                  </p>
                  <p className="text-slate-500 mt-1">tonnes/hectare</p>
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Confiance</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(yieldData.confidence || 0.7) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {((yieldData.confidence || 0.7) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Biomass Estimate */}
          {biomassData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌱 Estimation biomasse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-green-600">
                    {biomassData.estimated_biomass?.toFixed(1) || "—"}
                  </p>
                  <p className="text-slate-500 mt-1">tonnes/hectare</p>
                </div>
                {biomassData.growth_stage && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">Stade de croissance</p>
                    <p className="font-medium text-green-700 mt-1">
                      {biomassData.growth_stage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
