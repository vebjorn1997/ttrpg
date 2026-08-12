import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { notFound } from "next/navigation"

import { CharacterAvailableActions } from "@/components/character-available-actions"
import { CharacterDeleteButton } from "@/components/character-delete-button"
import { CharacterDetailTabs } from "@/components/character-detail-tabs"
import { ConsolePanel } from "@/components/console-panel"
import { CornerBrackets } from "@/components/corner-brackets"
import { OfflineNotice } from "@/components/offline-notice"
import { RuleText } from "@/components/rule-text"
import { SkillTooltip } from "@/components/skill-tooltip"
import { StatReadout } from "@/components/stat-readout"
import { getActions, getCharacter, getLanguages, getSkills } from "@/lib/api"
import { actionsAvailableToCharacter } from "@/lib/character-actions"
import {
  characterSkillKey,
  formatCharacterSkillLabel,
} from "@/lib/character-skills"
import { getModule } from "@/lib/modules"
import { buildRuleLinkCatalog } from "@/lib/rule-links"

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
    return { title: dataset.title }
  }
  return {
    title: `${result.data.name} · ${dataset.title}`,
    description: result.data.playerName
      ? `Sheet for ${result.data.playerName}`
      : dataset.synopsis,
  }
}

function formatPair(pair: { max: number; current: number }) {
  return pair.current === pair.max
    ? String(pair.current)
    : `${pair.current}/${pair.max}`
}

