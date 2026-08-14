import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { CampaignEntityDeleteButton } from "@/components/campaign-entity-delete-button"
import { ConsolePanel } from "@/components/console-panel"
import { FactionForm } from "@/components/faction-form"
import { deleteFactionAction } from "@/app/factions/actions"
import { getFaction, getSystems, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("factions")

export const metadata: Metadata = {
  title: `Edit · ${dataset.title}`,
}

export default async function EditFactionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [faction, systems, traits] = await Promise.all([
    getFaction(id),
    getSystems(),
    getTraits(),
  ])

  if (!faction.ok || !faction.data) notFound()

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[
          { label: dataset.code, href: "/factions" },
          { label: faction.data.name, href: `/factions/${id}` },
          { label: "EDIT" },
        ]}
        title={`Edit ${faction.data.name}`}
      />

      <ConsolePanel label="Faction record" code="FAC · EDIT" brackets>
        <FactionForm
          faction={faction.data}
          systems={systems.data ?? []}
          traits={traits.data ?? []}
          traitsError={traits.error}
        />
      </ConsolePanel>

      <ConsolePanel label="Danger zone" code="FAC · DELETE">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Deleting {faction.data.name} removes it from every system where it
            holds a presence. Ships and characters that named it as an owner or
            allegiance keep their records, but lose the link.
          </p>
          <CampaignEntityDeleteButton
            action={deleteFactionAction}
            id={id}
            name={faction.data.name}
            label="Delete faction"
          />
        </div>
      </ConsolePanel>
    </div>
  )
}
