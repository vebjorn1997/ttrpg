/**
 * RFC 4180 style CSV reader. Handles quoted fields containing commas, escaped
 * double quotes, and newlines inside quotes — the last of which matters for
 * imported system descriptions.
 */

export function parseCsvRows(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []

  let row: string[] = []
  let field = ''
  let inQuotes = false
  let fieldStarted = false

  const endField = () => {
    row.push(field)
    field = ''
    fieldStarted = false
  }

  const endRow = () => {
    endField()
    // Skip blank lines rather than emitting a row of one empty field.
    if (row.length > 1 || row[0] !== '') rows.push(row)
    row = []
  }

  for (let i = 0; i < source.length; i++) {
    const char = source[i]

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
        continue
      }
      field += char
      continue
    }

    if (char === '"' && !fieldStarted) {
      inQuotes = true
      fieldStarted = true
      continue
    }

    if (char === ',') {
      endField()
      continue
    }

    if (char === '\r') continue

    if (char === '\n') {
      endRow()
      continue
    }

    field += char
    fieldStarted = true
  }

  if (field !== '' || row.length > 0) endRow()

  return rows
}

/** Parse CSV text into header-keyed row objects. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseCsvRows(text.trim())
  if (rows.length <= 1) return []

  const [headers, ...body] = rows
  const keys = headers.map((header) => header.trim())

  return body.map((values) =>
    Object.fromEntries(keys.map((key, i) => [key, values[i] ?? ''])),
  )
}
