import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { CharacterCreateForm } from "@/components/character-create-form"
import { ConsolePanel } from "@/components/console-panel"
import { CornerBrackets } from "@/components/corner-brackets"
import { getFeats, getSkills } from "@/lib/api"
import { getModule } from "@/lib/modules"

const dataset = getModule("characters")

export const metadata: Metadata = {
  title: `New · ${dataset.title}`,
  description: "File a new player character sheet.",
}

export default async function NewCharacterPage() {
  const [skillsResult, featsResult] = await Promise.all([
    getSkills(),
    getFeats(),
  ])

  return (
    <div className="space-y-6">
      <section className="relative border border-hairline bg-card/50 p-5 sm:p-6">
        <CornerBrackets />
        <nav
          aria-label="Breadcrumb"
          className="console-label flex items-center gap-1.5 text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-ochre">
            Field manual
          </Link>
          <ChevronRight aria-hidden className="size-3" />
          <Link
            href="/characters"
            className="transition-colors hover:text-ochre"
          >
            {dataset.code}
          </Link>
          <ChevronRight aria-hidden className="size-3" />
          <span className="text-ochre">NEW</span>
        </nav>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-wide uppercase sm:text-3xl">
          New character sheet
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/75">
          Fill the Sheet tab first, then switch to Feats to pick options unlocked
          by your skills.
        </p>
      </section>

      <ConsolePanel label="Sheet intake" code="CHR · CREATE" brackets>
        <CharacterCreateForm
          skills={skillsResult.data ?? []}
          skillsError={skillsResult.error}
          feats={featsResult.data ?? []}
          featsError={featsResult.error}
        />
      </ConsolePanel>
    </div>
  )
}
