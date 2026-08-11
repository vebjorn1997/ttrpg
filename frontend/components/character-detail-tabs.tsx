"use client"

import { useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type DetailTab = "sheet" | "actions"

type CharacterDetailTabsProps = {
  sheet: ReactNode
  actions: ReactNode
  actionCount: number
}

/** Sheet vs available-actions switcher for a filed character. */
export function CharacterDetailTabs({
  sheet,
  actions,
  actionCount,
}: CharacterDetailTabsProps) {
  const [tab, setTab] = useState<DetailTab>("sheet")

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Character sheet sections"
        className="flex border-b border-hairline"
      >
        {(
          [
            ["sheet", "Sheet", null],
            [
              "actions",
              "Actions",
              actionCount > 0 ? String(actionCount) : null,
            ],
          ] as const
        ).map(([id, label, badge]) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              id={`character-tab-${id}`}
              aria-controls={`character-panel-${id}`}
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
        id="character-panel-sheet"
        aria-labelledby="character-tab-sheet"
        hidden={tab !== "sheet"}
        className="space-y-6"
      >
        {sheet}
      </div>

      <div
        role="tabpanel"
        id="character-panel-actions"
        aria-labelledby="character-tab-actions"
        hidden={tab !== "actions"}
      >
        {actions}
      </div>
    </div>
  )
}
