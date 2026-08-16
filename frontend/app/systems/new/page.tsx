import type { Metadata } from "next"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { ConsolePanel } from "@/components/console-panel"
import { SystemForm } from "@/components/system-form"
import { getFactions, getLawLevels, getTechLevels, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("systems")

export const metadata: Metadata = {
  title: `New · ${dataset.title}`,
  description: "Chart a new star system.",
}

export default async function NewSystemPage() {
  await requireAdmin()

  const [traits, techLevels, lawLevels, factions] = await Promise.all([
    getTraits(),
    getTechLevels(),
    getLawLevels(),
    getFactions(),
  ])

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[
          { label: dataset.code, href: "/systems" },
          { label: "NEW" },
        ]}
        title="Chart a system"
        lede="Name the world, place it on the hex grid, then tag its traits. Everything else — hooks, history, who lives there — is added from the system's own page once it exists."
      />

      <ConsolePanel label="System intake" code="SYS · CREATE" brackets>
        <SystemForm
          traits={traits.data ?? []}
          traitsError={traits.error}
          techLevels={techLevels.data ?? []}
          lawLevels={lawLevels.data ?? []}
          factions={factions.data ?? []}
        />
      </ConsolePanel>
    </div>
  )
}
