"use client"

import Link from "next/link"
import { type ReactNode, useMemo } from "react"

import {
  escapeRegExp,
  indexRuleLinks,
  type RuleLinkEntry,
} from "@/lib/rule-links"
import { cn } from "@/lib/utils"

/**
 * Rule descriptions come out of the database as lightly marked-up plain text:
 * `<br>` line breaks and `**emphasis**` around dice checks and equipment.
 * This renders that safely as elements rather than injecting HTML, and pulls
 * runs of `- ` lines into real lists. When a link catalog is provided, known
 * rule titles become navigable deep links.
 */

const LINE_BREAK = /<br\s*\/?>/i
const EMPHASIS = /(\*\*[^*]+\*\*)/g

function renderInline(
  text: string,
  linkPattern: RegExp | null,
  linkMap: Map<string, RuleLinkEntry>,
  skipTitle?: string | null
): ReactNode[] {
  const withEmphasis = text
    .split(EMPHASIS)
    .filter((segment) => segment.length > 0)

  const nodes: ReactNode[] = []

  withEmphasis.forEach((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      nodes.push(
        <strong key={`em-${index}`} className="font-semibold text-ochre">
          {linkifySegment(
            segment.slice(2, -2),
            linkPattern,
            linkMap,
            skipTitle,
            `em-${index}`
          )}
        </strong>
      )
      return
    }

    nodes.push(
      ...linkifySegment(segment, linkPattern, linkMap, skipTitle, `t-${index}`)
    )
  })

  return nodes
}

function linkifySegment(
  text: string,
  linkPattern: RegExp | null,
  linkMap: Map<string, RuleLinkEntry>,
  skipTitle: string | null | undefined,
  keyPrefix: string
): ReactNode[] {
  if (!linkPattern || linkMap.size === 0) {
    return [<span key={keyPrefix}>{text}</span>]
  }

  const skip = skipTitle?.trim().toLowerCase() ?? null
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const pattern = new RegExp(linkPattern.source, linkPattern.flags)
  let guard = 0

  while ((match = pattern.exec(text)) !== null && guard < 200) {
    guard += 1
    const matched = match[0]
    const start = match.index

    if (start > lastIndex) {
      nodes.push(
        <span key={`${keyPrefix}-p-${lastIndex}`}>
          {text.slice(lastIndex, start)}
        </span>
      )
    }

    const entry = linkMap.get(matched.toLowerCase())
    if (entry && matched.toLowerCase() !== skip) {
      nodes.push(
        <Link
          key={`${keyPrefix}-l-${start}`}
          href={entry.href}
          className="underline decoration-ochre/45 underline-offset-2 transition-colors hover:text-ochre hover:decoration-ochre"
        >
          {matched}
        </Link>
      )
    } else {
      nodes.push(
        <span key={`${keyPrefix}-s-${start}`}>{matched}</span>
      )
    }

    lastIndex = start + matched.length
  }

  if (lastIndex < text.length) {
    nodes.push(
      <span key={`${keyPrefix}-tail`}>{text.slice(lastIndex)}</span>
    )
  }

  return nodes.length > 0 ? nodes : [<span key={keyPrefix}>{text}</span>]
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

function buildLinkPattern(catalog: RuleLinkEntry[]): RegExp | null {
  const titles = [...new Set(catalog.map((entry) => entry.title.trim()))]
    .filter((title) => title.length >= 3)
    .sort((a, b) => b.length - a.length)

  if (titles.length === 0) return null

  return new RegExp(`\\b(${titles.map(escapeRegExp).join("|")})\\b`, "gi")
}

export function RuleText({
  text,
  className,
  links = [],
  skipTitle,
}: {
  text: string | null | undefined
  className?: string
  links?: RuleLinkEntry[]
  /** Do not link this title (usually the current record). */
  skipTitle?: string | null
}) {
  const linkMap = useMemo(() => indexRuleLinks(links), [links])
  const linkPattern = useMemo(() => buildLinkPattern(links), [links])

  if (!text) return null

  const blocks = toBlocks(text)

  return (
    <div className={cn("rule-prose space-y-2.5", className)}>
      {blocks.map((block, index) =>
        block.kind === "list" ? (
          <ul key={index} className="space-y-1.5">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-2.5 size-1 shrink-0 bg-ochre/70"
                />
                <span>
                  {renderInline(item, linkPattern, linkMap, skipTitle)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>
            {renderInline(block.text, linkPattern, linkMap, skipTitle)}
          </p>
        )
      )}
    </div>
  )
}
