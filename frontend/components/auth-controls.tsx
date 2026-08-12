"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function AuthControls() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <span className="console-label text-muted-foreground">…</span>
    )
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="console-label border border-transparent px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-hairline hover:text-foreground"
      >
        Sign in
      </Link>
    )
  }

  const role =
    "role" in session.user && typeof session.user.role === "string"
      ? session.user.role
      : "player"

  async function signOut() {
    await authClient.signOut()
    router.refresh()
    router.push("/")
  }

  return (
    <div className="flex items-center gap-2">
      {role === "admin" ? (
        <Link
          href="/admin/users"
          className="console-label border border-transparent px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-hairline hover:text-foreground"
        >
          Users
        </Link>
      ) : null}
      <span className="console-label hidden max-w-[10rem] truncate text-muted-foreground sm:inline">
        {session.user.name}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-none"
        onClick={() => void signOut()}
      >
        Sign out
      </Button>
    </div>
  )
}
