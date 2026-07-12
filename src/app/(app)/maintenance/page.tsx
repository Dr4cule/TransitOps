import { requireAccess } from "@/lib/rbac";
import { StubPage } from "@/components/stub-page";

export default async function MaintenancePage() {
  await requireAccess("maintenance", "view");
  return (
    <StubPage
      title="Maintenance"
      blurb="Log service records; an active record flips the vehicle to In Shop and hides it from dispatch. Closing restores Available. Part B."
    />
  );
}
