import { requireAdmin } from "@/lib/session"

export default async function NpcsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  return children
}
