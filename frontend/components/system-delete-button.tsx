"use client"

import { deleteSystemAction } from "@/app/systems/actions"
import { CampaignDeleteButton } from "@/components/campaign-delete-button"

export function SystemDeleteButton({
  id,
  name,
}: {
  id: string
  name: string
}) {
  return (
    <CampaignDeleteButton
      action={deleteSystemAction}
      fields={{ id }}
      title="Delete this system?"
      description={
        <>
          This permanently removes{" "}
          <span className="font-medium text-foreground">{name}</span> from the
          database and cannot be undone.
        </>
      }
      trigger="Delete system"
      triggerClassName="border border-oxide/50 bg-oxide/10 px-3 py-2 font-heading text-xs tracking-[0.12em] uppercase text-oxide transition-colors hover:bg-oxide/20"
      confirmLabel="Delete system"
    />
  )
}
