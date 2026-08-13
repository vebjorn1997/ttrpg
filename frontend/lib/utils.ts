import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Append `cr` to an equipment price unless the value already names credits. */
export function formatEquipmentCost(
  cost: string | null | undefined
): string | null {
  const trimmed = cost?.trim()
  if (!trimmed) return null
  if (/\bcr\b/i.test(trimmed)) {
    return trimmed.replace(/\bcr\b/gi, "cr")
  }
  return `${trimmed} cr`
}

const RANGE_VALUE = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/

function formatRangeNumber(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 10) / 10)
}

/**
 * Close range is one quarter of listed range, keeping any unit (m, km, …).
 */
export function formatCloseRange(
  range: string | null | undefined
): string | null {
  const trimmed = range?.trim()
  if (!trimmed) return null
  const match = trimmed.match(RANGE_VALUE)
  if (!match) return null

  const value = Number(match[1])
  if (!Number.isFinite(value) || value <= 0) return null

  const unit = match[2] ?? ""
  return `${formatRangeNumber(value / 4)}${unit}`
}

/** Listed range with close range in parentheses, e.g. `10(2.5)`. */
export function formatRangeWithClose(
  range: string | null | undefined
): string | null {
  const trimmed = range?.trim()
  if (!trimmed) return null
  const close = formatCloseRange(trimmed)
  return close ? `${trimmed}(${close})` : trimmed
}
