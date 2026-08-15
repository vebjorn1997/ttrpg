/**
 * Traveller-style hex addresses stored as four characters (CCRR).
 *
 * Pairs that use only digits 0–9 are read as decimal so classic codes like
 * Regina `1910` land on column 19, row 10. Pairs that include A–F (allowed by
 * the API) are read as hexadecimal, e.g. `0A0F` → column 10, row 15.
 */

const LOCATION_RE = /^[0-9A-F]{4}$/

export type HexCoords = {
  col: number
  row: number
}

export function isHexLocation(value: string): boolean {
  return LOCATION_RE.test(value.trim().toUpperCase())
}

function parsePair(pair: string): number {
  if (/^[0-9]{2}$/.test(pair)) return Number.parseInt(pair, 10)
  return Number.parseInt(pair, 16)
}

export function parseLocationCoords(location: string): HexCoords | null {
  const upper = location.trim().toUpperCase()
  if (!LOCATION_RE.test(upper)) return null
  return {
    col: parsePair(upper.slice(0, 2)),
    row: parsePair(upper.slice(2, 4)),
  }
}

export function formatLocation(col: number, row: number): string {
  const encode = (n: number) => {
    if (n < 0 || !Number.isInteger(n)) return "??"
    if (n <= 99) return String(n).padStart(2, "0")
    return n.toString(16).toUpperCase().padStart(2, "0").slice(-2)
  }
  return `${encode(col)}${encode(row)}`
}

export type HexBounds = {
  minCol: number
  maxCol: number
  minRow: number
  maxRow: number
}

/** Bounding box of occupied hexes, expanded by `padding` empty rings. */
export function boundsFromCoords(
  coords: HexCoords[],
  padding = 1
): HexBounds {
  if (coords.length === 0) {
    // Empty chart: a classic 8×10 subsector frame starting at 0101.
    return { minCol: 1, maxCol: 8, minRow: 1, maxRow: 10 }
  }

  let minCol = Infinity
  let maxCol = -Infinity
  let minRow = Infinity
  let maxRow = -Infinity

  for (const { col, row } of coords) {
    minCol = Math.min(minCol, col)
    maxCol = Math.max(maxCol, col)
    minRow = Math.min(minRow, row)
    maxRow = Math.max(maxRow, row)
  }

  return {
    minCol: Math.max(0, minCol - padding),
    maxCol: maxCol + padding,
    minRow: Math.max(0, minRow - padding),
    maxRow: maxRow + padding,
  }
}
