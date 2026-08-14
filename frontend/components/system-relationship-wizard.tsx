"use client"

import { useActionState, useState } from "react"
import {
  Briefcase,
  Building2,
  Flag,
  Link2,
  Rocket,
  UserSquare,
  X,
  type LucideIcon,
} from "lucide-react"

import { addRelationshipAction } from "@/app/systems/actions"
import {
  Field,
  FormMessage,
  SelectField,
  TextAreaField,
  VisibilityField,
  fieldClass,
  labelClass,
  selectClass,
} from "@/components/campaign-fields"
import { CampaignTraitPicker } from "@/components/campaign-trait-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type {
  CampaignNpc,
  Faction,
  Patron,
  Ship,
  StarSystem,
  SystemLocation,
  Trait,
} from "@/lib/api-types"
import {
  emptyFormState,
  type RelationshipKind,
  jobDifficultyOptions,
  legalStatusOptions,
  locationTypeOptions,
  npcConnectionOptions,
  partyRelationshipOptions,
  patronAvailabilityOptions,
  presenceTypeOptions,
  shipPurposeOptions,
  shipVisitStatusOptions,
  systemLinkOptions,
} from "@/lib/campaign"
import { cn } from "@/lib/utils"

const DATE_HINT = "Imperial calendar or stardate. Leave blank if unknown."

type Catalogs = {
  factions: Faction[]
  npcs: CampaignNpc[]
  ships: Ship[]
  patrons: Patron[]
  systems: StarSystem[]
  locations: SystemLocation[]
  traits: Trait[]
}

const kinds: {
  id: RelationshipKind
  label: string
  blurb: string
  icon: LucideIcon
}[] = [
  {
    id: "faction",
    label: "Faction presence",
    blurb: "A power that operates here, and how it feels about the crew.",
    icon: Flag,
  },
  {
    id: "npc",
    label: "Character",
    blurb: "Someone who lives here, is passing through, or is stuck here.",
    icon: UserSquare,
  },
  {
    id: "ship",
    label: "Ship visit",
    blurb: "A vessel in port, in orbit, or impounded on the ground.",
    icon: Rocket,
  },
  {
    id: "patron",
    label: "Patron offer",
    blurb: "Work being offered in this system, with reward and legal status.",
    icon: Briefcase,
  },
  {
    id: "location",
    label: "Location",
    blurb: "A named place on or above the world: port, city, ruin, station.",
    icon: Building2,
  },
  {
    id: "connection",
    label: "System link",
    blurb: "A tie to another world: trade route, war, protectorate.",
    icon: Link2,
  },
]

function EntitySelect({
  label,
  name,
  options,
  placeholder,
  empty,
}: {
  label: string
  name: string
  options: { id: string; name: string; hint?: string | null }[]
  placeholder: string
  empty: string
}) {
  if (options.length === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>{label}</span>
        <p className="border border-hairline bg-background/30 px-3 py-2 text-sm text-muted-foreground">
          {empty}
        </p>
      </div>
    )
  }

  return (
    <Field label={label}>
      <select name={name} required defaultValue="" className={selectClass}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
            {option.hint ? ` — ${option.hint}` : ""}
          </option>
        ))}
      </select>
    </Field>
  )
}

