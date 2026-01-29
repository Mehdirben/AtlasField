import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardNav, DashboardSidebar } from "@/components/dashboard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <DashboardNav user={session.user} />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto min-h-[calc(100vh-64px)] pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
