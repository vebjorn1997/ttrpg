"use client"

import { useActionState, useEffect, useState, type ReactNode } from "react"
import { AlertDialog } from "@base-ui/react/alert-dialog"

import { Button } from "@/components/ui/button"
import { emptyFormState, type FormState } from "@/lib/campaign"
import { cn } from "@/lib/utils"

type CampaignDeleteButtonProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  /** Hidden fields forwarded to the action, e.g. `{ systemId, recordId }`. */
  fields: Record<string, string>
  title: string
  description: ReactNode
  trigger: ReactNode
  triggerClassName?: string
  confirmLabel?: string
}

/**
 * Confirmation dialog wrapper for the campaign world deletes. The trigger is
 * supplied by the caller so the same dialog serves both full-width buttons and
 * the small icon buttons on relationship rows.
 */
export function CampaignDeleteButton({
  action,
  fields,
  title,
  description,
  trigger,
  triggerClassName,
  confirmLabel = "Delete",
}: CampaignDeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(action, emptyFormState)

  useEffect(() => {
    if (state.error) setOpen(true)
    else if (state.success) setOpen(false)
  }, [state.error, state.success])

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        render={<button type="button" className={cn(triggerClassName)} />}
      >
        {trigger}
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-hairline bg-card p-5 shadow-lg outline-none transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-6">
          <AlertDialog.Title className="font-heading text-lg font-semibold tracking-wide uppercase text-foreground">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </AlertDialog.Description>

          {state.error ? (
            <p
              role="alert"
              className="mt-3 border border-oxide/50 bg-oxide/10 px-3 py-2 font-mono text-sm text-oxide"
            >
              {state.error}
            </p>
          ) : null}

          <form
            action={formAction}
            className="mt-5 flex flex-wrap items-center justify-end gap-3"
          >
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <AlertDialog.Close
              render={
                <Button
                  type="button"
                  disabled={pending}
                  className="rounded-none border border-hairline bg-transparent font-heading tracking-[0.12em] uppercase text-muted-foreground hover:border-ochre/50 hover:text-ochre"
                />
              }
            >
              Cancel
            </AlertDialog.Close>
            <Button
              type="submit"
              disabled={pending}
              className="rounded-none border border-oxide/50 bg-oxide/15 font-heading tracking-[0.12em] uppercase text-oxide hover:bg-oxide/25"
            >
              {pending ? "Deleting…" : confirmLabel}
            </Button>
          </form>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
