import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements } from "better-auth/plugins/admin/access"

const ac = createAccessControl(defaultStatements)

const player = ac.newRole({
  user: [],
  session: [],
})

const adminRole = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
})

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        player,
        admin: adminRole,
      },
    }),
  ],
})
