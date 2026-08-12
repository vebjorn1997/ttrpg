import "server-only"

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins"
import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements } from "better-auth/plugins/admin/access"

import { db } from "@/lib/db"
import * as schema from "@/lib/auth-schema"

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

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [
    admin({
      ac,
      roles: {
        player,
        admin: adminRole,
      },
      defaultRole: "player",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
