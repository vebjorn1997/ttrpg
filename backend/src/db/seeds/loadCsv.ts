import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from '../../lib/csv';

/**
 * Load a CSV from the seeds folder into header-keyed row objects.
 * Pass `import.meta.url` from the calling seed module so the file resolves next to that module.
 */
export const loadCsv = (filename: string, importMetaUrl: string): Record<string, string>[] => {
    const csvPath = join(dirname(fileURLToPath(importMetaUrl)), filename);
    return parseCsv(readFileSync(csvPath, 'utf8'));
};
