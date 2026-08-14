"use client"

import { useActionState } from "react"
import Link from "next/link"

import { importSystemsAction } from "@/app/systems/actions"
import { Field, FormMessage, fieldClass } from "@/components/campaign-fields"
import { Button } from "@/components/ui/button"
import { emptyImportState } from "@/lib/campaign"
import { cn } from "@/lib/utils"

const COLUMNS = [
  ["name", "Required. Must be unique; rows naming an existing system are skipped."],
  ["location", "Required. Four hex characters, e.g. 1910. Also must be unique."],
  ["description", "Optional public briefing text."],
  ["tech_level", "Required, 0–9."],
  ["law_level", "Required, 0–4."],
  ["traits", "Optional. Semicolon-separated trait names that already exist in the glossary."],
  ["notes", "Optional GM-only notes."],
  ["hooks", "Optional JSON array of {title, description, used}."],
  ["traveller_interactions", "Optional JSON array of {date, event}."],
  ["timeline_history", "Optional JSON array of {date, event, visibility}."],
] as const

export function SystemImportForm() {
  const [state, formAction, pending] = useActionState(
    importSystemsAction,
    emptyImportState
  )

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <FormMessage error={state.error} success={state.success} />

        <Field
          label="CSV file"
          hint="The file is read in your browser and sent as text; nothing is stored until the import runs."
        >
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            className={cn(
              fieldClass,
              "px-2.5 py-2 file:mr-3 file:border-0 file:bg-signal/15 file:px-3 file:py-1 file:font-heading file:text-xs file:tracking-[0.12em] file:uppercase file:text-signal"
            )}
          />
        </Field>

        <Field label="…or paste CSV" hint="Handy for a single row pasted out of a spreadsheet.">
          <textarea
            name="csv"
            rows={8}
            spellCheck={false}
            placeholder="name,description,tech_level,law_level,location,traits,notes"
            className={cn(
              fieldClass,
              "resize-y px-2.5 py-2 text-xs outline-none focus-visible:ring-3"
            )}
          />
        </Field>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/systems"
            className="console-label text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={pending}
            className="rounded-none border border-signal/45 bg-signal/10 font-heading tracking-[0.14em] uppercase text-signal hover:bg-signal/20"
          >
            {pending ? "Importing…" : "Run import"}
          </Button>
        </div>
      </form>

      {state.report ? (
        <section className="space-y-4 border border-hairline bg-card/50 p-4">
          <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-signal">
            Import report
          </h2>

          {state.report.created.length > 0 ? (
            <div>
              <p className="console-label text-viridian">
                Created ({state.report.created.length})
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                {state.report.created.join(", ")}
              </p>
            </div>
          ) : null}

          {state.report.skipped.length > 0 ? (
            <div>
              <p className="console-label text-muted-foreground">
                Skipped, already on file ({state.report.skipped.length})
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.report.skipped.join(", ")}
              </p>
            </div>
          ) : null}

          {state.report.errors.length > 0 ? (
            <div>
              <p className="console-label text-oxide">
                Rejected ({state.report.errors.length})
              </p>
              <ul className="mt-1 space-y-1">
                {state.report.errors.map((error) => (
                  <li key={error} className="font-mono text-xs text-oxide">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="border border-hairline bg-card/40 p-4">
        <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-muted-foreground">
          Recognised columns
        </h2>
        <dl className="mt-3 space-y-2.5">
          {COLUMNS.map(([column, note]) => (
            <div key={column} className="grid gap-1 sm:grid-cols-[12rem_1fr]">
              <dt className="font-mono text-xs text-ochre">{column}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">
                {note}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
