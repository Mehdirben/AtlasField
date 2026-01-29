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

const menuItems = [
  { href: "/dashboard", icon: DashboardIcon, label: "Dashboard", exact: true },
  { href: "/dashboard/fields", icon: MapIcon, label: "My Fields" },
  { href: "/dashboard/analysis", icon: SatelliteIcon, label: "Analysis" },
  { href: "/dashboard/chat", icon: ChatIcon, label: "AI Assistant" },
  { href: "/dashboard/alerts", icon: BellIcon, label: "Alerts" },
  { href: "/dashboard/settings", icon: SettingsIcon, label: "Settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  const isActive = (item: (typeof menuItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="hidden md:flex flex-col w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 h-[calc(100vh-64px)] sticky top-16">
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
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-cyan-500 rounded-2xl p-5 shadow-lg shadow-emerald-500/20">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                Current
              </span>
              <span className="text-white/80 text-xs">1/3 fields</span>
            </div>
            <p className="text-white font-bold text-lg mb-1">Free Plan</p>
            <p className="text-emerald-100 text-sm mb-4">Upgrade for unlimited access</p>
            <Link
              href="/dashboard/settings?tab=subscription"
              className="block w-full text-center py-2.5 bg-white text-emerald-600 text-sm font-semibold rounded-xl hover:bg-emerald-50 hover:shadow-lg transition-all duration-200"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
