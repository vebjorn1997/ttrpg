import { loadCsv } from './loadCsv';

const feats = loadCsv('feats.csv', import.meta.url).map((row) => ({
    name: row.name,
    type: row.type,
    prerequisites: row.prerequisites,
    cost: row.cost,
    description: row.description,
}));

export default feats;
