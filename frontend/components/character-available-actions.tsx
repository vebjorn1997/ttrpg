import { ConsolePanel } from "@/components/console-panel"
import { RuleText } from "@/components/rule-text"
import type { Action } from "@/lib/api"
import type { RuleLinkEntry } from "@/lib/rule-links"
import { cn } from "@/lib/utils"

type CharacterAvailableActionsProps = {
  actions: Action[]
  error?: string | null
  links?: RuleLinkEntry[]
}

function costLabel(action: Action): string {
  if (action.type.toLowerCase() === "reaction") return "1 reaction"
  return `${action.cost} AP`
}

function costGroupKey(action: Action): string {
  if (action.type.toLowerCase() === "reaction") return "reaction"
  return `ap-${action.cost}`
}

function costGroupLabel(action: Action): string {
  if (action.type.toLowerCase() === "reaction") return "Reactions"
  return `${action.cost} ${action.cost === 1 ? "action point" : "action points"}`
}

/** Available actions ordered by AP cost; feat-unlocked rows are highlighted. */
export function CharacterAvailableActions({
  actions,
  error = null,
  links = [],
}: CharacterAvailableActionsProps) {
  const groups: { key: string; label: string; items: Action[] }[] = []
  for (const action of actions) {
    const key = costGroupKey(action)
    const last = groups.at(-1)
    if (last?.key === key) {
      last.items.push(action)
    } else {
      groups.push({ key, label: costGroupLabel(action), items: [action] })
    }
  }

  return (
    <ConsolePanel
      label="Available actions"
      code="ACT"
      accent="signal"
      aside={
        actions.length > 0 ? (
          <span className="console-label text-muted-foreground/70">
            {actions.length}
          </span>
        ) : undefined
      }
    >
      {error ? (
        <p className="text-sm text-oxide">
          Action catalog unavailable ({error}).
        </p>
      ) : actions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No actions available.</p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="console-label mb-2 text-ochre/80">{group.label}</p>
              <ul className="divide-y divide-hairline border border-hairline">
                {group.items.map((action) => {
                  const fromFeat = Boolean(action.requiredFeat)
                  return (
                    <li
                      key={action.id}
                      className={cn(
                        "px-3 py-2.5",
                        fromFeat
                          ? "border-l-2 border-l-signal bg-signal/10"
                          : "bg-background/30"
                      )}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-heading text-sm tracking-wide uppercase">
                          {action.name}
                        </p>
                        <p className="console-label text-muted-foreground">
                          {costLabel(action)}
                          {fromFeat ? (
                            <span className="text-signal"> · Feat</span>
                          ) : (
                            " · Basic"
                          )}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {action.type}
                        {action.requiredFeat
                          ? ` · Unlocks from ${action.requiredFeat.name}`
                          : ""}
                      </p>
                      <RuleText
                        text={action.description}
                        className="mt-1.5 text-sm leading-relaxed text-foreground/75"
                        links={links}
                        skipTitle={action.name}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </ConsolePanel>
  )
}
