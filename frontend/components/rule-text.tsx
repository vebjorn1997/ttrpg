import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Rule descriptions come out of the database as lightly marked-up plain text:
 * `<br>` line breaks and `**emphasis**` around dice checks and equipment.
 * This renders that safely as elements rather than injecting HTML, and pulls
 * runs of `- ` lines into real lists.
 */

const LINE_BREAK = /<br\s*\/?>/i
const EMPHASIS = /(\*\*[^*]+\*\*)/g

function renderInline(text: string): ReactNode[] {
  return text
    .split(EMPHASIS)
    .filter((segment) => segment.length > 0)
    .map((segment, index) => {
      if (segment.startsWith("**") && segment.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-ochre">
            {segment.slice(2, -2)}
          </strong>
        )
      }
      return <span key={index}>{segment}</span>
    })
}

type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }

function toBlocks(text: string): Block[] {
  const lines = text
    .split(LINE_BREAK)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const blocks: Block[] = []

  for (const line of lines) {
    const bullet = line.match(/^[-•]\s*(.+)$/)

    if (bullet) {
      const previous = blocks.at(-1)
      if (previous?.kind === "list") {
        previous.items.push(bullet[1])
      } else {
        blocks.push({ kind: "list", items: [bullet[1]] })
      }
      continue
    }

    blocks.push({ kind: "paragraph", text: line })
  }

  return blocks
}

export function RuleText({
  text,
  className,
}: {
  text: string | null | undefined
  className?: string
}) {
  if (!text) return null

  const blocks = toBlocks(text)

  return (
    <div className={cn("space-y-2 text-sm leading-relaxed", className)}>
      {blocks.map((block, index) =>
        block.kind === "list" ? (
          <ul key={index} className="space-y-1">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1 shrink-0 bg-ochre/70" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>{renderInline(block.text)}</p>
        )
      )}
    </div>
  )
}
