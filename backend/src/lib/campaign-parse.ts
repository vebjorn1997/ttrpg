/**
 * Request-body parsing for the campaign world routes.
 *
 * Each parser returns either a value or a human-readable reason, so handlers can
 * surface the first problem verbatim instead of a generic "invalid body".
 */

import { isOneOf } from './campaign-enums'
import { normalizeIsoDate } from './traveller-date'

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string }

export const parsed = <T>(value: T): Parsed<T> => ({ ok: true, value })
export const invalid = (error: string): Parsed<never> => ({ ok: false, error })

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Read a JSON object body, or null when it is absent, malformed, or not an object. */
export async function readJsonBody(req: {
  json: () => Promise<unknown>
}): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null
    return body as Record<string, unknown>
  } catch {
    return null
  }
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

/** Required, non-empty, length-capped text. */
export function parseText(
  value: unknown,
  field: string,
  max: number,
): Parsed<string> {
  if (typeof value !== 'string' || value.trim() === '') {
    return invalid(`${field} is required`)
  }
  const trimmed = value.trim()
  if (trimmed.length > max) {
    return invalid(`${field} must be ${max} characters or fewer`)
  }
  return parsed(trimmed)
}

/** Optional text; empty string and null both mean "clear this field". */
export function parseNullableText(
  value: unknown,
  field: string,
  max?: number,
): Parsed<string | null> {
  if (value === null || value === undefined) return parsed(null)
  if (typeof value !== 'string') return invalid(`${field} must be text`)
  const trimmed = value.trim()
  if (trimmed === '') return parsed(null)
  if (max !== undefined && trimmed.length > max) {
    return invalid(`${field} must be ${max} characters or fewer`)
  }
  return parsed(trimmed)
}

export function parseIntInRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
): Parsed<number> {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    return invalid(`${field} must be a whole number between ${min} and ${max}`)
  }
  return parsed(n)
}

export function parseNullableIntInRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
): Parsed<number | null> {
  if (value === null || value === undefined || value === '') return parsed(null)
  return parseIntInRange(value, field, min, max)
}

export function parseEnum<const T extends readonly string[]>(
  allowed: T,
  value: unknown,
  field: string,
): Parsed<T[number]> {
  if (!isOneOf(allowed, value)) {
    return invalid(`${field} must be one of: ${allowed.join(', ')}`)
  }
  return parsed(value)
}

export function parseNullableEnum<const T extends readonly string[]>(
  allowed: T,
  value: unknown,
  field: string,
): Parsed<T[number] | null> {
  if (value === null || value === undefined || value === '') return parsed(null)
  return parseEnum(allowed, value, field)
}

export function parseUuid(value: unknown, field: string): Parsed<string> {
  if (!isUuid(value)) return invalid(`${field} must be a valid id`)
  return parsed(value)
}

export function parseNullableUuid(
  value: unknown,
  field: string,
): Parsed<string | null> {
  if (value === null || value === undefined || value === '') return parsed(null)
  return parseUuid(value, field)
}

export function parseUuidList(value: unknown, field: string): Parsed<string[]> {
  if (value === undefined || value === null) return parsed([])
  if (!Array.isArray(value)) return invalid(`${field} must be an array of ids`)
  if (!value.every(isUuid)) return invalid(`${field} contains an invalid id`)
  return parsed([...new Set(value as string[])])
}

export function parseStringList(value: unknown, field: string): Parsed<string[]> {
  if (value === undefined || value === null) return parsed([])
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : null
  if (items === null) return invalid(`${field} must be an array of text values`)
  if (!items.every((item) => typeof item === 'string')) {
    return invalid(`${field} must be an array of text values`)
  }
  const cleaned = (items as string[]).map((item) => item.trim()).filter(Boolean)
  return parsed([...new Set(cleaned)])
}

export function parseBoolean(value: unknown, field: string): Parsed<boolean> {
  if (typeof value === 'boolean') return parsed(value)
  if (value === 'true') return parsed(true)
  if (value === 'false') return parsed(false)
  return invalid(`${field} must be true or false`)
}

/** Strict ISO calendar date for arrival / departure fields. */
export function parseNullableIsoDate(
  value: unknown,
  field: string,
): Parsed<string | null> {
  if (value === null || value === undefined || value === '') return parsed(null)
  const normalized = normalizeIsoDate(value)
  if (!normalized) return invalid(`${field} must be a date in YYYY-MM-DD form`)
  return parsed(normalized)
}

/** Hex grid coordinate; stored uppercase. */
export function parseHexLocation(value: unknown): Parsed<string> {
  if (typeof value !== 'string' || value.trim() === '') {
    return invalid('location is required')
  }
  const upper = value.trim().toUpperCase()
  if (!/^[0-9A-F]{4}$/.test(upper)) {
    return invalid('location must be four hexadecimal characters, e.g. 0101 or 0A0F')
  }
  return parsed(upper)
}

/** Traveller universal personality profile, six hex digits. */
export function parseNullableUpp(value: unknown): Parsed<string | null> {
  if (value === null || value === undefined || value === '') return parsed(null)
  if (typeof value !== 'string') return invalid('upp must be text')
  const upper = value.trim().toUpperCase()
  if (upper === '') return parsed(null)
  if (!/^[0-9A-F]{6}$/.test(upper)) {
    return invalid('upp must be six hexadecimal characters, e.g. 7A8A99')
  }
  return parsed(upper)
}
