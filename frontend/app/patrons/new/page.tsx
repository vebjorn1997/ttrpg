import type { Metadata } from "next"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { ConsolePanel } from "@/components/console-panel"
import { PatronForm } from "@/components/patron-form"
import { getCampaignNpcs } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("patrons")

export const metadata: Metadata = {
  title: `New · ${dataset.title}`,
  description: "Put a character on the books as a patron.",
}

export default async function NewPatronPage() {
  await requireAdmin()

  const npcs = await getCampaignNpcs()

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[{ label: dataset.code, href: "/patrons" }, { label: "NEW" }]}
        title="Put work on the board"
        lede="A patron is a character from the cast in a hiring role. Choose who is doing the hiring, record how they pay and what they ask for, then hang individual jobs off them from each system's Relationships tab."
      />

      <ConsolePanel label="Patron intake" code="PTR · CREATE" brackets>
        <PatronForm npcs={npcs.data ?? []} />
      </ConsolePanel>
    </div>
  )
}
