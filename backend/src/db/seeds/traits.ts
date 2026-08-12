import { loadCsv } from './loadCsv';

const traits = loadCsv('traits.csv', import.meta.url).map((row) => ({
    name: row.name,
    type: row.type,
    description: row.description,
    color: row.color,
}));

export default traits;
