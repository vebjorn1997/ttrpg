"use client"

import { useActionState, useState } from "react"
import Link from "next/link"

import { createShipAction, updateShipAction } from "@/app/ships/actions"
import {
  Field,
  FormMessage,
  SelectField,
  TextAreaField,
  fieldClass,
  selectClass,
} from "@/components/campaign-fields"
import { CampaignTraitPicker } from "@/components/campaign-trait-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type {
  CampaignNpc,
  Faction,
  Ship,
  StarSystem,
  Trait,
} from "@/lib/api-types"
import { emptyFormState, shipStatusOptions } from "@/lib/campaign"
import { cn } from "@/lib/utils"

export function ShipForm({
  ship,
  systems,
  factions,
  npcs,
  traits,
  traitsError = null,
}: {
  ship?: Ship
  systems: StarSystem[]
  factions: Faction[]
  npcs: CampaignNpc[]
  traits: Trait[]
  traitsError?: string | null
}) {
  const editing = Boolean(ship)
  const [state, formAction, pending] = useActionState(
    editing ? updateShipAction : createShipAction,
    emptyFormState
  )

  // Only one owner may be submitted, so each select clears the other.
  const [ownerFactionId, setOwnerFactionId] = useState(
    ship?.ownerFactionId ?? ""
  )
  const [ownerNpcId, setOwnerNpcId] = useState(ship?.ownerNpcId ?? "")

  return (
    <form action={formAction} className="space-y-6">
      {ship ? <input type="hidden" name="id" value={ship.id} /> : null}

      <FormMessage error={state.error} />

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-signal">
          Identity
        </h2>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="Name">
            <Input
              name="name"
              required
              maxLength={150}
              defaultValue={ship?.name ?? ""}
              placeholder="Kestrel's Errand"
              className={fieldClass}
            />
          </Field>
          <Field label="Type">
            <Input
              name="type"
              defaultValue={ship?.type ?? ""}
              placeholder="Far Trader"
              className={fieldClass}
            />
          </Field>
        </div>

        <Field
          label="Registration"
          hint="Transponder code as it reads to port control."
        >
          <Input
            name="registration"
            defaultValue={ship?.registration ?? ""}
            placeholder="TRV-4471-K"
            className={cn(fieldClass, "uppercase")}
          />
        </Field>
      </section>

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-signal">
          Ownership
        </h2>

        <p className="text-xs leading-relaxed text-muted-foreground/80">
          A hull is owned by a faction or by a person, not both. Picking one
          side clears the other.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owning faction">
            <select
              name="ownerFactionId"
              value={ownerFactionId}
              onChange={(event) => {
                setOwnerFactionId(event.target.value)
                if (event.target.value) setOwnerNpcId("")
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {factions.map((faction) => (
                <option key={faction.id} value={faction.id}>
                  {faction.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Owning person">
            <select
              name="ownerNpcId"
              value={ownerNpcId}
              onChange={(event) => {
                setOwnerNpcId(event.target.value)
                if (event.target.value) setOwnerFactionId("")
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {npcs.map((npc) => (
                <option key={npc.id} value={npc.id}>
                  {npc.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-signal">
          Status
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Status"
            name="status"
            options={shipStatusOptions}
            defaultValue={ship?.status ?? "active"}
          />
          <Field label="Current system">
            <select
              name="currentSystemId"
              defaultValue={ship?.currentSystemId ?? ""}
              className={selectClass}
            >
              <option value="">Whereabouts unknown</option>
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name} — {system.location}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <CampaignTraitPicker
          catalog={traits}
          type="Ship"
          error={traitsError}
          initialTraitIds={ship?.traits.map((trait) => trait.id)}
          label="Ship traits"
        />
      </section>

      <section className="space-y-4 border border-oxide/35 bg-oxide/5 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-oxide">
          Game Master notes
        </h2>
        <TextAreaField
          label="Notes"
          name="notes"
          rows={4}
          defaultValue={ship?.notes}
          placeholder="False transponders, what is in the hold, who is really flying it."
          hint="Never sent to players or visitors."
        />
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link
          href={ship ? `/ships/${ship.id}` : "/ships"}
          className="console-label text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
        <Button
          type="submit"
          disabled={pending}
          className="rounded-none border border-signal/45 bg-signal/10 font-heading tracking-[0.14em] uppercase text-signal hover:bg-signal/20"
        >
          {pending ? "Saving…" : editing ? "Save changes" : "File ship"}
        </Button>
      </div>
    </form>
  )
}
