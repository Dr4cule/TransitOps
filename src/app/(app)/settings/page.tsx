import { requireAccess } from "@/lib/rbac";
import { RBAC, ROLE_LABEL } from "@/lib/constants";
import type { Role } from "@/generated/prisma/enums";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ThemeToggle } from "@/components/theme-toggle";

const ROLES: Role[] = ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"];
const COLUMNS: { key: keyof typeof RBAC; label: string }[] = [
  { key: "fleet", label: "Fleet" },
  { key: "drivers", label: "Drivers" },
  { key: "trips", label: "Trips" },
  { key: "expenses", label: "Fuel & Exp" },
  { key: "maintenance", label: "Maint" },
  { key: "analytics", label: "Analytics" },
];

function cell(role: Role, domain: keyof typeof RBAC) {
  const access = RBAC[domain][role];
  if (access === "crud")
    return <span className="font-bold text-st-green">✓</span>;
  if (access === "view")
    return <span className="font-mono text-xs text-st-blue">view</span>;
  return <span className="text-fg-dim">–</span>;
}

export default async function SettingsPage() {
  const { session } = await requireAccess("settings", "view");
  const isAdmin = session.role === "ADMIN";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-fg">Settings{isAdmin ? " & RBAC" : ""}</h1>

      <div className={`grid grid-cols-1 gap-6 ${isAdmin ? "xl:grid-cols-2" : ""}`}>
        {/* General */}
        <BrutalCard className="p-5">
          <div className="label mb-4">General</div>
          <dl className="space-y-3">
            {[
              ["Company", session.companyName],
              ["Currency", "INR (₹)"],
              ["Distance Unit", "Kilometres"],
              ["Theme", null],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4">
                <dt className="label !normal-case">{k}</dt>
                <dd className="text-fg">
                  {k === "Theme" ? <ThemeToggle /> : <span className="tnum">{v}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </BrutalCard>

        {/* RBAC matrix — visible to the admin only, to guide role assignment */}
        {isAdmin && (
        <BrutalCard className="p-5">
          <div className="label mb-4">Role-Based Access (RBAC)</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="label py-2 pr-3">Role</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="label px-2 py-2 text-center whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => (
                  <tr key={r} className="border-b border-panel-3 last:border-0">
                    <td className="py-2.5 pr-3 font-bold text-fg whitespace-nowrap">
                      {ROLE_LABEL[r]}
                    </td>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="px-2 py-2.5 text-center">
                        {cell(r, c.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="label mt-4 !normal-case">
            ✓ = full access · view = read-only · – = no access. These cells document
            the same gating enforced in the route guard and every server action.
          </p>
        </BrutalCard>
        )}
      </div>
    </div>
  );
}
