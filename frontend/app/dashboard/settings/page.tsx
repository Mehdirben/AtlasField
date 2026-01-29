"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Badge, Button } from "@/components/ui";

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "subscription">("profile");

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "subscription" || tab === "notifications" || tab === "profile") {
      setActiveTab(tab);
    }
  }, [searchParams]);
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
      name: "Free",
      price: "$0",
      period: "/month",
      features: [
        "1 field",
        "5 analyses/month",
        "Basic NDVI data",
        "7 days history",
      ],
      current: true,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      features: [
        "10 fields",
        "100 analyses/month",
        "NDVI + RVI + Fusion",
        "1 year history",
        "Data export",
        "Priority support",
      ],
      current: false,
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      features: [
        "Unlimited fields",
        "Unlimited analyses",
        "Dedicated API",
        "Unlimited history",
        "Custom training",
        "24/7 support",
      ],
      current: false,
    },
  ];

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "subscription", label: "Subscription", icon: "💳" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Sidebar Tabs - Horizontal on mobile, vertical on desktop */}
        <nav className="lg:w-56 flex lg:flex-col gap-1 sm:gap-2 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-slate-200/60 shadow-sm h-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-left transition-all whitespace-nowrap text-sm sm:text-base ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/25"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-lg sm:text-xl">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-3xl">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Personal Information</h2>
                </div>
                <div className="p-6">
                  <form className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={session?.user?.name || ""}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={session?.user?.email || ""}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                        disabled
                      />
                      <p className="text-sm text-slate-500 mt-1.5">
                        Email cannot be changed
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <Button type="submit" className="mt-4">
                      Save Changes
                    </Button>
                  </form>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Change Password</h2>
                </div>
                <div className="p-6">
                  <form className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="mt-4">
                      Update Password
                    </Button>
                  </form>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-red-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-red-100">
                  <h2 className="font-semibold text-red-600">Danger Zone</h2>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 mb-4">
                    Deleting your account is irreversible. All your data will be permanently deleted.
                  </p>
                  <button className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium border border-red-200">
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Notification Preferences</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    {
                      key: "email_alerts" as const,
                      title: "Email Alerts",
                      description: "Receive important alerts via email",
                    },
                    {
                      key: "critical_only" as const,
                      title: "Critical Alerts Only",
                      description: "Only receive critical alerts",
                    },
                    {
                      key: "weekly_report" as const,
                      title: "Weekly Report",
                      description: "Summary of your fields status every week",
                    },
                    {
                      key: "analysis_complete" as const,
                      title: "Analysis Complete",
                      description: "Notification when a satellite analysis is complete",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/60"
                    >
                      <div>
                        <h3 className="font-medium text-slate-900">{item.title}</h3>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                      <button
                        onClick={() => handleNotificationChange(item.key)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                          notifications[item.key] ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                            notifications[item.key] ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <Button className="mt-6">Save Preferences</Button>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === "subscription" && (
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Current Subscription</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-200/60">
                    <div>
                      <h3 className="font-semibold text-slate-900">Free Plan</h3>
                      <p className="text-sm text-slate-600">
                        1 field • 5 analyses/month
                      </p>
                    </div>
                    <Badge variant="primary">Active</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subscriptionTiers.map((tier) => (
                  <div
                    key={tier.name}
                    className={`relative bg-white/80 backdrop-blur-sm rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md flex flex-col ${
                      tier.popular ? "ring-2 ring-emerald-500 border-emerald-200" : "border-slate-200/60"
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-0 left-0 right-0">
                        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-center py-1.5 text-sm font-medium">
                          Most Popular
                        </div>
                      </div>
                    )}
                    <div className={`p-6 flex flex-col flex-1 ${tier.popular ? "pt-12" : ""}`}>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {tier.name}
                      </h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-slate-900">
                          {tier.price}
                        </span>
                        <span className="text-slate-500">{tier.period}</span>
                      </div>
                      <ul className="mt-6 space-y-3 flex-1">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <svg
                              className="w-5 h-5 text-emerald-500 shrink-0"
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
                        className={`w-full mt-6 px-4 py-3 rounded-xl font-medium transition-all ${
                          tier.current
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : tier.popular
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/25"
                            : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                        disabled={tier.current}
                      >
                        {tier.current ? "Current Plan" : "Choose Plan"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
