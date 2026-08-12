import { headers } from "next/headers"

import { ConsolePanel } from "@/components/console-panel"
import { CreateUserForm } from "@/components/create-user-form"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/session"

export const metadata = {
  title: "Users",
}

export default async function AdminUsersPage() {
  await requireAdmin()

  let users: {
    id: string
    name: string
    email: string
    role?: string | null
  }[] = []

  try {
    const result = await auth.api.listUsers({
      query: { limit: 100 },
      headers: await headers(),
    })
    users = result.users ?? []
  } catch {
    users = []
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="console-label text-ochre">Admin</p>
        <h1 className="mt-2 font-heading text-3xl tracking-[0.08em] uppercase text-glow">
          Users
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Invite-only accounts. Create a player, give them the temporary
          password, and they can sign in to manage their character sheets.
        </p>
      </div>

      <ConsolePanel
        label="Create account"
        code="INVITE"
        brackets
        bodyClassName="p-4"
      >
        <CreateUserForm />
      </ConsolePanel>

      <ConsolePanel
        label="Roster"
        code={`USR · ${users.length}`}
        brackets
        bodyClassName="p-0"
      >
        {users.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No users listed.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
              >
                <span>
                  <span className="font-heading text-sm tracking-wide">
                    {u.name}
                  </span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {u.email}
                  </span>
                </span>
                <span className="console-label text-ochre">
                  {u.role ?? "player"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ConsolePanel>
    </div>
  )
}
