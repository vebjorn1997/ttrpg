import Link from "next/link"

import { ConsolePanel } from "@/components/console-panel"
import { dataModules } from "@/lib/modules"

export default function NotFound() {
  return (
    <ConsolePanel
      label="No such record"
      code="404"
      accent="oxide"
      brackets
      bodyClassName="p-6 sm:p-10"
    >
      <p className="console-label text-oxide">Navigation error</p>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-wide uppercase">
        Off the star map
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        That route is not part of the rules console. Everything the backend
        serves is listed below.
      </p>

      <nav className="mt-6 grid gap-1.5 sm:grid-cols-2">
        <Link
          href="/"
          className="console-label border border-ochre/45 bg-ochre/10 px-3 py-2 text-ochre"
        >
          Dashboard
        </Link>
        {dataModules.map((entry) => (
          <Link
            key={entry.id}
            href={entry.href}
            className="console-label border border-hairline px-3 py-2 text-muted-foreground transition-colors hover:border-ochre/45 hover:text-ochre"
          >
            {entry.code} · {entry.title}
          </Link>
        ))}
      </nav>
    </ConsolePanel>
  )
}
