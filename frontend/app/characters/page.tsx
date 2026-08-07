import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { OfflineNotice } from "@/components/offline-notice"
import { PageHeader } from "@/components/page-header"
import { StatReadout } from "@/components/stat-readout"
import { getCharacters } from "@/lib/api"
import { accentClasses, getModule } from "@/lib/modules"
import { cn } from "@/lib/utils"

const dataset = getModule("characters")
const tone = accentClasses[dataset.accent]

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

function formatPair(pair: { max: number; current: number }) {
  return pair.current === pair.max
    ? String(pair.current)
    : `${pair.current}/${pair.max}`
}

export default async function CharactersPage() {
  const result = await getCharacters()
  const characters = result.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader module={dataset} count={result.ok ? characters.length : null} />

      <div className="flex justify-end">
        <Link
          href="/characters/new"
          className={cn(
            "inline-flex items-center gap-2 border px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase transition-colors",
            tone.border,
            tone.bg,
            tone.text,
            "hover:bg-ochre/20"
          )}
        >
          <Plus aria-hidden className="size-3.5" />
          New sheet
        </Link>
      </div>

      {result.error ? (
        <OfflineNotice error={result.error} endpoint={dataset.endpoint} />
      ) : characters.length === 0 ? (
        <div className="border border-dashed border-hairline bg-card/40 px-6 py-12 text-center">
          <p className="font-heading text-lg tracking-wide uppercase">
            No sheets filed
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a character sheet to track characteristics, skills and gear
            for the table.
          </p>
          <Link
            href="/characters/new"
            className="mt-5 inline-flex items-center gap-2 border border-ochre/45 bg-ochre/10 px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase text-ochre transition-colors hover:bg-ochre/20"
          >
            <Plus aria-hidden className="size-3.5" />
            Create first sheet
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {characters.map((character) => (
            <li key={character.id}>
              <Link
                href={`/characters/${character.id}`}
                className="group block border border-hairline bg-card/60 p-4 transition-colors hover:border-ochre/50 hover:bg-ochre/5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-heading text-lg tracking-wide uppercase group-hover:text-ochre">
                    {character.name}
                  </h2>
                  <span className="console-label text-muted-foreground">
                    Armour {character.armorTotal}
                  </span>
                </div>
                {character.playerName && (
                  <p className="mt-1 console-label text-muted-foreground">
                    Player · {character.playerName}
                  </p>
                )}
                <div className="mt-4 grid gap-1.5 sm:grid-cols-3">
                  <StatReadout
                    label="STR"
                    value={formatPair(character.str)}
                    emphasis={character.str.current === 0}
                  />
                  <StatReadout
                    label="DEX"
                    value={formatPair(character.dex)}
                    emphasis={character.dex.current === 0}
                  />
                  <StatReadout
                    label="END"
                    value={formatPair(character.end)}
                    emphasis={character.end.current === 0}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
