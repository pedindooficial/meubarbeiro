import ProfileGuard from "@/components/ProfileGuard";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfileGuard>{children}</ProfileGuard>;
}
