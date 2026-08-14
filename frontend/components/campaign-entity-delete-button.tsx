"use client"

import { CampaignDeleteButton } from "@/components/campaign-delete-button"
import type { FormState } from "@/lib/campaign"

/**
 * Delete control for the standalone entity records — factions, characters,
 * ships and patrons — all of which take a single `id` field.
 */
export function CampaignEntityDeleteButton({
  action,
  id,
  name,
  label,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  id: string
  name: string
  label: string
}) {
  return (
    <CampaignDeleteButton
      action={action}
      fields={{ id }}
      title={`${label}?`}
      description={
        <>
          This permanently removes{" "}
          <span className="font-medium text-foreground">{name}</span> and cannot
          be undone.
        </>
      }
      trigger={label}
      triggerClassName="border border-oxide/50 bg-oxide/10 px-3 py-2 font-heading text-xs tracking-[0.12em] uppercase text-oxide transition-colors hover:bg-oxide/20"
      confirmLabel={label}
    />
  )
}
