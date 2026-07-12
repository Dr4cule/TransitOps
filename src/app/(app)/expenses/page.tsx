import { requireAccess } from "@/lib/rbac";
import {
  listVehiclesLite,
  listFuelLogs,
  listExpenses,
  operationalCost,
} from "@/modules/fuel-expenses/finance.repository";
import { inr, num } from "@/lib/utils";
import { BrutalTable, Tr, Td } from "@/components/ui/brutal-table";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ExportButton } from "@/components/export-button";
import { FuelForm } from "@/components/finance/FuelForm";
import { ExpenseForm } from "@/components/finance/ExpenseForm";

export default async function ExpensesPage() {
  const { access } = await requireAccess("expenses", "view");
  const canEdit = access === "crud";

  const [vehicles, fuelLogs, expenses, cost] = await Promise.all([
    listVehiclesLite(),
    listFuelLogs(),
    listExpenses(),
    operationalCost(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-fg">Fuel &amp; Expenses</h1>
        {canEdit && (
          <div className="flex items-center gap-3">
            <ExportButton dataset="fuel" label="Export Fuel CSV" />
            <ExportButton dataset="expenses" label="Export Expenses CSV" />
            <FuelForm vehicles={vehicles} />
            <ExpenseForm vehicles={vehicles} />
          </div>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-fg">Fuel Logs</h2>
        <BrutalTable
          headers={[
            { label: "Vehicle" },
            { label: "Date" },
            { label: "Liters", align: "right" },
            { label: "Fuel Cost", align: "right" },
          ]}
        >
          {fuelLogs.length === 0 ? (
            <Tr>
              <Td className="text-fg-dim">No fuel logged yet.</Td>
              <Td>{""}</Td>
              <Td>{""}</Td>
              <Td>{""}</Td>
            </Tr>
          ) : (
            fuelLogs.map((f) => (
              <Tr key={f.id}>
                <Td>{f.vehicle.name}</Td>
                <Td mono>{f.date.toISOString().slice(0, 10)}</Td>
                <Td mono align="right">{num(Number(f.liters))} L</Td>
                <Td mono align="right">{inr(Number(f.cost))}</Td>
              </Tr>
            ))
          )}
        </BrutalTable>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-fg">Other Expenses</h2>
        <BrutalTable
          headers={[
            { label: "Vehicle" },
            { label: "Category" },
            { label: "Amount", align: "right" },
            { label: "Notes" },
            { label: "Date" },
          ]}
        >
          {expenses.length === 0 ? (
            <Tr>
              <Td className="text-fg-dim">No expenses recorded yet.</Td>
              <Td>{""}</Td>
              <Td>{""}</Td>
              <Td>{""}</Td>
              <Td>{""}</Td>
            </Tr>
          ) : (
            expenses.map((e) => (
              <Tr key={e.id}>
                <Td>{e.vehicle.name}</Td>
                <Td mono>{e.category}</Td>
                <Td mono align="right">{inr(Number(e.amount))}</Td>
                <Td>{e.notes ?? "—"}</Td>
                <Td mono>{e.date.toISOString().slice(0, 10)}</Td>
              </Tr>
            ))
          )}
        </BrutalTable>
      </section>

      <BrutalCard className="bg-st-orange p-6">
        <p className="label !text-ink">
          Total Operational Cost (Fuel + Maintenance + Toll/Other)
        </p>
        <p className="tnum text-2xl font-bold text-brand mt-1">{inr(cost.total)}</p>
        <p className="tnum text-sm text-ink mt-2">
          Fuel {inr(cost.fuel)} · Maintenance {inr(cost.maintenance)} · Toll/Other {inr(cost.tollOther)}
        </p>
      </BrutalCard>

      <p className="label">
        Total Operational Cost is auto-calculated from fuel logs, maintenance costs, and toll/other
        expenses. MAINTENANCE-category expenses are display-only and are not summed.
      </p>
    </div>
  );
}
