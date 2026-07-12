import { requireAccess } from "@/lib/rbac";
import { StubPage } from "@/components/stub-page";

export default async function SettingsPage() {
  await requireAccess("settings", "view");
  return (
    <StubPage
      title="Settings & RBAC"
      blurb="Depot name, currency and distance unit, plus the role-based access matrix. Part B."
    />
  );
}
