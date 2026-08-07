import { ConsolePanel } from "@/components/console-panel"
import { CornerBrackets } from "@/components/corner-brackets"
import { ModuleCard } from "@/components/module-card"
import { TelemetryStrip } from "@/components/telemetry-strip"
import { TurnBudget } from "@/components/turn-budget"
import { getDashboardSnapshot } from "@/lib/api"
import { dataModules } from "@/lib/modules"

export default async function DashboardPage() {
  const { telemetry, actions } = await getDashboardSnapshot()

  const totalRecords = dataModules.reduce(
    (sum, module) => sum + (telemetry[module.id] ?? 0),
    0
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
            <button></button>
            <h1 className="mt-3 font-heading text-4xl leading-[0.95] font-semibold tracking-[0.06em] uppercase text-glow sm:text-6xl">
              Field
              <br />
              Manual
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/75">
              A public reference for our own corner of the Third Imperium.
              Look up a rule mid-fight, or read the system through as a
              field manual — combat actions, conditions, injuries, medical
              care, feats and NPCs, served live from the rules database.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 self-start lg:grid-cols-1">
            <div className="border border-ochre/40 bg-ochre/5 p-4">
              <dt className="console-label text-muted-foreground">
                Rules indexed
              </dt>
              <dd className="mt-1 font-mono text-4xl leading-none text-ochre">
                {totalRecords}
              </dd>
            </div>
            <div className="border border-hairline bg-background/40 p-4">
              <dt className="console-label text-muted-foreground">
                Chapters
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

      <section aria-labelledby="subsystems">
        <div className="mb-3 flex items-baseline gap-3">
          <h2
            id="subsystems"
            className="font-heading text-lg font-medium tracking-[0.16em] uppercase"
          >
            All chapters
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
    </div>
  )
}
