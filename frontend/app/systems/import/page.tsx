import type { Metadata } from "next"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { ConsolePanel } from "@/components/console-panel"
import { SystemImportForm } from "@/components/system-import-form"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("systems")

export const metadata: Metadata = {
  title: `Import · ${dataset.title}`,
  description: "Bulk-load star systems from a CSV file.",
}

export default async function ImportSystemsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[{ label: dataset.code, href: "/systems" }, { label: "IMPORT" }]}
        title="Import systems"
        lede="Bulk-load worlds from a spreadsheet export. Rows naming a system or hex already on file are skipped rather than overwritten, so an import can be re-run safely."
      />

      <ConsolePanel label="CSV import" code="SYS · IMPORT" brackets>
        <SystemImportForm />
      </ConsolePanel>
    </div>
  )
}
