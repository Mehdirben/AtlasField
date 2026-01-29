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
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-[calc(100vh-64px)]">
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                  isActive(item)
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-500">Current Plan</span>
            <span className="text-xs font-medium px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
              Free
            </span>
          </div>
          <Link
            href="/dashboard/upgrade"
            className="block w-full text-center py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </aside>
  );
}
