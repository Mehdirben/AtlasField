"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogoutIcon, MenuIcon } from "@/components/icons";

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  return (
    <nav className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
          <MenuIcon className="w-5 h-5 text-slate-600" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🛰️</span>
          <span className="hidden sm:inline bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            AtlasField
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-900">
              {user.name || user.email?.split("@")[0]}
            </p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
            {(user.name || user.email || "U")[0].toUpperCase()}
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <LogoutIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
