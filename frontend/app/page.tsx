import { Database, Radio } from "lucide-react"

import { ConsolePanel } from "@/components/console-panel"
import { CornerBrackets } from "@/components/corner-brackets"
import { EndpointDirectory } from "@/components/endpoint-directory"
import { ModuleCard } from "@/components/module-card"
import { TelemetryStrip } from "@/components/telemetry-strip"
import { TurnBudget } from "@/components/turn-budget"
import { API_BASE_URL, getDashboardSnapshot } from "@/lib/api"
import { dataModules } from "@/lib/modules"

export default async function DashboardPage() {
  const { telemetry, actions } = await getDashboardSnapshot()

  const totalRecords = dataModules.reduce(
    (sum, module) => sum + (telemetry[module.id] ?? 0),
    0
  )
  const unreachable = dataModules.filter(
    (module) => telemetry[module.id] === null
  )

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-hairline bg-card/60">
        <CornerBrackets />
        <div aria-hidden className="console-hatch h-1.5 w-full opacity-70" />

        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <p className="console-label text-ochre">
              Homebrew Traveller 2e · Mongoose
            </p>
            <h1 className="mt-3 font-heading text-4xl leading-[0.95] font-semibold tracking-[0.06em] uppercase text-glow sm:text-6xl">
              Rules
              <br />
              Console
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              A public, read-only reference for our own corner of the Third
              Imperium. Combat actions, conditions, injuries, medical care,
              feats and NPCs — served live from the rules database. No account,
              no login: pick a subsystem below and read.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 self-start lg:grid-cols-1">
            <div className="border border-ochre/40 bg-ochre/5 p-4">
              <dt className="console-label text-muted-foreground">
                Records indexed
              </dt>
              <dd className="mt-1 font-mono text-4xl leading-none text-ochre">
                {totalRecords}
              </dd>
            </div>
            <div className="border border-hairline bg-background/40 p-4">
              <dt className="console-label text-muted-foreground">
                Subsystems
              </dt>
              <dd className="mt-1 font-mono text-4xl leading-none">
                {dataModules.length}
              </dd>
            </div>
          </dl>
        </div>

        <div className="px-6 pb-6 sm:px-10 sm:pb-8">
          <TelemetryStrip telemetry={telemetry} />
        </div>
      </section>

      <section aria-labelledby="subsystems">
        <div className="mb-3 flex items-baseline gap-3">
          <h2
            id="subsystems"
            className="font-heading text-lg font-medium tracking-[0.16em] uppercase"
          >
            Subsystems
          </h2>
          <span aria-hidden className="console-hatch h-2.5 flex-1 opacity-60" />
          <span className="console-label text-muted-foreground">
            {dataModules.length} modules
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dataModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              count={telemetry[module.id]}
            />
          ))}
        </div>
      </section>

      {actions.length > 0 && (
        <ConsolePanel
          label="Turn budget"
          code="ACT · QUICK REF"
          brackets
          bodyClassName="p-4"
        >
          <TurnBudget actions={actions} />
        </ConsolePanel>
      )}

      <ConsolePanel
        label="Backend directory"
        code="API MAP"
        accent="signal"
        bodyClassName="p-0"
        aside={
          <span className="console-label flex items-center gap-1.5 text-muted-foreground">
            <Radio aria-hidden className="size-3" />
            {API_BASE_URL.replace(/^https?:\/\//, "")}
          </span>
        }
      >
        <EndpointDirectory telemetry={telemetry} />

        <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-4 py-3 text-xs text-muted-foreground">
          <Database aria-hidden className="size-3.5" />
          {unreachable.length === 0 ? (
            <span>
              All {dataModules.length} endpoints answered. Every table in the
              database is reachable from this dashboard.
            </span>
          ) : (
            <span className="text-oxide">
              {unreachable.length} endpoint
              {unreachable.length === 1 ? "" : "s"} did not answer:{" "}
              <span className="font-mono">
                {unreachable.map((module) => module.endpoint).join(", ")}
              </span>
              . Start the backend with{" "}
              <span className="font-mono text-foreground">npm run dev</span> in{" "}
              <span className="font-mono text-foreground">backend/</span>.
            </span>
          )}
        </div>
      </ConsolePanel>
    </div>
  )
}
