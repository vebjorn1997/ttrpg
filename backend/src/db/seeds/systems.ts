import { loadCsv } from './loadCsv';
import { normalizeTravellerDate } from '../../lib/traveller-date';
import type { Visibility } from '../../lib/campaign-enums';

export type SeedHook = {
    title: string;
    description: string | null;
    used: boolean;
};

export type SeedEntry = {
    entryDate: string;
    entryDateRaw: string | null;
    event: string;
};

export type SeedTimelineEntry = SeedEntry & { visibility: Visibility };

export type SeedSystem = {
    name: string;
    description: string | null;
    techLevel: number;
    lawLevel: number;
    location: string;
    /** Resolved to a faction UUID at seed time; not a column. */
    controllerName: string | null;
    notes: string | null;
    /** Resolved to trait UUIDs at seed time; not a column. */
    traitNames: string[];
    hooks: SeedHook[];
    interactions: SeedEntry[];
    timeline: SeedTimelineEntry[];
};

const text = (value: string | undefined): string | null => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
};

const jsonArray = (value: string | undefined, label: string, name: string): unknown[] => {
    const trimmed = value?.trim();
    if (!trimmed) return [];
    try {
        const parsed: unknown = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) throw new Error('not an array');
        return parsed;
    } catch {
        throw new Error(`${name}: ${label} is not a valid JSON array`);
    }
};

const toEntry = (raw: unknown, name: string, label: string): SeedEntry => {
    const entry = raw as { date?: unknown; event?: unknown };
    const entryDate = normalizeTravellerDate(entry.date);
    if (!entryDate) throw new Error(`${name}: ${label} has an unreadable date`);
    if (typeof entry.event !== 'string' || entry.event.trim() === '') {
        throw new Error(`${name}: ${label} is missing an event description`);
    }
    const rawDate = String(entry.date).trim();
    return {
        entryDate,
        entryDateRaw: rawDate === entryDate ? null : rawDate,
        event: entry.event.trim(),
    };
};

const rows = loadCsv('systems_database_seed.csv', import.meta.url);

const systems: SeedSystem[] = rows.map((row) => {
    const name = row.name?.trim();
    if (!name) throw new Error('systems seed: a row is missing a name');

    const techLevel = Number(row.tech_level);
    const lawLevel = Number(row.law_level);
    if (!Number.isInteger(techLevel) || !Number.isInteger(lawLevel)) {
        throw new Error(`${name}: tech_level and law_level must be whole numbers`);
    }

    const location = row.location?.trim().toUpperCase() ?? '';
    if (!/^[0-9A-F]{4}$/.test(location)) {
        throw new Error(`${name}: location must be four hexadecimal characters`);
    }

    return {
        name,
        description: text(row.description),
        techLevel,
        lawLevel,
        location,
        controllerName: text(row.controller ?? row.controller_faction),
        notes: text(row.notes),
        traitNames: (row.traits ?? '')
            .split(';')
            .map((trait) => trait.trim())
            .filter(Boolean),
        hooks: jsonArray(row.hooks, 'hooks', name).map((raw) => {
            const hook = raw as { title?: unknown; description?: unknown; used?: unknown };
            if (typeof hook.title !== 'string' || hook.title.trim() === '') {
                throw new Error(`${name}: a hook is missing a title`);
            }
            return {
                title: hook.title.trim(),
                description:
                    typeof hook.description === 'string' ? hook.description.trim() : null,
                used: hook.used === true,
            };
        }),
        interactions: jsonArray(
            row.traveller_interactions,
            'traveller_interactions',
            name,
        ).map((raw) => toEntry(raw, name, 'traveller_interactions')),
        timeline: jsonArray(row.timeline_history, 'timeline_history', name).map((raw) => {
            const entry = toEntry(raw, name, 'timeline_history');
            const visibility = (raw as { visibility?: unknown }).visibility;
            return {
                ...entry,
                visibility: visibility === 'gm_only' ? 'gm_only' : 'public',
            };
        }),
    };
});

export default systems;
