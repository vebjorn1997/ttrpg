"use client"

import { useActionState, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import {
  addLogEntryAction,
  deleteLogEntryAction,
  updateLogEntryAction,
} from "@/app/systems/actions"
import { Field, FormMessage, fieldClass } from "@/components/campaign-fields"
import { CampaignDeleteButton } from "@/components/campaign-delete-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SystemLogEntry } from "@/lib/api-types"
import { emptyFormState } from "@/lib/campaign"
import { cn } from "@/lib/utils"

const DATE_HINT =
  "Imperial calendar (1105-02-20) or stardate (1105-045). Both are accepted and sorted together."

function EditRow({
  systemId,
  entry,
  onDone,
}: {
  systemId: string
  entry: SystemLogEntry
  onDone: () => void
}) {
  const [state, formAction, pending] = useActionState(
    updateLogEntryAction,
    emptyFormState
  )

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="systemId" value={systemId} />
      <input type="hidden" name="entryId" value={entry.id} />
      <FormMessage error={state.error} />

      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Field label="Date">
          <Input
            name="date"
            required
            defaultValue={entry.dateDisplay}
            className={cn(fieldClass, "tracking-[0.1em]")}
          />
        </Field>
        <Field label="Entry">
          <textarea
            name="event"
            rows={3}
            required
            defaultValue={entry.event}
            className={cn(
              fieldClass,
              "resize-y px-2.5 py-2 outline-none focus-visible:ring-3"
            )}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDone}
          className="rounded-none font-heading text-xs tracking-[0.12em] uppercase text-muted-foreground"
        >
          <X aria-hidden />
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="rounded-none border border-signal/45 bg-signal/10 font-heading text-xs tracking-[0.12em] uppercase text-signal hover:bg-signal/20"
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  )
}

/**
 * The shared traveller log. Unlike hooks and history, any signed-in player can
 * file here — it is the crew's own record of what they did in this system.
 */
export function SystemLogPanel({
  systemId,
  entries,
  canWrite,
}: {
  systemId: string
  entries: SystemLogEntry[]
  canWrite: boolean
}) {
  const [state, formAction, pending] = useActionState(
    addLogEntryAction,
    emptyFormState
  )
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {canWrite ? (
        <div className="border border-hairline bg-card/50">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex w-full items-center gap-2 px-4 py-3 font-heading text-xs tracking-[0.14em] uppercase text-signal transition-colors hover:bg-signal/5"
          >
            <Plus aria-hidden className="size-3.5" />
            Add a log entry
          </button>

          {open ? (
            <form
              action={formAction}
              className="space-y-4 border-t border-hairline p-4"
            >
              <input type="hidden" name="systemId" value={systemId} />
              <FormMessage error={state.error} success={state.success} />

              <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                <Field label="Date" hint={DATE_HINT}>
                  <Input
                    name="date"
                    required
                    placeholder="1105-045"
                    className={cn(fieldClass, "tracking-[0.1em]")}
                  />
                </Field>
                <Field label="What happened">
                  <textarea
                    name="event"
                    rows={3}
                    required
                    placeholder="Made planetfall at the downport and met the broker."
                    className={cn(
                      fieldClass,
                      "resize-y px-2.5 py-2 outline-none focus-visible:ring-3"
                    )}
                  />
                </Field>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={pending}
                  className="rounded-none border border-signal/45 bg-signal/10 font-heading tracking-[0.12em] uppercase text-signal hover:bg-signal/20"
                >
                  {pending ? "Filing…" : "File entry"}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {entries.length === 0 ? (
        <p className="border border-dashed border-hairline bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
          The crew has not logged anything here yet.
        </p>
      ) : (
        <ol className="relative space-y-4 border-l border-hairline pl-5">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span
                aria-hidden
                className="absolute top-2 -left-[1.4rem] size-1.5 bg-signal"
              />
              <div className="border border-hairline bg-card/60 p-4">
                {editing === entry.id ? (
                  <EditRow
                    systemId={systemId}
                    entry={entry}
                    onDone={() => setEditing(null)}
                  />
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm tracking-[0.14em] text-signal">
                          {entry.dateDisplay}
                        </p>
                        {entry.recordedByName ? (
                          <p className="console-label mt-0.5 text-muted-foreground">
                            Logged by {entry.recordedByName}
                          </p>
                        ) : null}
                      </div>

                      {canWrite ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Edit entry"
                            onClick={() => setEditing(entry.id)}
                            className="p-1.5 text-muted-foreground transition-colors hover:text-signal"
                          >
                            <Pencil aria-hidden className="size-3.5" />
                          </button>
                          <CampaignDeleteButton
                            action={deleteLogEntryAction}
                            fields={{ systemId, entryId: entry.id }}
                            title="Delete this log entry?"
                            description="The entry will be removed from the traveller log."
                            trigger={<Trash2 aria-hidden className="size-3.5" />}
                            triggerClassName="p-1.5 text-muted-foreground transition-colors hover:text-oxide"
                          />
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-foreground/85">
                      {entry.event}
                    </p>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
