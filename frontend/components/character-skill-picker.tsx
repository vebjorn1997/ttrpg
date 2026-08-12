"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SkillTooltip } from "@/components/skill-tooltip"
import type { CharacterSkill, Language, Skill } from "@/lib/api-types"
import {
  characterSkillKey,
  formatCharacterSkillLabel,
  isLanguageSkill,
} from "@/lib/character-skills"
import { cn } from "@/lib/utils"

const fieldClass =
  "rounded-none border-hairline bg-background/50 font-mono text-sm focus-visible:border-ochre focus-visible:ring-ochre/30"

const labelClass = "console-label text-muted-foreground"

type CharacterSkillPickerProps = {
  catalog: Skill[]
  languages?: Language[]
  languagesError?: string | null
  error?: string | null
  onChange?: (skills: CharacterSkill[]) => void
  initialSkills?: CharacterSkill[]
}

/** Pick catalog skills + levels for character intake; submits as paired form fields. */
export function CharacterSkillPicker({
  catalog,
  languages = [],
  languagesError = null,
  error,
  onChange,
  initialSkills = [],
}: CharacterSkillPickerProps) {
  const [picked, setPicked] = useState<CharacterSkill[]>(() =>
    [...initialSkills].sort((a, b) =>
      formatCharacterSkillLabel(a).localeCompare(formatCharacterSkillLabel(b))
    )
  )
  const [pendingName, setPendingName] = useState("")
  const [pendingLanguage, setPendingLanguage] = useState("")
  const [pendingLevel, setPendingLevel] = useState(0)

  function commit(next: CharacterSkill[]) {
    setPicked(next)
    onChange?.(next)
  }

  const grouped = useMemo(() => {
    const byChar = new Map<string, Skill[]>()
    for (const skill of catalog) {
      const key = skill.primaryCharacteristic.toUpperCase()
      const list = byChar.get(key) ?? []
      list.push(skill)
      byChar.set(key, list)
    }
    return [...byChar.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [catalog])

  const takenLanguages = useMemo(() => {
    return new Set(
      picked
        .filter((skill) => isLanguageSkill(skill.name) && skill.language?.trim())
        .map((skill) => skill.language!.trim().toLowerCase())
    )
  }, [picked])

  const availableLanguages = useMemo(() => {
    return languages.filter(
      (language) => !takenLanguages.has(language.name.trim().toLowerCase())
    )
  }, [languages, takenLanguages])

  const available = useMemo(() => {
    const takenNames = new Set(
      picked
        .filter((skill) => !isLanguageSkill(skill.name))
        .map((skill) => skill.name.trim().toLowerCase())
    )

    return catalog.filter((skill) => {
      if (isLanguageSkill(skill.name)) {
        return availableLanguages.length > 0
      }
      return !takenNames.has(skill.name.trim().toLowerCase())
    })
  }, [catalog, picked, availableLanguages.length])

  const descriptionByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const skill of catalog) {
      if (skill.description?.trim()) {
        map.set(skill.name, skill.description.trim())
      }
    }
    return map
  }, [catalog])

  const languageDescriptionByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const language of languages) {
      if (language.description?.trim()) {
        map.set(language.name.trim().toLowerCase(), language.description.trim())
      }
    }
    return map
  }, [languages])

  const pendingNeedsLanguage = isLanguageSkill(pendingName)

  function setSkillName(name: string) {
    setPendingName(name)
    if (!isLanguageSkill(name)) {
      setPendingLanguage("")
    }
  }

  function addSkill() {
    if (!pendingName) return
    const level =
      Number.isInteger(pendingLevel) && pendingLevel >= 0 ? pendingLevel : 0

    if (isLanguageSkill(pendingName)) {
      if (!pendingLanguage) return
      const next: CharacterSkill = {
        name: pendingName,
        level,
        language: pendingLanguage,
      }
      if (picked.some((skill) => characterSkillKey(skill) === characterSkillKey(next))) {
        return
      }
      commit(
        [...picked, next].sort((a, b) =>
          formatCharacterSkillLabel(a).localeCompare(formatCharacterSkillLabel(b))
        )
      )
      setPendingName("")
      setPendingLanguage("")
      setPendingLevel(0)
      return
    }

    if (picked.some((skill) => characterSkillKey(skill) === pendingName.trim().toLowerCase())) {
      return
    }

    commit(
      [...picked, { name: pendingName, level }].sort((a, b) =>
        formatCharacterSkillLabel(a).localeCompare(formatCharacterSkillLabel(b))
      )
    )
    setPendingName("")
    setPendingLevel(0)
  }

  function updateLevel(key: string, level: number) {
    commit(
      picked.map((skill) =>
        characterSkillKey(skill) === key
          ? { ...skill, level: Number.isFinite(level) && level >= 0 ? level : 0 }
          : skill
      )
    )
  }

  function removeSkill(key: string) {
    commit(picked.filter((skill) => characterSkillKey(skill) !== key))
  }

  const canAdd =
    Boolean(pendingName) && (!pendingNeedsLanguage || Boolean(pendingLanguage))

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className={labelClass}>Skills</p>
        {picked.length > 0 && (
          <span className="console-label text-muted-foreground/70">
            {picked.length} selected
          </span>
        )}
      </div>

      {error ? (
        <p className="border border-oxide/40 bg-oxide/10 px-3 py-2 text-sm text-oxide">
          Skill catalog unavailable ({error}). You can still save skills already
          on the sheet.
        </p>
      ) : catalog.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No skills in the catalog yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[12rem]">
            <span className={labelClass}>Add from catalog</span>
            <select
              value={pendingName}
              onChange={(event) => setSkillName(event.target.value)}
              className={cn(
                fieldClass,
                "h-8 w-full px-2.5 outline-none focus-visible:ring-3"
              )}
            >
              <option value="">Select a skill…</option>
              {grouped.map(([characteristic, skills]) => {
                const options = skills.filter((skill) =>
                  available.some((row) => row.name === skill.name)
                )
                if (options.length === 0) return null
                return (
                  <optgroup key={characteristic} label={characteristic}>
                    {options.map((skill) => (
                      <option key={skill.id} value={skill.name}>
                        {skill.name}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </label>

          {pendingNeedsLanguage && (
            <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[10rem]">
              <span className={labelClass}>Language</span>
              {languagesError ? (
                <p className="border border-oxide/40 bg-oxide/10 px-2 py-1.5 text-xs text-oxide">
                  Languages unavailable ({languagesError}).
                </p>
              ) : availableLanguages.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No unused languages left in the catalog.
                </p>
              ) : (
                <select
                  value={pendingLanguage}
                  onChange={(event) => setPendingLanguage(event.target.value)}
                  className={cn(
                    fieldClass,
                    "h-8 w-full px-2.5 outline-none focus-visible:ring-3"
                  )}
                >
                  <option value="">Select a language…</option>
                  {availableLanguages.map((language) => (
                    <option key={language.id} value={language.name}>
                      {language.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
          )}

          <label className="flex w-full flex-col gap-1.5 sm:w-24">
            <span className={labelClass}>Level</span>
            <Input
              type="number"
              min={0}
              value={pendingLevel}
              onChange={(event) => setPendingLevel(Number(event.target.value))}
              className={fieldClass}
            />
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canAdd}
            onClick={addSkill}
            className="rounded-none border-hairline font-heading tracking-[0.12em] uppercase"
          >
            <Plus aria-hidden />
            Add
          </Button>
        </div>
      )}

      {picked.length > 0 && (
        <ul className="divide-y divide-hairline border border-hairline bg-background/30">
          {picked.map((skill) => {
            const key = characterSkillKey(skill)
            const label = formatCharacterSkillLabel(skill)
            const description =
              (skill.language &&
                languageDescriptionByName.get(
                  skill.language.trim().toLowerCase()
                )) ||
              descriptionByName.get(skill.name)

            return (
              <li key={key} className="flex items-center gap-3 px-3 py-2">
                <SkillTooltip
                  name={label}
                  description={description}
                  className="min-w-0 flex-1"
                >
                  <span className="cursor-help font-heading text-sm tracking-wide">
                    {label}
                  </span>
                </SkillTooltip>
                <label className="flex items-center gap-2">
                  <span className={labelClass}>Lvl</span>
                  <Input
                    type="number"
                    min={0}
                    name="skillLevel"
                    value={skill.level}
                    onChange={(event) =>
                      updateLevel(key, Number(event.target.value))
                    }
                    className={cn(fieldClass, "w-16")}
                  />
                </label>
                <input type="hidden" name="skillName" value={skill.name} />
                <input
                  type="hidden"
                  name="skillLanguage"
                  value={skill.language ?? ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${label}`}
                  onClick={() => removeSkill(key)}
                  className="rounded-none text-muted-foreground hover:text-oxide"
                >
                  <X aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
