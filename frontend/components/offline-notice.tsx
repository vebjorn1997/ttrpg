import { TriangleAlert } from "lucide-react"

import { ConsolePanel } from "@/components/console-panel"
import { API_BASE_URL } from "@/lib/api"

/**
 * Shown in place of a dataset when the API cannot be read, with the exact
 * transport error and the commands needed to bring the backend up.
 */
export function OfflineNotice({
  error,
  endpoint,
}: {
  error: string
  endpoint?: string
}) {
  return (
    <ConsolePanel
      label="Signal lost"
      code="ERR"
      accent="oxide"
      brackets
      bodyClassName="p-5"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-oxide" />
        <div className="space-y-4">
          <div>
            <h2 className="font-heading text-lg font-medium tracking-wide">
              No response from the rules API
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {endpoint ? (
                <>
                  Could not read{" "}
                  <span className="font-mono text-foreground">
                    {API_BASE_URL}
                    {endpoint}
                  </span>
                  .
                </>
              ) : (
                <>
                  Could not reach{" "}
                  <span className="font-mono text-foreground">
                    {API_BASE_URL}
                  </span>
                  .
                </>
              )}
            </p>
          </div>

          <p className="border-l-2 border-oxide/50 pl-3 font-mono text-xs leading-relaxed text-oxide">
            {error}
          </p>

          <div className="space-y-1.5">
            <p className="console-label text-muted-foreground">
              Bring the backend up
            </p>
            <pre className="overflow-x-auto border border-hairline bg-background/60 p-3 font-mono text-xs leading-relaxed text-foreground/85">
              {[
                "cd backend",
                "docker compose up -d",
                "npm run db:push && npm run db:seed",
                "npm run dev",
              ].join("\n")}
            </pre>
            <p className="text-xs text-muted-foreground">
              Point the frontend elsewhere with{" "}
              <span className="font-mono">API_BASE_URL</span> in{" "}
              <span className="font-mono">frontend/.env.local</span>.
            </p>
          </div>
        </div>
      </div>
    </ConsolePanel>
  )
}
