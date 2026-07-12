import { requireAccess } from "@/lib/rbac";
import { StubPage } from "@/components/stub-page";

export default async function TripsPage() {
  await requireAccess("trips", "view");
  return (
    <StubPage
      title="Trip Dispatcher"
      blurb="The crown jewel — available-only vehicle & driver pickers, live cargo-vs-capacity validation, and atomic dispatch that flips vehicle + driver to On Trip. Part B."
    />
  );
}
