import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { notFound } from "next/navigation"

import { CharacterEditForm } from "@/components/character-edit-form"
import { ConsolePanel } from "@/components/console-panel"
import { CornerBrackets } from "@/components/corner-brackets"
import { OfflineNotice } from "@/components/offline-notice"
import { getCharacter, getFeats, getLanguages, getSkills } from "@/lib/api"
import { getModule } from "@/lib/modules"

const dataset = getModule("characters")

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getCharacter(id)
  if (!result.ok) {
    return { title: `Edit · ${dataset.title}` }
  }
  return {
    title: `Edit · ${result.data.name}`,
    description: `Update ${result.data.name}'s sheet.`,
  }
}

export default async function EditCharacterPage({ params }: PageProps) {
  const { id } = await params
  const [characterResult, skillsResult, languagesResult, featsResult] =
    await Promise.all([
      getCharacter(id),
      getSkills(),
      getLanguages(),
      getFeats(),
    ])

  if (
    !characterResult.ok &&
    characterResult.error === "Character not found."
  ) {
    notFound()
  }

  if (!characterResult.ok || !characterResult.data) {
    return (
      <div className="space-y-6">
        <OfflineNotice
          error={characterResult.error}
          endpoint={`/characters/${id}`}
        />
      </div>
    )
  }

  const character = characterResult.data

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
          <Link
            href={`/characters/${character.id}`}
            className="truncate transition-colors hover:text-ochre"
          >
            {character.name}
          </Link>
          <ChevronRight aria-hidden className="size-3" />
          <span className="text-ochre">EDIT</span>
        </nav>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-wide uppercase sm:text-3xl">
          Edit character sheet
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/75">
          Update name, physical maxes, skills, and feats. Available actions on
          the sheet refresh from the feats you keep.
        </p>
      </section>

      <ConsolePanel label="Sheet amend" code="CHR · EDIT" brackets>
        <CharacterEditForm
          character={character}
          skills={skillsResult.data ?? []}
          skillsError={skillsResult.error}
          languages={languagesResult.data ?? []}
          languagesError={languagesResult.error}
          feats={featsResult.data ?? []}
          featsError={featsResult.error}
        />
      </ConsolePanel>
    </div>
  )
}
