"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "subscription">("profile");
  const [saving, setSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    email_alerts: true,
    critical_only: false,
    weekly_report: true,
    analysis_complete: true,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const subscriptionTiers = [
    {
      name: "Gratuit",
      price: "0€",
      period: "/mois",
      features: [
        "1 parcelle",
        "5 analyses/mois",
        "Données NDVI basiques",
        "7 jours d'historique",
      ],
      current: true,
    },
    {
      name: "Pro",
      price: "29€",
      period: "/mois",
      features: [
        "10 parcelles",
        "100 analyses/mois",
        "NDVI + RVI + Fusion",
        "1 an d'historique",
        "Export des données",
        "Support prioritaire",
      ],
      current: false,
      popular: true,
    },
    {
      name: "Entreprise",
      price: "Sur devis",
      period: "",
      features: [
        "Parcelles illimitées",
        "Analyses illimitées",
        "API dédiée",
        "Historique illimité",
        "Formation personnalisée",
        "Support 24/7",
      ],
      current: false,
    },
  ];

  const tabs = [
    { id: "profile", label: "Profil", icon: "👤" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "subscription", label: "Abonnement", icon: "💳" },
  ] as const;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-600 mt-1">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <nav className="lg:w-64 flex lg:flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-3xl">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        defaultValue={session?.user?.name || ""}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={session?.user?.email || ""}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                        disabled
                      />
                      <p className="text-sm text-slate-500 mt-1">
                        L'email ne peut pas être modifié
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        placeholder="+33 6 00 00 00 00"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <Button type="submit" className="mt-4">
                      Enregistrer les modifications
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Changer le mot de passe</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="mt-4">
                      Mettre à jour le mot de passe
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Zone de danger</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    La suppression de votre compte est irréversible. Toutes vos données
                    seront définitivement supprimées.
                  </p>
                  <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium">
                    Supprimer mon compte
                  </button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      key: "email_alerts" as const,
                      title: "Alertes par email",
                      description: "Recevez les alertes importantes par email",
                    },
                    {
                      key: "critical_only" as const,
                      title: "Alertes critiques uniquement",
                      description: "Ne recevoir que les alertes critiques",
                    },
                    {
                      key: "weekly_report" as const,
                      title: "Rapport hebdomadaire",
                      description: "Résumé de l'état de vos parcelles chaque semaine",
                    },
                    {
                      key: "analysis_complete" as const,
                      title: "Analyses terminées",
                      description: "Notification quand une analyse satellite est terminée",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-slate-900">{item.title}</h3>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                      <button
                        onClick={() => handleNotificationChange(item.key)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications[item.key] ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications[item.key] ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <Button className="mt-6">Enregistrer les préférences</Button>
              </CardContent>
            </Card>
          )}

          {/* Subscription Tab */}
          {activeTab === "subscription" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Votre abonnement actuel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Plan Gratuit</h3>
                      <p className="text-sm text-slate-600">
                        1 parcelle • 5 analyses/mois
                      </p>
                    </div>
                    <Badge variant="primary">Actif</Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subscriptionTiers.map((tier) => (
                  <Card
                    key={tier.name}
                    className={`relative ${
                      tier.popular ? "ring-2 ring-emerald-500" : ""
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="primary">Populaire</Badge>
                      </div>
                    )}
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {tier.name}
                      </h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-slate-900">
                          {tier.price}
                        </span>
                        <span className="text-slate-500">{tier.period}</span>
                      </div>
                      <ul className="mt-6 space-y-3">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <svg
                              className="w-5 h-5 text-emerald-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={`w-full mt-6 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                          tier.current
                            ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                            : tier.popular
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                        disabled={tier.current}
                      >
                        {tier.current ? "Plan actuel" : "Choisir ce plan"}
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
