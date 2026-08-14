"use client"

import { useActionState } from "react"
import Link from "next/link"

import { createPatronAction, updatePatronAction } from "@/app/patrons/actions"
import {
  Field,
  FormMessage,
  SelectField,
  TextAreaField,
  fieldClass,
  selectClass,
} from "@/components/campaign-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CampaignNpc, Patron } from "@/lib/api-types"
import {
  emptyFormState,
  paymentRecordOptions,
  riskToleranceOptions,
} from "@/lib/campaign"

export function PatronForm({
  patron,
  npcs,
}: {
  patron?: Patron
  npcs: CampaignNpc[]
}) {
  const editing = Boolean(patron)
  const [state, formAction, pending] = useActionState(
    editing ? updatePatronAction : createPatronAction,
    emptyFormState
  )

  return (
    <form action={formAction} className="space-y-6">
      {patron ? <input type="hidden" name="id" value={patron.id} /> : null}

      <FormMessage error={state.error} />

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-ochre">
          Who is hiring
        </h2>

        <p className="text-sm leading-relaxed text-muted-foreground">
          A patron is not a separate person: it is an existing character wearing
          a hiring hat. Pick who is putting the work out. If they are not on the
          list yet,{" "}
          <Link
            href="/campaign-npcs/new"
            className="text-ochre transition-colors hover:text-foreground"
          >
            add them to the cast
          </Link>{" "}
          first.
        </p>

        {npcs.length === 0 ? (
          <div className="border border-dashed border-hairline bg-background/30 px-4 py-6 text-sm leading-relaxed text-muted-foreground">
            There are no characters on file to hire from.{" "}
            <Link
              href="/campaign-npcs/new"
              className="text-ochre transition-colors hover:text-foreground"
            >
              Add a character
            </Link>{" "}
            first, then come back and give them work to hand out.
          </div>
        ) : (
          <Field label="Character">
            <select
              name="npcId"
              required
              defaultValue={patron?.npcId ?? ""}
              className={selectClass}
            >
              <option value="" disabled>
                Select a character…
              </option>
              {npcs.map((npc) => (
                <option key={npc.id} value={npc.id}>
                  {npc.occupation ? `${npc.name} — ${npc.occupation}` : npc.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </section>

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-ochre">
          Track record
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Reputation"
            hint="-5 has burned crews before; +5 has never shorted anyone."
          >
            <Input
              name="reputation"
              type="number"
              min={-5}
              max={5}
              defaultValue={patron?.reputation ?? 0}
              className={fieldClass}
            />
          </Field>
          <SelectField
            label="Payment record"
            name="paymentRecord"
            options={paymentRecordOptions}
            defaultValue={patron?.paymentRecord ?? "variable"}
          />
          <SelectField
            label="Risk tolerance"
            name="riskTolerance"
            options={riskToleranceOptions}
            defaultValue={patron?.riskTolerance ?? "moderate"}
          />
        </div>
      </section>

      <section className="space-y-4 border border-hairline bg-card/50 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-ochre">
          Work offered
        </h2>

        <Field
          label="Job types"
          hint="Comma-separated: courier runs, salvage, quiet retrieval."
        >
          <Input
            name="jobTypes"
            defaultValue={patron?.jobTypes.join(", ") ?? ""}
            placeholder="Courier runs, Salvage, Quiet retrieval"
            className={fieldClass}
          />
        </Field>
      </section>

      <section className="space-y-4 border border-oxide/35 bg-oxide/5 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-oxide">
          Game Master notes
        </h2>
        <TextAreaField
          label="Notes"
          name="notes"
          rows={4}
          defaultValue={patron?.notes}
          placeholder="What they actually want, who is funding it, what they leave out of the briefing."
          hint="Never sent to players or visitors."
        />
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link
          href={patron ? `/patrons/${patron.id}` : "/patrons"}
          className="console-label text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
        <Button
          type="submit"
          disabled={pending}
          className="rounded-none border border-ochre/45 bg-ochre/10 font-heading tracking-[0.14em] uppercase text-ochre hover:bg-ochre/20"
        >
          {pending ? "Saving…" : editing ? "Save changes" : "File patron"}
        </Button>
      </div>
    </form>
  )
}
