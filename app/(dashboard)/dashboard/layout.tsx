import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import MobileBottomNav from "@/components/MobileBottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as { role?: string }).role === "admin") redirect("/admin");

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="p-4 md:p-6 md:ml-64 min-h-screen pb-24 md:pb-6">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
