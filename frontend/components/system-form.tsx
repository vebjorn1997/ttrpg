"use client"

import { useActionState } from "react"
import Link from "next/link"

import { createSystemAction, updateSystemAction } from "@/app/systems/actions"
import {
  Field,
  FormMessage,
  TextAreaField,
  fieldClass,
  labelClass,
  selectClass,
} from "@/components/campaign-fields"
import { CampaignTraitPicker } from "@/components/campaign-trait-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LawLevel, StarSystem, TechLevel, Trait } from "@/lib/api-types"
import { emptyFormState } from "@/lib/campaign"

type SystemFormProps = {
  traits: Trait[]
  traitsError?: string | null
  techLevels: TechLevel[]
  lawLevels: LawLevel[]
  system?: StarSystem
}

/** Intake and edit form for a star system. */
export function SystemForm({
  traits,
  traitsError = null,
  techLevels,
  lawLevels,
  system,
}: SystemFormProps) {
  const editing = Boolean(system)
  const [state, formAction, pending] = useActionState(
    editing ? updateSystemAction : createSystemAction,
    emptyFormState
  )

  return (
    <form action={formAction} className="space-y-6">
      {system ? <input type="hidden" name="id" value={system.id} /> : null}

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
              maxLength={100}
              defaultValue={system?.name ?? ""}
              placeholder="Regina"
              className={fieldClass}
            />
          </Field>
          <Field
            label="Hex location"
            hint="Four characters: two-digit column then two-digit row."
          >
            <Input
              name="location"
              required
              maxLength={4}
              pattern="[0-9A-Fa-f]{4}"
              defaultValue={system?.location ?? ""}
              placeholder="1910"
              className={`${fieldClass} uppercase tracking-[0.18em]`}
            />
          </Field>
        </div>

        <TextAreaField
          label="Description"
          name="description"
          rows={5}
          defaultValue={system?.description}
          placeholder="What a traveller notices on approach, and what the world is known for."
          hint="Visible to everyone, including visitors who are not signed in."
        />
      </section>

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-signal">
          Governance
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Tech level</span>
            <select
              name="techLevel"
              required
              defaultValue={system ? String(system.techLevel) : ""}
              className={selectClass}
            >
              <option value="" disabled>
                Select a tech level…
              </option>
              {techLevels.map((tl) => (
                <option key={tl.id} value={tl.level}>
                  {tl.level} — {tl.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Law level</span>
            <select
              name="lawLevel"
              required
              defaultValue={system ? String(system.lawLevel) : ""}
              className={selectClass}
            >
              <option value="" disabled>
                Select a law level…
              </option>
              {lawLevels.map((law) => (
                <option key={law.id} value={law.lawlevel}>
                  {law.lawlevel} — {law.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-signal">
          World profile
        </h2>
        <CampaignTraitPicker
          catalog={traits}
          type="System"
          error={traitsError}
          initialTraitIds={system?.traits.map((trait) => trait.id)}
          label="System traits"
          hint="Starport class, gravity, atmosphere and travel zone all live here rather than in a UWP string."
        />
      </section>

      <section className="space-y-4 border border-oxide/35 bg-oxide/5 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-oxide">
          Game Master notes
        </h2>
        <TextAreaField
          label="Notes"
          name="notes"
          rows={5}
          defaultValue={system?.notes}
          placeholder="Secrets, true motives, what is really going on beneath the surface."
          hint="Never sent to players or visitors."
        />
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link
          href={system ? `/systems/${system.id}` : "/systems"}
          className="console-label text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
        <Button
          type="submit"
          disabled={pending}
          className="rounded-none border border-signal/45 bg-signal/10 font-heading tracking-[0.14em] uppercase text-signal hover:bg-signal/20"
        >
          {pending
            ? "Saving…"
            : editing
              ? "Save changes"
              : "Chart system"}
        </Button>
      </div>
    </form>
  )
}
