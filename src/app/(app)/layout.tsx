import { requireUser } from "@/lib/rbac";
import { canAccess, NAV_ITEMS } from "@/lib/constants";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  // Only show nav items this role can reach.
  const items = NAV_ITEMS.filter((item) => canAccess(session.role, item.domain));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={items} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar name={session.name} role={session.role} navItems={items} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
