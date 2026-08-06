import Link from "next/link"
import { ExternalLink } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { API_BASE_URL, type ModuleTelemetry } from "@/lib/api"
import { accentClasses, dataModules } from "@/lib/modules"
import { cn } from "@/lib/utils"

/**
 * The literal backend map: every mounted route, whether it answered, how many
 * records it holds, and links to both the rendered page and the raw JSON.
 */
export function EndpointDirectory({
  telemetry,
}: {
  telemetry: ModuleTelemetry
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-hairline hover:bg-transparent">
          <TableHead className="console-label text-muted-foreground">
            Code
          </TableHead>
          <TableHead className="console-label text-muted-foreground">
            Dataset
          </TableHead>
          <TableHead className="console-label text-muted-foreground">
            Endpoint
          </TableHead>
          <TableHead className="console-label text-right text-muted-foreground">
            Records
          </TableHead>
          <TableHead className="console-label text-muted-foreground">
            Status
          </TableHead>
          <TableHead className="console-label text-right text-muted-foreground">
            Raw
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dataModules.map((module) => {
          const count = telemetry[module.id]
          const offline = count === null
          const tone = accentClasses[module.accent]

          return (
            <TableRow key={module.id} className="border-hairline">
              <TableCell className={cn("console-label", tone.text)}>
                {module.code}
              </TableCell>
              <TableCell>
                <Link
                  href={module.href}
                  className="font-heading tracking-wide underline-offset-4 transition-colors hover:text-ochre hover:underline"
                >
                  {module.title}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                GET {module.endpoint}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {offline ? "––" : count}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 rounded-full",
                      offline ? "bg-oxide" : "bg-viridian"
                    )}
                  />
                  <span
                    className={cn(
                      "console-label",
                      offline ? "text-oxide" : "text-viridian"
                    )}
                  >
                    {offline ? "no reply" : "200 ok"}
                  </span>
                </span>
              </TableCell>
              <TableCell className="text-right">
                <a
                  href={`${API_BASE_URL}${module.endpoint}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open raw JSON for ${module.title}`}
                  className="inline-flex items-center justify-end text-muted-foreground transition-colors hover:text-ochre"
                >
                  <ExternalLink aria-hidden className="size-3.5" />
                </a>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
