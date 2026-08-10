import { loadCsv } from './loadCsv';

const healing = loadCsv('healing.csv', import.meta.url).map((row) => ({
    name: row.name,
    cost: row.cost,
    description: row.description,
}));

export default healing;
