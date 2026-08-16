import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Download, Map, Pencil } from "lucide-react"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { GmNote } from "@/components/campaign-fields"
import { CampaignTabs, type CampaignTab } from "@/components/campaign-tabs"
import { SystemHooksPanel } from "@/components/system-hooks-panel"
import { SystemLogPanel } from "@/components/system-log-panel"
import { SystemRelationshipsPanel } from "@/components/system-relationships-panel"
import { SystemTimelinePanel } from "@/components/system-timeline-panel"
import { TraitBadge } from "@/components/trait-badge"
import {
  getCampaignNpcs,
  getFactions,
  getLawLevels,
  getPatrons,
  getShips,
  getSystem,
  getSystems,
  getTechLevels,
  getTraits,
} from "@/lib/api"
import type {
  CampaignNpc,
  Faction,
  Patron,
  Ship,
  StarSystem,
  StarSystemDetail,
  Trait,
} from "@/lib/api-types"
import { getModule } from "@/lib/modules"
import { getCurrentUser } from "@/lib/session"
import { factionTypeLabels } from "@/lib/campaign"

const dataset = getModule("systems")

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const result = await getSystem(id)
  if (!result.ok || !result.data) return { title: dataset.title }
  return {
    title: `${result.data.name} · ${dataset.title}`,
    description: result.data.description ?? dataset.synopsis,
  }
}

const actionLink =
  "inline-flex items-center gap-2 border border-signal/45 bg-signal/10 px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase text-signal transition-colors hover:bg-signal/20"

