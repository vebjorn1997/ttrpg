import Link from "next/link"

import { CostPips } from "@/components/cost-pips"
import type { Action } from "@/lib/api"
import { cn } from "@/lib/utils"

/**
 * Quick reference for the three-point turn: what each action point buys, plus
 * the reactions available outside your own turn.
 */
export function TurnBudget({ actions }: { actions: Action[] }) {
  const reactions = actions.filter(
    (action) => action.type.toLowerCase() === "reaction"
  )

  const tiers = [1, 2, 3].map((cost) => ({
    cost,
    actions: actions.filter(
      (action) => action.type.toLowerCase() === "action" && action.cost === cost
    ),
  }))

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tiers.map((tier) => (
        <div
          key={tier.cost}
          className="flex flex-col border border-hairline bg-background/40 p-3"
        >
          <div className="flex items-center gap-2">
            <CostPips
              value={tier.cost}
              label={`${tier.cost} action points`}
            />
            <span className="console-label text-ochre">
              {tier.cost} {tier.cost === 1 ? "point" : "points"}
            </span>
            <span className="console-label ml-auto text-muted-foreground">
              {tier.actions.length}
            </span>
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-1">
            {tier.actions.map((action) => {
              const isBasic = !action.requiredFeat
              return (
                <li
                  key={action.id}
                  title={isBasic ? "Basic action (no feat required)" : undefined}
                  className={cn(
                    "border px-1.5 py-0.5 text-xs",
                    isBasic
                      ? "border-ochre/35 bg-ochre/15 text-foreground"
                      : "border-hairline text-foreground/80"
                  )}
                >
                  {action.name}
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      <div className="flex flex-col border border-signal/40 bg-signal/5 p-3">
        <div className="flex items-center gap-2">
          <span className="console-label text-signal">Reactions</span>
          <span className="console-label ml-auto text-muted-foreground">
            {reactions.length}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          One per round, taken on someone else&rsquo;s turn.
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-1">
          {reactions.map((reaction) => (
            <li
              key={reaction.id}
              className={cn(
                "border border-signal/30 px-1.5 py-0.5 text-xs text-foreground/85"
              )}
            >
              {reaction.name}
            </li>
          ))}
        </ul>
        <Link
          href="/actions"
          className="console-label mt-auto pt-3 text-signal underline-offset-4 hover:underline"
        >
          Full action list →
        </Link>
      </div>
    </div>
  )
}
