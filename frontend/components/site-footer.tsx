import Link from "next/link"

import { API_BASE_URL } from "@/lib/api"
import { dataModules } from "@/lib/modules"

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-hairline bg-panel/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="console-label text-ochre">Traveller · Own Universe</p>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            An open reference for a homebrew Traveller 2e ruleset. Every dataset
            on this site is public and served read-only from{" "}
            <span className="font-mono">{API_BASE_URL}</span>.
          </p>
        </div>

        <nav aria-label="All datasets" className="grid gap-1 sm:grid-cols-2">
          {dataModules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className="console-label text-muted-foreground transition-colors hover:text-ochre"
            >
              {module.code} · {module.title}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
