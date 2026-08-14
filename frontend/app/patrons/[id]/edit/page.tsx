import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { CampaignEntityDeleteButton } from "@/components/campaign-entity-delete-button"
import { ConsolePanel } from "@/components/console-panel"
import { PatronForm } from "@/components/patron-form"
import { deletePatronAction } from "@/app/patrons/actions"
import { getCampaignNpcs, getPatron } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { requireAdmin } from "@/lib/session"

const dataset = getModule("patrons")

export const metadata: Metadata = {
  title: `Edit · ${dataset.title}`,
}

export default async function EditPatronPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [patron, npcs] = await Promise.all([getPatron(id), getCampaignNpcs()])

  if (!patron.ok || !patron.data) notFound()

  const name = patron.data.npc?.name ?? "Unnamed patron"

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[
          { label: dataset.code, href: "/patrons" },
          { label: name, href: `/patrons/${id}` },
          { label: "EDIT" },
        ]}
        title={`Edit ${name}`}
      />

      <ConsolePanel label="Patron record" code="PTR · EDIT" brackets>
        <PatronForm patron={patron.data} npcs={npcs.data ?? []} />
      </ConsolePanel>

      <ConsolePanel label="Danger zone" code="PTR · DELETE">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Deleting this patron record takes down every job {name} was
            offering, in every system. The character stays in the cast — they
            simply stop hiring.
          </p>
          <CampaignEntityDeleteButton
            action={deletePatronAction}
            id={id}
            name={name}
            label="Delete patron"
          />
        </div>
      </ConsolePanel>
    </div>
  )
}
