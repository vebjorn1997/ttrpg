"use client"

import { useActionState } from "react"
import Link from "next/link"

import {
  createCampaignNpcAction,
  updateCampaignNpcAction,
} from "@/app/campaign-npcs/actions"
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
import type { CampaignNpc, Faction, StarSystem, Trait } from "@/lib/api-types"
import { emptyFormState, npcStatusOptions } from "@/lib/campaign"
import { cn } from "@/lib/utils"

export function CampaignNpcForm({
  npc,
  systems,
  factions,
  traits,
  traitsError = null,
}: {
  npc?: CampaignNpc
  systems: StarSystem[]
  factions: Faction[]
  traits: Trait[]
  traitsError?: string | null
}) {
  const editing = Boolean(npc)
  const [state, formAction, pending] = useActionState(
    editing ? updateCampaignNpcAction : createCampaignNpcAction,
    emptyFormState
  )

  return (
    <form action={formAction} className="space-y-6">
      {npc ? <input type="hidden" name="id" value={npc.id} /> : null}

      <FormMessage error={state.error} />

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-viridian">
          Identity
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input
              name="name"
              required
              maxLength={150}
              defaultValue={npc?.name ?? ""}
              placeholder="Ilya Vashenko"
              className={fieldClass}
            />
          </Field>
          <Field label="Occupation">
            <Input
              name="occupation"
              defaultValue={npc?.occupation ?? ""}
              placeholder="Port factor"
              className={fieldClass}
            />
          </Field>
        </div>

        <TextAreaField
          label="Description"
          name="description"
          rows={4}
          defaultValue={npc?.description}
          placeholder="How they look, how they talk, what the crew notices first."
        />
      </section>

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-viridian">
          Standing
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Status"
            name="status"
            options={npcStatusOptions}
            defaultValue={npc?.status ?? "alive"}
          />
          <Field label="UPP" hint="Six hex digits: STR DEX END INT EDU SOC.">
            <Input
              name="upp"
              maxLength={6}
              defaultValue={npc?.upp ?? ""}
              placeholder="7A6B94"
              className={cn(fieldClass, "uppercase tracking-[0.2em]")}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Allegiance">
            <select
              name="allegianceFactionId"
              defaultValue={npc?.allegianceFactionId ?? ""}
              className="h-8 w-full rounded-none border border-hairline bg-background/50 px-2.5 font-mono text-sm outline-none focus-visible:border-ochre focus-visible:ring-3 focus-visible:ring-ochre/30"
            >
              <option value="">Unaffiliated</option>
              {factions.map((faction) => (
                <option key={faction.id} value={faction.id}>
                  {faction.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Current location">
            <select
              name="currentLocationSystemId"
              defaultValue={npc?.currentLocationSystemId ?? ""}
              className="h-8 w-full rounded-none border border-hairline bg-background/50 px-2.5 font-mono text-sm outline-none focus-visible:border-ochre focus-visible:ring-3 focus-visible:ring-ochre/30"
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
          type="NPC"
          error={traitsError}
          initialTraitIds={npc?.traits.map((trait) => trait.id)}
          label="Character traits"
          hint="Species, size and other tags live here — pick them from the NPC glossary."
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
          defaultValue={npc?.notes}
          placeholder="What they want, what they are hiding, who they answer to."
          hint="Never sent to players or visitors."
        />
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link
          href={npc ? `/campaign-npcs/${npc.id}` : "/campaign-npcs"}
          className="console-label text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
        <Button
          type="submit"
          disabled={pending}
          className="rounded-none border border-viridian/45 bg-viridian/10 font-heading tracking-[0.14em] uppercase text-viridian hover:bg-viridian/20"
        >
          {pending ? "Saving…" : editing ? "Save changes" : "File character"}
        </Button>
      </div>
    </form>
  )
}
