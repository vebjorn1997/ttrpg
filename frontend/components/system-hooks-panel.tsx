"use client"

import { useActionState, useState, useTransition } from "react"
import { Check, Plus, Trash2, Undo2 } from "lucide-react"

import {
  addHookAction,
  deleteHookAction,
  setHookUsedAction,
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
import type { SystemHook } from "@/lib/api-types"
import { emptyFormState } from "@/lib/campaign"
import { cn } from "@/lib/utils"

/** Toggling a hook between unused and spent is a one-click GM affordance. */
function UsedToggle({
  systemId,
  hook,
}: {
  systemId: string
  hook: SystemHook
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await setHookUsedAction(systemId, hook.id, !hook.used)
            setError(result.error)
          })
        }
        className={cn(
          "rounded-none font-heading text-xs tracking-[0.12em] uppercase",
          hook.used
            ? "text-muted-foreground hover:text-viridian"
            : "text-viridian hover:text-viridian"
        )}
      >
        {hook.used ? (
          <>
            <Undo2 aria-hidden />
            Reopen
          </>
        ) : (
          <>
            <Check aria-hidden />
            Mark used
          </>
        )}
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-oxide">
          {error}
        </span>
      ) : null}
    </>
  )
}

function HookCard({
  systemId,
  hook,
  isGm,
}: {
  systemId: string
  hook: SystemHook
  isGm: boolean
}) {
  return (
    <li
      className={cn(
        "border border-hairline bg-card/60 p-4",
        hook.used && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={cn(
              "font-heading text-base tracking-wide uppercase",
              hook.used && "line-through decoration-muted-foreground/60"
            )}
          >
            {hook.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {hook.visibility === "gm_only" ? <GmOnlyBadge /> : null}
            {hook.used ? (
              <span className="console-label text-muted-foreground">Used</span>
            ) : null}
          </div>
        </div>

        {isGm ? (
          <div className="flex items-center gap-1">
            <UsedToggle systemId={systemId} hook={hook} />
            <CampaignDeleteButton
              action={deleteHookAction}
              fields={{ systemId, hookId: hook.id }}
              title="Delete this hook?"
              description={`"${hook.title}" will be removed from this system.`}
              trigger={<Trash2 aria-hidden className="size-3.5" />}
              triggerClassName="p-1.5 text-muted-foreground transition-colors hover:text-oxide"
            />
          </div>
        ) : null}
      </div>

      {hook.description ? (
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-foreground/80">
          {hook.description}
        </p>
      ) : null}
    </li>
  )
}

export function SystemHooksPanel({
  systemId,
  hooks,
  isGm,
}: {
  systemId: string
  hooks: SystemHook[]
  isGm: boolean
}) {
  const [state, formAction, pending] = useActionState(
    addHookAction,
    emptyFormState
  )
  const [open, setOpen] = useState(false)

  const live = hooks.filter((hook) => !hook.used)
  const spent = hooks.filter((hook) => hook.used)

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
            File an adventure hook
          </button>

          {open ? (
            <form action={formAction} className="space-y-4 border-t border-hairline p-4">
              <input type="hidden" name="systemId" value={systemId} />
              <FormMessage error={state.error} success={state.success} />

              <Field label="Title">
                <Input
                  name="title"
                  required
                  maxLength={200}
                  placeholder="The Sealed Warehouse"
                  className={fieldClass}
                />
              </Field>

              <Field label="Description">
                <textarea
                  name="description"
                  rows={4}
                  placeholder="What the crew notices, and the thread they can pull on."
                  className={cn(
                    fieldClass,
                    "resize-y px-2.5 py-2 outline-none focus-visible:ring-3"
                  )}
                />
              </Field>

              <VisibilityField />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={pending}
                  className="rounded-none border border-signal/45 bg-signal/10 font-heading tracking-[0.12em] uppercase text-signal hover:bg-signal/20"
                >
                  {pending ? "Filing…" : "File hook"}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {hooks.length === 0 ? (
        <p className="border border-dashed border-hairline bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
          No hooks on file for this system.
        </p>
      ) : (
        <div className="space-y-6">
          {live.length > 0 ? (
            <ul className="space-y-3">
              {live.map((hook) => (
                <HookCard
                  key={hook.id}
                  systemId={systemId}
                  hook={hook}
                  isGm={isGm}
                />
              ))}
            </ul>
          ) : null}

          {spent.length > 0 ? (
            <section className="space-y-3">
              <h3 className="console-label text-muted-foreground">
                Already used
              </h3>
              <ul className="space-y-3">
                {spent.map((hook) => (
                  <HookCard
                    key={hook.id}
                    systemId={systemId}
                    hook={hook}
                    isGm={isGm}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