function KindFields({
  kind,
  catalogs,
}: {
  kind: RelationshipKind
  catalogs: Catalogs
}) {
  switch (kind) {
    case "faction":
      return (
        <>
          <EntitySelect
            label="Faction"
            name="factionId"
            placeholder="Select a faction…"
            empty="No factions on file yet. Create one in the Factions module first."
            options={catalogs.factions.map((faction) => ({
              id: faction.id,
              name: faction.name,
              hint: faction.type.replace(/_/g, " "),
            }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Presence"
              name="presenceType"
              required
              options={presenceTypeOptions}
              placeholder="Select…"
            />
            <SelectField
              label="Attitude to the crew"
              name="relationshipToParty"
              options={partyRelationshipOptions}
              defaultValue="neutral"
            />
          </div>
          <Field label="Influence" hint="1 is a token presence, 5 runs the world.">
            <Input
              name="influence"
              type="number"
              min={1}
              max={5}
              defaultValue={3}
              className={fieldClass}
            />
          </Field>
        </>
      )

    case "npc":
      return (
        <>
          <EntitySelect
            label="Character"
            name="npcId"
            placeholder="Select a character…"
            empty="No campaign characters on file yet. Add one in the Cast module first."
            options={catalogs.npcs.map((npc) => ({
              id: npc.id,
              name: npc.name,
              hint: npc.occupation,
            }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Connection"
              name="connectionType"
              required
              options={npcConnectionOptions}
              placeholder="Select…"
            />
            <Field label="Current status" hint="Free text, e.g. “running the night market”.">
              <Input name="currentStatus" maxLength={200} className={fieldClass} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Arrived" hint={DATE_HINT}>
              <Input name="arrivalDate" placeholder="1105-045" className={fieldClass} />
            </Field>
            <Field label="Departed" hint={DATE_HINT}>
              <Input name="departureDate" className={fieldClass} />
            </Field>
          </div>
        </>
      )

    case "ship":
      return (
        <>
          <EntitySelect
            label="Ship"
            name="shipId"
            placeholder="Select a ship…"
            empty="No ships on file yet. Add one in the Ship Registry first."
            options={catalogs.ships.map((ship) => ({
              id: ship.id,
              name: ship.name,
              hint: ship.registration ?? ship.type,
            }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Purpose"
              name="purpose"
              options={shipPurposeOptions}
              placeholder="Unknown"
            />
            <SelectField
              label="Status"
              name="status"
              options={shipVisitStatusOptions}
              defaultValue="docked"
            />
          </div>
          {catalogs.locations.length > 0 ? (
            <SelectField
              label="Docked at"
              name="dockedAtLocationId"
              options={catalogs.locations.map((location) => ({
                value: location.id,
                label: location.name,
              }))}
              placeholder="Not berthed at a named location"
            />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Arrived" hint={DATE_HINT}>
              <Input name="arrivalDate" className={fieldClass} />
            </Field>
            <Field label="Departed" hint={DATE_HINT}>
              <Input name="departureDate" className={fieldClass} />
            </Field>
          </div>
        </>
      )

    case "patron":
      return (
        <>
          <EntitySelect
            label="Patron"
            name="patronId"
            placeholder="Select a patron…"
            empty="No patrons on file yet. Promote a character to patron in the Patrons module first."
            options={catalogs.patrons.map((patron) => ({
              id: patron.id,
              name: patron.npc?.name ?? "Unnamed patron",
              hint: patron.npc?.occupation,
            }))}
          />
          <Field label="The job">
            <textarea
              name="jobSummary"
              rows={3}
              placeholder="What they want done, in the words they would use."
              className={cn(
                fieldClass,
                "resize-y px-2.5 py-2 outline-none focus-visible:ring-3"
              )}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reward" hint="Free text, e.g. “Cr15,000 on delivery”.">
              <Input name="reward" maxLength={200} className={fieldClass} />
            </Field>
            <SelectField
              label="Availability"
              name="availability"
              options={patronAvailabilityOptions}
              defaultValue="available"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Difficulty"
              name="difficulty"
              options={jobDifficultyOptions}
              placeholder="Unrated"
            />
            <SelectField
              label="Legal status"
              name="legalStatus"
              options={legalStatusOptions}
              placeholder="Unrated"
            />
          </div>
        </>
      )

    case "location":
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Name">
              <Input
                name="name"
                required
                maxLength={150}
                placeholder="Startown Highport"
                className={fieldClass}
              />
            </Field>
            <SelectField
              label="Type"
              name="type"
              options={locationTypeOptions}
              defaultValue="other"
            />
          </div>
          <TextAreaField
            label="Description"
            name="description"
            rows={3}
            placeholder="What the place looks and smells like, and who runs it."
          />
          <Field
            label="Security level"
            hint="0 is wide open, 5 is a hard target. Leave blank if it does not apply."
          >
            <Input
              name="securityLevel"
              type="number"
              min={0}
              max={5}
              className={fieldClass}
            />
          </Field>
          <CampaignTraitPicker
            catalog={catalogs.traits}
            type="Location"
            label="Location traits"
          />
        </>
      )

    case "connection":
      return (
        <>
          <EntitySelect
            label="Linked system"
            name="toSystemId"
            placeholder="Select a system…"
            empty="No other systems charted yet."
            options={catalogs.systems.map((system) => ({
              id: system.id,
              name: system.name,
              hint: system.location,
            }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Link type"
              name="relationshipType"
              required
              options={systemLinkOptions}
              placeholder="Select…"
            />
            <Field label="Strength" hint="1 is nominal, 5 is the defining tie.">
              <Input
                name="strength"
                type="number"
                min={1}
                max={5}
                defaultValue={2}
                className={fieldClass}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              name="active"
              defaultChecked
              className="size-4 accent-[var(--color-signal)]"
            />
            <span className="text-sm text-foreground/85">
              Currently active — uncheck for a lapsed or historical link
            </span>
          </label>
        </>
      )
  }
}

/**
 * Two-step add flow: pick what kind of tie this is, then fill only the fields
 * that kind needs. Keeps six quite different forms behind one button.
 */
export function SystemRelationshipWizard({
  systemId,
  catalogs,
}: {
  systemId: string
  catalogs: Catalogs
}) {
  const [state, formAction, pending] = useActionState(
    addRelationshipAction,
    emptyFormState
  )
  const [kind, setKind] = useState<RelationshipKind | null>(null)

  if (!kind) {
    return (
      <div className="space-y-3 border border-hairline bg-card/50 p-4">
        <h3 className="font-heading text-sm tracking-[0.16em] uppercase text-signal">
          Add a relationship
        </h3>
        <p className="text-sm text-muted-foreground">
          Pick what kind of tie you are recording.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {kinds.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setKind(entry.id)}
                className="flex h-full w-full flex-col gap-1 border border-hairline bg-background/30 p-3 text-left transition-colors hover:border-signal/50 hover:bg-signal/5"
              >
                <span className="flex items-center gap-2 font-heading text-sm tracking-wide uppercase">
                  <entry.icon aria-hidden className="size-4 text-signal" />
                  {entry.label}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {entry.blurb}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const active = kinds.find((entry) => entry.id === kind)!

  return (
    <form action={formAction} className="space-y-4 border border-signal/40 bg-card/60 p-4">
      <input type="hidden" name="systemId" value={systemId} />
      <input type="hidden" name="kind" value={kind} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-sm tracking-[0.16em] uppercase text-signal">
            <active.icon aria-hidden className="size-4" />
            {active.label}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{active.blurb}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setKind(null)}
          className="rounded-none font-heading text-xs tracking-[0.12em] uppercase text-muted-foreground"
        >
          <X aria-hidden />
          Back
        </Button>
      </div>

      <FormMessage error={state.error} success={state.success} />

      <KindFields kind={kind} catalogs={catalogs} />

      <TextAreaField
        label="Notes"
        name="notes"
        rows={2}
        placeholder="Anything else worth remembering about this tie."
      />

      {kind === "location" ? null : <VisibilityField />}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="rounded-none border border-signal/45 bg-signal/10 font-heading tracking-[0.12em] uppercase text-signal hover:bg-signal/20"
        >
          {pending ? "Saving…" : "Save relationship"}
        </Button>
      </div>
    </form>
  )
}
