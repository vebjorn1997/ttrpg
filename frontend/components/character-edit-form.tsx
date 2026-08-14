"use client"

import { useActionState, useState, type ReactNode } from "react"
import Link from "next/link"

import {
  updateCharacterAction,
  type UpdateCharacterState,
} from "@/app/characters/actions"
import { CharacterFeatPicker } from "@/components/character-feat-picker"
import {
  CharacterEquipmentPicker,
  equipmentQuantityTotal,
  type EquipmentQuantities,
} from "@/components/character-equipment-picker"
import { CharacterSkillPicker } from "@/components/character-skill-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type {
  CharacterDetail,
  CharacterSkill,
  Equipment,
  Feat,
  Language,
  Skill,
} from "@/lib/api-types"
import { pruneInvalidFeats } from "@/lib/prune-feats"
import { cn } from "@/lib/utils"

const fieldClass =
  "rounded-none border-hairline bg-background/50 font-mono text-sm focus-visible:border-ochre focus-visible:ring-ochre/30"

const labelClass = "console-label text-muted-foreground"

const initialState: UpdateCharacterState = { error: null }

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

function MaxStat({
  code,
  name,
  defaultMax,
  current,
}: {
  code: string
  name: string
  defaultMax: number
  current: number
}) {
  return (
    <div className="border border-hairline bg-background/30 p-3">
      <p className="console-label mb-2 text-ochre">{code}</p>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Max</span>
        <Input
          name={name}
          type="number"
          min={0}
          defaultValue={defaultMax}
          required
          className={fieldClass}
        />
      </label>
      <p className="mt-2 text-xs text-muted-foreground">
        Current {current}
      </p>
    </div>
  )
}

export function CharacterEditForm({
  character,
  skills = [],
  skillsError = null,
  languages = [],
  languagesError = null,
  feats = [],
  featsError = null,
  equipmentCatalog = [],
  equipmentError = null,
}: {
  character: CharacterDetail
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
    updateCharacterAction,
    initialState
  )
  const [tab, setTab] = useState<IntakeTab>("sheet")
  const [pickedSkills, setPickedSkills] = useState<CharacterSkill[]>(
    character.skills
  )
  const [selectedFeatIds, setSelectedFeatIds] = useState<string[]>(() =>
    pruneInvalidFeats(
      character.feats.map((feat) => feat.id),
      feats,
      character.skills
    )
  )
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentQuantities>(() =>
      Object.fromEntries(
        (character.equipmentItems ?? []).map((item) => [
          item.id,
          item.quantity ?? 1,
        ])
      )
    )

  function handleSkillsChange(nextSkills: CharacterSkill[]) {
    setPickedSkills(nextSkills)
    setSelectedFeatIds((current) => pruneInvalidFeats(current, feats, nextSkills))
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={character.id} />

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
            ["equipment", "Equipment"] as const,
          ] as const
        ).map(([id, label]) => {
          const active = tab === id
          const badge =
            id === "feats" && selectedFeatIds.length > 0
              ? String(selectedFeatIds.length)
              : id === "equipment" &&
                  equipmentQuantityTotal(selectedEquipment) > 0
                ? String(equipmentQuantityTotal(selectedEquipment))
                : null
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              id={`edit-tab-${id}`}
              aria-controls={`edit-panel-${id}`}
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

      <div
        role="tabpanel"
        id="edit-panel-sheet"
        aria-labelledby="edit-tab-sheet"
        hidden={tab !== "sheet"}
        className="space-y-6"
      >
        <Field label="Character name">
          <Input
            name="name"
            required
            defaultValue={character.name}
            className={fieldClass}
          />
        </Field>

        <Field label="Experience">
          <Input
            name="experience"
            type="number"
            min={0}
            defaultValue={character.experience ?? 0}
            className={fieldClass}
          />
        </Field>

        <div>
          <p className="console-label mb-2 text-muted-foreground">
            Physical max
          </p>
          <p className="mb-3 text-sm text-muted-foreground">
            Lowering a max clamps current if it is above the new value.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <MaxStat
              code="STR"
              name="strMax"
              defaultMax={character.str.max}
              current={character.str.current}
            />
            <MaxStat
              code="DEX"
              name="dexMax"
              defaultMax={character.dex.max}
              current={character.dex.current}
            />
            <MaxStat
              code="END"
              name="endMax"
              defaultMax={character.end.max}
              current={character.end.current}
            />
          </div>
        </div>

        <CharacterSkillPicker
          catalog={skills}
          error={skillsError}
          languages={languages}
          languagesError={languagesError}
          initialSkills={character.skills}
          onChange={handleSkillsChange}
        />
      </div>

      <div
        role="tabpanel"
        id="edit-panel-feats"
        aria-labelledby="edit-tab-feats"
        hidden={tab !== "feats"}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Feats unlock from the skills on the Sheet tab. Changing skills may
          clear feats that no longer qualify.
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
        id="edit-panel-equipment"
        aria-labelledby="edit-tab-equipment"
        hidden={tab !== "equipment"}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Lift wares from the Black Market Emporium. Listings are grouped by
          type.
        </p>
        <CharacterEquipmentPicker
          catalog={equipmentCatalog}
          quantities={selectedEquipment}
          onChange={setSelectedEquipment}
          error={equipmentError}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <Button
          type="submit"
          disabled={pending}
          className="rounded-none border border-ochre/50 bg-ochre/15 font-heading tracking-[0.12em] uppercase text-ochre hover:bg-ochre/25"
        >
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Link
          href={`/characters/${character.id}`}
          className="console-label text-muted-foreground transition-colors hover:text-ochre"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
