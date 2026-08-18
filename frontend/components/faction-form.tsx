"use client"

import { useActionState, useState } from "react"
import Link from "next/link"

import { createFactionAction, updateFactionAction } from "@/app/factions/actions"
import {
  Field,
  FormMessage,
  SelectField,
  TextAreaField,
  fieldClass,
} from "@/components/campaign-fields"
import { CampaignTraitPicker } from "@/components/campaign-trait-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Faction, StarSystem, Trait } from "@/lib/api-types"
import { emptyFormState, factionTypeOptions } from "@/lib/campaign"

const DEFAULT_COLOR = "#4a6d8c"

export function FactionForm({
  faction,
  systems,
  traits,
  traitsError = null,
}: {
  faction?: Faction
  systems: StarSystem[]
  traits: Trait[]
  traitsError?: string | null
}) {
  const editing = Boolean(faction)
  const [state, formAction, pending] = useActionState(
    editing ? updateFactionAction : createFactionAction,
    emptyFormState
  )
  const [color, setColor] = useState(faction?.color ?? DEFAULT_COLOR)

  return (
    <form action={formAction} className="space-y-6">
      {faction ? <input type="hidden" name="id" value={faction.id} /> : null}

      <FormMessage error={state.error} />

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-oxide">
          Identity
        </h2>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="Name">
            <Input
              name="name"
              required
              maxLength={150}
              defaultValue={faction?.name ?? ""}
              placeholder="Tukera Lines"
              className={fieldClass}
            />
          </Field>
          <SelectField
            label="Type"
            name="type"
            options={factionTypeOptions}
            defaultValue={faction?.type ?? "other"}
          />
        </div>

        <TextAreaField
          label="Description"
          name="description"
          rows={4}
          defaultValue={faction?.description}
          placeholder="Who they are and how they present themselves in public."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Tier"
            hint="1 is a local gang, 5 spans the sector. Leave blank if unranked."
          >
            <Input
              name="tier"
              type="number"
              min={1}
              max={5}
              defaultValue={faction?.tier ?? ""}
              className={fieldClass}
            />
          </Field>
          <Field label="Headquarters">
            <select
              name="headquartersSystemId"
              defaultValue={faction?.headquartersSystemId ?? ""}
              className="h-8 w-full rounded-none border border-hairline bg-background/50 px-2.5 font-mono text-sm outline-none focus-visible:border-ochre focus-visible:ring-3 focus-visible:ring-ochre/30"
            >
              <option value="">No fixed base</option>
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name} — {system.location}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Map colour"
          hint="Hex code used on the star-system chart for worlds this faction holds."
        >
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Pick map colour"
              value={/^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_COLOR}
              onChange={(event) => setColor(event.target.value)}
              className="size-8 shrink-0 cursor-pointer border border-hairline bg-background p-0"
            />
            <Input
              name="color"
              required
              maxLength={7}
              pattern="#[0-9A-Fa-f]{6}"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              placeholder="#32a852"
              className={`${fieldClass} uppercase`}
            />
          </div>
        </Field>
      </section>

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-oxide">
          Reach
        </h2>

        <TextAreaField
          label="Goals"
          name="goals"
          rows={3}
          defaultValue={faction?.goals}
          placeholder="What they are actually trying to achieve."
        />

        <Field
          label="Assets"
          hint="Comma-separated: ships, holdings, contracts, anything they can bring to bear."
        >
          <Input
            name="assets"
            defaultValue={faction?.assets.join(", ") ?? ""}
            placeholder="Two subsidised liners, Port bond, Customs seat"
            className={fieldClass}
          />
        </Field>

        <CampaignTraitPicker
          catalog={traits}
          type="Faction"
          error={traitsError}
          initialTraitIds={faction?.traits.map((trait) => trait.id)}
          label="Faction traits"
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
          defaultValue={faction?.notes}
          placeholder="Real agenda, secret backers, who they answer to."
          hint="Never sent to players or visitors."
        />
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link
          href={faction ? `/factions/${faction.id}` : "/factions"}
          className="console-label text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
        <Button
          type="submit"
          disabled={pending}
          className="rounded-none border border-oxide/45 bg-oxide/10 font-heading tracking-[0.14em] uppercase text-oxide hover:bg-oxide/20"
        >
          {pending ? "Saving…" : editing ? "Save changes" : "File faction"}
        </Button>
      </div>
    </form>
  )
}
