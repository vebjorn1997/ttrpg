/**
 * Traveller Imperial dates come in two written forms:
 *   - calendar   `1105-02-20`  (year-month-day)
 *   - stardate   `1105-045` or `05-045`  (year-dayOfYear)
 *
 * Both are normalised to an ISO 8601 calendar date string for storage. Two-digit
 * stardate years are read as Imperial century years, so `05-045` is 1105-045.
 */

const IMPERIAL_CENTURY = 1100

const CALENDAR = /^(\d{1,4})-(\d{1,2})-(\d{1,2})$/
const STARDATE = /^(\d{1,4})-(\d{3})$/

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29
  return DAYS_IN_MONTH[month - 1]
}

function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0')
}

function toIso(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`
}

/**
 * Parse a Traveller date into `YYYY-MM-DD`, or null when it is not a date we
 * recognise. Callers keep the operator's original text alongside the normalised
 * value so stardates still display the way they were entered.
 */
export function normalizeTravellerDate(input: unknown): string | null {
  if (typeof input !== 'string') return null

  const raw = input.trim()
  if (raw === '') return null

  const calendar = raw.match(CALENDAR)
  if (calendar) {
    const year = Number(calendar[1])
    const month = Number(calendar[2])
    const day = Number(calendar[3])

    if (year < 1 || month < 1 || month > 12) return null
    if (day < 1 || day > daysInMonth(year, month)) return null

    return toIso(year, month, day)
  }

  const stardate = raw.match(STARDATE)
  if (stardate) {
    const yearDigits = stardate[1]
    const year =
      yearDigits.length <= 2 ? IMPERIAL_CENTURY + Number(yearDigits) : Number(yearDigits)
    const dayOfYear = Number(stardate[2])

    if (year < 1) return null
    if (dayOfYear < 1 || dayOfYear > daysInYear(year)) return null

    let remaining = dayOfYear
    for (let month = 1; month <= 12; month++) {
      const size = daysInMonth(year, month)
      if (remaining <= size) return toIso(year, month, remaining)
      remaining -= size
    }
  }

  return null
}

/** Strict `YYYY-MM-DD` reader for arrival / departure fields. */
export function normalizeIsoDate(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const match = input.trim().match(CALENDAR)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (year < 1 || month < 1 || month > 12) return null
  if (day < 1 || day > daysInMonth(year, month)) return null

  return toIso(year, month, day)
}
