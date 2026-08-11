"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Skill } from "@/lib/api"
import { cn } from "@/lib/utils"

const fieldClass =
  "rounded-none border-hairline bg-background/50 font-mono text-sm focus-visible:border-ochre focus-visible:ring-ochre/30"

const labelClass = "console-label text-muted-foreground"

type PickedSkill = {
  name: string
  level: number
}

type CharacterSkillPickerProps = {
  catalog: Skill[]
  error?: string | null
  onChange?: (skills: PickedSkill[]) => void
  initialSkills?: PickedSkill[]
}

/** Pick catalog skills + levels for character intake; submits as paired form fields. */
export function CharacterSkillPicker({
  catalog,
  error,
  onChange,
  initialSkills = [],
}: CharacterSkillPickerProps) {
  const [picked, setPicked] = useState<PickedSkill[]>(() =>
    [...initialSkills].sort((a, b) => a.name.localeCompare(b.name))
  )
  const [pendingName, setPendingName] = useState("")
  const [pendingLevel, setPendingLevel] = useState(0)

  function commit(next: PickedSkill[]) {
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

  const available = useMemo(() => {
    const taken = new Set(picked.map((skill) => skill.name))
    return catalog.filter((skill) => !taken.has(skill.name))
  }, [catalog, picked])

  function addSkill() {
    if (!pendingName) return
    const level = Number.isInteger(pendingLevel) && pendingLevel >= 0
      ? pendingLevel
      : 0
    if (picked.some((skill) => skill.name === pendingName)) return
    commit(
      [...picked, { name: pendingName, level }].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    )
    setPendingName("")
    setPendingLevel(0)
  }

  function updateLevel(name: string, level: number) {
    commit(
      picked.map((skill) =>
        skill.name === name
          ? { ...skill, level: Number.isFinite(level) && level >= 0 ? level : 0 }
          : skill
      )
    )
  }

  function removeSkill(name: string) {
    commit(picked.filter((skill) => skill.name !== name))
  }

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={labelClass}>Add from catalog</span>
            <select
              value={pendingName}
              onChange={(event) => setPendingName(event.target.value)}
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
            disabled={!pendingName}
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
          {picked.map((skill) => (
            <li
              key={skill.name}
              className="flex items-center gap-3 px-3 py-2"
            >
              <span className="min-w-0 flex-1 font-heading text-sm tracking-wide">
                {skill.name}
              </span>
              <label className="flex items-center gap-2">
                <span className={labelClass}>Lvl</span>
                <Input
                  type="number"
                  min={0}
                  name="skillLevel"
                  value={skill.level}
                  onChange={(event) =>
                    updateLevel(skill.name, Number(event.target.value))
                  }
                  className={cn(fieldClass, "w-16")}
                />
              </label>
              <input type="hidden" name="skillName" value={skill.name} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${skill.name}`}
                onClick={() => removeSkill(skill.name)}
                className="rounded-none text-muted-foreground hover:text-oxide"
              >
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
