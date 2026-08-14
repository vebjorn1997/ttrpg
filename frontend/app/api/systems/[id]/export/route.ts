import { exportSystem } from "@/lib/api"
import { getCurrentUser } from "@/lib/session"

/** Single-system JSON download, including relationships the viewer may see. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getCurrentUser()
  if (user?.role !== "admin") {
    return new Response("Game Master access required.", { status: 403 })
  }

  const result = await exportSystem(id)
  if (!result.ok) {
    return new Response(result.error, { status: 502 })
  }

  const record = result.data as { name?: unknown }
  const slug =
    typeof record.name === "string" && record.name.trim()
      ? record.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : id

  return new Response(JSON.stringify(result.data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="system-${slug}.json"`,
    },
  })
}
