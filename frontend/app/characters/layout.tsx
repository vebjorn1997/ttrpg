import { requireUser } from "@/lib/session"

export default async function CharactersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireUser()
  return children
}
