"use client"

import { useActionState, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import {
  addTimelineEventAction,
  deleteTimelineEventAction,
  updateTimelineEventAction,
} from "@/app/systems/actions"
import {
  Field,
  FormMessage,
  GmOnlyBadge,
  VisibilityField,
  fieldClass,
} from "@/components/campaign-fields"
import { CampaignDeleteButton } from "@/components/campaign-delete-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SystemTimelineEvent } from "@/lib/api-types"
import { emptyFormState } from "@/lib/campaign"
import { cn } from "@/lib/utils"

function EditRow({
  systemId,
  event,
  onDone,
}: {
  systemId: string
  event: SystemTimelineEvent
  onDone: () => void
}) {
  const [state, formAction, pending] = useActionState(
    updateTimelineEventAction,
    emptyFormState
  )

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="systemId" value={systemId} />
      <input type="hidden" name="eventId" value={event.id} />
      <FormMessage error={state.error} />

      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Field label="Date">
          <Input
            name="date"
            required
            defaultValue={event.dateDisplay}
            className={cn(fieldClass, "tracking-[0.1em]")}
          />
        </Field>
        <Field label="Event">
          <textarea
            name="event"
            rows={3}
            required
            defaultValue={event.event}
            className={cn(
              fieldClass,
              "resize-y px-2.5 py-2 outline-none focus-visible:ring-3"
            )}
          />
        </Field>
      </div>

      <VisibilityField defaultValue={event.visibility} />

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

/** The world's own history: GM-authored, oldest first. */
export function SystemTimelinePanel({
  systemId,
  events,
  isGm,
}: {
  systemId: string
  events: SystemTimelineEvent[]
  isGm: boolean
}) {
  const [state, formAction, pending] = useActionState(
    addTimelineEventAction,
    emptyFormState
  )
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {isGm ? (
        <div className="border border-hairline bg-card/50">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex w-full items-center gap-2 px-4 py-3 font-heading text-xs tracking-[0.14em] uppercase text-signal transition-colors hover:bg-signal/5"
          >
            <Plus aria-hidden className="size-3.5" />
            Record a history event
          </button>

          {open ? (
            <form
              action={formAction}
              className="space-y-4 border-t border-hairline p-4"
            >
              <input type="hidden" name="systemId" value={systemId} />
              <FormMessage error={state.error} success={state.success} />

              <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                <Field
                  label="Date"
                  hint="Imperial calendar or stardate; both sort together."
                >
                  <Input
                    name="date"
                    required
                    placeholder="1098-01-01"
                    className={cn(fieldClass, "tracking-[0.1em]")}
                  />
                </Field>
                <Field label="Event">
                  <textarea
                    name="event"
                    rows={3}
                    required
                    placeholder="Subsector administration relocated to the highport."
                    className={cn(
                      fieldClass,
                      "resize-y px-2.5 py-2 outline-none focus-visible:ring-3"
                    )}
                  />
                </Field>
              </div>

              <VisibilityField />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={pending}
                  className="rounded-none border border-signal/45 bg-signal/10 font-heading tracking-[0.12em] uppercase text-signal hover:bg-signal/20"
                >
                  {pending ? "Recording…" : "Record event"}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {events.length === 0 ? (
        <p className="border border-dashed border-hairline bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
          Nothing recorded in this world's history yet.
        </p>
      ) : (
        <ol className="relative space-y-4 border-l border-hairline pl-5">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span
                aria-hidden
                className={cn(
                  "absolute top-2 -left-[1.4rem] size-1.5",
                  event.visibility === "gm_only" ? "bg-oxide" : "bg-ochre"
                )}
              />
              <div className="border border-hairline bg-card/60 p-4">
                {editing === event.id ? (
                  <EditRow
                    systemId={systemId}
                    event={event}
                    onDone={() => setEditing(null)}
                  />
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm tracking-[0.14em] text-ochre">
                          {event.dateDisplay}
                        </p>
                        {event.visibility === "gm_only" ? <GmOnlyBadge /> : null}
                      </div>

                      {isGm ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Edit event"
                            onClick={() => setEditing(event.id)}
                            className="p-1.5 text-muted-foreground transition-colors hover:text-signal"
                          >
                            <Pencil aria-hidden className="size-3.5" />
                          </button>
                          <CampaignDeleteButton
                            action={deleteTimelineEventAction}
                            fields={{ systemId, eventId: event.id }}
                            title="Delete this history event?"
                            description="The event will be removed from this world's timeline."
                            trigger={<Trash2 aria-hidden className="size-3.5" />}
                            triggerClassName="p-1.5 text-muted-foreground transition-colors hover:text-oxide"
                          />
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-foreground/85">
                      {event.event}
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
