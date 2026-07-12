"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { BrutalButton } from "@/components/ui/brutal-button";
import { type ActionState } from "@/lib/action-state";
import { createUserAction } from "@/lib/actions/users";
import { ASSIGNABLE_ROLES, ROLE_LABEL } from "@/lib/constants";

const initial: ActionState = { ok: true };

export function UserFormModal({ companyDomain }: { companyDomain: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createUserAction, initial);

  useEffect(() => {
    if (open && state.ok) {
      setOpen(false);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fe = !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <>
      <BrutalButton type="button" size="sm" onClick={() => setOpen(true)}>
        + Add Team Member
      </BrutalButton>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Team Member">
        <form action={formAction} className="space-y-4">
          <Field label="Full Name" error={fe.name}>
            <Input name="name" placeholder="Asha Mehta" />
          </Field>

          <Field label="Email" error={fe.emailLocal}>
            <div className="flex items-stretch">
              <Input name="emailLocal" placeholder="asha" className="rounded-r-none" />
              <span className="inline-flex items-center border-2 border-l-0 border-ink bg-panel-3 rounded-r-[4px] px-3 text-sm text-fg-dim tnum">
                @{companyDomain}
              </span>
            </div>
          </Field>

          <Field label="Role" error={fe.role}>
            <Select name="role" defaultValue="">
              <option value="" disabled>
                Select role…
              </option>
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Temporary Password" error={fe.password}>
            <Input name="password" type="text" placeholder="At least 6 characters" />
          </Field>

          {!state.ok && state.error && (
            <div className="border-2 border-st-red bg-st-red/15 rounded-[4px] px-3 py-2 text-sm text-st-red">
              ✕ {state.error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <BrutalButton type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </BrutalButton>
            <SubmitButton>Create Account</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
