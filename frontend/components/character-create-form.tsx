"use client"

import { useActionState, useState, type ReactNode } from "react"
import Link from "next/link"

import {
  createCharacterAction,
  type CreateCharacterState,
} from "@/app/characters/actions"
import { CharacterFeatPicker } from "@/components/character-feat-picker"
import { CharacterEquipmentPicker } from "@/components/character-equipment-picker"
import { CharacterSkillPicker } from "@/components/character-skill-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CharacterSkill, Equipment, Feat, Language, Skill } from "@/lib/api-types"
import { pruneInvalidFeats } from "@/lib/prune-feats"
import { cn } from "@/lib/utils"

const fieldClass =
  "rounded-none border-hairline bg-background/50 font-mono text-sm focus-visible:border-ochre focus-visible:ring-ochre/30"

const labelClass = "console-label text-muted-foreground"

const initialState: CreateCharacterState = { error: null }

const DEFAULT_STARTING_SKILLS: CharacterSkill[] = [
  { name: "Language", level: 1, language: "Common" },
]

type IntakeTab = "sheet" | "feats" | "equipment"

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function CharPair({
  code,
  maxName,
  currentName,
  defaultMax = 7,
}: {
  code: string
  maxName: string
  currentName: string
  defaultMax?: number
}) {
  return (
    <div className="border border-hairline bg-background/30 p-3">
      <p className="console-label mb-2 text-ochre">{code}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Max</span>
          <Input
            name={maxName}
            type="number"
            min={0}
            defaultValue={defaultMax}
            required
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Current</span>
          <Input
            name={currentName}
            type="number"
            min={0}
            defaultValue={defaultMax}
            required
            className={fieldClass}
          />
        </label>
      </div>
    </div>
  )
}