function Stat({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string | null
}) {
  return (
    <div className="border border-hairline bg-background/30 p-4">
      <p className="console-label text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl tracking-wide uppercase text-signal">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function OverviewPanel({
  system,
  isGm,
}: {
  system: StarSystemDetail
  isGm: boolean
}) {
  const { relationships } = system
  const counts = [
    ["Factions", relationships.factions.length],
    ["People", relationships.npcs.length],
    ["Ships", relationships.ships.length],
    ["Jobs", relationships.patrons.length],
    ["Locations", relationships.locations.length],
    ["Links", relationships.connections.length],
  ] as const

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Hex" value={system.location} />
        <Stat
          label="Controller"
          value={system.controller?.name ?? "Unclaimed"}
          detail={
            system.controller
              ? factionTypeLabels[system.controller.type]
              : "No faction currently holds this hex."
          }
        />
        <Stat
          label="Tech level"
          value={`TL ${system.techLevel}`}
          detail={system.techLevelName}
        />
        <Stat
          label="Law level"
          value={`LL ${system.lawLevel}`}
          detail={system.lawLevelName}
        />
      </div>

      {system.description ? (
        <section className="border border-hairline bg-card/50 p-5">
          <h2 className="console-label mb-3 text-muted-foreground">Briefing</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
            {system.description}
          </p>
        </section>
      ) : null}

      {system.traits.length > 0 ? (
        <section className="border border-hairline bg-card/50 p-5">
          <h2 className="console-label mb-3 text-muted-foreground">
            World profile
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {system.traits.map((trait) => (
              <li key={trait.id}>
                <TraitBadge
                  tag={{
                    id: trait.id,
                    label: trait.name,
                    description: trait.description,
                    color: trait.color,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border border-hairline bg-card/50 p-5">
        <h2 className="console-label mb-3 text-muted-foreground">
          Who and what is here
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {counts.map(([label, count]) => (
            <div
              key={label}
              className="border border-hairline bg-background/30 px-3 py-2.5 text-center"
            >
              <dt className="console-label text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-mono text-lg text-signal">{count}</dd>
            </div>
          ))}
        </dl>
      </section>

      {isGm && system.notes ? <GmNote>{system.notes}</GmNote> : null}
    </div>
  )
}

function GovernancePanel({
  system,
  techDescription,
  lawDescription,
}: {
  system: StarSystemDetail
  techDescription: string | null
  lawDescription: string | null
}) {
  return (
    <div className="space-y-4">
      <section className="border border-hairline bg-card/50 p-5">
        <p className="console-label text-muted-foreground">Controller</p>
        {system.controller ? (
          <>
            <Link
              href={`/factions/${system.controller.id}`}
              className="mt-1 inline-block font-heading text-2xl tracking-wide uppercase text-signal transition-colors hover:text-foreground"
            >
              {system.controller.name}
            </Link>
            <p className="mt-1 font-heading text-sm tracking-wide uppercase text-foreground/80">
              {factionTypeLabels[system.controller.type]}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This faction currently holds the hex. Other groups may still have
              a presence here without ruling the system.
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 font-heading text-2xl tracking-wide uppercase text-signal">
              Unclaimed
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              No faction currently holds this hex. Assign a controller from the
              edit form.
            </p>
          </>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="border border-hairline bg-card/50 p-5">
        <p className="console-label text-muted-foreground">Tech level</p>
        <p className="mt-1 font-heading text-2xl tracking-wide uppercase text-signal">
          TL {system.techLevel}
        </p>
        {system.techLevelName ? (
          <p className="mt-1 font-heading text-sm tracking-wide uppercase text-foreground/80">
            {system.techLevelName}
          </p>
        ) : null}
        {techDescription ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {techDescription}
          </p>
        ) : null}
        <Link
          href="/tl"
          className="console-label mt-4 inline-block text-muted-foreground transition-colors hover:text-signal"
        >
          Full tech level table →
        </Link>
      </section>

      <section className="border border-hairline bg-card/50 p-5">
        <p className="console-label text-muted-foreground">Law level</p>
        <p className="mt-1 font-heading text-2xl tracking-wide uppercase text-signal">
          LL {system.lawLevel}
        </p>
        {system.lawLevelName ? (
          <p className="mt-1 font-heading text-sm tracking-wide uppercase text-foreground/80">
            {system.lawLevelName}
          </p>
        ) : null}
        {lawDescription ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {lawDescription}
          </p>
        ) : null}
        <Link
          href="/lawlevel"
          className="console-label mt-4 inline-block text-muted-foreground transition-colors hover:text-signal"
        >
          Full law level table →
        </Link>
        </section>
      </div>
    </div>
  )
}

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [user, result] = await Promise.all([getCurrentUser(), getSystem(id)])

  if (!result.ok || !result.data) notFound()

  const system = result.data
  const isGm = user?.role === "admin"

  const [techLevels, lawLevels] = await Promise.all([
    getTechLevels(),
    getLawLevels(),
  ])

  // Only the GM sees the add-relationship wizard, so only the GM pays for the
  // catalogs that populate it.
  let catalogs: {
    factions: Faction[]
    npcs: CampaignNpc[]
    ships: Ship[]
    patrons: Patron[]
    systems: StarSystem[]
    traits: Trait[]
  } = { factions: [], npcs: [], ships: [], patrons: [], systems: [], traits: [] }

  if (isGm) {
    const [factions, npcs, ships, patrons, systems, traits] = await Promise.all([
      getFactions(),
      getCampaignNpcs(),
      getShips(),
      getPatrons(),
      getSystems(),
      getTraits(),
    ])
    catalogs = {
      factions: factions.data ?? [],
      npcs: npcs.data ?? [],
      ships: ships.data ?? [],
      patrons: patrons.data ?? [],
      systems: (systems.data ?? []).filter((entry) => entry.id !== id),
      traits: traits.data ?? [],
    }
  }

  const techDescription =
    (techLevels.data ?? []).find((tl) => tl.level === system.techLevel)
      ?.description ?? null
  const lawDescription =
    (lawLevels.data ?? []).find((law) => law.lawlevel === system.lawLevel)
      ?.description ?? null

  const relationshipCount =
    system.relationships.factions.length +
    system.relationships.npcs.length +
    system.relationships.ships.length +
    system.relationships.patrons.length +
    system.relationships.locations.length +
    system.relationships.connections.length

  const tabs: CampaignTab[] = [
    {
      id: "overview",
      label: "Overview",
      panel: <OverviewPanel system={system} isGm={isGm} />,
    },
    {
      id: "governance",
      label: "Governance",
      panel: (
        <GovernancePanel
          system={system}
          techDescription={techDescription}
          lawDescription={lawDescription}
        />
      ),
    },
    {
      id: "relationships",
      label: "Relationships",
      badge: relationshipCount,
      panel: (
        <SystemRelationshipsPanel
          systemId={id}
          relationships={system.relationships}
          isGm={isGm}
          catalogs={catalogs}
        />
      ),
    },
    {
      id: "hooks",
      label: "Hooks",
      badge: system.hooks.filter((hook) => !hook.used).length,
      panel: (
        <SystemHooksPanel systemId={id} hooks={system.hooks} isGm={isGm} />
      ),
    },
    {
      id: "log",
      label: "Traveller log",
      badge: system.interactions.length,
      panel: (
        <SystemLogPanel
          systemId={id}
          entries={system.interactions}
          canWrite={Boolean(user)}
        />
      ),
    },
    {
      id: "history",
      label: "History",
      badge: system.timeline.length,
      panel: (
        <SystemTimelinePanel
          systemId={id}
          events={system.timeline}
          isGm={isGm}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[
          { label: dataset.code, href: "/systems" },
          { label: system.location },
        ]}
        title={system.name}
        lede={system.description ?? undefined}
        actions={
          <>
            <Link href="/systems/map" className={actionLink}>
              <Map aria-hidden className="size-3.5" />
              Hex map
            </Link>
            {isGm ? (
              <>
                <a
                  href={`/api/systems/${id}/export`}
                  download
                  className={actionLink}
                >
                  <Download aria-hidden className="size-3.5" />
                  Export
                </a>
                <Link href={`/systems/${id}/edit`} className={actionLink}>
                  <Pencil aria-hidden className="size-3.5" />
                  Edit
                </Link>
              </>
            ) : null}
          </>
        }
      />

      <CampaignTabs tabs={tabs} label="System sections" idPrefix="system" />
    </div>
  )
}
