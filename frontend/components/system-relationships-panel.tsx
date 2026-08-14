"use client"

import Link from "next/link"
import { ArrowRight, ArrowLeft, Trash2 } from "lucide-react"

import { deleteRelationshipAction } from "@/app/systems/actions"
import { CampaignDeleteButton } from "@/components/campaign-delete-button"
import { GmNote, GmOnlyBadge, RatingMeter } from "@/components/campaign-fields"
import { SystemRelationshipWizard } from "@/components/system-relationship-wizard"
import { TraitBadge } from "@/components/trait-badge"
import type {
  CampaignNpc,
  Faction,
  Patron,
  Ship,
  StarSystem,
  SystemRelationships,
  Trait,
  Visibility,
} from "@/lib/api-types"
import {
  type RelationshipKind,
  jobDifficultyLabels,
  legalStatusLabels,
  locationTypeLabels,
  npcConnectionLabels,
  partyRelationshipLabels,
  patronAvailabilityLabels,
  presenceTypeLabels,
  relationshipAccent,
  shipPurposeLabels,
  shipVisitStatusLabels,
  systemLinkLabels,
} from "@/lib/campaign"
import { cn } from "@/lib/utils"

type SystemRelationshipsPanelProps = {
  systemId: string
  relationships: SystemRelationships
  isGm: boolean
  catalogs: {
    factions: Faction[]
    npcs: CampaignNpc[]
    ships: Ship[]
    patrons: Patron[]
    systems: StarSystem[]
    traits: Trait[]
  }
}

function RowShell({
  systemId,
  kind,
  recordId,
  title,
  href,
  meta,
  visibility,
  notes,
  isGm,
  children,
}: {
  systemId: string
  kind: RelationshipKind
  recordId: string
  title: string
  href?: string
  meta: React.ReactNode
  visibility?: Visibility
  notes?: string | null
  isGm: boolean
  children?: React.ReactNode
}) {
  return (
    <li className="border border-hairline bg-card/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h4 className="font-heading text-base tracking-wide uppercase">
            {href ? (
              <Link href={href} className="transition-colors hover:text-signal">
                {title}
              </Link>
            ) : (
              title
            )}
          </h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {meta}
            {visibility === "gm_only" ? <GmOnlyBadge /> : null}
          </div>
        </div>

        {isGm ? (
          <CampaignDeleteButton
            action={deleteRelationshipAction}
            fields={{ systemId, kind, recordId }}
            title="Remove this relationship?"
            description={`"${title}" will no longer be linked to this system. The record itself is kept.`}
            trigger={<Trash2 aria-hidden className="size-3.5" />}
            triggerClassName="p-1.5 text-muted-foreground transition-colors hover:text-oxide"
          />
        ) : null}
      </div>

      {children}

      {notes ? (
        <div className="mt-3">
          <GmNote label="Notes">{notes}</GmNote>
        </div>
      ) : null}
    </li>
  )
}

function Group({
  title,
  count,
  empty,
  children,
}: {
  title: string
  count: number
  empty: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h3 className="font-heading text-sm tracking-[0.16em] uppercase text-signal">
          {title}
        </h3>
        <span className="font-mono text-xs text-muted-foreground">{count}</span>
      </div>
      {count === 0 ? (
        <p className="border border-dashed border-hairline bg-card/30 px-4 py-6 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="space-y-3">{children}</ul>
      )}
    </section>
  )
}

const metaText = "console-label text-muted-foreground"