export function CharacterCreateForm({
  playerName,
  skills = [],
  skillsError = null,
  languages = [],
  languagesError = null,
  feats = [],
  featsError = null,
  equipmentCatalog = [],
  equipmentError = null,
}: {
  playerName: string
  skills?: Skill[]
  skillsError?: string | null
  languages?: Language[]
  languagesError?: string | null
  feats?: Feat[]
  featsError?: string | null
  equipmentCatalog?: Equipment[]
  equipmentError?: string | null
}) {
  const [state, formAction, pending] = useActionState(
    createCharacterAction,
    initialState
  )
  const [tab, setTab] = useState<IntakeTab>("sheet")
  const [pickedSkills, setPickedSkills] = useState<CharacterSkill[]>(
    DEFAULT_STARTING_SKILLS
  )
  const [selectedFeatIds, setSelectedFeatIds] = useState<string[]>([])
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    []
  )

  function handleSkillsChange(nextSkills: CharacterSkill[]) {
    setPickedSkills(nextSkills)
    setSelectedFeatIds((current) => pruneInvalidFeats(current, feats, nextSkills))
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p
          role="alert"
          className="border border-oxide/50 bg-oxide/10 px-3 py-2 font-mono text-sm text-oxide"
        >
          {state.error}
        </p>
      )}

      <div
        role="tablist"
        aria-label="Character sheet sections"
        className="flex border-b border-hairline"
      >
        {(
          [
            ["sheet", "Sheet"] as const,
            ["feats", "Feats"] as const,
            ["equipment", "Emporium"] as const,
          ] as const
        ).map(([id, label]) => {
          const active = tab === id
          const badge =
            id === "feats" && selectedFeatIds.length > 0
              ? String(selectedFeatIds.length)
              : id === "equipment" && selectedEquipmentIds.length > 0
                ? String(selectedEquipmentIds.length)
                : null
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              id={`intake-tab-${id}`}
              aria-controls={`intake-panel-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                "console-label relative -mb-px border-b-2 px-4 py-2.5 tracking-[0.14em] transition-colors",
                active
                  ? "border-ochre text-ochre"
                  : "border-transparent text-muted-foreground hover:text-foreground/80"
              )}
            >
              {label}
              {badge ? (
                <span className="ml-2 font-mono text-[0.65rem] text-muted-foreground">
                  {badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Keep both panels mounted so form fields submit from either tab. */}
      <div
        role="tabpanel"
        id="intake-panel-sheet"
        aria-labelledby="intake-tab-sheet"
        hidden={tab !== "sheet"}
        className="space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Character name">
            <Input
              name="name"
              required
              placeholder="Mara Voss"
              className={fieldClass}
            />
          </Field>
          <Field label="Player">
            <Input
              name="playerName"
              value={playerName}
              readOnly
              className={cn(fieldClass, "text-muted-foreground")}
            />
          </Field>
        </div>

        <div>
          <p className="console-label mb-2 text-muted-foreground">
            Physical characteristics
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <CharPair code="STR" maxName="strMax" currentName="strCurrent" />
            <CharPair code="DEX" maxName="dexMax" currentName="dexCurrent" />
            <CharPair code="END" maxName="endMax" currentName="endCurrent" />
          </div>
        </div>

        <div>
          <p className="console-label mb-2 text-muted-foreground">
            Mental / social
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["INT", "int"],
                ["SOC", "soc"],
                ["EDU", "edu"],
              ] as const
            ).map(([code, name]) => (
              <Field key={name} label={code}>
                <Input
                  name={name}
                  type="number"
                  min={0}
                  defaultValue={7}
                  className={fieldClass}
                />
              </Field>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Movement">
            <Input
              name="movement"
              placeholder="9"
              className={fieldClass}
            />
          </Field>
          <Field label="Credits">
            <Input
              name="credits"
              type="number"
              min={0}
              defaultValue={0}
              className={fieldClass}
            />
          </Field>
        </div>

        <div>
          <p className="console-label mb-2 text-muted-foreground">Armour</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Total">
              <Input
                name="armorTotal"
                type="number"
                min={0}
                defaultValue={0}
                className={fieldClass}
              />
            </Field>
            <Field label="Bottom layer">
              <Input
                name="armorBottom"
                placeholder="Armored Clothing"
                className={fieldClass}
              />
            </Field>
            <Field label="Top layer">
              <Input
                name="armorTop"
                placeholder="Flak Armor"
                className={fieldClass}
              />
            </Field>
            <Field label="Outer layer">
              <Input
                name="armorOuter"
                placeholder="Vac Suit Mk. I"
                className={fieldClass}
              />
            </Field>
          </div>
        </div>

        <CharacterSkillPicker
          catalog={skills}
          error={skillsError}
          languages={languages}
          languagesError={languagesError}
          initialSkills={DEFAULT_STARTING_SKILLS}
          onChange={handleSkillsChange}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Weapons (comma or line separated)">
            <textarea
              name="weapons"
              rows={3}
              placeholder={"VK 2\nDagger"}
              className={cn(
                fieldClass,
                "min-h-20 w-full resize-y px-2.5 py-2 outline-none focus-visible:ring-3"
              )}
            />
          </Field>
          <Field label="Equipment (comma or line separated)">
            <textarea
              name="equipment"
              rows={3}
              placeholder={"Medical Kit\nCombat Stims"}
              className={cn(
                fieldClass,
                "min-h-20 w-full resize-y px-2.5 py-2 outline-none focus-visible:ring-3"
              )}
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            name="notes"
            rows={3}
            className={cn(
              fieldClass,
              "min-h-20 w-full resize-y px-2.5 py-2 outline-none focus-visible:ring-3"
            )}
          />
        </Field>
      </div>

      <div
        role="tabpanel"
        id="intake-panel-feats"
        aria-labelledby="intake-tab-feats"
        hidden={tab !== "feats"}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Feats unlock from the skills on the Sheet tab. Locked entries stay
          greyed out until prerequisites are met.
        </p>
        <CharacterFeatPicker
          catalog={feats}
          skills={pickedSkills}
          selectedIds={selectedFeatIds}
          onChange={setSelectedFeatIds}
          error={featsError}
        />
      </div>

      <div
        role="tabpanel"
        id="intake-panel-equipment"
        aria-labelledby="intake-tab-equipment"
        hidden={tab !== "equipment"}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Lift wares from the Black Market Emporium. Listings are grouped by
          type.
        </p>
        <CharacterEquipmentPicker
          catalog={equipmentCatalog}
          selectedIds={selectedEquipmentIds}
          onChange={setSelectedEquipmentIds}
          error={equipmentError}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <Button
          type="submit"
          disabled={pending}
          className="rounded-none border border-ochre/50 bg-ochre/15 font-heading tracking-[0.12em] uppercase text-ochre hover:bg-ochre/25"
        >
          {pending ? "Filing…" : "Create sheet"}
        </Button>
        <Link
          href="/characters"
          className="console-label text-muted-foreground transition-colors hover:text-ochre"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