export default async function CharacterDetailPage({ params }: PageProps) {
  const { id } = await params
  const [result, actionsResult, skillsResult, languagesResult, links] =
    await Promise.all([
      getCharacter(id),
      getActions(),
      getSkills(),
      getLanguages(),
      buildRuleLinkCatalog(),
    ])

  if (!result.ok && result.error === "Character not found.") {
    notFound()
  }

  if (!result.ok || !result.data) {
    return (
      <div className="space-y-6">
        <OfflineNotice error={result.error} endpoint={`/characters/${id}`} />
      </div>
    )
  }

  const character = result.data
  const availableActions = actionsResult.ok
    ? actionsAvailableToCharacter(
        actionsResult.data,
        character.feats.map((feat) => feat.id)
      )
    : []

  const skillDescriptionByName = new Map(
    (skillsResult.data ?? [])
      .filter((skill) => skill.description?.trim())
      .map((skill) => [skill.name, skill.description!.trim()] as const)
  )
  const languageDescriptionByName = new Map(
    (languagesResult.data ?? [])
      .filter((language) => language.description?.trim())
      .map(
        (language) =>
          [language.name.trim().toLowerCase(), language.description!.trim()] as const
      )
  )

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
          <span className="text-ochre truncate">{character.name}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-wide uppercase sm:text-3xl">
              {character.name}
            </h1>
            {character.playerName && (
              <p className="mt-1 console-label text-muted-foreground">
                Player · {character.playerName}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/characters/${character.id}/edit`}
              className="console-label inline-flex items-center gap-1.5 border border-ochre/50 bg-ochre/10 px-3 py-1.5 text-ochre transition-colors hover:bg-ochre/20"
            >
              Edit sheet
            </Link>
            <Link
              href="/characters"
              className="console-label inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-ochre"
            >
              All sheets
            </Link>
            <CharacterDeleteButton
              characterId={character.id}
              characterName={character.name}
            />
          </div>
        </div>
      </section>

      <CharacterDetailTabs
        actionCount={availableActions.length}
        sheet={
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <ConsolePanel label="Characteristics" code="PHYS" accent="ochre">
                <div className="space-y-2">
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
                  <div className="my-3 border-t border-hairline" />
                  <StatReadout label="INT" value={String(character.int)} />
                  <StatReadout label="SOC" value={String(character.soc)} />
                  <StatReadout label="EDU" value={String(character.edu)} />
                </div>
              </ConsolePanel>

              <ConsolePanel
                label="Combat profile"
                code="LOADOUT"
                accent="signal"
              >
                <div className="space-y-2">
                  <StatReadout
                    label="Movement"
                    value={
                      character.movement ? `${character.movement} m` : "—"
                    }
                  />
                  <StatReadout
                    label="Armour"
                    value={String(character.armor.total)}
                    emphasis
                  />
                  <StatReadout
                    label="Bottom"
                    value={character.armor.bottom ?? "—"}
                  />
                  <StatReadout
                    label="Top"
                    value={character.armor.top ?? "—"}
                  />
                  <StatReadout
                    label="Outer"
                    value={character.armor.outer ?? "—"}
                  />
                  <StatReadout
                    label="Credits"
                    value={`${character.credits.toLocaleString()} Cr`}
                  />
                </div>
              </ConsolePanel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ConsolePanel label="Skills" code="SKL">
                {character.skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No skills recorded.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {character.skills.map((skill) => {
                      const label = formatCharacterSkillLabel(skill)
                      const description =
                        (skill.language &&
                          languageDescriptionByName.get(
                            skill.language.trim().toLowerCase()
                          )) ||
                        skillDescriptionByName.get(skill.name)

                      return (
                        <li key={characterSkillKey(skill)}>
                          <SkillTooltip
                            name={label}
                            description={description}
                          >
                            <div className="cursor-help">
                              <StatReadout
                                label={label}
                                value={String(skill.level)}
                              />
                            </div>
                          </SkillTooltip>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </ConsolePanel>

              <ConsolePanel label="Feats" code="FTS">
                {character.feats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No feats linked.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {character.feats.map((feat) => (
                      <li key={feat.id}>
                        <p className="font-heading text-sm tracking-wide uppercase">
                          {feat.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {feat.type}
                          {feat.prerequisites
                            ? ` · ${feat.prerequisites}`
                            : ""}
                        </p>
                        {feat.description ? (
                          <RuleText
                            text={feat.description}
                            className="mt-1.5 text-sm leading-relaxed text-foreground/75"
                            links={links}
                            skipTitle={feat.name}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </ConsolePanel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ConsolePanel label="Weapons" code="WPN">
                {character.weapons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None listed.</p>
                ) : (
                  <ul className="space-y-1 font-mono text-sm">
                    {character.weapons.map((weapon) => (
                      <li key={weapon}>{weapon}</li>
                    ))}
                  </ul>
                )}
              </ConsolePanel>

              <ConsolePanel label="Equipment" code="EQP">
                {character.equipment.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None listed.</p>
                ) : (
                  <ul className="space-y-1 font-mono text-sm">
                    {character.equipment.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </ConsolePanel>
            </div>

            {(character.conditions.length > 0 ||
              character.criticalInjuries.length > 0) && (
              <div className="grid gap-4 lg:grid-cols-2">
                {character.conditions.length > 0 && (
                  <ConsolePanel label="Conditions" code="CND" accent="signal">
                    <ul className="space-y-2">
                      {character.conditions.map((condition) => (
                        <li key={condition.id}>
                          <p className="font-heading text-sm tracking-wide uppercase">
                            {condition.name}
                            {condition.value != null
                              ? ` ${condition.value}`
                              : ""}
                          </p>
                          <RuleText
                            text={condition.description}
                            className="mt-0.5 text-xs text-muted-foreground"
                            links={links}
                            skipTitle={condition.name}
                          />
                        </li>
                      ))}
                    </ul>
                  </ConsolePanel>
                )}
                {character.criticalInjuries.length > 0 && (
                  <ConsolePanel
                    label="Critical injuries"
                    code="CRT"
                    accent="oxide"
                  >
                    <ul className="space-y-2">
                      {character.criticalInjuries.map((injury) => (
                        <li key={injury.id}>
                          <p className="font-heading text-sm tracking-wide uppercase text-oxide">
                            {injury.name}
                          </p>
                          <p className="mt-0.5 console-label text-muted-foreground">
                            {injury.characteristic}
                            {injury.notes ? ` · ${injury.notes}` : ""}
                          </p>
                          <RuleText
                            text={injury.description}
                            className="mt-1 text-xs text-muted-foreground"
                            links={links}
                            skipTitle={injury.name}
                          />
                        </li>
                      ))}
                    </ul>
                  </ConsolePanel>
                )}
              </div>
            )}

            {character.notes && (
              <ConsolePanel label="Notes" code="LOG">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                  {character.notes}
                </p>
              </ConsolePanel>
            )}
          </>
        }
        actions={
          <CharacterAvailableActions
            actions={availableActions}
            error={actionsResult.error}
            links={links}
          />
        }
      />
    </div>
  )
}
