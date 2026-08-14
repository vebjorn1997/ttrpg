"use client"

import { useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export type CampaignTab = {
  id: string
  label: string
  /** Small count shown beside the label; hidden when zero or undefined. */
  badge?: number
  panel: ReactNode
}

/**
 * Underlined tab strip shared by the campaign world detail pages. Panels stay
 * mounted and are hidden rather than unmounted so scroll position and any
 * half-filled add-forms survive a switch.
 */
export function CampaignTabs({
  tabs,
  label,
  idPrefix,
}: {
  tabs: CampaignTab[]
  label: string
  idPrefix: string
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "")

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label={label}
        className="flex flex-wrap border-b border-hairline"
      >
        {tabs.map((tab) => {
          const selected = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`${idPrefix}-tab-${tab.id}`}
              aria-controls={`${idPrefix}-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={cn(
                "console-label relative -mb-px border-b-2 px-4 py-2.5 tracking-[0.14em] transition-colors",
                selected
                  ? "border-signal text-signal"
                  : "border-transparent text-muted-foreground hover:text-foreground/80"
              )}
            >
              {tab.label}
              {tab.badge ? (
                <span className="ml-2 font-mono text-[0.65rem] text-muted-foreground">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${idPrefix}-panel-${tab.id}`}
          aria-labelledby={`${idPrefix}-tab-${tab.id}`}
          hidden={active !== tab.id}
          className="space-y-6"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  )
}
