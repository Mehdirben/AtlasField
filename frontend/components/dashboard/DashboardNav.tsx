"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogoutIcon } from "@/components/icons";

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  return (
    <nav className="h-14 sm:h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 font-bold text-lg group">
          <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">🛰️</span>
          <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent text-base sm:text-lg">
            AtlasField
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-900">
              {user.name || user.email?.split("@")[0]}
            </p>
            <p className="text-xs text-slate-500 hidden md:block">{user.email}</p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-emerald-500/20 text-sm sm:text-base">
            {(user.name || user.email || "U")[0].toUpperCase()}
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all duration-200"
          title="Sign Out"
        >
          <LogoutIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
