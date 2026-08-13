import { loadCsv } from './loadCsv';

const emptyToNull = (value: string | undefined): string | null => {
    const trimmed = value?.trim() ?? '';
    return trimmed === '' ? null : trimmed;
};

const equipment = loadCsv('equipment.csv', import.meta.url).map((row) => ({
    name: row.name.trim(),
    cost: emptyToNull(row.cost),
    category: row.category.trim(),
    type: row.type.trim(),
    trait: emptyToNull(row.trait),
    weaponClassification: emptyToNull(row.weaponClassification),
    description: emptyToNull(row.description),
    tl: emptyToNull(row.tl),
    dmg: emptyToNull(row.dmg),
    armor: emptyToNull(row.armor),
    mag: emptyToNull(row.mag),
    range: emptyToNull(row.range),
}));

export default equipment;