/** The system's relationship dashboard: who is here, and what it means. */
export function SystemRelationshipsPanel({
  systemId,
  relationships,
  isGm,
  catalogs,
}: SystemRelationshipsPanelProps) {
  const { factions, npcs, ships, patrons, locations, connections } = relationships

  return (
    <div className="space-y-8">
      {isGm ? (
        <SystemRelationshipWizard
          systemId={systemId}
          catalogs={{ ...catalogs, locations }}
        />
      ) : null}

      <Group
        title="Factions present"
        count={factions.length}
        empty="No factions have declared a presence here."
      >
        {factions.map((presence) => (
          <RowShell
            key={presence.id}
            systemId={systemId}
            kind="faction"
            recordId={presence.id}
            title={presence.faction.name}
            href={`/factions/${presence.faction.id}`}
            isGm={isGm}
            visibility={presence.visibility}
            notes={presence.notes}
            meta={
              <>
                <span className={metaText}>
                  {presenceTypeLabels[presence.presenceType]}
                </span>
                <span
                  className={cn(
                    "console-label",
                    relationshipAccent(presence.relationshipToParty)
                  )}
                >
                  {partyRelationshipLabels[presence.relationshipToParty]}
                </span>
              </>
            }
          >
            <div className="mt-3">
              <RatingMeter label="Influence" value={presence.influence} min={1} />
            </div>
            {presence.faction.traits.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {presence.faction.traits.map((trait) => (
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
            ) : null}
          </RowShell>
        ))}
      </Group>

      <Group
        title="People here"
        count={npcs.length}
        empty="Nobody notable is tied to this world yet."
      >
        {npcs.map((presence) => (
          <RowShell
            key={presence.id}
            systemId={systemId}
            kind="npc"
            recordId={presence.id}
            title={presence.npc.name}
            href={`/campaign-npcs/${presence.npc.id}`}
            isGm={isGm}
            visibility={presence.visibility}
            notes={presence.notes}
            meta={
              <>
                <span className={metaText}>
                  {npcConnectionLabels[presence.connectionType]}
                </span>
                {presence.npc.occupation ? (
                  <span className={metaText}>{presence.npc.occupation}</span>
                ) : null}
                {presence.npc.allegiance ? (
                  <span className={metaText}>
                    {presence.npc.allegiance.name}
                  </span>
                ) : null}
              </>
            }
          >
            {presence.currentStatus ? (
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {presence.currentStatus}
              </p>
            ) : null}
            {presence.arrivalDate || presence.departureDate ? (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {presence.arrivalDate ?? "?"} → {presence.departureDate ?? "present"}
              </p>
            ) : null}
          </RowShell>
        ))}
      </Group>

      <Group
        title="Ships in system"
        count={ships.length}
        empty="No vessels logged in this system."
      >
        {ships.map((visit) => (
          <RowShell
            key={visit.id}
            systemId={systemId}
            kind="ship"
            recordId={visit.id}
            title={visit.ship.name}
            href={`/ships/${visit.ship.id}`}
            isGm={isGm}
            visibility={visit.visibility}
            notes={visit.notes}
            meta={
              <>
                <span className={metaText}>
                  {shipVisitStatusLabels[visit.status]}
                </span>
                {visit.purpose ? (
                  <span className={metaText}>
                    {shipPurposeLabels[visit.purpose]}
                  </span>
                ) : null}
                {visit.dockedAt ? (
                  <span className={metaText}>at {visit.dockedAt.name}</span>
                ) : null}
              </>
            }
          >
            {visit.arrivalDate || visit.departureDate ? (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {visit.arrivalDate ?? "?"} → {visit.departureDate ?? "still here"}
              </p>
            ) : null}
          </RowShell>
        ))}
      </Group>

      <Group
        title="Work on offer"
        count={patrons.length}
        empty="No patron is hiring here right now."
      >
        {patrons.map((offer) => (
          <RowShell
            key={offer.id}
            systemId={systemId}
            kind="patron"
            recordId={offer.id}
            title={offer.patron.npc?.name ?? "Unnamed patron"}
            href={`/patrons/${offer.patron.id}`}
            isGm={isGm}
            visibility={offer.visibility}
            notes={offer.notes}
            meta={
              <>
                <span className={metaText}>
                  {patronAvailabilityLabels[offer.availability]}
                </span>
                {offer.difficulty ? (
                  <span className={metaText}>
                    {jobDifficultyLabels[offer.difficulty]}
                  </span>
                ) : null}
                {offer.legalStatus ? (
                  <span
                    className={cn(
                      "console-label",
                      offer.legalStatus === "illegal"
                        ? "text-oxide"
                        : "text-muted-foreground"
                    )}
                  >
                    {legalStatusLabels[offer.legalStatus]}
                  </span>
                ) : null}
              </>
            }
          >
            {offer.jobSummary ? (
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {offer.jobSummary}
              </p>
            ) : null}
            {offer.reward ? (
              <p className="mt-2 font-mono text-xs text-ochre">{offer.reward}</p>
            ) : null}
          </RowShell>
        ))}
      </Group>

      <Group
        title="Locations"
        count={locations.length}
        empty="No named places recorded on this world."
      >
        {locations.map((location) => (
          <RowShell
            key={location.id}
            systemId={systemId}
            kind="location"
            recordId={location.id}
            title={location.name}
            isGm={isGm}
            notes={isGm ? location.notes : null}
            meta={
              <span className={metaText}>{locationTypeLabels[location.type]}</span>
            }
          >
            {location.description ? (
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {location.description}
              </p>
            ) : null}
            {location.securityLevel !== null ? (
              <div className="mt-3">
                <RatingMeter label="Security" value={location.securityLevel} />
              </div>
            ) : null}
            {location.traits.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {location.traits.map((trait) => (
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
            ) : null}
          </RowShell>
        ))}
      </Group>

      <Group
        title="Linked systems"
        count={connections.length}
        empty="This world stands alone — no routes or ties recorded."
      >
        {connections.map((link) => (
          <RowShell
            key={link.id}
            systemId={systemId}
            kind="connection"
            recordId={link.id}
            title={link.other?.name ?? "Unknown system"}
            href={link.other ? `/systems/${link.other.id}` : undefined}
            isGm={isGm}
            visibility={link.visibility}
            notes={link.notes}
            meta={
              <>
                <span className="flex items-center gap-1.5 console-label text-muted-foreground">
                  {link.direction === "outbound" ? (
                    <ArrowRight aria-hidden className="size-3" />
                  ) : (
                    <ArrowLeft aria-hidden className="size-3" />
                  )}
                  {systemLinkLabels[link.relationshipType]}
                </span>
                {link.other ? (
                  <span className="font-mono text-xs tracking-[0.14em] text-signal">
                    {link.other.location}
                  </span>
                ) : null}
                {!link.active ? (
                  <span className="console-label text-oxide">Lapsed</span>
                ) : null}
              </>
            }
          >
            <div className="mt-3">
              <RatingMeter label="Strength" value={link.strength} min={1} />
            </div>
          </RowShell>
        ))}
      </Group>
    </div>
  )
}
