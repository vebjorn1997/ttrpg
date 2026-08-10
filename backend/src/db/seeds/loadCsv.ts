import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const parseCsvLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            fields.push(current);
            current = '';
            continue;
        }

        current += char;
    }

    fields.push(current);
    return fields;
};

/**
 * Load a CSV from the seeds folder into header-keyed row objects.
 * Pass `import.meta.url` from the calling seed module so the file resolves next to that module.
 */
export const loadCsv = (filename: string, importMetaUrl: string): Record<string, string>[] => {
    const csvPath = join(dirname(fileURLToPath(importMetaUrl)), filename);
    const raw = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '').trim();
    const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);

    if (lines.length <= 1) return [];

    const [headerLine, ...rows] = lines;
    const headers = parseCsvLine(headerLine);

    return rows.map((line) => {
        const values = parseCsvLine(line);
        return Object.fromEntries(headers.map((header, i) => [header, values[i] ?? '']));
    });
};
