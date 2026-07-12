import { requireAccess } from "@/lib/rbac";
import { StubPage } from "@/components/stub-page";

export default async function ExpensesPage() {
  await requireAccess("expenses", "view");
  return (
    <StubPage
      title="Fuel & Expenses"
      blurb="Fuel logs and other expenses (tolls / misc), with auto Total Operational Cost = Fuel + Maintenance."
    />
  );
}
