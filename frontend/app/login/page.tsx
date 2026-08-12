import { Suspense } from "react"

import { ConsolePanel } from "@/components/console-panel"
import { LoginForm } from "@/components/login-form"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Sign in",
}

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect("/characters")

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="console-label text-ochre">Access control</p>
        <h1 className="mt-2 font-heading text-3xl tracking-[0.08em] uppercase text-glow">
          Sign in
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Accounts are invite-only. Ask your GM if you need credentials.
        </p>
      </div>

      <ConsolePanel label="Credentials" code="AUTH" brackets bodyClassName="p-4">
        <Suspense fallback={<p className="console-label">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </ConsolePanel>
    </div>
  )
}
