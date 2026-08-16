import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { ConsolePanel } from "@/components/console-panel"
import { SystemDeleteButton } from "@/components/system-delete-button"
import { SystemForm } from "@/components/system-form"
import { getFactions, getLawLevels, getSystem, getTechLevels, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("systems")

export const metadata: Metadata = {
  title: `Edit · ${dataset.title}`,
}

export default async function EditSystemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [system, traits, techLevels, lawLevels, factions] = await Promise.all([
    getSystem(id),
    getTraits(),
    getTechLevels(),
    getLawLevels(),
    getFactions(),
  ])

  if (!system.ok || !system.data) notFound()

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[
          { label: dataset.code, href: "/systems" },
          { label: system.data.name, href: `/systems/${id}` },
          { label: "EDIT" },
        ]}
        title={`Edit ${system.data.name}`}
      />

      <ConsolePanel label="System record" code="SYS · EDIT" brackets>
        <SystemForm
          system={system.data}
          traits={traits.data ?? []}
          traitsError={traits.error}
          techLevels={techLevels.data ?? []}
          lawLevels={lawLevels.data ?? []}
          factions={factions.data ?? []}
        />
      </ConsolePanel>

      <ConsolePanel label="Danger zone" code="SYS · DELETE">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Deleting {system.data.name} also removes its hooks, log, history,
            locations, and every relationship recorded against it. Factions,
            characters and ships themselves are kept — only their ties to this
            world go.
          </p>
          <SystemDeleteButton id={id} name={system.data.name} />
        </div>
      </ConsolePanel>
    </div>
  )
}
