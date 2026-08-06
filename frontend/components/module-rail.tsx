"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { accentClasses, dataModules } from "@/lib/modules"
import { cn } from "@/lib/utils"

/**
 * Persistent one-click rail to every dataset, so the whole backend stays
 * reachable from any page and not just the dashboard.
 */
export function ModuleRail() {
  const pathname = usePathname()

  return (
    <div className="border-b border-hairline bg-panel/40">
      <nav
        aria-label="Datasets"
        className="mx-auto flex max-w-7xl gap-px overflow-x-auto px-4"
      >
        {dataModules.map((module) => {
          const Icon = module.icon
          const tone = accentClasses[module.accent]
          const active = pathname === module.href

          return (
            <Link
              key={module.id}
              href={module.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 transition-colors",
                active
                  ? cn("border-b-current bg-card/60", tone.text)
                  : "border-b-transparent text-muted-foreground hover:bg-card/40 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0",
                  active ? tone.text : "text-muted-foreground/70 group-hover:text-foreground"
                )}
              />
              <span className="console-label whitespace-nowrap">
                {module.code}
              </span>
              <span className="hidden text-xs tracking-wide whitespace-nowrap lg:inline">
                {module.title}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
