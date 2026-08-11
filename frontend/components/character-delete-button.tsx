"use client"

import { useActionState, useEffect, useState } from "react"
import { AlertDialog } from "@base-ui/react/alert-dialog"

import {
  deleteCharacterAction,
  type DeleteCharacterState,
} from "@/app/characters/actions"
import { Button } from "@/components/ui/button"

const initialState: DeleteCharacterState = { error: null }

type CharacterDeleteButtonProps = {
  characterId: string
  characterName: string
}

export function CharacterDeleteButton({
  characterId,
  characterName,
}: CharacterDeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    deleteCharacterAction,
    initialState
  )

  useEffect(() => {
    if (state.error) setOpen(true)
  }, [state.error])

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        render={
          <Button
            type="button"
            className="rounded-none border border-oxide/50 bg-oxide/10 font-heading tracking-[0.12em] uppercase text-oxide hover:bg-oxide/20"
          />
        }
      >
        Delete sheet
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-hairline bg-card p-5 shadow-lg outline-none transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-6">
          <AlertDialog.Title className="font-heading text-lg font-semibold tracking-wide uppercase text-foreground">
            Delete character sheet?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This permanently removes{" "}
            <span className="font-medium text-foreground">{characterName}</span>{" "}
            and cannot be undone.
          </AlertDialog.Description>

          {state.error && (
            <p
              role="alert"
              className="mt-3 border border-oxide/50 bg-oxide/10 px-3 py-2 font-mono text-sm text-oxide"
            >
              {state.error}
            </p>
          )}

          <form
            action={formAction}
            className="mt-5 flex flex-wrap items-center justify-end gap-3"
          >
            <input type="hidden" name="id" value={characterId} />
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
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </form>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
