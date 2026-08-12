import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export type AppRole = "admin" | "player"

export type AppUser = {
  id: string
  name: string
  email: string
  role: AppRole
}

function normalizeRole(role: string | null | undefined): AppRole {
  return role === "admin" ? "admin" : "player"
}

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getSession()
  if (!session?.user) return null
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: normalizeRole(
      "role" in session.user ? (session.user.role as string | undefined) : undefined
    ),
  }
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser()
  if (user.role !== "admin") redirect("/")
  return user
}
