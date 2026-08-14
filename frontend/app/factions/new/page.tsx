import type { Metadata } from "next"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { ConsolePanel } from "@/components/console-panel"
import { FactionForm } from "@/components/faction-form"
import { getSystems, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("factions")

export const metadata: Metadata = {
  title: `New · ${dataset.title}`,
  description: "File a new faction.",
}

export default async function NewFactionPage() {
  await requireAdmin()

  const [systems, traits] = await Promise.all([getSystems(), getTraits()])

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[{ label: dataset.code, href: "/factions" }, { label: "NEW" }]}
        title="File a faction"
        lede="Factions exist on their own and can hold a presence in as many systems as you like. Record who they are here, then wire them into worlds from each system's Relationships tab."
      />

      <ConsolePanel label="Faction intake" code="FAC · CREATE" brackets>
        <FactionForm
          systems={systems.data ?? []}
          traits={traits.data ?? []}
          traitsError={traits.error}
        />
      </ConsolePanel>
    </div>
  )
}
