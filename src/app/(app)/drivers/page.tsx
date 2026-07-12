import { requireAccess } from "@/lib/rbac";
import { StubPage } from "@/components/stub-page";

export default async function DriversPage() {
  await requireAccess("drivers", "view");
  return (
    <StubPage
      title="Drivers & Safety"
      blurb="Driver profiles, license validity, safety scores and status. Expired-license and suspended drivers are blocked from trip assignment."
    />
  );
}
