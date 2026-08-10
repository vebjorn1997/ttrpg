import { loadCsv } from './loadCsv';

const splitList = (value: string): string[] =>
    value
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean);

const npcCatalog = loadCsv('npcCatalog.csv', import.meta.url).map((row) => ({
    name: row.name,
    movement: row.movement,
    hp: row.hp,
    armor: row.armor,
    features: splitList(row.features),
    description: row.description,
    traitNames: splitList(row.traitNames),
}));

export default npcCatalog;
