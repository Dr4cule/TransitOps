import { requireAccess } from "@/lib/rbac";
import { listCompanyUsers, getCompany } from "@/modules/users/user.repository";
import { ROLE_LABEL } from "@/lib/constants";
import { BrutalTable, Tr, Td } from "@/components/ui/brutal-table";
import { BrutalCard } from "@/components/ui/brutal-card";
import { UserFormModal } from "@/components/users/UserForm";
import { RoleSelect, ActiveToggle, RemoveButton } from "@/components/users/UserRowControls";

export default async function UsersPage() {
  const { session } = await requireAccess("users", "crud"); // ADMIN only
  const [users, company] = await Promise.all([
    listCompanyUsers(session.companyId),
    getCompany(session.companyId),
  ]);
  const domain = company?.domain ?? "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-fg">Team</h1>
          <p className="mt-1 text-fg-dim">
            {company?.name} · <span className="tnum">@{domain}</span> — {users.length}{" "}
            {users.length === 1 ? "member" : "members"}
          </p>
        </div>
        <UserFormModal companyDomain={domain} />
      </div>

      <BrutalCard className="p-4">
        <p className="label !normal-case">
          You are the workspace admin. Add teammates with an{" "}
          <span className="tnum text-fg">@{domain}</span> email and assign each a role —
          check the RBAC matrix in Settings to decide what each role can do.
        </p>
      </BrutalCard>

      <BrutalTable
        headers={[
          { label: "Name" },
          { label: "Email" },
          { label: "Role" },
          { label: "Status" },
          { label: "Actions", align: "right" },
        ]}
      >
        {users.map((u) => {
          const isAdmin = u.role === "ADMIN";
          return (
            <Tr key={u.id}>
              <Td>
                {u.name}
                {u.id === session.userId && (
                  <span className="ml-2 border border-ink bg-brand/30 rounded px-1.5 py-0.5 text-[10px] font-bold text-fg">
                    YOU
                  </span>
                )}
              </Td>
              <Td mono>{u.email}</Td>
              <Td>
                {isAdmin ? (
                  <span className="border-2 border-ink bg-brand rounded-[4px] px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-ink">
                    Admin
                  </span>
                ) : (
                  <RoleSelect userId={u.id} role={u.role} />
                )}
              </Td>
              <Td>
                {u.isActive ? (
                  <span className="font-mono text-xs font-bold uppercase text-st-green">Active</span>
                ) : (
                  <span className="font-mono text-xs font-bold uppercase text-st-red">Disabled</span>
                )}
              </Td>
              <Td align="right">
                {isAdmin ? (
                  <span className="text-fg-dim text-sm">—</span>
                ) : (
                  <span className="inline-flex items-center justify-end gap-2">
                    <ActiveToggle userId={u.id} isActive={u.isActive} />
                    <RemoveButton userId={u.id} name={u.name} />
                  </span>
                )}
              </Td>
            </Tr>
          );
        })}
      </BrutalTable>

      <p className="label">
        Roles: {["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"]
          .map((r) => ROLE_LABEL[r as keyof typeof ROLE_LABEL])
          .join(" · ")}
      </p>
    </div>
  );
}
