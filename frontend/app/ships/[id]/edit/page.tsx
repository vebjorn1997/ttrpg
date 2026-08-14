import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { CampaignEntityDeleteButton } from "@/components/campaign-entity-delete-button"
import { ConsolePanel } from "@/components/console-panel"
import { ShipForm } from "@/components/ship-form"
import { deleteShipAction } from "@/app/ships/actions"
import {
  getCampaignNpcs,
  getFactions,
  getShip,
  getSystems,
  getTraits,
} from "@/lib/api"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("ships")

export const metadata: Metadata = {
  title: `Edit · ${dataset.title}`,
}

export default async function EditShipPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [ship, systems, factions, npcs, traits] = await Promise.all([
    getShip(id),
    getSystems(),
    getFactions(),
    getCampaignNpcs(),
    getTraits(),
  ])

  if (!ship.ok || !ship.data) notFound()

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[
          { label: dataset.code, href: "/ships" },
          { label: ship.data.name, href: `/ships/${id}` },
          { label: "EDIT" },
        ]}
        title={`Edit ${ship.data.name}`}
      />

      <ConsolePanel label="Ship record" code="SHP · EDIT" brackets>
        <ShipForm
          ship={ship.data}
          systems={systems.data ?? []}
          factions={factions.data ?? []}
          npcs={npcs.data ?? []}
          traits={traits.data ?? []}
          traitsError={traits.error}
        />
      </ConsolePanel>

      <ConsolePanel label="Danger zone" code="SHP · DELETE">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Deleting {ship.data.name} also removes every port call logged
            against it, in every system. The owner keeps their record, but loses
            the link.
          </p>
          <CampaignEntityDeleteButton
            action={deleteShipAction}
            id={id}
            name={ship.data.name}
            label="Delete ship"
          />
        </div>
      </ConsolePanel>
    </div>
  )
}
