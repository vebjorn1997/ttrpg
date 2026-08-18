import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { CampaignEntityDeleteButton } from "@/components/campaign-entity-delete-button"
import { CampaignNpcForm } from "@/components/campaign-npc-form"
import { ConsolePanel } from "@/components/console-panel"
import { deleteCampaignNpcAction } from "@/app/campaign-npcs/actions"
import { getCampaignNpc, getEquipment, getFactions, getSystems, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("campaign-npcs")

export const metadata: Metadata = {
  title: `Edit · ${dataset.title}`,
}

export default async function EditCampaignNpcPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [npc, systems, factions, traits, equipment] = await Promise.all([
    getCampaignNpc(id),
    getSystems(),
    getFactions(),
    getTraits(),
    getEquipment(),
  ])

  if (!npc.ok || !npc.data) notFound()

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[
          { label: dataset.code, href: "/campaign-npcs" },
          { label: npc.data.name, href: `/campaign-npcs/${id}` },
          { label: "EDIT" },
        ]}
        title={`Edit ${npc.data.name}`}
      />

      <ConsolePanel label="Character record" code="CST · EDIT" brackets>
        <CampaignNpcForm
          npc={npc.data}
          systems={systems.data ?? []}
          factions={factions.data ?? []}
          traits={traits.data ?? []}
          traitsError={traits.error}
          equipmentCatalog={equipment.data ?? []}
          equipmentError={equipment.error}
        />
      </ConsolePanel>

      <ConsolePanel label="Danger zone" code="CST · DELETE">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Deleting {npc.data.name} removes them from every system they were
            tied to, and any patron record built on them goes with them. Ships
            that named them as an owner keep their records, but lose the link.
          </p>
          <CampaignEntityDeleteButton
            action={deleteCampaignNpcAction}
            id={id}
            name={npc.data.name}
            label="Delete character"
          />
        </div>
      </ConsolePanel>
    </div>
  )
}
