"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/session"

export type CreateUserState = {
  error: string | null
  success: string | null
}

export async function createInviteUserAction(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await requireAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const roleRaw = String(formData.get("role") ?? "player")
  const role = roleRaw === "admin" ? "admin" : "player"

  if (!name) return { error: "Name is required.", success: null }
  if (!email) return { error: "Email is required.", success: null }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", success: null }
  }

  try {
    await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role,
      },
      headers: await headers(),
    })
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Could not create user."
    return { error: message, success: null }
  }

  revalidatePath("/admin/users")
  return {
    error: null,
    success: `Created ${role} account for ${email}.`,
  }
}
