"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/characters"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const result = await authClient.signIn.email({
      email: email.trim(),
      password,
    })

    setPending(false)

    if (result.error) {
      setError(result.error.message || "Sign-in failed.")
      return
    }

    router.replace(next.startsWith("/") ? next : "/characters")
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="console-label text-muted-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-none"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="console-label text-muted-foreground"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-none"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-oxide">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="w-full rounded-none"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
