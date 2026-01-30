"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  MapIcon,
  SatelliteIcon,
  ChatIcon,
  BellIcon,
  SettingsIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getSites, getCurrentUser, UserProfile } from "@/lib/api";
import { SITE_LIMITS, SubscriptionTier } from "@/lib/constants";

const menuItems = [
  { href: "/dashboard", icon: DashboardIcon, label: "Dashboard", exact: true, mobileLabel: "Home" },
  { href: "/dashboard/sites", icon: MapIcon, label: "My Sites", mobileLabel: "Sites" },
  { href: "/dashboard/analysis", icon: SatelliteIcon, label: "Analysis", mobileLabel: "Analysis" },
  { href: "/dashboard/chat", icon: ChatIcon, label: "AI Assistant", mobileLabel: "Chat" },
  { href: "/dashboard/alerts", icon: BellIcon, label: "Alerts", mobileLabel: "Alerts" },
  { href: "/dashboard/settings", icon: SettingsIcon, label: "Settings", mobileLabel: "Settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [siteCount, setSiteCount] = useState<number | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sitesData, userData] = await Promise.all([
          getSites(),
          getCurrentUser(),
        ]);
        setSiteCount(sitesData.length);
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch sidebar data:", error);
      }
    }
    fetchData();
  }, [pathname]); // Refresh when navigating, as sites might have changed

  const isActive = (item: (typeof menuItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const tier = user?.subscription_tier || "free";
  const limit = SITE_LIMITS[tier as SubscriptionTier];
  const planName = tier === "free" ? "Free Plan" : tier === "pro" ? "Pro Plan" : "Enterprise Plan";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 h-[calc(100vh-64px)] sticky top-16">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-transparent to-transparent pointer-events-none" />

        <nav className="flex-1 p-4 relative">
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">
              Menu
            </p>
          </div>
          <ul className="space-y-1.5">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                    isActive(item)
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform",
                    isActive(item) && "scale-110"
                  )} />
                  <span>{item.label}</span>
                  {isActive(item) && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 relative">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-cyan-500 rounded-2xl p-4 lg:p-5 shadow-lg shadow-emerald-500/20">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                  Current
                </span>
                <span className="text-white/80 text-xs">
                  {siteCount !== null ? `${siteCount}/${limit}` : "-/-"} sites
                </span>
              </div>
              <p className="text-white font-bold text-base lg:text-lg mb-1">{planName}</p>
              <p className="text-emerald-100 text-xs lg:text-sm mb-4">
                {tier === "free" ? "Upgrade for unlimited access" : "Enjoy your premium features"}
              </p>
              <Link
                href="/dashboard/settings?tab=subscription"
                className="block w-full text-center py-2 lg:py-2.5 bg-white text-emerald-600 text-sm font-semibold rounded-xl hover:bg-emerald-50 hover:shadow-lg transition-all duration-200"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {menuItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]",
                isActive(item)
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive(item) && "scale-110"
              )} />
              <span className="text-[10px] font-medium">{item.mobileLabel}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
