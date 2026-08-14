import type { Metadata } from "next"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { ConsolePanel } from "@/components/console-panel"
import { ShipForm } from "@/components/ship-form"
import { getCampaignNpcs, getFactions, getSystems, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("ships")

export const metadata: Metadata = {
  title: `New · ${dataset.title}`,
  description: "File a new ship.",
}

export default async function NewShipPage() {
  await requireAdmin()

  const [systems, factions, npcs, traits] = await Promise.all([
    getSystems(),
    getFactions(),
    getCampaignNpcs(),
    getTraits(),
  ])

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[{ label: dataset.code, href: "/ships" }, { label: "NEW" }]}
        title="File a ship"
        lede="A hull only needs a record once the crew has reason to remember it. Note who owns it and where it was last seen here, then log its visits from each system's Relationships tab."
      />

      <ConsolePanel label="Ship intake" code="SHP · CREATE" brackets>
        <ShipForm
          systems={systems.data ?? []}
          factions={factions.data ?? []}
          npcs={npcs.data ?? []}
          traits={traits.data ?? []}
          traitsError={traits.error}
        />
      </ConsolePanel>
    </div>
  )
}
