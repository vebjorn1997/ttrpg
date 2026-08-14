import type { Metadata } from "next"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { CampaignNpcForm } from "@/components/campaign-npc-form"
import { ConsolePanel } from "@/components/console-panel"
import { getFactions, getSystems, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("campaign-npcs")

export const metadata: Metadata = {
  title: `New · ${dataset.title}`,
  description: "File a new campaign character.",
}

export default async function NewCampaignNpcPage() {
  await requireAdmin()

  const [systems, factions, traits] = await Promise.all([
    getSystems(),
    getFactions(),
    getTraits(),
  ])

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[
          { label: dataset.code, href: "/campaign-npcs" },
          { label: "NEW" },
        ]}
        title="File a character"
        lede="Cast members are the named people the crew deals with, not the stat blocks in the NPC catalog. Record who they are here, then tie them to worlds from each system's Relationships tab."
      />

      <ConsolePanel label="Character intake" code="CST · CREATE" brackets>
        <CampaignNpcForm
          systems={systems.data ?? []}
          factions={factions.data ?? []}
          traits={traits.data ?? []}
          traitsError={traits.error}
        />
      </ConsolePanel>
    </div>
  )
}
