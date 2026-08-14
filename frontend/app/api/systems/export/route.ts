import { exportSystems } from "@/lib/api"
import { getCurrentUser } from "@/lib/session"

/**
 * Streams the whole systems database as a JSON download. Proxied through the
 * app rather than linked straight at the backend so the viewer's identity
 * headers travel with the request and GM-only notes are included for GMs.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") {
    return new Response("Game Master access required.", { status: 403 })
  }

  const result = await exportSystems()
  if (!result.ok) {
    return new Response(result.error, { status: 502 })
  }

  const stamp = new Date().toISOString().slice(0, 10)

  return new Response(JSON.stringify(result.data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="systems-${stamp}.json"`,
    },
  })
}
