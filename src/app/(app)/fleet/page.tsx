import { requireAccess } from "@/lib/rbac";
import { StubPage } from "@/components/stub-page";

export default async function FleetPage() {
  await requireAccess("fleet", "view");
  return (
    <StubPage
      title="Vehicle Registry"
      blurb="Master list of vehicles with registration, capacity, odometer, cost and status. Part B — add/edit/retire vehicles with unique registration enforcement."
    />
  );
}
