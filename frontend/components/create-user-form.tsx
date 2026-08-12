"use client"

import { useActionState } from "react"

import {
  createInviteUserAction,
  type CreateUserState,
} from "@/app/admin/users/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const initial: CreateUserState = { error: null, success: null }

export function CreateUserForm() {
  const [state, action, pending] = useActionState(
    createInviteUserAction,
    initial
  )

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="console-label text-muted-foreground">
            Name
          </label>
          <Input
            id="name"
            name="name"
            required
            className="rounded-none"
            placeholder="Player name"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="console-label text-muted-foreground">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-none"
            placeholder="player@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="console-label text-muted-foreground"
          >
            Temporary password
          </label>
          <Input
            id="password"
            name="password"
            type="text"
            required
            minLength={8}
            className="rounded-none"
            placeholder="Min 8 characters"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="role" className="console-label text-muted-foreground">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue="player"
            className="h-8 w-full rounded-none border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="player">Player</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-oxide">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-viridian">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="rounded-none">
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  )
}
