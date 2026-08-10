import { loadCsv } from './loadCsv';

const conditions = loadCsv('conditions.csv', import.meta.url).map((row) => ({
    name: row.name,
    description: row.description,
}));

export default conditions;
