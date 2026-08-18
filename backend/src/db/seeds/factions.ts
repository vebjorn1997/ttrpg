import { loadCsv } from './loadCsv';
import { FACTION_TYPES, type FactionType } from '../../lib/campaign-enums';

export type SeedFaction = {
    name: string;
    type: FactionType;
    description: string | null;
    tier: number | null;
    /** Resolved to a system UUID at seed time; not a column. */
    headquartersName: string | null;
    goals: string | null;
    assets: string[];
    notes: string | null;
    color: string;
    /** Resolved to trait UUIDs at seed time; not a column. */
    traitNames: string[];
};

const text = (value: string | undefined): string | null => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
};

const splitList = (value: string | undefined): string[] =>
    (value ?? '')
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean);

const rows = loadCsv('factions.csv', import.meta.url);

const factions: SeedFaction[] = rows.map((row) => {
    const name = row.name?.trim();
    if (!name) throw new Error('factions seed: a row is missing a name');

    const typeRaw = row.type?.trim() || 'other';
    if (!(FACTION_TYPES as readonly string[]).includes(typeRaw)) {
        throw new Error(
            `${name}: type must be one of ${FACTION_TYPES.join(', ')}`,
        );
    }

    const tierRaw = row.tier?.trim() ?? '';
    let tier: number | null = null;
    if (tierRaw) {
        const parsed = Number(tierRaw);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
            throw new Error(`${name}: tier must be a whole number from 1 to 5`);
        }
        tier = parsed;
    }

    const colorRaw = (row.color?.trim() || '#4a6d8c').toLowerCase()
    if (!/^#[0-9a-f]{6}$/.test(colorRaw)) {
        throw new Error(`${name}: color must be a six-digit hex, e.g. #32a852`)
    }

    return {
        name,
        type: typeRaw as FactionType,
        description: text(row.description),
        tier,
        headquartersName: text(row.headquarters),
        goals: text(row.goals),
        assets: splitList(row.assets),
        notes: text(row.notes),
        color: colorRaw,
        traitNames: splitList(row.traits),
    };
});

export default factions;
